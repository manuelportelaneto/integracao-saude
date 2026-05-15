import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Fluxo de Integracao (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    // Limpar o banco antes dos testes
    await prisma.client.documento.deleteMany();
    await prisma.client.examePedido.deleteMany();
    await prisma.client.exame.deleteMany();
    await prisma.client.pedido.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const codigoPedido = 616;
  const accessionNumber = "930";

  it('Cenario 1: Pedido chega e nao existe exame correspondente (Status: false)', async () => {
    const response = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        CodigoPedido: codigoPedido,
        NomePaciente: "ALEFHER MONTONI DE ALMEIDA",
        DataNascimento: "19970601",
        Sexo: "M",
        CodUnidade: 104,
        Exames: [
          {
            CodigoItemPedido: 930,
            AccessionNumber: accessionNumber,
            Modalidade: "CR",
            NomeProcedimento: "RX ANTEBRACO ESQUERDO"
          }
        ]
      })
      .expect(201);

    expect(response.body.integrado).toBe(false);
  });

  it('Cenario 2: Documento chega para pedido ainda nao integrado (Status: false)', async () => {
    const response = await request(app.getHttpServer())
      .post('/documentos')
      .send({
        CodigoDocumento: 251,
        CodigoPedido: codigoPedido,
        NomeDocumento: "PEDIDO",
        Documento: "base64_data"
      })
      .expect(201);

    expect(response.body.integrado).toBe(false);
  });

  it('Cenario 3: Documento duplicado deve retornar erro 409', async () => {
    await request(app.getHttpServer())
      .post('/documentos')
      .send({
        CodigoDocumento: 251,
        CodigoPedido: codigoPedido,
        NomeDocumento: "PEDIDO",
        Documento: "base64_data"
      })
      .expect(409);
  });

  it('Cenario 4: Chegada de exame deve marcar Pedido e Documento como integrado: true', async () => {
    // Simular chegada do exame
    await request(app.getHttpServer())
      .post('/exames')
      .send({
        AccessionNumber: accessionNumber,
        NomePaciente: "ALEFHER MONTONI DE ALMEIDA",
        Modalidade: "CR",
        Status: "FINALIZADO"
      })
      .expect(201);

    // Verificar se o pedido agora esta integrado
    const pedidoResponse = await request(app.getHttpServer())
      .get(`/pedidos/${codigoPedido}`)
      .expect(200);

    expect(pedidoResponse.body.integrado).toBe(true);
    // Verificar se o documento vinculado tambem foi integrado
    expect(pedidoResponse.body.documentos[0].integrado).toBe(true);
  });

  it('Cenario 5: Pedido chega novamente com novo exame (Apenas adiciona o novo)', async () => {
    const response = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        CodigoPedido: codigoPedido,
        NomePaciente: "ALEFHER MONTONI DE ALMEIDA",
        DataNascimento: "19970601",
        Sexo: "M",
        CodUnidade: 104,
        Exames: [
          {
            CodigoItemPedido: 930, // Antigo
            AccessionNumber: accessionNumber,
            Modalidade: "CR",
            NomeProcedimento: "RX ANTEBRACO ESQUERDO"
          },
          {
            CodigoItemPedido: 931, // Novo
            AccessionNumber: "931",
            Modalidade: "CR",
            NomeProcedimento: "OUTRO EXAME"
          }
        ]
      })
      .expect(201);

    // Deve ter 2 exames agora
    expect(response.body.exames.length).toBe(2);
  });
});
