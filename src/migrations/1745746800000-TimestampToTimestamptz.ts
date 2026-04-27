import { MigrationInterface, QueryRunner } from "typeorm";

export class TimestampToTimestamptz1745746800000 implements MigrationInterface {
    name = 'TimestampToTimestamptz1745746800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Convert all timestamp columns to timestamptz, treating existing values as UTC
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ALTER COLUMN "paid_at" TYPE timestamptz USING paid_at AT TIME ZONE 'UTC',
            ALTER COLUMN "created_at" TYPE timestamptz USING created_at AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ALTER COLUMN "created_at" TYPE timestamptz USING created_at AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`
            ALTER TABLE "customers"
            ALTER COLUMN "created_at" TYPE timestamptz USING created_at AT TIME ZONE 'UTC'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ALTER COLUMN "paid_at" TYPE timestamp USING paid_at AT TIME ZONE 'UTC',
            ALTER COLUMN "created_at" TYPE timestamp USING created_at AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ALTER COLUMN "created_at" TYPE timestamp USING created_at AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`
            ALTER TABLE "customers"
            ALTER COLUMN "created_at" TYPE timestamp USING created_at AT TIME ZONE 'UTC'
        `);
    }
}
