import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Envia uma mensagem de texto para o WhatsApp do fiel.
   */
  async enviarMensagem(telefone: string, texto: string): Promise<boolean> {
    const provider = this.configService.get<string>('WHATSAPP_PROVIDER', 'zapi').toLowerCase();
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    const apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN');
    const instanceName = this.configService.get<string>('WHATSAPP_INSTANCE_NAME');

    if (!apiUrl) {
      this.logger.error('WhatsApp API URL não configurada.');
      return false;
    }

    try {
      if (provider === 'evolution') {
        const url = `${apiUrl}/message/sendText/${instanceName}`;
        this.logger.log(`Enviando mensagem via Evolution API para: ${telefone}`);
        await axios.post(
          url,
          {
            number: telefone,
            text: texto,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: apiToken,
            },
          },
        );
      } else {
        // Z-API por padrão
        // Se a URL já contiver '/send-text', usamos direto. Caso contrário concatenamos.
        const url = apiUrl.includes('/send-text') ? apiUrl : `${apiUrl}/send-text`;
        this.logger.log(`Enviando mensagem via Z-API para: ${telefone}`);
        await axios.post(
          url,
          {
            phone: telefone,
            message: texto,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              // Z-API às vezes pede Client-Token no header se configurado
              'Client-Token': apiToken,
            },
          },
        );
      }
      return true;
    } catch (err) {
      this.logger.error(`Erro ao enviar mensagem para ${telefone}: ${err.message}`);
      if (err.response) {
        this.logger.error(`Response error: ${JSON.stringify(err.response.data)}`);
      }
      return false;
    }
  }
}
