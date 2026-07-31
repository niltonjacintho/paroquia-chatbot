import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { GeminiModule } from './gemini/gemini.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { TransbordoModule } from './transbordo/transbordo.module';
import { ConhecimentoModule } from './conhecimento/conhecimento.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna as variáveis de ambiente disponíveis globalmente
    }),
    DatabaseModule,
    GeminiModule,
    ChatbotModule,
    TransbordoModule,
    ConhecimentoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
