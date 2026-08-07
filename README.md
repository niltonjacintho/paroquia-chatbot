# Guia de Configuração e Credenciais: Chatbot Pastoral

Este guia detalha o passo a passo para obter, configurar e aplicar todas as credenciais necessárias para rodar o backend RAG e o frontend paroquial.

---

## 🛠️ 1. OpenAI API (Embeddings e Chat)
A OpenAI é usada para gerar embeddings vetoriais (`text-embedding-3-small`) para nossa busca semântica de similaridade de cosseno e para responder às perguntas dos fiéis de forma natural (`gpt-4o-mini`).

### Passo a passo para obter a chave:
1. Acesse o portal da [OpenAI Platform](https://platform.openai.com/).
2. Faça login ou crie uma conta gratuita.
3. No menu lateral esquerdo, clique em **API Keys** (ou acesse diretamente pelo link: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)).
4. Clique no botão **+ Create new secret key** (Criar nova chave secreta).
5. Defina um nome identificador (ex: `Chatbot-Paroquia`) e clique em **Create secret key**.
6. **IMPORTANTE:** Copie a chave secreta gerada imediatamente. Ela só será exibida uma vez.
7. Cole o valor na variável `OPENAI_API_KEY` do arquivo `.env` do backend.

> [!WARNING]
> **Adicione Créditos de Uso:** A OpenAI exige recarga pré-paga para chamadas de API (a conta gratuita do ChatGPT Plus **não** cobre chamadas de desenvolvedor). Acesse a aba **Settings > Billing** no portal e adicione um saldo mínimo de $5 USD para evitar erros do tipo `429 (Quota Exceeded)`.

---

## 💬 2. WhatsApp API (Provedores)
O backend suporta integração via webhook com os dois principais provedores do mercado: **Z-API** e **Evolution API**. Escolha um deles.

### Opção A: Z-API (Solução em Nuvem Paga)
A Z-API gerencia a conexão do WhatsApp via QR Code em seus servidores em nuvem.

1. Acesse o site da [Z-API](https://www.z-api.io/) e crie uma conta.
2. No painel de controle da Z-API, compre um plano de instância (há opções de teste gratuito).
3. Vá para a aba **Instâncias** e clique em **Criar Instância**.
4. Use o celular para escanear o **QR Code** exibido na tela (exatamente como faz para conectar o WhatsApp Web).
5. Copie os seguintes dados no painel da Z-API e adicione-os ao arquivo `.env`:
   *   `WHATSAPP_API_URL`: O endereço da API que o painel exibe para envio (Ex: `https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN`).
   *   `WHATSAPP_TOKEN`: O token de segurança associado à instância.
6. Na aba **Webhooks** da Z-API, ative a opção **Recebimento de Mensagens** e configure a URL de destino apontando para o seu servidor backend público:
   *   `http://<IP_OU_DOMINIO_PUBLICO>:3100/chatbot/webhook`
   *   *(Para testes locais, você pode usar ferramentas como Ngrok para gerar uma URL pública temporária: `ngrok http 3100`)*.

### Opção B: Evolution API (Solução de Código Aberto / Auto-hospedada)
Uma alternativa gratuita e Open Source que você pode hospedar em seu próprio servidor via Docker.

1. Suba a Evolution API em seu servidor ou máquina local usando Docker Compose.
2. Acesse o gerenciador (Ex: Evolution Manager) ou use o Postman para fazer uma chamada HTTP e criar uma nova instância (ex: `paroquia-bot`).
3. Gere o QR Code chamando a rota `/instance/connect/paroquia-bot` e escaneie com seu celular.
4. No arquivo `.env` do backend, configure:
   *   `WHATSAPP_API_URL`: A URL onde a sua Evolution API está respondendo (Ex: `http://localhost:8080` ou `https://sua-evolution-api.com`).
   *   `WHATSAPP_TOKEN`: A chave global do admin (`apikey`) configurada na instalação do Docker.
5. Configure o Webhook na Evolution chamando a rota `/webhook/set` apontando para o endpoint do backend NestJS:
   *   `https://seu-dominio.com/chatbot/webhook`
   *   Ative o evento de escuta: `MESSAGES_UPSERT`.

---

## 🗄️ 3. PostgreSQL + pgvector (Banco de Dados)
O banco de dados armazena o histórico, a fila de transbordo e os embeddings de 1536 dimensões.

1. **Instalação:** Certifique-se de usar uma imagem do Postgres que venha com a extensão `pgvector`. A imagem oficial do Docker recomendada é:
   ```bash
   docker run --name pgvector-db -e POSTGRES_PASSWORD=f9t07ZbQMnTfEDiUsNp4H0k81AQZzYFXgi9jB33YYVqcPA0zWTYVw4XmR3 -p 5432:5432 -d pgvector/pgvector:pg16
   ```
2. **Configuração automática:** O backend está programado para rodar `CREATE EXTENSION IF NOT EXISTS vector;` na inicialização (`main.ts`), logo, não é necessário criar a extensão manualmente.
3. Configure os detalhes de conexão no `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=admin
   DB_PASSWORD="f9t07ZbQMnTfEDiUsNp4H0k81AQZzYFXgi9jB33YYVqcPA0zWTYVw4XmR3"
   DB_DATABASE=postgres_db
   ```

---

## 📝 4. Variáveis do Backend (`/backend/.env`)

Para preencher seu arquivo `.env` de produção e desenvolvimento, siga este modelo:

```env
# Conexão com o Banco de Dados
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD="f9t07ZbQMnTfEDiUsNp4H0k81AQZzYFXgi9jB33YYVqcPA0zWTYVw4XmR3"
DB_DATABASE=postgres_db

# Variáveis do Sistema NestJS
PORT=3100
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_jwt_aqui_123456

# OpenAI
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Configurações do WhatsApp (Substitua pelos dados da Z-API ou Evolution)
WHATSAPP_API_URL=https://api.z-api.io/instances/MINHA_INSTANCIA/token/MEU_TOKEN
WHATSAPP_TOKEN=TOKEN_SEGURANCA_Z_API
```

---

## 🌐 5. Implantação em Nuvem (Cloud Deploy)

Para implantar toda a solução em ambiente de nuvem, incluindo o frontend no **Netlify**, o backend no **Render** e o banco de dados PostgreSQL com `pgvector` no **Supabase**, consulte o guia detalhado completo criado em:

👉 **[Guia de Deploy (read.mr)](file:///home/nilton-cesar/projetos/whatsapp/read.mr)**

O guia contém instruções passo a passo para:
- Criação e configuração do banco de dados gratuito com suporte a vetores no Supabase.
- Deploy automático do backend NestJS no Render integrado ao repositório GitHub.
- Deploy do frontend Angular no Netlify utilizando as variáveis de ambiente necessárias (`API_URL` e `PRODUCTION`).
- Configuração de webhooks do WhatsApp para a URL de produção.

