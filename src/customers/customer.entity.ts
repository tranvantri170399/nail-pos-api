import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  note: string;

  @Column({ default: 0 })
  total_visits: number;

  @Column({ default: 0 })
  total_spent: number;

  @CreateDateColumn()
  created_at: Date;
}