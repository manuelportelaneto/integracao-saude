import {
  IsInt,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExamePedidoDto {
  @IsInt()
  CodigoItemPedido!: number;

  @IsString()
  AccessionNumber!: string;

  @IsString()
  Modalidade!: string;

  @IsString()
  NomeProcedimento!: string;
}

export class CreatePedidoDto {
  @IsInt()
  CodigoPedido!: number;

  @IsString()
  NomePaciente!: string;

  @IsString()
  DataNascimento!: string;

  @IsString()
  Sexo!: string;

  @IsInt()
  CodUnidade!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamePedidoDto)
  Exames!: ExamePedidoDto[];
}
