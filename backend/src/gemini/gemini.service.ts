import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { TaskType } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private chatModel: ChatGoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    // Busca a chave de API (aceita GEMINI_API_KEY ou GOOGLE_API_KEY)
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || 
                   this.configService.get<string>('GOOGLE_API_KEY') || '';

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      modelName: 'text-embedding-004',
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    });

    this.chatModel = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: 'gemini-1.5-flash',
      temperature: 0.2,
    });
  }

  /**
   * Gera o vetor de embedding (768 dimensões) para um texto dado.
   */
  async getEmbedding(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  /**
   * Gera a resposta do Chatbot usando o histórico e o contexto recuperado.
   */
  async generateResponse(
    systemPrompt: string,
    history: { papel: 'USER' | 'ASSISTANT' | 'SYSTEM'; conteudo: string }[],
    currentMessage: string
  ): Promise<string> {
    const messages: any[] = [];

    // Adiciona as diretrizes do sistema
    messages.push(new SystemMessage(systemPrompt));

    // Adiciona as mensagens de histórico
    for (const msg of history) {
      if (msg.papel === 'USER') {
        messages.push(new HumanMessage(msg.conteudo));
      } else if (msg.papel === 'ASSISTANT') {
        messages.push(new AIMessage(msg.conteudo));
      } else if (msg.papel === 'SYSTEM') {
        messages.push(new SystemMessage(msg.conteudo));
      }
    }

    // Adiciona a mensagem atual do usuário
    messages.push(new HumanMessage(currentMessage));

    // Chama o modelo
    const response = await this.chatModel.invoke(messages);
    return response.content as string;
  }
}
