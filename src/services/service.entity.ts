import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('numeric')
  price: number;

  @Column()
  duration_minutes: number;

  @Column({ default: 'Tay' })
  category: string;

  @Column({ default: '#FF6B9D' })
  color: string;

  @Column({ default: true })
  is_active: boolean;
}