import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Conhecimento } from '../conhecimento/entities/conhecimento.entity';
import { Atendimento } from '../transbordo/entities/atendimento.entity';
import { HistoricoMensagem } from '../chatbot/entities/historico-mensagem.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          ...(dbUrl
            ? { url: dbUrl }
            : {
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: Number(configService.get<number>('DB_PORT', 5432)),
                username: configService.get<string>('DB_USERNAME', 'admin'),
                password: configService.get<string>('DB_PASSWORD', ''),
                database: configService.get<string>('DB_DATABASE', 'postgres_db'),
              }),
          entities: [Conhecimento, Atendimento, HistoricoMensagem],
          synchronize: true, // Cria automaticamente as tabelas em desenvolvimento
          logging: false,
          ssl: dbUrl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
