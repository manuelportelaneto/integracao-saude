import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { CreateDocumentoDto } from './dto/create-documento.dto.js';
import { CreateExameDto } from './dto/create-exame.dto.js';

@Injectable()
export class IntegracaoService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PEDIDOS ────────────────────────────────────────────────────────────────

  /**
   * POST /pedidos
   *
   * Regras:
   * 1. Verifica se já existe um Exame com o mesmo AccessionNumber de cada item.
   *    Se sim, salva o pedido como integrado: true. Se não, integrado: false.
   * 2. Se o CodigoPedido já existir, apenas adiciona exames novos (sem duplicar
   *    itens e sem sobrescrever o pedido base).
   */
  async createPedido(dto: CreatePedidoDto) {
    const pedidoExistente = await this.prisma.client.pedido.findUnique({
      where: { codigoPedido: dto.CodigoPedido },
      include: { exames: true },
    });

    // Verificar se algum AccessionNumber dos exames enviados já existe na tabela Exame
    const accessionNumbers = dto.Exames.map((e) => e.AccessionNumber);
    const examesExistentes = await this.prisma.client.exame.findMany({
      where: { accessionNumber: { in: accessionNumbers } },
    });

    const integrado = examesExistentes.length > 0;

    if (pedidoExistente) {
      // Pedido já existe: apenas adicionar exames novos
      const accessionNumbersExistentes = new Set(
        pedidoExistente.exames.map((e) => e.accessionNumber),
      );

      const novosExames = dto.Exames.filter(
        (e) => !accessionNumbersExistentes.has(e.AccessionNumber),
      );

      if (novosExames.length > 0) {
        await this.prisma.client.examePedido.createMany({
          data: novosExames.map((exame) => ({
            codigoItemPedido: exame.CodigoItemPedido,
            accessionNumber: exame.AccessionNumber,
            modalidade: exame.Modalidade,
            nomeProcedimento: exame.NomeProcedimento,
            pedidoId: dto.CodigoPedido,
          })),
        });
      }

      // Atualizar flag integrado se necessário
      if (integrado && !pedidoExistente.integrado) {
        await this.prisma.client.pedido.update({
          where: { codigoPedido: dto.CodigoPedido },
          data: { integrado: true },
        });
      }

      return this.prisma.client.pedido.findUnique({
        where: { codigoPedido: dto.CodigoPedido },
        include: { exames: true, documentos: true },
      });
    }

    // Pedido novo: criar tudo de uma vez
    return this.prisma.client.pedido.create({
      data: {
        codigoPedido: dto.CodigoPedido,
        nomePaciente: dto.NomePaciente,
        dataNascimento: dto.DataNascimento,
        sexo: dto.Sexo,
        codUnidade: dto.CodUnidade,
        integrado,
        exames: {
          create: dto.Exames.map((exame) => ({
            codigoItemPedido: exame.CodigoItemPedido,
            accessionNumber: exame.AccessionNumber,
            modalidade: exame.Modalidade,
            nomeProcedimento: exame.NomeProcedimento,
          })),
        },
      },
      include: { exames: true, documentos: true },
    });
  }

  /**
   * GET /pedidos/:codigoPedido
   * Retorna o pedido com exames e documentos aninhados.
   */
  async findPedido(codigoPedido: number) {
    const pedido = await this.prisma.client.pedido.findUnique({
      where: { codigoPedido },
      include: { exames: true, documentos: true },
    });

    if (!pedido) {
      throw new NotFoundException(
        `Pedido com código ${codigoPedido} não encontrado.`,
      );
    }

    return pedido;
  }

  // ─── DOCUMENTOS ─────────────────────────────────────────────────────────────

  /**
   * POST /documentos
   *
   * Regras:
   * 1. Se a combinação codigoDocumento + codigoPedido já existir → 409 Conflict.
   * 2. Se o Pedido não existir → 404 NotFound.
   * 3. Se o Pedido relacionado estiver integrado: true → documento integrado: true.
   *    Caso contrário → integrado: false.
   */
  async createDocumento(dto: CreateDocumentoDto) {
    // Verificar se o documento já existe (chave composta)
    const documentoExistente = await this.prisma.client.documento.findUnique({
      where: {
        codigoDocumento_codigoPedido: {
          codigoDocumento: dto.CodigoDocumento,
          codigoPedido: dto.CodigoPedido,
        },
      },
    });

    if (documentoExistente) {
      throw new ConflictException(
        `Documento ${dto.CodigoDocumento} já existe para o pedido ${dto.CodigoPedido}.`,
      );
    }

    // Verificar se o pedido existe
    const pedido = await this.prisma.client.pedido.findUnique({
      where: { codigoPedido: dto.CodigoPedido },
    });

    if (!pedido) {
      throw new NotFoundException(
        `Pedido com código ${dto.CodigoPedido} não encontrado.`,
      );
    }

    // Herdar o status de integração do pedido
    return this.prisma.client.documento.create({
      data: {
        codigoDocumento: dto.CodigoDocumento,
        codigoPedido: dto.CodigoPedido,
        nomeDocumento: dto.NomeDocumento,
        documento: dto.Documento,
        integrado: pedido.integrado,
      },
    });
  }

  /**
   * GET /documentos/:codigoPedido
   * Retorna todos os documentos de um pedido.
   */
  async findDocumentos(codigoPedido: number) {
    const pedido = await this.prisma.client.pedido.findUnique({
      where: { codigoPedido },
    });

    if (!pedido) {
      throw new NotFoundException(
        `Pedido com código ${codigoPedido} não encontrado.`,
      );
    }

    return this.prisma.client.documento.findMany({
      where: { codigoPedido },
    });
  }

  // ─── EXAMES ─────────────────────────────────────────────────────────────────

  /**
   * POST /exames
   *
   * Regras:
   * 1. Upsert baseado no AccessionNumber (cria ou atualiza).
   * 2. Procura se existe algum Pedido que contenha esse AccessionNumber nos itens.
   * 3. Se existir, atualiza o Pedido para integrado: true e todos os Documentos
   *    pendentes desse pedido para integrado: true.
   */
  async upsertExame(dto: CreateExameDto) {
    // Upsert do exame
    const exame = await this.prisma.client.exame.upsert({
      where: { accessionNumber: dto.AccessionNumber },
      update: {
        nomePaciente: dto.NomePaciente,
        modalidade: dto.Modalidade,
        status: dto.Status,
      },
      create: {
        accessionNumber: dto.AccessionNumber,
        nomePaciente: dto.NomePaciente,
        modalidade: dto.Modalidade,
        status: dto.Status,
      },
    });

    // Buscar pedidos que contêm este AccessionNumber
    const examePedido = await this.prisma.client.examePedido.findUnique({
      where: { accessionNumber: dto.AccessionNumber },
      include: { pedido: true },
    });

    if (examePedido) {
      // Atualizar pedido para integrado: true
      await this.prisma.client.pedido.update({
        where: { codigoPedido: examePedido.pedidoId },
        data: { integrado: true },
      });

      // Atualizar todos os documentos pendentes deste pedido
      await this.prisma.client.documento.updateMany({
        where: {
          codigoPedido: examePedido.pedidoId,
          integrado: false,
        },
        data: { integrado: true },
      });
    }

    return exame;
  }

  /**
   * GET /exames/:accessionNumber
   * Retorna um exame pelo AccessionNumber.
   */
  async findExame(accessionNumber: string) {
    const exame = await this.prisma.client.exame.findUnique({
      where: { accessionNumber },
    });

    if (!exame) {
      throw new NotFoundException(
        `Exame com AccessionNumber '${accessionNumber}' não encontrado.`,
      );
    }

    return exame;
  }
}
