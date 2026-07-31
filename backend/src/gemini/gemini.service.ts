import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private googleAI: GoogleGenerativeAI;
  private chatModel: ChatGoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    // Busca a chave de API (aceita GEMINI_API_KEY ou GOOGLE_API_KEY)
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || 
                   this.configService.get<string>('GOOGLE_API_KEY') || '';

    this.googleAI = new GoogleGenerativeAI(apiKey);

    this.chatModel = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: 'gemini-flash-latest',
      temperature: 0.2,
    });
  }

  /**
   * Gera o vetor de embedding (768 dimensões) para um texto dado.
   */
  async getEmbedding(text: string): Promise<number[]> {
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text: text.replace(/\n/g, ' ') }] },
      outputDimensionality: 768,
    } as any);
    return result.embedding.values;
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
