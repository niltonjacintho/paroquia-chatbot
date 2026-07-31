import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any): Promise<any> {
    this.logger.log(`Webhook recebido: ${JSON.stringify(payload)}`);

    let telefoneFiel = '';
    let nomeFiel = 'Fiel Paroquiano';
    let texto = '';
    let isGroup = false;
    let fromMe = false;

    // 1. Detecta Evolution API (possui 'event' e 'data')
    if (payload && payload.event && payload.data) {
      if (payload.event !== 'messages.upsert') {
        return { status: 'ignored_event', event: payload.event };
      }
      const data = payload.data;
      fromMe = data.key?.fromMe === true;
      isGroup = data.key?.remoteJid?.includes('@g.us') === true;
      telefoneFiel = data.key?.remoteJid?.split('@')[0] || '';
      nomeFiel = payload.data?.pushName || 'Fiel Paroquiano';
      
      texto = data.message?.conversation || 
              data.message?.extendedTextMessage?.text || 
              data.message?.imageMessage?.caption || 
              data.message?.videoMessage?.caption || '';
    } 
    // 2. Detecta Z-API (possui 'phone')
    else if (payload && payload.phone) {
      fromMe = payload.fromMe === true;
      isGroup = payload.isGroup === true;
      telefoneFiel = payload.phone.split('@')[0];
      nomeFiel = payload.senderName || 'Fiel Paroquiano';
      texto = payload.text || '';
    } 
    // 3. Formato desconhecido
    else {
      this.logger.warn('Formato de webhook desconhecido recebido.');
      return { status: 'unknown_format' };
    }

    // Regras de descarte
    if (fromMe) {
      this.logger.log('Mensagem de saída (do próprio bot) ignorada.');
      return { status: 'ignored_from_me' };
    }

    if (isGroup) {
      this.logger.log('Mensagem de grupo ignorada.');
      return { status: 'ignored_group' };
    }

    if (!texto || texto.trim() === '') {
      this.logger.log('Mensagem vazia ou sem texto ignorada.');
      return { status: 'ignored_empty_text' };
    }

    // Processa a mensagem em segundo plano para responder o webhook imediatamente (evita re-tentativas da API)
    this.chatbotService.processarMensagem(telefoneFiel, nomeFiel, texto.trim())
      .catch((err) => this.logger.error(`Erro no processamento assíncrono da mensagem: ${err.message}`));

    return { status: 'received' };
  }
}
