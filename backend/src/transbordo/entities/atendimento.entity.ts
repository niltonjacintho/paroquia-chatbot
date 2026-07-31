import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AtendimentoStatus {
  PENDENTE = 'PENDENTE',
  RESPONDIDO = 'RESPONDIDO',
  IGNORADO = 'IGNORADO',
}

@Entity('atendimentos')
export class Atendimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, name: 'telefone_fiel' })
  telefoneFiel: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'nome_fiel' })
  nomeFiel: string;

  @Column({ type: 'text' })
  pergunta: string;

  @Column({ type: 'text', nullable: true, name: 'resposta_humanizada' })
  respostaHumanizada: string;

  @Column({
    type: 'enum',
    enum: AtendimentoStatus,
    default: AtendimentoStatus.PENDENTE,
  })
  status: AtendimentoStatus;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
