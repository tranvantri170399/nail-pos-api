import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTransactionStatusCompleted1745747400000 implements MigrationInterface {
    name = 'FixTransactionStatusCompleted1745747400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "transactions"
            SET status = 'paid'
            WHERE status = 'completed'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Cannot reliably revert since we don't know which were originally 'completed'
    }
}
