import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const supertest = (request as any).default || request;

describe('Fluxo de Integracao (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await prisma.client.documento.deleteMany();
    await prisma.client.examePedido.deleteMany();
    await prisma.client.exame.deleteMany();
    await prisma.client.pedido.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const codigoPedido = 616;
  const accessionNumber = '930';

  it('Cenario 1: Pedido chega e nao existe exame correspondente (Status: false)', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/pedidos')
      .send({
        CodigoPedido: codigoPedido,
        NomePaciente: 'ALEFHER MONTONI DE ALMEIDA',
        DataNascimento: '19970601',
        Sexo: 'M',
        CodUnidade: 104,
        Exames: [
          {
            CodigoItemPedido: 930,
            AccessionNumber: accessionNumber,
            Modalidade: 'CR',
            NomeProcedimento: 'RX ANTEBRACO ESQUERDO',
          },
        ],
      })
      .expect(201);

    expect(response.body.integrado).toBe(false);
  });

  it('Cenario 2: Documento chega para pedido ainda nao integrado (Status: false)', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/documentos')
      .send({
        CodigoDocumento: 251,
        CodigoPedido: codigoPedido,
        NomeDocumento: 'PEDIDO',
        Documento: 'base64_data',
      })
      .expect(201);

    expect(response.body.integrado).toBe(false);
  });

  it('Cenario 3: Documento duplicado deve retornar erro 409', async () => {
    await supertest(app.getHttpServer())
      .post('/documentos')
      .send({
        CodigoDocumento: 251,
        CodigoPedido: codigoPedido,
        NomeDocumento: 'PEDIDO',
        Documento: 'base64_data',
      })
      .expect(409);
  });

  it('Cenario 4: Chegada de exame deve marcar Pedido e Documento como integrado: true', async () => {
    await supertest(app.getHttpServer())
      .post('/exames')
      .send({
        AccessionNumber: accessionNumber,
        NomePaciente: 'ALEFHER MONTONI DE ALMEIDA',
        Modalidade: 'CR',
        Status: 'FINALIZADO',
      })
      .expect(201);

    const pedidoResponse = await supertest(app.getHttpServer())
      .get(`/pedidos/${codigoPedido}`)
      .expect(200);

    expect(pedidoResponse.body.integrado).toBe(true);
    expect(pedidoResponse.body.documentos[0].integrado).toBe(true);
  });

  it('Cenario 5: Pedido chega novamente com novo exame (Apenas adiciona o novo)', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/pedidos')
      .send({
        CodigoPedido: codigoPedido,
        NomePaciente: 'ALEFHER MONTONI DE ALMEIDA',
        DataNascimento: '19970601',
        Sexo: 'M',
        CodUnidade: 104,
        Exames: [
          {
            CodigoItemPedido: 930,
            AccessionNumber: accessionNumber,
            Modalidade: 'CR',
            NomeProcedimento: 'RX ANTEBRACO ESQUERDO',
          },
          {
            CodigoItemPedido: 931,
            AccessionNumber: '931',
            Modalidade: 'CR',
            NomeProcedimento: 'OUTRO EXAME',
          },
        ],
      })
      .expect(201);

    expect(response.body.exames.length).toBe(2);
  });
});
