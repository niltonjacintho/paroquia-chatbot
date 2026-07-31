import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransbordoService } from './transbordo.service';
import { TransbordoController } from './transbordo.controller';
import { TransbordoGateway } from './transbordo.gateway';
import { Atendimento } from './entities/atendimento.entity';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Atendimento]),
    GeminiModule,
    forwardRef(() => ChatbotModule),
  ],
  controllers: [TransbordoController],
  providers: [TransbordoService, TransbordoGateway],
  exports: [TransbordoService, TransbordoGateway],
})
export class TransbordoModule {}
