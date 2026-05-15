import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: PrismaClient;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Usando composição para manter compatibilidade com o IntegracaoService
    this.client = new PrismaClient();
  }

  async onModuleInit() {
    try {
      this.logger.log('Conectando ao banco de dados (Prisma 6 - Estável)...');
      await this.client.$connect();
      this.logger.log('Conexão estabelecida com sucesso.');
    } catch (error) {
      this.logger.error('Erro ao conectar ao banco:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
