# API de Integração de Saúde

API REST de alto desempenho desenvolvida com **NestJS**, **Prisma** e **PostgreSQL** para a consolidação e integração automática de pedidos médicos, documentos complementares e exames de imagem hospitalares.

---

## 🚀 Tecnologias Utilizadas

- **Framework:** NestJS 11 (TypeScript) em modo ECMAScript Modules (ESM).
- **Banco de Dados:** PostgreSQL 15 (Alpine).
- **ORM:** Prisma 6.
- **Ambiente:** Docker & Docker Compose para portabilidade absoluta.

---

## 🛠️ Arquitetura e Decisões Técnicas

A API foi arquitetada sob preceitos modernos de engenharia de software hospitalar:
1. **Conectividade Docker Inviolável:** A configuração de rede no `.env` foi desenhada usando o hostname `postgres` para isolamento interno dos containers. Isso previne latências de loopback ou timeouts silenciosos associados ao uso de `localhost` em ambientes conteinerizados.
2. **Ciclo de Vida Transacional Assíncrono:** Todas as escritas do Prisma são explicitamente aguardadas (`await`) nos controllers antes do envio da resposta HTTP. Isso garante consistência relacional e evita problemas de Promises soltas ("hanging requests").
3. **Logs Estruturados:** Utilização do `Logger` nativo do NestJS para auditoria de todas as etapas críticas do pipeline de casamento de dados.

---

## 🏁 Como Executar o Projeto do Zero

### 1. Clonar o Repositório
```bash
git clone https://github.com/manuelportelaneto/integracao-saude.git
cd integracao-saude
```

### 2. Subir o Ambiente Multi-container
```bash
docker compose up -d --build
```
A API estará disponível imediatamente em `http://localhost:3000`.

---

## 🧪 Suíte de Testes Automatizados E2E

Para comprovar a integridade e conformidade de todos os fluxos de negócio do desafio, execute a suíte de testes E2E diretamente de dentro do container:

```bash
docker compose exec api npm run test:e2e
```

---

## 📋 Guia de Simulação e Testes Manuais (Cenários do Desafio)

Utilize os comandos `curl` abaixo (otimizados em uma linha para colagem livre de erros) para testar os cenários de negócio ponta a ponta:

### Cenário 1: Envio do Pedido Inicial (Pendente)
*O faturamento envia o pedido médico. A imagem ainda não chegou ao PACS.*
```bash
curl -X POST http://localhost:3000/pedidos -H "Content-Type: application/json" -d '{"CodigoPedido": 8001, "NomePaciente": "Ana Maria Oliveira", "DataNascimento": "1985-04-12", "Sexo": "F", "CodUnidade": 3, "Exames": [{"CodigoItemPedido": 9001, "AccessionNumber": "ACC-E2E-8001", "Modalidade": "CR", "NomeProcedimento": "Raio-X de Torax"}]}'
```
* **Verificação (Retorna `integrado: false`):**
```bash
curl http://localhost:3000/pedidos/8001
```

### Cenário 2: Envio de Documento Complementar (Pendente)
*Um laudo ou pedido assinado é enviado. O status de integração deve ser herdado do pedido (false).*
```bash
curl -X POST http://localhost:3000/documentos -H "Content-Type: application/json" -d '{"CodigoDocumento": 101, "CodigoPedido": 8001, "NomeDocumento": "Pedido_Medico_Assinado.pdf", "Documento": "JVBERi0xLjQKJVRleHRvIEZpY3RpY2lv"}'
```

### Cenário 3: Validação de Duplicidade (Retorno 409)
*Tentar reenviar o mesmo documento para o mesmo pedido deve retornar erro de conflito.*
```bash
curl -i -X POST http://localhost:3000/documentos -H "Content-Type: application/json" -d '{"CodigoDocumento": 101, "CodigoPedido": 8001, "NomeDocumento": "Pedido_Medico_Assinado.pdf", "Documento": "JVBERi0xLjQKJVRleHRvIEZpY3RpY2lv"}'
```

### Cenário 4: Chegada da Imagem Médica (PACS/RIS -> Integração Automática)
*O exame é realizado. O sistema deve varrer o banco, encontrar o pedido pendente e integrar tanto o pedido quanto todos os seus documentos retroativamente.*
```bash
curl -X POST http://localhost:3000/exames -H "Content-Type: application/json" -d '{"AccessionNumber": "ACC-E2E-8001", "NomePaciente": "Ana Maria Oliveira", "Modalidade": "CR", "Status": "REALIZADO"}'
```
* **Verificação (Pedido e documentos agora possuem `integrado: true`):**
```bash
curl http://localhost:3000/pedidos/8001
```

### Cenário 5: Pedido já integrado recebe novo exame incremental
*O pedido existente e integrado recebe um novo exame solicitado posteriormente.*
```bash
curl -X POST http://localhost:3000/pedidos -H "Content-Type: application/json" -d '{"CodigoPedido": 8001, "NomePaciente": "Ana Maria Oliveira", "DataNascimento": "1985-04-12", "Sexo": "F", "CodUnidade": 3, "Exames": [{"CodigoItemPedido": 9001, "AccessionNumber": "ACC-E2E-8001", "Modalidade": "CR", "NomeProcedimento": "Raio-X de Torax"}, {"CodigoItemPedido": 9002, "AccessionNumber": "ACC-E2E-8002", "Modalidade": "CR", "NomeProcedimento": "Raio-X de Mao Esquerda"}]}'
```
* **Verificação (O exame 9002 foi adicionado com sucesso sem duplicar o 9001):**
```bash
curl http://localhost:3000/pedidos/8001
```

---

## 🔧 Solução de Problemas e Depuração (Troubleshooting)

Se você enfrentar problemas de inconsistência de banco de dados, alterações não aplicadas ou travamentos de colagem no terminal, utilize os procedimentos abaixo:

### 1. Resetar o Ambiente e o Banco de Dados do Zero (Recomendado para novos testes)
Remove todas as tabelas e dados anteriores, reconstruindo os containers de forma limpa:
```bash
docker compose down -v
docker compose up -d --build
```

### 2. Acompanhar logs da API em tempo real
Útil para auditar a conexão com o banco e o processamento de rotas:
```bash
docker compose logs -f api
```

### 3. Rodar migrations do Prisma manualmente (caso o banco não inicialize)
```bash
docker compose exec api npx prisma db push
```
