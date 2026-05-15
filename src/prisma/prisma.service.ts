import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: PrismaClient;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // No Prisma 7, a configuração é resolvida automaticamente via prisma.config.ts.
    // O construtor vazio é o padrão recomendado quando o arquivo de config existe.
    this.client = new PrismaClient();
  }

  async onModuleInit() {
    try {
      this.logger.log('Iniciando conexão com o banco (Prisma 7)...');
      await this.client.$connect();
      this.logger.log('Conectado ao PostgreSQL com sucesso.');
    } catch (error) {
      this.logger.error('Falha na conexão do Prisma:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
