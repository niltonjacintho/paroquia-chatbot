import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MensagemPapel {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

@Entity('historico_mensagens')
export class HistoricoMensagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, name: 'telefone_fiel' })
  telefoneFiel: string;

  @Column({
    type: 'enum',
    enum: MensagemPapel,
  })
  papel: MensagemPapel;

  @Column({ type: 'text' })
  conteudo: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
