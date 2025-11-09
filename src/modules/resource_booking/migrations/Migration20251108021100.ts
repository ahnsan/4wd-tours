import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251108021100 extends Migration {

  override async up(): Promise<void> {
    // Create update_updated_at_column function for triggers
    this.addSql(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create resource table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "resource" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" VARCHAR(20) NOT NULL CHECK (type IN ('VEHICLE', 'TOUR', 'GUIDE')),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "deleted_at" TIMESTAMP NULL
      );
    `);

    // Create indexes for resource table
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_resource_type" ON "resource"("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_resource_active" ON "resource"("is_active") WHERE deleted_at IS NULL;`);

    // Create trigger for resource table
    this.addSql(`
      CREATE TRIGGER update_resource_updated_at
      BEFORE UPDATE ON "resource"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create resource_capacity table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "resource_capacity" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "resource_id" UUID NOT NULL REFERENCES "resource"("id") ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "max_capacity" INTEGER NOT NULL CHECK (max_capacity >= 0),
        "available_capacity" INTEGER NOT NULL CHECK (available_capacity >= 0 AND available_capacity <= max_capacity),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "uq_resource_date" UNIQUE ("resource_id", "date")
      );
    `);

    // Create indexes for resource_capacity table
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_capacity_date" ON "resource_capacity"("date");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_capacity_resource_date" ON "resource_capacity"("resource_id", "date");`);

    // Create trigger for resource_capacity table
    this.addSql(`
      CREATE TRIGGER update_resource_capacity_updated_at
      BEFORE UPDATE ON "resource_capacity"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create resource_blackout table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "resource_blackout" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "resource_id" UUID NOT NULL REFERENCES "resource"("id") ON DELETE CASCADE,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL CHECK (end_date >= start_date),
        "reason" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create index for resource_blackout table
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_blackout_resource_dates" ON "resource_blackout"("resource_id", "start_date", "end_date");`);

    // Create trigger for resource_blackout table
    this.addSql(`
      CREATE TRIGGER update_resource_blackout_updated_at
      BEFORE UPDATE ON "resource_blackout"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create resource_hold table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "resource_hold" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "resource_id" UUID NOT NULL REFERENCES "resource"("id") ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        "customer_email" VARCHAR(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "idempotency_token" VARCHAR(255) UNIQUE NOT NULL,
        "status" VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED')),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for resource_hold table
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_hold_idempotency" ON "resource_hold"("idempotency_token");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_hold_resource_date_status" ON "resource_hold"("resource_id", "date", "status");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_hold_expires" ON "resource_hold"("expires_at") WHERE status = 'ACTIVE';`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_hold_customer" ON "resource_hold"("customer_email");`);

    // Create trigger for resource_hold table
    this.addSql(`
      CREATE TRIGGER update_resource_hold_updated_at
      BEFORE UPDATE ON "resource_hold"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create resource_allocation table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "resource_allocation" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "resource_id" UUID NOT NULL REFERENCES "resource"("id") ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "quantity" INTEGER NOT NULL CHECK (quantity > 0),
        "order_id" VARCHAR(255) NOT NULL,
        "line_item_id" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for resource_allocation table
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_allocation_resource_date" ON "resource_allocation"("resource_id", "date");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_allocation_order" ON "resource_allocation"("order_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_allocation_line_item" ON "resource_allocation"("line_item_id");`);
  }

  override async down(): Promise<void> {
    // Drop tables in reverse order (respecting foreign key constraints)
    this.addSql(`DROP TABLE IF EXISTS "resource_allocation" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "resource_hold" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "resource_blackout" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "resource_capacity" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "resource" CASCADE;`);

    // Drop the trigger function
    this.addSql(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;`);
  }

}
