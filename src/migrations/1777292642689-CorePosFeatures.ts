import { MigrationInterface, QueryRunner } from "typeorm";

export class CorePosFeatures1777292642689 implements MigrationInterface {
    name = 'CorePosFeatures1777292642689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction_payments" ("id" SERIAL NOT NULL, "transaction_id" integer NOT NULL, "payment_method" character varying NOT NULL, "amount" numeric NOT NULL, "reference" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_324e77bea070ff5e6822f478da1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cash_movements" ("id" SERIAL NOT NULL, "shift_id" integer NOT NULL, "salon_id" integer NOT NULL, "staff_id" integer NOT NULL, "type" character varying NOT NULL, "amount" numeric NOT NULL, "reason" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_25faead19e1ff74153a01604d37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shifts" ("id" SERIAL NOT NULL, "salon_id" integer NOT NULL, "opened_by" integer NOT NULL, "closed_by" integer, "starting_cash" numeric NOT NULL DEFAULT '0', "ending_cash" numeric, "expected_cash" numeric NOT NULL DEFAULT '0', "total_cash_sales" numeric NOT NULL DEFAULT '0', "total_card_sales" numeric NOT NULL DEFAULT '0', "total_other_sales" numeric NOT NULL DEFAULT '0', "total_tips" numeric NOT NULL DEFAULT '0', "total_refunds" numeric NOT NULL DEFAULT '0', "cash_in_total" numeric NOT NULL DEFAULT '0', "cash_out_total" numeric NOT NULL DEFAULT '0', "cash_difference" numeric, "status" character varying NOT NULL DEFAULT 'open', "close_note" character varying, "transaction_count" integer NOT NULL DEFAULT '0', "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_84d692e367e4d6cdf045828768c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transaction_items" ADD "discount_type" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction_items" ADD "discount_value" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transaction_items" ADD "discount_amount" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transaction_items" ADD "discount_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction_items" ADD "tip_amount" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "shift_id" integer`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "customer_id" integer`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "discount_type" character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "discount_value" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "discount_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "tax_rate" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transaction_items" ALTER COLUMN "service_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "salon_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staffs" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "salons" ALTER COLUMN "owner_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "salons" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "service_categories" DROP CONSTRAINT "FK_7c812f276a22da3f81862e1d6bb"`);
        await queryRunner.query(`ALTER TABLE "service_categories" ALTER COLUMN "salon_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_categories" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "owners" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "owners" ALTER COLUMN "phone" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "owners" ALTER COLUMN "password" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_923e323e598280a0454e1d1b7cf"`);
        await queryRunner.query(`ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b"`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ALTER COLUMN "appointment_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ALTER COLUMN "service_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "scheduled_date" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "start_time" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "end_time" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_payments" ADD CONSTRAINT "FK_fb9f72c7210116ee1b3ad289cc3" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_a7dd9378a61295e20a9f79e1b0c" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_categories" ADD CONSTRAINT "FK_7c812f276a22da3f81862e1d6bb" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ADD CONSTRAINT "FK_923e323e598280a0454e1d1b7cf" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ADD CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b"`);
        await queryRunner.query(`ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_923e323e598280a0454e1d1b7cf"`);
        await queryRunner.query(`ALTER TABLE "service_categories" DROP CONSTRAINT "FK_7c812f276a22da3f81862e1d6bb"`);
        await queryRunner.query(`ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_a7dd9378a61295e20a9f79e1b0c"`);
        await queryRunner.query(`ALTER TABLE "transaction_payments" DROP CONSTRAINT "FK_fb9f72c7210116ee1b3ad289cc3"`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "end_time" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "start_time" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "scheduled_date" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ALTER COLUMN "service_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ALTER COLUMN "appointment_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ADD CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment_services" ADD CONSTRAINT "FK_923e323e598280a0454e1d1b7cf" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "owners" ALTER COLUMN "password" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "owners" ALTER COLUMN "phone" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "owners" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "service_categories" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "service_categories" ALTER COLUMN "salon_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_categories" ADD CONSTRAINT "FK_7c812f276a22da3f81862e1d6bb" FOREIGN KEY ("salon_id") REFERENCES "salons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salons" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "salons" ALTER COLUMN "owner_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staffs" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "salon_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transaction_items" ALTER COLUMN "service_name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "tax_rate"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "discount_reason"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "discount_value"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "discount_type"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "shift_id"`);
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP COLUMN "tip_amount"`);
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP COLUMN "discount_reason"`);
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP COLUMN "discount_amount"`);
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP COLUMN "discount_value"`);
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP COLUMN "discount_type"`);
        await queryRunner.query(`DROP TABLE "shifts"`);
        await queryRunner.query(`DROP TABLE "cash_movements"`);
        await queryRunner.query(`DROP TABLE "transaction_payments"`);
    }

}
