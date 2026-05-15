"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegracaoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let IntegracaoService = class IntegracaoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPedido(dto) {
        const pedidoExistente = await this.prisma.pedido.findUnique({
            where: { codigoPedido: dto.CodigoPedido },
            include: { exames: true },
        });
        const accessionNumbers = dto.Exames.map((e) => e.AccessionNumber);
        const examesExistentes = await this.prisma.exame.findMany({
            where: { accessionNumber: { in: accessionNumbers } },
        });
        const integrado = examesExistentes.length > 0;
        if (pedidoExistente) {
            const accessionNumbersExistentes = new Set(pedidoExistente.exames.map((e) => e.accessionNumber));
            const novosExames = dto.Exames.filter((e) => !accessionNumbersExistentes.has(e.AccessionNumber));
            if (novosExames.length > 0) {
                await this.prisma.examePedido.createMany({
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
                await this.prisma.pedido.update({
                    where: { codigoPedido: dto.CodigoPedido },
                    data: { integrado: true },
                });
            }
            return this.prisma.pedido.findUnique({
                where: { codigoPedido: dto.CodigoPedido },
                include: { exames: true, documentos: true },
            });
        }
        return this.prisma.pedido.create({
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
    async findPedido(codigoPedido) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { codigoPedido },
            include: { exames: true, documentos: true },
        });
        if (!pedido) {
            throw new common_1.NotFoundException(`Pedido com código ${codigoPedido} não encontrado.`);
        }
        return pedido;
    }
    async createDocumento(dto) {
        const documentoExistente = await this.prisma.documento.findUnique({
            where: {
                codigoDocumento_codigoPedido: {
                    codigoDocumento: dto.CodigoDocumento,
                    codigoPedido: dto.CodigoPedido,
                },
            },
        });
        if (documentoExistente) {
            throw new common_1.ConflictException(`Documento ${dto.CodigoDocumento} já existe para o pedido ${dto.CodigoPedido}.`);
        }
        const pedido = await this.prisma.pedido.findUnique({
            where: { codigoPedido: dto.CodigoPedido },
        });
        if (!pedido) {
            throw new common_1.NotFoundException(`Pedido com código ${dto.CodigoPedido} não encontrado.`);
        }
        return this.prisma.documento.create({
            data: {
                codigoDocumento: dto.CodigoDocumento,
                codigoPedido: dto.CodigoPedido,
                nomeDocumento: dto.NomeDocumento,
                documento: dto.Documento,
                integrado: pedido.integrado,
            },
        });
    }
    async findDocumentos(codigoPedido) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { codigoPedido },
        });
        if (!pedido) {
            throw new common_1.NotFoundException(`Pedido com código ${codigoPedido} não encontrado.`);
        }
        return this.prisma.documento.findMany({
            where: { codigoPedido },
        });
    }
    async upsertExame(dto) {
        const exame = await this.prisma.exame.upsert({
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
        const examePedido = await this.prisma.examePedido.findUnique({
            where: { accessionNumber: dto.AccessionNumber },
            include: { pedido: true },
        });
        if (examePedido) {
            await this.prisma.pedido.update({
                where: { codigoPedido: examePedido.pedidoId },
                data: { integrado: true },
            });
            await this.prisma.documento.updateMany({
                where: {
                    codigoPedido: examePedido.pedidoId,
                    integrado: false,
                },
                data: { integrado: true },
            });
        }
        return exame;
    }
    async findExame(accessionNumber) {
        const exame = await this.prisma.exame.findUnique({
            where: { accessionNumber },
        });
        if (!exame) {
            throw new common_1.NotFoundException(`Exame com AccessionNumber '${accessionNumber}' não encontrado.`);
        }
        return exame;
    }
};
exports.IntegracaoService = IntegracaoService;
exports.IntegracaoService = IntegracaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], IntegracaoService);
//# sourceMappingURL=integracao.service.js.map