# API de Integração de Saúde

API REST para integração de sistemas de saúde — pedidos médicos, documentos clínicos e exames de imagem.

## Stack Tecnológica

| Tecnologia  | Versão   | Papel                          |
|-------------|----------|--------------------------------|
| NestJS      | 11.x     | Framework HTTP (TypeScript)    |
| PostgreSQL  | 15       | Banco de dados relacional      |
| Prisma      | 7.x      | ORM e migrations               |
| Docker      | -        | Containerização e orquestração |

---

## Como Executar

### Com Docker (Recomendado)

```bash
# Subir todos os serviços (PostgreSQL + API)
docker-compose up --build

# A API estará disponível em http://localhost:3000
```

O `docker-compose up` irá:
1. Subir um PostgreSQL 15 com healthcheck
2. Buildar a aplicação NestJS
3. Gerar o cliente Prisma 7 utilizando o prisma.config.ts
4. Executar a sincronização do banco de dados
5. Iniciar a API na porta 3000

### Sem Docker (Desenvolvimento Local)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Crie um arquivo .env com a DATABASE_URL
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/integracao_saude?schema=public"

# 3. Sincronizar schema com o banco
npx prisma db push

# 4. Iniciar em modo desenvolvimento
npm run start:dev
```

---

## Endpoints da API

### Pedidos

#### `POST /pedidos` — Criar ou adicionar exames a um pedido

```json
{
  "CodigoPedido": 1001,
  "NomePaciente": "João da Silva",
  "DataNascimento": "1985-03-15",
  "Sexo": "M",
  "CodUnidade": 10,
  "Exames": [
    {
      "CodigoItemPedido": 5001,
      "AccessionNumber": "ACC-2025-001",
      "Modalidade": "CT",
      "NomeProcedimento": "Tomografia de Tórax"
    },
    {
      "CodigoItemPedido": 5002,
      "AccessionNumber": "ACC-2025-002",
      "Modalidade": "MR",
      "NomeProcedimento": "Ressonância de Crânio"
    }
  ]
}
```

**Regras de negócio:**
- Se já existe um Exame no banco com algum AccessionNumber enviado → pedido é salvo como integrado: true
- Se o CodigoPedido já existir, apenas exames novos são adicionados (sem duplicação nem sobrescrita do pedido)

#### `GET /pedidos/:codigoPedido` — Buscar pedido com exames e documentos

```bash
curl http://localhost:3000/pedidos/1001
```

---

### Documentos

#### `POST /documentos` — Anexar documento a um pedido

```json
{
  "CodigoDocumento": 3001,
  "CodigoPedido": 1001,
  "NomeDocumento": "Laudo Tomografia",
  "Documento": "JVBERi0xLjQKMSAwIG9iago8PA..."
}
```

**Regras de negócio:**
- 409 Conflict se a combinação CodigoDocumento + CodigoPedido já existir
- 404 Not Found se o Pedido não existir
- Herda o status integrado do pedido pai

#### `GET /documentos/:codigoPedido` — Listar documentos de um pedido

```bash
curl http://localhost:3000/documentos/1001
```

---

### Exames

#### `POST /exames` — Criar ou atualizar exame (Upsert)

```json
{
  "AccessionNumber": "ACC-2025-001",
  "NomePaciente": "João da Silva",
  "Modalidade": "CT",
  "Status": "Concluído"
}
```

**Regras de negócio:**
- Upsert baseado no AccessionNumber (cria se não existe, atualiza se existe)
- Se um Pedido contém esse AccessionNumber nos itens → atualiza o pedido para integrado: true
- Atualiza todos os Documentos pendentes desse pedido para integrado: true

#### `GET /exames/:accessionNumber` — Buscar exame

```bash
curl http://localhost:3000/exames/ACC-2025-001
```

---

## Decisões Arquiteturais

### Configuração do Prisma 7

A aplicação utiliza o Prisma 7, que introduziu mudanças significativas na configuração:
- O arquivo `prisma/schema.prisma` não contém mais a propriedade `url` do datasource.
- A configuração de conexão é centralizada no arquivo `prisma.config.ts`.
- O `PrismaService` utiliza inicialização zero-config, permitindo que o cliente resolva as variáveis de ambiente automaticamente de acordo com o novo padrão.

### Chave Primária Composta em Documentos

A entidade Documento usa uma chave primária composta `@@id([codigoDocumento, codigoPedido])` porque:
- Um mesmo código de documento pode existir em pedidos diferentes.
- A unicidade real é a combinação documento + pedido.
- Evita a necessidade de um ID auto-incremental artificial.

### Upsert em Exames

O endpoint POST /exames implementa um upsert (create or update) ao invés de separar POST/PUT porque:
- O sistema de imagem (PACS/RIS) envia atualizações de status de forma idempotente.
- Simplifica a integração, eliminando a necessidade de verificar existência antes de enviar.
- O AccessionNumber é a chave natural e imutável do exame.

### Integração Automática (Flag integrado)

O campo integrado funciona como um semáforo de sincronização:
- Pedido: Marca true quando o exame correspondente é recebido.
- Documento: Herda o status do pedido pai, e é atualizado em cascata quando o pedido é integrado.
- Permite rastrear quais registros já foram sincronizados entre os sistemas.

---

## Estrutura do Projeto

```
integracao-saude/
├── prisma/
│   └── schema.prisma          # Modelos de dados
├── src/
│   ├── integracao/
│   │   ├── dto/               # Objetos de transferência de dados
│   │   ├── integracao.controller.ts
│   │   ├── integracao.module.ts
│   │   └── integracao.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
├── prisma.config.ts           # Configuração central do Prisma 7
└── package.json
```

---

## Testando Fluxo Completo

```bash
# 1. Criar um pedido (integrado: false, pois nenhum exame existe ainda)
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
        "NomeProcedimento": "Raio-X de Tórax"
      }
    ]
  }'

# 2. Anexar documento (integrado: false, pois pedido ainda não foi integrado)
curl -X POST http://localhost:3000/documentos \
  -H "Content-Type: application/json" \
  -d '{
    "CodigoDocumento": 3001,
    "CodigoPedido": 1001,
    "NomeDocumento": "Requisição Médica",
    "Documento": "base64EncodedContent..."
  }'

# 3. Registrar exame — isso integrará o pedido e documentos automaticamente!
curl -X POST http://localhost:3000/exames \
  -H "Content-Type: application/json" \
  -d '{
    "AccessionNumber": "ACC-2025-100",
    "NomePaciente": "Maria Santos",
    "Modalidade": "CR",
    "Status": "Em andamento"
  }'

# 4. Verificar que tudo foi integrado
curl http://localhost:3000/pedidos/1001
# → integrado: true, documentos: [{ integrado: true }]
```
