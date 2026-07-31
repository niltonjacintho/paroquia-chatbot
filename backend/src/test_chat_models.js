const { GoogleGenerativeAI } = require('@google/generative-ai');
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

async function testModel(modelName) {
  console.log(`\nTesting chat model: "${modelName}"`);
  try {
    const ai = new GoogleGenerativeAI(geminiKey);
    const model = ai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Olá, me responda com uma palavra.");
    console.log(`Success! Response: ${result.response.text()}`);
    return true;
  } catch (err) {
    console.error(`Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  await testModel('gemini-2.0-flash');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-flash-latest');
}

run();
