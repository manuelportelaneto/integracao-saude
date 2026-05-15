import { IsInt, IsString } from 'class-validator';

export class CreateDocumentoDto {
  @IsInt()
  CodigoDocumento!: number;

  @IsInt()
  CodigoPedido!: number;

  @IsString()
  NomeDocumento!: string;

  @IsString()
  Documento!: string;
}
