import * as dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis do arquivo .env antes do bootstrap do Nest

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Client } from 'pg';
import { ValidationPipe } from '@nestjs/common';

async function ensurePgVector() {
  // Conecta diretamente via pg client para garantir que a extensão exista
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/"/g, '') : '', // remove quotes if present
    database: process.env.DB_DATABASE || 'postgres_db',
  });

  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ Extensão pgvector verificada/criada com sucesso no PostgreSQL.');
  } catch (err) {
    console.error('❌ Erro ao habilitar a extensão pgvector:', err.message);
  } finally {
    await client.end();
  }
}

async function bootstrap() {
  await ensurePgVector();

  const app = await NestFactory.create(AppModule);

  // Habilita CORS para permitir comunicação com o painel Angular
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3100;
  await app.listen(port);
  console.log(`🚀 Chatbot Pastoral Backend executando em: http://localhost:${port}`);
}
bootstrap();
