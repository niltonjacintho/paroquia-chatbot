import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Atendimento, AtendimentoStatus } from './entities/atendimento.entity';
import { Conhecimento } from '../conhecimento/entities/conhecimento.entity';
import { HistoricoMensagem, MensagemPapel } from '../chatbot/entities/historico-mensagem.entity';
import { WhatsappService } from '../chatbot/whatsapp.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class TransbordoService {
  constructor(
    @InjectRepository(Atendimento)
    private atendimentoRepository: Repository<Atendimento>,
    private dataSource: DataSource,
    private whatsappService: WhatsappService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Lista todos os atendimentos com status PENDENTE
   */
  async listarPendentes(): Promise<Atendimento[]> {
    return this.atendimentoRepository.find({
      where: { status: AtendimentoStatus.PENDENTE },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Responde humanizadamente à dúvida do fiel via secretaria, mudando o status e treinando a IA
   */
  async responderDuvida(id: string, resposta: string): Promise<Atendimento> {
    if (!resposta || resposta.trim() === '') {
      throw new BadRequestException('A resposta não pode ser vazia.');
    }

    // Executa em transação para garantir atomicidade e retorna o resultado
    return this.dataSource.transaction(async (entityManager) => {
      // 1. Busca o atendimento pendente
      const atendimento = await entityManager.findOne(Atendimento, {
        where: { id },
      });

      if (!atendimento) {
        throw new NotFoundException('Atendimento não encontrado.');
      }

      if (atendimento.status !== AtendimentoStatus.PENDENTE) {
        throw new BadRequestException('Este atendimento já foi finalizado ou respondido.');
      }

      // 2. Envia a resposta oficial para o WhatsApp do fiel
      const enviado = await this.whatsappService.enviarMensagem(atendimento.telefoneFiel, resposta);
      if (!enviado) {
        throw new InternalServerErrorException('Falha ao enviar a mensagem de resposta via WhatsApp.');
      }

      // 3. Atualiza o status do atendimento
      atendimento.status = AtendimentoStatus.RESPONDIDO;
      atendimento.respostaHumanizada = resposta;
      const atendimentoAtualizado = await entityManager.save(Atendimento, atendimento);

      // 4. Salva a resposta no histórico de mensagens do paroquiano
      const historico = entityManager.create(HistoricoMensagem, {
        telefoneFiel: atendimento.telefoneFiel,
        papel: MensagemPapel.ASSISTANT,
        conteudo: resposta,
      });
      await entityManager.save(HistoricoMensagem, historico);

      // 5. Gera o embedding do novo par de informação (Pergunta + Resposta)
      const novoConteudoRAG = `Pergunta: ${atendimento.pergunta}\nResposta: ${resposta}`;
      let embedding: number[];
      try {
        embedding = await this.geminiService.getEmbedding(novoConteudoRAG);
      } catch (err) {
        throw new InternalServerErrorException(`Erro ao gerar embedding do novo conhecimento: ${err.message}`);
      }

      // 6. Insere o novo par de conhecimento no banco RAG
      const novoConhecimento = entityManager.create(Conhecimento, {
        titulo: `Curadoria: ${atendimento.pergunta.substring(0, 60)}...`,
        conteudo: novoConteudoRAG,
        categoria: 'Curadoria',
        embedding: embedding,
        ativo: true,
      });
      await entityManager.save(Conhecimento, novoConhecimento);

      return atendimentoAtualizado;
    });
  }

  /**
   * Ignora uma dúvida pendente
   */
  async ignorarDuvida(id: string): Promise<Atendimento> {
    const atendimento = await this.atendimentoRepository.findOne({ where: { id } });
    if (!atendimento) {
      throw new NotFoundException('Atendimento não encontrado.');
    }
    if (atendimento.status !== AtendimentoStatus.PENDENTE) {
      throw new BadRequestException('Atendimento já respondido ou ignorado.');
    }

    atendimento.status = AtendimentoStatus.IGNORADO;
    return this.atendimentoRepository.save(atendimento);
  }
}
