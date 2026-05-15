import { IsString } from 'class-validator';

export class CreateExameDto {
  @IsString()
  AccessionNumber!: string;

  @IsString()
  NomePaciente!: string;

  @IsString()
  Modalidade!: string;

  @IsString()
  Status!: string;
}
