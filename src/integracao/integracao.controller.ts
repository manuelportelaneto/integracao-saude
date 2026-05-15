import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntegracaoService } from './integracao.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { CreateDocumentoDto } from './dto/create-documento.dto.js';
import { CreateExameDto } from './dto/create-exame.dto.js';

@Controller()
export class IntegracaoController {
  constructor(private readonly integracaoService: IntegracaoService) {}

  // ─── PEDIDOS ──────────────────────────────────────────────────────────────

  @Post('pedidos')
  @HttpCode(HttpStatus.CREATED)
  async createPedido(@Body() dto: CreatePedidoDto) {
    return this.integracaoService.createPedido(dto);
  }

  @Get('pedidos/:codigoPedido')
  async findPedido(@Param('codigoPedido', ParseIntPipe) codigoPedido: number) {
    return this.integracaoService.findPedido(codigoPedido);
  }

  // ─── DOCUMENTOS ───────────────────────────────────────────────────────────

  @Post('documentos')
  @HttpCode(HttpStatus.CREATED)
  async createDocumento(@Body() dto: CreateDocumentoDto) {
    return this.integracaoService.createDocumento(dto);
  }

  @Get('documentos/:codigoPedido')
  async findDocumentos(
    @Param('codigoPedido', ParseIntPipe) codigoPedido: number,
  ) {
    return this.integracaoService.findDocumentos(codigoPedido);
  }

  // ─── EXAMES ───────────────────────────────────────────────────────────────

  @Post('exames')
  @HttpCode(HttpStatus.CREATED)
  async upsertExame(@Body() dto: CreateExameDto) {
    return this.integracaoService.upsertExame(dto);
  }

  @Get('exames/:accessionNumber')
  async findExame(@Param('accessionNumber') accessionNumber: string) {
    return this.integracaoService.findExame(accessionNumber);
  }
}
