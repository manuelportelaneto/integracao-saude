import { IntegracaoService } from './integracao.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { CreateDocumentoDto } from './dto/create-documento.dto.js';
import { CreateExameDto } from './dto/create-exame.dto.js';
export declare class IntegracaoController {
    private readonly integracaoService;
    constructor(integracaoService: IntegracaoService);
    createPedido(dto: CreatePedidoDto): Promise<({
        exames: {
            accessionNumber: string;
            modalidade: string;
            codigoItemPedido: number;
            nomeProcedimento: string;
            pedidoId: number;
        }[];
        documentos: {
            documento: string;
            codigoPedido: number;
            integrado: boolean;
            codigoDocumento: number;
            nomeDocumento: string;
        }[];
    } & {
        codigoPedido: number;
        nomePaciente: string;
        dataNascimento: string;
        sexo: string;
        codUnidade: number;
        integrado: boolean;
    }) | null>;
    findPedido(codigoPedido: number): Promise<{
        exames: {
            accessionNumber: string;
            modalidade: string;
            codigoItemPedido: number;
            nomeProcedimento: string;
            pedidoId: number;
        }[];
        documentos: {
            documento: string;
            codigoPedido: number;
            integrado: boolean;
            codigoDocumento: number;
            nomeDocumento: string;
        }[];
    } & {
        codigoPedido: number;
        nomePaciente: string;
        dataNascimento: string;
        sexo: string;
        codUnidade: number;
        integrado: boolean;
    }>;
    createDocumento(dto: CreateDocumentoDto): Promise<{
        documento: string;
        codigoPedido: number;
        integrado: boolean;
        codigoDocumento: number;
        nomeDocumento: string;
    }>;
    findDocumentos(codigoPedido: number): Promise<{
        documento: string;
        codigoPedido: number;
        integrado: boolean;
        codigoDocumento: number;
        nomeDocumento: string;
    }[]>;
    upsertExame(dto: CreateExameDto): Promise<{
        nomePaciente: string;
        accessionNumber: string;
        modalidade: string;
        status: string;
    }>;
    findExame(accessionNumber: string): Promise<{
        nomePaciente: string;
        accessionNumber: string;
        modalidade: string;
        status: string;
    }>;
}
