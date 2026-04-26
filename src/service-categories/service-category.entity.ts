// service-categories/service-category.entity.ts
import { Salon } from '../salons/salon.entity';
import { Service } from '../services/service.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity('service_categories')
export class ServiceCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salon_id' })
  salonId: number;

  @Column()
  name: string;

  @Column({ default: '#FF6B9D' })
  color: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Salon, salon => salon.categories)
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;

  @OneToMany(() => Service, service => service.category)
  services: Service[];
}