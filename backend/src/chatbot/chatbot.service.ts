import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conhecimento } from '../conhecimento/entities/conhecimento.entity';
import { Atendimento, AtendimentoStatus } from '../transbordo/entities/atendimento.entity';
import { HistoricoMensagem, MensagemPapel } from './entities/historico-mensagem.entity';
import { GeminiService } from '../gemini/gemini.service';
import { WhatsappService } from './whatsapp.service';
import { TransbordoGateway } from '../transbordo/transbordo.gateway';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectRepository(Conhecimento)
    private conhecimentoRepository: Repository<Conhecimento>,
    @InjectRepository(Atendimento)
    private atendimentoRepository: Repository<Atendimento>,
    @InjectRepository(HistoricoMensagem)
    private historicoRepository: Repository<HistoricoMensagem>,
    private geminiService: GeminiService,
    private whatsappService: WhatsappService,
    @Inject(forwardRef(() => TransbordoGateway))
    private transbordoGateway: TransbordoGateway,
  ) {}

  /**
   * Processa a mensagem recebida de um fiel
   */
  async processarMensagem(telefoneFiel: string, nomeFiel: string, texto: string): Promise<void> {
    this.logger.log(`Processando mensagem de ${nomeFiel || telefoneFiel}: "${texto}"`);

    // 1. Salva a mensagem do usuário no histórico
    const msgUsuario = this.historicoRepository.create({
      telefoneFiel,
      papel: MensagemPapel.USER,
      conteudo: texto,
    });
    await this.historicoRepository.save(msgUsuario);

    // 2. Converte a pergunta para embedding
    let embedding: number[];
    try {
      embedding = await this.geminiService.getEmbedding(texto);
    } catch (err) {
      this.logger.error(`Erro ao gerar embedding: ${err.message}`);
      // Fallback: Responde direto ou encaminha
      await this.encaminharParaTransbordo(telefoneFiel, nomeFiel, texto);
      return;
    }

    // 3. Consulta a tabela de conhecimento usando similaridade cosseno
    // Cosine similarity = 1 - Cosine distance
    const rawResults = await this.conhecimentoRepository
      .createQueryBuilder('c')
      .select('c.id', 'id')
      .addSelect('c.titulo', 'titulo')
      .addSelect('c.conteudo', 'conteudo')
      .addSelect('c.categoria', 'categoria')
      .addSelect('1 - (c.embedding <=> :embedding)', 'similarity')
      .where('c.ativo = :ativo', { ativo: true })
      .orderBy('c.embedding <=> :embedding', 'ASC')
      .setParameters({ embedding: `[${embedding.join(',')}]` })
      .limit(3)
      .getRawMany();

    // Filtra o resultado com score mais alto
    const bestMatch = rawResults.length > 0 ? rawResults[0] : null;
    const similarityScore = bestMatch ? parseFloat(bestMatch.similarity) : 0;

    this.logger.log(`Melhor correspondência RAG: "${bestMatch?.titulo || 'Nenhum'}" com score: ${similarityScore}`);

    if (similarityScore >= 0.75 && bestMatch) {
      // Caso Score >= 0.75: Gera resposta com a IA
      await this.responderComIA(telefoneFiel, texto, rawResults);
    } else {
      // Caso Score < 0.75: Cria transbordo pendente
      await this.encaminharParaTransbordo(telefoneFiel, nomeFiel, texto);
    }
  }

  /**
   * Responde ao fiel utilizando RAG e GPT
   */
  private async responderComIA(telefoneFiel: string, texto: string, matches: any[]): Promise<void> {
    // Busca as últimas 4 mensagens de histórico do fiel (excluindo a última inserida para não repetir no prompt,
    // ou passando todas exceto a atual já que ela é inserida no prompt separadamente).
    // Pegamos as 4 mensagens anteriores à que acabou de ser inserida.
    const historicoRecente = await this.historicoRepository.find({
      where: { telefoneFiel },
      order: { createdAt: 'DESC' },
      skip: 1, // Pula a mensagem atual
      take: 4,
    });

    // Reverte para manter a ordem cronológica
    const historicoOrdenado = historicoRecente.reverse().map((msg) => ({
      papel: msg.papel,
      conteudo: msg.conteudo,
    }));

    // Concatena o contexto dos matches encontrados
    const contexto = matches.map((m) => `[Categoria: ${m.categoria} - Título: ${m.titulo}]\n${m.conteudo}`).join('\n\n');

    // Prompt pastoral configurado
    const systemPrompt = `Você é o Assistente Virtual Acolhedor da Paróquia Santa Bárbara.
Sua missão é ajudar os fiéis com informações sobre missas, sacramentos, eventos e rotina da paróquia.

Diretrizes de Comportamento:
1. Tom de voz: Pastoral, acolhedor, educado e cristão (utilize saudações como "A Paz de Cristo!", "Que Santa Bárbara te abençoe!").
2. Restrição Estrita: Responda APENAS com base no CONTEXTO FORNECIDO abaixo. Não invente regras sobre sacramentos, taxas ou horários.
3. Se a informação no contexto for parcial, responda apenas o que souber e informe que detalhes adicionais podem ser consultados na secretaria.

CONTEXTO FORNECIDO:
${contexto}`;

    try {
      const respostaIA = await this.geminiService.generateResponse(systemPrompt, historicoOrdenado, texto);

      // Salva a resposta no histórico
      const msgAssistente = this.historicoRepository.create({
        telefoneFiel,
        papel: MensagemPapel.ASSISTANT,
        conteudo: respostaIA,
      });
      await this.historicoRepository.save(msgAssistente);

      // Envia ao WhatsApp do fiel
      await this.whatsappService.enviarMensagem(telefoneFiel, respostaIA);
    } catch (err) {
      this.logger.error(`Erro ao gerar resposta com GPT: ${err.message}`);
      await this.whatsappService.enviarMensagem(
        telefoneFiel,
        'A Paz de Cristo! Tivemos uma pequena instabilidade ao processar sua resposta, mas em breve um atendente da secretaria irá te ajudar por aqui!',
      );
    }
  }

  /**
   * Encaminha o atendimento para a fila de transbordo e notifica via WebSocket
   */
  private async encaminharParaTransbordo(telefoneFiel: string, nomeFiel: string, pergunta: string): Promise<void> {
    // 1. Cria um registro na tabela atendimentos com status PENDENTE
    // Verifica se já existe um atendimento PENDENTE aberto para este telefone para evitar duplicados na fila
    let atendimento = await this.atendimentoRepository.findOne({
      where: { telefoneFiel, status: AtendimentoStatus.PENDENTE },
    });

    if (!atendimento) {
      atendimento = this.atendimentoRepository.create({
        telefoneFiel,
        nomeFiel: nomeFiel || 'Fiel Paroquiano',
        pergunta,
        status: AtendimentoStatus.PENDENTE,
      });
      await this.atendimentoRepository.save(atendimento);
    } else {
      // Se já existe, atualiza a pergunta mais recente
      atendimento.pergunta = pergunta;
      atendimento.updatedAt = new Date();
      await this.atendimentoRepository.save(atendimento);
    }

    // 2. Dispara evento via WebSocket para o Angular
    this.transbordoGateway.notificarNovaDuvida(atendimento);

    // 3. Responde ao fiel no WhatsApp
    const msgTransbordo =
      'A Paz de Cristo! Não encontrei essa informação com precisão no momento. Encaminhei sua dúvida para a secretaria paroquial e em breve te retornaremos por aqui!';
    
    // Salva a resposta de transbordo do bot no histórico
    const msgAssistente = this.historicoRepository.create({
      telefoneFiel,
      papel: MensagemPapel.ASSISTANT,
      conteudo: msgTransbordo,
    });
    await this.historicoRepository.save(msgAssistente);

    await this.whatsappService.enviarMensagem(telefoneFiel, msgTransbordo);
  }
}
