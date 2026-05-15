export declare class ExamePedidoDto {
    CodigoItemPedido: number;
    AccessionNumber: string;
    Modalidade: string;
    NomeProcedimento: string;
}
export declare class CreatePedidoDto {
    CodigoPedido: number;
    NomePaciente: string;
    DataNascimento: string;
    Sexo: string;
    CodUnidade: number;
    Exames: ExamePedidoDto[];
}
