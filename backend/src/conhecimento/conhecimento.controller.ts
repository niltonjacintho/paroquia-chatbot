import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ConhecimentoService } from './conhecimento.service';

@Controller('conhecimento')
export class ConhecimentoController {
  constructor(private readonly conhecimentoService: ConhecimentoService) {}

  @Get()
  async listarTodos() {
    return this.conhecimentoService.listarTodos();
  }

  @Get(':id')
  async obterPorId(@Param('id') id: string) {
    return this.conhecimentoService.obterPorId(id);
  }

  @Post()
  async criar(
    @Body() dados: { titulo: string; conteudo: string; categoria: string; ativo?: boolean },
  ) {
    return this.conhecimentoService.criar(dados);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dados: { titulo?: string; conteudo?: string; categoria?: string; ativo?: boolean },
  ) {
    return this.conhecimentoService.atualizar(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id') id: string) {
    return this.conhecimentoService.remover(id);
  }
}
