import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { IntegracaoModule } from './integracao/integracao.module.js';

@Module({
  imports: [PrismaModule, IntegracaoModule],
})
export class AppModule {}
