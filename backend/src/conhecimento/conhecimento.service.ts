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
   * Divide um texto em partes (chunks) menores de forma inteligente.
   */
  private splitText(text: string, chunkSize = 1000, chunkOverlap = 150): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    // Normaliza quebras de linha múltiplas e espaços excessivos
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    while (startIndex < normalizedText.length) {
      let endIndex = startIndex + chunkSize;
      if (endIndex > normalizedText.length) {
        endIndex = normalizedText.length;
      } else {
        // Tenta encontrar o último espaço no intervalo para quebrar em limite de palavra
        const lastSpace = normalizedText.lastIndexOf(' ', endIndex);
        if (lastSpace > startIndex) {
          endIndex = lastSpace;
        }
      }

      chunks.push(normalizedText.slice(startIndex, endIndex).trim());
      
      let nextStartIndex = endIndex - chunkOverlap;
      if (nextStartIndex <= startIndex) {
        nextStartIndex = endIndex;
      }
      startIndex = nextStartIndex;
    }

    return chunks.filter((c) => c.length > 0);
  }

  /**
   * Processa o arquivo PDF recebido, faz o chunking, gera os embeddings e os salva no banco.
   */
  async importarPDF(buffer: Buffer, originalname: string, categoria: string): Promise<{ success: boolean; count: number }> {
    const { PDFParse } = require('pdf-parse');
    let text = '';
    try {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      text = data.text;
    } catch (err) {
      throw new Error(`Falha ao extrair texto do PDF: ${err.message}`);
    }

    if (!text || text.trim() === '') {
      throw new Error('O PDF está vazio ou não possui texto legível.');
    }

    const chunks = this.splitText(text);

    let count = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const title = `PDF: ${originalname.replace(/\.pdf$/i, '')} - Parte ${i + 1}/${chunks.length}`;

      try {
        const embedding = await this.geminiService.getEmbedding(chunkText);
        const novoConhecimento = this.conhecimentoRepository.create({
          titulo: title,
          conteudo: chunkText,
          categoria,
          embedding,
          ativo: true,
        });
        await this.conhecimentoRepository.save(novoConhecimento);
        count++;
      } catch (err) {
        console.error(`Erro ao indexar chunk ${i + 1} do PDF ${originalname}:`, err.message);
      }
    }

    return {
      success: count > 0,
      count,
    };
  }

  /**
   * Deleta permanentemente um registro
   */
  async remover(id: string): Promise<void> {
    const item = await this.obterPorId(id);
    await this.conhecimentoRepository.remove(item);
  }
}
