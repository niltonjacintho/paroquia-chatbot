import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conhecimento } from './entities/conhecimento.entity';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class ConhecimentoService {
  constructor(
    @InjectRepository(Conhecimento)
    private readonly conhecimentoRepository: Repository<Conhecimento>,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Lista todos os registros da base de conhecimento
   */
  async listarTodos(): Promise<Conhecimento[]> {
    return this.conhecimentoRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca um registro de conhecimento pelo ID
   */
  async obterPorId(id: string): Promise<Conhecimento> {
    const item = await this.conhecimentoRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item da base de conhecimento não encontrado.');
    }
    return item;
  }

  /**
   * Cria um novo registro e gera seu embedding automaticamente
   */
  async criar(dados: { titulo: string; conteudo: string; categoria: string; ativo?: boolean }): Promise<Conhecimento> {
    // Gera embedding para o conteúdo
    const embedding = await this.geminiService.getEmbedding(dados.conteudo);

    const novo = this.conhecimentoRepository.create({
      ...dados,
      embedding,
      ativo: dados.ativo !== false,
    });
    return this.conhecimentoRepository.save(novo);
  }

  /**
   * Atualiza um registro e regenera o embedding se o conteúdo mudar
   */
  async atualizar(id: string, dados: { titulo?: string; conteudo?: string; categoria?: string; ativo?: boolean }): Promise<Conhecimento> {
    const item = await this.obterPorId(id);

    if (dados.conteudo && dados.conteudo !== item.conteudo) {
      // Regenera embedding se o texto original for alterado
      item.embedding = await this.geminiService.getEmbedding(dados.conteudo);
    }

    Object.assign(item, dados);
    return this.conhecimentoRepository.save(item);
  }

  /**
   * Deleta permanentemente um registro
   */
  async remover(id: string): Promise<void> {
    const item = await this.obterPorId(id);
    await this.conhecimentoRepository.remove(item);
  }
}
