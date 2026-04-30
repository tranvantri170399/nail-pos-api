import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentBufferMinutes1777300000000 implements MigrationInterface {
  name = 'AddAppointmentBufferMinutes1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" ADD "buffer_minutes" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`UPDATE "appointments" SET "buffer_minutes" = 0 WHERE "buffer_minutes" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "buffer_minutes"`);
  }
}
