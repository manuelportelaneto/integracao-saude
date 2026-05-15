# API de Integracao de Saude

API REST desenvolvida com NestJS, Prisma e PostgreSQL para integracao de pedidos medicos, documentos e exames de imagem.

## Tecnologias Utilizadas

- Framework: NestJS (TypeScript)
- Banco de Dados: PostgreSQL 15
- ORM: Prisma 6
- Infraestrutura: Docker e Docker Compose

## Arquitetura e Regras de Negocio

A API gerencia o ciclo de vida de um pedido medico baseado em eventos de integracao:

1.  **Pedidos**: Criados inicialmente com status `integrado: false`. Podem conter multiplos exames solicitados.
2.  **Documentos**: Anexados a um pedido. Herdam o status de integracao do pedido no momento da criacao.
3.  **Exames**: Recebidos via sistema de imagem (RIS/PACS). Quando um exame e postado com um AccessionNumber que pertence a um pedido, o sistema automaticamente marca o pedido e todos os seus documentos como `integrado: true`.

## Como Executar

### Pre-requisitos

- Docker e Docker Compose instalados.
- Git (para versionamento).

### Passo a Passo

1.  Clone o repositorio.
2.  Certifique-se de que as portas 3000 (API) e 5432 (Postgres) estao disponiveis.
3.  Suba os containers:

```bash
docker compose up -d --build
```

4.  A API estara disponivel em `http://localhost:3000`.

## Testando o Fluxo de Integracao

Voce pode utilizar os comandos abaixo para validar o funcionamento:

### 1. Criar Pedido
```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "CodigoPedido": 1001,
    "NomePaciente": "Maria Santos",
    "DataNascimento": "1990-07-20",
    "Sexo": "F",
    "CodUnidade": 5,
    "Exames": [
      {
        "CodigoItemPedido": 5001,
        "AccessionNumber": "ACC-2025-100",
        "Modalidade": "CR",
        "NomeProcedimento": "Raio-X de Torax"
      }
    ]
  }'
```

### 2. Adicionar Documento
```bash
curl -X POST http://localhost:3000/documentos \
  -H "Content-Type: application/json" \
  -d '{
    "CodigoPedido": 1001,
    "CodigoDocumento": 9001,
    "NomeDocumento": "Pedido Medico",
    "Documento": "BASE64_CONTENT"
  }'
```

### 3. Finalizar Exame (Gera Integracao Automatica)
```bash
curl -X POST http://localhost:3000/exames \
  -H "Content-Type: application/json" \
  -d '{
    "AccessionNumber": "ACC-2025-100",
    "NomePaciente": "Maria Santos",
    "Modalidade": "CR",
    "Status": "Finalizado"
  }'
```

### 4. Consultar Status Final
```bash
curl http://localhost:3000/pedidos/1001
```

## Compatibilidade com Windows

O projeto e totalmente compativel com Windows via Docker Desktop.
- Utilize o PowerShell ou Terminal do Windows.
- O comando recomendado e `docker compose` (sem hifen).
- Certifique-se de que o WSL2 esta habilitado para melhor performance no Docker Desktop.

## Desenvolvimento

Para rodar localmente fora do Docker (necessita Postgres local):
1.  `npm install`
2.  Configure a `DATABASE_URL` no arquivo `.env`.
3.  `npx prisma db push`
4.  `npm run start:dev`
