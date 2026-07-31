import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConhecimentoService } from './conhecimento.service';
import { ConhecimentoController } from './conhecimento.controller';
import { Conhecimento } from './entities/conhecimento.entity';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conhecimento]),
    GeminiModule,
  ],
  controllers: [ConhecimentoController],
  providers: [ConhecimentoService],
  exports: [ConhecimentoService],
})
export class ConhecimentoModule {}
