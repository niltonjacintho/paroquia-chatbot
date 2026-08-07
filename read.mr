# 🚀 Guia de Deploy em Nuvem - Chatbot Pastoral Fullstack

Este documento descreve detalhadamente o passo a passo para realizar a implantação (deploy) completa de toda a infraestrutura do Chatbot Pastoral na nuvem.

A arquitetura final recomendada é composta por:
1. **Frontend (Dashboard Administrativo Angular):** Hospedado no **Netlify** (plataforma gratuita, segura e otimizada para SPAs).
2. **Backend (NestJS API):** Hospedado no **Render** (plataforma de Cloud Services com excelente tier gratuito para serviços Node.js).
3. **Banco de Dados (PostgreSQL + pgvector):** Hospedado no **Supabase** (banco PostgreSQL na nuvem completo com extensão `pgvector` nativa e gratuita).
4. **WhatsApp API Providers:** Conectado via **Z-API** (serviço SaaS pago) ou **Evolution API** (auto-hospedado).
5. **Inteligência Artificial:** Chaves de API da **OpenAI** (`gpt-4o-mini` e `text-embedding-3-small`).

---

## 🛠️ Fluxo Geral de Comunicação

O diagrama abaixo ilustra como os serviços interagem no ambiente de nuvem:

```mermaid
graph TD
    User([Usuário do WhatsApp]) <-->|Mensagens| WhatsApp[WhatsApp / Celular]
    WhatsApp <-->|Webhooks & API| Provider[Z-API / Evolution API]
    Provider <-->|Webhooks & Envios| Backend[Backend NestJS - Render]
    Admin([Administrador da Paróquia]) <-->|Interface Web| Frontend[Frontend Angular - Netlify]
    Frontend <-->|Requisições HTTP & WebSockets| Backend
    Backend <-->|Leitura/Escrita de Dados| Database[(PostgreSQL + pgvector - Supabase)]
    Backend <-->|Embeddings & Chat completion| OpenAI[OpenAI API]
```

---

## 🗄️ Passo 1: Criando o Banco de Dados (Supabase)

O Supabase oferece instâncias completas de PostgreSQL com suporte nativo à extensão `pgvector` no seu plano gratuito.

1. Acesse o site do [Supabase](https://supabase.com/) e crie uma conta (pode usar seu login do GitHub).
2. Clique em **New Project** (Novo Projeto).
3. Selecione a sua organização e preencha as informações:
   * **Name:** `paroquia-chatbot-db`
   * **Database Password:** Escolha uma senha forte (guarde-a bem, ela será necessária para a string de conexão).
   * **Region:** Escolha uma região próxima (ex: `South America (São Paulo) - sa-east-1` para menor latência).
   * **Pricing Plan:** Selecione **Free** (Gratuito).
4. Clique em **Create new project**. O processo de provisionamento do banco de dados leva cerca de 1 a 2 minutos.
5. Após o banco estar ativo, vá em **Project Settings** (ícone de engrenagem no menu lateral esquerdo) > **Database**.
6. Role até a seção **Connection string** e selecione a aba **URI**.
7. Copie a string de conexão apresentada. Ela se parece com isto:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
   > [!IMPORTANT]
   > Lembre-se de substituir `[YOUR-PASSWORD]` pela senha real que você definiu ao criar o projeto.

> [!NOTE]
> **Extensão pgvector:** O backend NestJS está programado para rodar automaticamente o comando `CREATE EXTENSION IF NOT EXISTS vector;` durante a inicialização (em `backend/src/main.ts`). Não há necessidade de ativar manualmente a extensão no console do Supabase.
> **Sincronização de Tabelas:** O backend também utiliza TypeORM com `synchronize: true` em `database.module.ts`. Isso significa que todas as tabelas (histórico, atendimentos e base de conhecimento) serão criadas automaticamente na primeira inicialização do backend.

---

## 🧠 Passo 2: Hospedando o Backend (Render.com)

O Render permite fazer deploy de serviços web Node.js diretamente a partir de um repositório Git de forma gratuita.

1. Acesse o site do [Render](https://render.com/) e crie uma conta gratuita.
2. No painel principal, clique no botão **New +** no canto superior direito e selecione **Web Service**.
3. Na seção **Source Code**, localize o repositório deste projeto na lista sob a aba **Git Provider** (se necessário, use a barra de busca ou vincule a conta correta do GitHub) e clique no botão **Connect** (Conectar) ao lado do repositório.
   > [!NOTE]
   > Se o repositório for público, você também pode colar a URL HTTPS do Git diretamente na aba **Public Git Repository** e clicar em **Connect**.
4. **Após clicar em Connect**, a tela de configuração do Web Service será exibida. Nela, preencha os seguintes campos:
   * **Name:** `paroquia-chatbot-backend`
   * **Region:** Selecione a região recomendada (ex: `Oregon (US West)` ou similar).
   * **Branch:** `main` (ou a branch de produção do seu repositório).
   * **Root Directory:** `backend` (Isso é **muito importante** porque o backend está em uma subpasta).
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm run start:prod`
   * **Instance Type:** `Free`
5. Role a página até o final e clique no botão **Advanced**.
6. Na seção **Environment Variables** (Variáveis de Ambiente), adicione as seguintes chaves e valores:

| Variável | Valor Sugerido / Descrição |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` *(o Render detecta automaticamente a porta)* |
| `DATABASE_URL` | A URI de conexão que você copiou do **Supabase** *(ex: `postgresql://postgres:senha@db.ref.supabase.co:5432/postgres`)* |
| `JWT_SECRET` | Uma string aleatória e segura de sua escolha para criptografia dos tokens JWT. |
| `OPENAI_API_KEY` | Sua chave de API gerada no portal da OpenAI. |
| `WHATSAPP_API_URL` | A URL da API do seu provedor (Z-API ou Evolution API). |
| `WHATSAPP_TOKEN` | O token de segurança fornecido pelo seu provedor do WhatsApp. |

7. Clique em **Create Web Service**.
8. O Render iniciará o download do código, a instalação das dependências e a compilação. Quando concluído com sucesso, o status mudará para **Live**.
9. Copie a URL gerada pelo Render na parte superior da tela (ex: `https://paroquia-chatbot-backend.onrender.com`).

> [!WARNING]
> **Modo de Repouso do Render Free:** Serviços na camada gratuita do Render entram em modo de repouso (sleep) após 15 minutos sem receber tráfego. Quando uma nova requisição chega, ele demora de 30 a 50 segundos para "acordar". Para produção contínua, considere fazer o upgrade para o plano individual do Render ($7/mês) ou usar um serviço como UptimeRobot para realizar ping periódico no endpoint do backend.

---

## 💬 Passo 3: Configurando o Webhook do WhatsApp

Agora que o seu backend está ativo e possui uma URL pública na nuvem, você deve configurar o provedor de WhatsApp para enviar mensagens recebidas diretamente para ele.

### Opção A: Z-API
1. Entre no painel administrativo da [Z-API](https://www.z-api.io/).
2. Acesse sua instância e vá na aba **Webhooks**.
3. Localize o webhook para **Recebimento de Mensagens** (ou *Message Received*).
4. Insira a URL do seu backend do Render acrescida de `/chatbot/webhook`.
   * **Exemplo:** `https://paroquia-chatbot-backend.onrender.com/chatbot/webhook`
5. Ative a chave de ativação do webhook e salve.

### Opção B: Evolution API
Se você está rodando a Evolution API em um servidor próprio (via Docker):
1. Faça uma requisição para a rota de configuração de webhook (`POST /webhook/set`) da sua instância da Evolution API.
2. No corpo da requisição JSON, configure:
   * **URL:** `https://paroquia-chatbot-backend.onrender.com/chatbot/webhook`
   * **Enabled:** `true`
   * **Events:** `["MESSAGES_UPSERT"]`

---

## 💻 Passo 4: Hospedando o Frontend (Netlify)

O Netlify é uma plataforma perfeita para hospedar aplicativos Angular estáticos. Ela lê as instruções do arquivo `netlify.toml` na raiz do repositório para direcionar e construir o projeto automaticamente.

O projeto já contém um arquivo `netlify.toml` configurado para este projeto monorepo, especificando:
* A pasta raiz da compilação: `frontend`
* O comando de build: `npm run build` (que roda o script `set-env.js` injetando as variáveis do Netlify e depois compila com `ng build`).
* A pasta a publicar: `dist/frontend/browser`

### Passo a Passo de Deploy no Netlify:
1. Acesse o site do [Netlify](https://www.netlify.com/) e crie ou faça login na sua conta.
2. Clique no botão **Add new site** > **Import an existing project**.
3. Selecione o provedor Git correspondente (ex: **GitHub**) e autorize a conexão.
4. Escolha o repositório contendo o código do projeto.
5. As configurações do site serão preenchidas automaticamente a partir do arquivo `netlify.toml` da raiz do repositório. Confirme se os campos estão de acordo:
   * **Base directory:** `frontend`
   * **Build command:** `npm run build`
   * **Publish directory:** `dist/frontend/browser`
6. Vá para a seção **Environment variables** (Variáveis de Ambiente) clicando em **Add environment variables** (ou nas configurações pós-criação do site, em *Site configuration > Environment variables*).
7. Adicione as seguintes variáveis:
   * `API_URL`: A URL do backend publicado no **Render** (ex: `https://paroquia-chatbot-backend.onrender.com`).
   * `PRODUCTION`: `true`
8. Clique em **Deploy site**.
9. O Netlify iniciará o processo de build. Quando concluído, ele fornecerá uma URL pública (ex: `https://exemplo-paroquia.netlify.app`).

> [!NOTE]
> **Angular Router e Recarregamento de Páginas:** O frontend inclui o arquivo `frontend/public/_redirects` com a instrução `/* /index.html 200`. Isso garante que o Netlify redirecione todas as rotas internas do Angular (como `/login`, `/dashboard`, etc.) para o arquivo index principal, evitando erros de página não encontrada (404) ao atualizar o navegador.

---

## 🔍 Passo 5: Verificação do Funcionamento Completo

Uma vez que todos os serviços estejam ativos, realize a verificação ponta a ponta:

1. **Acesso ao Painel:** Acesse a URL gerada pelo **Netlify**. Tente realizar login com as credenciais administrativas (configuradas no banco de dados).
2. **Carga de Arquivos PDF (RAG):**
   * Vá até a seção de base de conhecimento no dashboard.
   * Faça o upload de um arquivo PDF institucional ou de orientações paroquiais.
   * O frontend enviará o arquivo para o backend (no Render), que extrairá o texto, gerará os embeddings na OpenAI e salvará os vetores de 1536 dimensões no banco do **Supabase**.
3. **Conversação no WhatsApp:**
   * Envie uma mensagem pelo WhatsApp associado ao bot contendo perguntas sobre o PDF enviado.
   * O fluxo deve passar pelo provedor do WhatsApp, acionar o webhook do Render, fazer a busca de similaridade vetorial no Supabase, contextualizar o prompt enviado à OpenAI e retornar a resposta correta no WhatsApp do usuário.
4. **Fila de Transbordo (Transbordo Humano):**
   * Mande uma mensagem com termos que forcem o transbordo (ex: "falar com atendente").
   * Verifique se o atendimento entra em estado de transbordo e se ele aparece instantaneamente no dashboard do **Netlify** via Socket.io.
