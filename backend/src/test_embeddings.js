const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { TaskType } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Carrega o arquivo .env
const envPath = path.join(__dirname, '..', '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      envConfig[match[1]] = value;
    }
  });
}

const geminiKey = envConfig['GEMINI_API_KEY'];

async function testModel(modelName, apiVersion) {
  console.log(`\nTesting model: "${modelName}" with apiVersion: "${apiVersion || 'default'}"`);
  const config = {
    apiKey: geminiKey,
    modelName: modelName,
  };
  if (apiVersion) {
    config.apiVersion = apiVersion;
  }
  
  const embeddings = new GoogleGenerativeAIEmbeddings(config);
  try {
    const res = await embeddings.embedQuery("Olá mundo");
    console.log(`Success! Embedding size: ${res.length}`);
    return true;
  } catch (err) {
    console.error(`Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  // Test 1: text-embedding-004 on v1 (standard)
  await testModel('text-embedding-004', 'v1');
  
  // Test 2: text-embedding-004 on default (which is v1beta)
  await testModel('text-embedding-004', null);

  // Test 3: text-embedding-004 on v1beta1
  await testModel('text-embedding-004', 'v1beta1');

  // Test 4: embedding-001 (older 768 model)
  await testModel('embedding-001', 'v1');
  await testModel('embedding-001', null);
}

run();
