# API de Integracao de Saude

API REST desenvolvida com NestJS, Prisma e PostgreSQL para integracao de pedidos medicos, documentos e exames de imagem.

## Tecnologias Utilizadas

- Framework: NestJS (TypeScript)
- Banco de Dados: PostgreSQL 15
- ORM: Prisma 6
- Infraestrutura: Docker e Docker Compose

## Arquitetura e Regras de Negocio

A API gerencia o ciclo de vida de um pedido medico baseado em eventos de integracao:

1.  **Pedidos**: Criados inicialmente com status `integrado: false`. Podem conter multiplos exames solicitados. Se reenviados, apenas exames novos sao adicionados.
2.  **Documentos**: Anexados a um pedido via chave composta (CodigoDocumento + CodigoPedido). Herdam o status de integracao do pedido no momento da criacao.
3.  **Exames**: Quando um exame chega (POST /exames), o sistema localiza pedidos que contenham o mesmo `AccessionNumber` e automaticamente marca o pedido e todos os seus documentos como `integrado: true`.

## Como Executar

### Pre-requisitos

- Docker e Docker Compose instalados.

### Passo a Passo

1.  Clone o repositorio.
2.  Suba os containers:
```bash
docker compose up -d --build
```
3.  A API estara disponivel em `http://localhost:3000`.

## Testes Automatizados (Diferencial)

Foram implementados testes de integracao E2E que validam todos os cenarios do desafio. Para rodar os testes:

**Dentro do container (recomendado):**
```bash
docker compose exec api npm run test:e2e
```

**Ou localmente (requer Node.js e banco rodando):**
```bash
npm run test:e2e
```

## Endpoints

- `POST /pedidos`: Recebimento de pedidos.
- `POST /documentos`: Recebimento de documentos vinculados.
- `POST /exames`: Simula chegada de exame (gatilho de integracao).
- `GET /pedidos/:codigoPedido`: Consulta pedido completo.
- `GET /documentos/:codigoPedido`: Consulta documentos de um pedido.
- `GET /exames/:accessionNumber`: Consulta dados do exame.

## Decisoes Tecnicas

- **NestJS + ESM**: Optamos por uma arquitetura moderna usando EcmaScript Modules para melhor performance e compatibilidade com o futuro do Node.js.
- **Relacionamentos**: Os documentos sao vinculados ao pedido, o que garante contexto para todos os exames contidos nele, atendendo a regra de negocio de forma centralizada.
- **Validacao**: Usamos `class-validator` para garantir a integridade dos dados na entrada da API.
