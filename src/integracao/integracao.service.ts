import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { CreateDocumentoDto } from './dto/create-documento.dto.js';
import { CreateExameDto } from './dto/create-exame.dto.js';

@Injectable()
export class IntegracaoService {
  private readonly logger = new Logger(IntegracaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── PEDIDOS ────────────────────────────────────────────────────────────────

  async createPedido(dto: CreatePedidoDto) {
    this.logger.log(`Iniciando criação/atualização de pedido: ${dto.CodigoPedido}`);
    
    const pedidoExistente = await this.prisma.client.pedido.findUnique({
      where: { codigoPedido: dto.CodigoPedido },
      include: { exames: true },
    });

    const accessionNumbers = dto.Exames.map((e) => e.AccessionNumber);
    const examesExistentes = await this.prisma.client.exame.findMany({
      where: { accessionNumber: { in: accessionNumbers } },
    });

    const integrado = examesExistentes.length > 0;

    if (pedidoExistente) {
      this.logger.log(`Pedido ${dto.CodigoPedido} já existe. Atualizando exames...`);
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

      if (integrado && !pedidoExistente.integrado) {
        await this.prisma.client.pedido.update({
          where: { codigoPedido: dto.CodigoPedido },
          data: { integrado: true },
        });
      }

      const result = await this.prisma.client.pedido.findUnique({
        where: { codigoPedido: dto.CodigoPedido },
        include: { exames: true, documentos: true },
      });
      this.logger.log(`Pedido ${dto.CodigoPedido} processado com sucesso.`);
      return result;
    }

    this.logger.log(`Criando novo pedido ${dto.CodigoPedido}...`);
    const novoPedido = await this.prisma.client.pedido.create({
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
    this.logger.log(`Novo pedido ${dto.CodigoPedido} criado.`);
    return novoPedido;
  }

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

  async createDocumento(dto: CreateDocumentoDto) {
    this.logger.log(`Salvando documento ${dto.CodigoDocumento} para pedido ${dto.CodigoPedido}`);
    
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

    const pedido = await this.prisma.client.pedido.findUnique({
      where: { codigoPedido: dto.CodigoPedido },
    });

    if (!pedido) {
      throw new NotFoundException(
        `Pedido com código ${dto.CodigoPedido} não encontrado.`,
      );
    }

    const novoDoc = await this.prisma.client.documento.create({
      data: {
        codigoDocumento: dto.CodigoDocumento,
        codigoPedido: dto.CodigoPedido,
        nomeDocumento: dto.NomeDocumento,
        documento: dto.Documento,
        integrado: pedido.integrado,
      },
    });
    this.logger.log(`Documento ${dto.CodigoDocumento} salvo com sucesso.`);
    return novoDoc;
  }

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

  async upsertExame(dto: CreateExameDto) {
    this.logger.log(`Recebendo exame: ${dto.AccessionNumber}`);
    
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

    const examePedido = await this.prisma.client.examePedido.findUnique({
      where: { accessionNumber: dto.AccessionNumber },
      include: { pedido: true },
    });

    if (examePedido) {
      this.logger.log(`Vínculo encontrado! Integrando pedido ${examePedido.pedidoId}`);
      await this.prisma.client.pedido.update({
        where: { codigoPedido: examePedido.pedidoId },
        data: { integrado: true },
      });

      await this.prisma.client.documento.updateMany({
        where: {
          codigoPedido: examePedido.pedidoId,
          integrado: false,
        },
        data: { integrado: true },
      });
    }

    this.logger.log(`Exame ${dto.AccessionNumber} processado.`);
    return exame;
  }

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
