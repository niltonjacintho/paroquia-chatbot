const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.ts');

// Garante que o diretório src/environments exista
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const apiUrl = process.env.API_URL || 'http://localhost:3100';
const production = process.env.PRODUCTION === 'true' || !!process.env.API_URL;

const envFileContent = `export const environment = {
  production: ${production},
  apiUrl: '${apiUrl}'
};
`;

fs.writeFileSync(targetPath, envFileContent, 'utf8');
console.log(`Environment file generated at ${targetPath} with apiUrl: ${apiUrl}`);
