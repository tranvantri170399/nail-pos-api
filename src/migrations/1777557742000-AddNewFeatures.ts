import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewFeatures1777557742000 implements MigrationInterface {
    name = 'AddNewFeatures1777557742000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create payrolls table
        await queryRunner.query(`CREATE TABLE "payrolls" ("id" SERIAL NOT NULL, "salon_id" integer NOT NULL, "staff_id" integer NOT NULL, "commission_amount" numeric NOT NULL DEFAULT '0', "tip_amount" numeric NOT NULL DEFAULT '0', "total_amount" numeric NOT NULL DEFAULT '0', "period_start" date NOT NULL, "period_end" date NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "paid_at" TIMESTAMP WITH TIME ZONE, "notes" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_payrolls" PRIMARY KEY ("id"))`);
        
        // Create waiting_list table
        await queryRunner.query(`CREATE TABLE "waiting_list" ("id" SERIAL NOT NULL, "salon_id" integer NOT NULL, "customer_id" integer, "customer_name" character varying NOT NULL, "customer_phone" character varying NOT NULL, "staff_id" integer, "status" character varying NOT NULL DEFAULT 'waiting', "party_size" integer NOT NULL DEFAULT '0', "notes" character varying, "position" integer NOT NULL DEFAULT '0', "assigned_at" TIMESTAMP WITH TIME ZONE, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_waiting_list" PRIMARY KEY ("id"))`);
        
        // Create schedules table
        await queryRunner.query(`CREATE TABLE "schedules" ("id" SERIAL NOT NULL, "salon_id" integer NOT NULL, "staff_id" integer NOT NULL, "schedule_date" date NOT NULL, "start_time" character varying NOT NULL, "end_time" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "notes" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_schedules" PRIMARY KEY ("id"))`);
        
        // Create time_clocks table
        await queryRunner.query(`CREATE TABLE "time_clocks" ("id" SERIAL NOT NULL, "salon_id" integer NOT NULL, "staff_id" integer NOT NULL, "clock_in" TIMESTAMP WITH TIME ZONE NOT NULL, "clock_out" TIMESTAMP WITH TIME ZONE, "hours_worked" numeric NOT NULL DEFAULT '0', "status" character varying NOT NULL DEFAULT 'active', "notes" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_time_clocks" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "time_clocks"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`DROP TABLE "waiting_list"`);
        await queryRunner.query(`DROP TABLE "payrolls"`);
    }
}
