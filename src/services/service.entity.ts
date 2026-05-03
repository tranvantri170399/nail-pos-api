// services/service.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ServiceCategory } from '../service-categories/service-category.entity';

@Entity('services')
@Index(['salonId'])
@Index(['categoryId'])
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salon_id', nullable: true })
  salonId: number;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @Column()
  name: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price: number;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => ServiceCategory, category => category.services)
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;
}