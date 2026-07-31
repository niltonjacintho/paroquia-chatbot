import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { WebhookController } from './webhook.controller';
import { WhatsappService } from './whatsapp.service';
import { Conhecimento } from '../conhecimento/entities/conhecimento.entity';
import { Atendimento } from '../transbordo/entities/atendimento.entity';
import { HistoricoMensagem } from './entities/historico-mensagem.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { TransbordoModule } from '../transbordo/transbordo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conhecimento, Atendimento, HistoricoMensagem]),
    GeminiModule,
    forwardRef(() => TransbordoModule),
  ],
  controllers: [WebhookController],
  providers: [ChatbotService, WhatsappService],
  exports: [ChatbotService, WhatsappService],
})
export class ChatbotModule {}
