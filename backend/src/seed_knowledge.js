const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. Carrega o arquivo .env manualmente para evitar dependência externa extra
const envPath = path.join(__dirname, '..', '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      // Remove aspas se houver
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      envConfig[match[1]] = value;
    }
  });
}

const geminiKey = envConfig['GEMINI_API_KEY'];
if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY') {
  console.error('Erro: GEMINI_API_KEY não configurada no .env!');
  process.exit(1);
}

const dbConfig = {
  host: envConfig['DB_HOST'] || 'localhost',
  port: parseInt(envConfig['DB_PORT'] || '5432'),
  user: envConfig['DB_USERNAME'] || 'admin',
  password: envConfig['DB_PASSWORD'] || '',
  database: envConfig['DB_DATABASE'] || 'postgres_db',
};

const titulo = 'Horário das Missas';
const conteudo = 'O horário da missa na Paróquia Santa Bárbara é aos domingos às 19:00h e às quartas-feiras às 19:30h.';
const categoria = 'Geral';

async function run() {
  console.log('1. Gerando embedding com o Gemini...');
  let embedding;
  try {
    const ai = new GoogleGenerativeAI(geminiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text: conteudo }] },
      outputDimensionality: 768,
    });
    embedding = result.embedding.values;
    console.log(`Sucesso! Embedding gerado. Dimensões: ${embedding.length}`);
  } catch (err) {
    console.error('Erro ao gerar embedding:', err.message);
    process.exit(1);
  }

  console.log('2. Conectando ao Banco de Dados...');
  const client = new Client(dbConfig);
  await client.connect();

  try {
    console.log('3. Inserindo dados na tabela conhecimento...');
    // Formata o array para o formato aceito pelo pgvector: '[val1,val2,...]'
    const vectorString = `[${embedding.join(',')}]`;
    
    const query = `
      INSERT INTO conhecimento (titulo, conteudo, categoria, embedding, ativo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id;
    `;
    
    const res = await client.query(query, [titulo, conteudo, categoria, vectorString]);
    console.log(`Sucesso! Registro inserido com ID: ${res.rows[0].id}`);
  } catch (err) {
    console.error('Erro ao inserir no banco:', err.message);
  } finally {
    await client.end();
  }
}

run();
