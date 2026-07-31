import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { TransbordoService } from './transbordo.service';

@Controller('transbordo')
export class TransbordoController {
  constructor(private readonly transbordoService: TransbordoService) {}

  @Get('pendentes')
  async listarPendentes() {
    return this.transbordoService.listarPendentes();
  }

  @Post('responder/:id')
  @HttpCode(HttpStatus.OK)
  async responderDuvida(
    @Param('id') id: string,
    @Body('resposta') resposta: string, // Espera JSON {"resposta": "..."} ou se class-validator for usar DTO, mas podemos pegar direto ou via DTO simples
  ) {
    // Se o body for enviado como {"resposta": "..."}
    return this.transbordoService.responderDuvida(id, resposta);
  }

  @Post('ignorar/:id')
  @HttpCode(HttpStatus.OK)
  async ignorarDuvida(@Param('id') id: string) {
    return this.transbordoService.ignorarDuvida(id);
  }
}
