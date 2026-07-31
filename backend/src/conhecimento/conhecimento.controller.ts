import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ConhecimentoService } from './conhecimento.service';

@ApiTags('conhecimento')
@Controller('conhecimento')
export class ConhecimentoController {
  constructor(private readonly conhecimentoService: ConhecimentoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os conhecimentos cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  async listarTodos() {
    return this.conhecimentoService.listarTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhe de um conhecimento específico' })
  @ApiResponse({ status: 200, description: 'Conhecimento retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Conhecimento não encontrado.' })
  async obterPorId(@Param('id') id: string) {
    return this.conhecimentoService.obterPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo conhecimento manualmente e gerar embedding' })
  @ApiResponse({ status: 201, description: 'Conhecimento criado com sucesso.' })
  async criar(
    @Body() dados: { titulo: string; conteudo: string; categoria: string; ativo?: boolean },
  ) {
    return this.conhecimentoService.criar(dados);
  }

  @Post('importar-pdf')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importar um arquivo PDF e treinar a base de conhecimento RAG' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF para processamento',
        },
        categoria: {
          type: 'string',
          description: 'Categoria do conhecimento (ex: Missas, Eventos)',
          default: 'Missas',
        },
      },
      required: ['file', 'categoria'],
    },
  })
  @ApiResponse({ status: 201, description: 'PDF processado e inserido na base de conhecimento com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro ao processar o arquivo PDF.' })
  async importarPDF(
    @UploadedFile() file: Express.Multer.File,
    @Body('categoria') categoria: string,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo enviado.');
    }
    return this.conhecimentoService.importarPDF(file.buffer, file.originalname, categoria);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar conhecimento existente e regenerar embedding se o conteúdo mudar' })
  @ApiResponse({ status: 200, description: 'Conhecimento atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Conhecimento não encontrado.' })
  async atualizar(
    @Param('id') id: string,
    @Body() dados: { titulo?: string; conteudo?: string; categoria?: string; ativo?: boolean },
  ) {
    return this.conhecimentoService.atualizar(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover conhecimento' })
  @ApiResponse({ status: 204, description: 'Conhecimento deletado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Conhecimento não encontrado.' })
  async remover(@Param('id') id: string) {
    return this.conhecimentoService.remover(id);
  }
}
