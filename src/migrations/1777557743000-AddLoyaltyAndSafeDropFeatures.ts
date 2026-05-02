import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoyaltyAndSafeDropFeatures1777557743000 implements MigrationInterface {
  name = 'AddLoyaltyAndSafeDropFeatures1777557743000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add safe_drop_total column to shifts table
    await queryRunner.query(`
      ALTER TABLE shifts 
      ADD COLUMN IF NOT EXISTS safe_drop_total numeric DEFAULT 0
    `);

    // Add loyalty_points and loyalty_tier columns to customers table
    await queryRunner.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS loyalty_points numeric DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS loyalty_tier varchar(50)
    `);

    // Create loyalty_transactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        salon_id INTEGER NOT NULL,
        transaction_id INTEGER,
        type varchar(50) NOT NULL,
        points numeric NOT NULL,
        balance numeric NOT NULL,
        reason text,
        expires_at timestamptz,
        created_at timestamptz DEFAULT NOW(),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (salon_id) REFERENCES salons(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      )
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        salon_id INTEGER NOT NULL,
        appointment_id INTEGER,
        customer_id INTEGER,
        type varchar(50) NOT NULL,
        channel varchar(50) NOT NULL,
        title varchar(255),
        message text NOT NULL,
        status varchar(50) DEFAULT 'pending',
        error text,
        sent_at timestamptz,
        scheduled_at timestamptz,
        created_at timestamptz DEFAULT NOW(),
        FOREIGN KEY (appointment_id) REFERENCES appointments(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (salon_id) REFERENCES salons(id)
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer 
      ON loyalty_transactions(customer_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_salon 
      ON loyalty_transactions(salon_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_customer 
      ON notifications(customer_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_salon 
      ON notifications(salon_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_status 
      ON notifications(status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_scheduled 
      ON notifications(scheduled_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_scheduled`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_salon`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_customer`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_loyalty_transactions_salon`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_loyalty_transactions_customer`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS loyalty_transactions`);

    // Remove columns from customers table
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS loyalty_tier`);
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS loyalty_points`);

    // Remove column from shifts table
    await queryRunner.query(`ALTER TABLE shifts DROP COLUMN IF EXISTS safe_drop_total`);
  }
}
