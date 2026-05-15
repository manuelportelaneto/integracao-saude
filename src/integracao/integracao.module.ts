import { Module } from '@nestjs/common';
import { IntegracaoController } from './integracao.controller.js';
import { IntegracaoService } from './integracao.service.js';

@Module({
  controllers: [IntegracaoController],
  providers: [IntegracaoService],
})
export class IntegracaoModule {}
