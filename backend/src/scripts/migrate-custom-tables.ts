/**
 * Run this before `medusa start` in production to ensure all custom tables
 * and schema changes are applied. Safe to run on every deploy — all statements
 * use IF NOT EXISTS / IF EXISTS guards.
 *
 * Usage:  npx tsx src/scripts/migrate-custom-tables.ts
 */
import "dotenv/config"
import pg from "pg"

const { Pool } = pg

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    console.log("[migrate] Running custom table migrations…")

    await client.query(`
      create table if not exists customer_order_requests (
        id serial primary key,
        order_id text not null,
        request_type text not null,
        status text not null default 'requested',
        reason text,
        notes text,
        items jsonb,
        tracking_number text,
        tracking_url text,
        refund_reference text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists idx_customer_order_requests_order_id on customer_order_requests(order_id);

      create table if not exists razorpay_payment_references (
        id bigserial primary key,
        cart_id text,
        medusa_order_id text,
        razorpay_order_id text unique,
        razorpay_payment_id text unique,
        razorpay_refund_id text,
        amount integer,
        currency text,
        status text not null,
        failure_reason text,
        last_event text,
        last_webhook_event_id text,
        payload jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists idx_razorpay_payment_references_cart_id on razorpay_payment_references(cart_id);
      create index if not exists idx_razorpay_payment_references_medusa_order_id on razorpay_payment_references(medusa_order_id);
      create index if not exists idx_razorpay_payment_references_status on razorpay_payment_references(status);

      create table if not exists site_feedback (
        id serial primary key,
        name text,
        email text,
        message text not null,
        page text,
        status text not null default 'new',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists customer_wishlist_items (
        id serial primary key,
        customer_id text not null,
        product_id text not null,
        created_at timestamptz not null default now(),
        unique(customer_id, product_id)
      );
      create index if not exists idx_customer_wishlist_items_customer on customer_wishlist_items(customer_id);

      create table if not exists customer_compare_items (
        id serial primary key,
        customer_id text not null,
        product_id text not null,
        created_at timestamptz not null default now(),
        unique(customer_id, product_id)
      );

      create table if not exists product_reviews (
        id serial primary key,
        product_id text not null,
        customer_id text,
        order_id text,
        rating integer not null check (rating between 1 and 5),
        title text,
        body text,
        status text not null default 'pending',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists idx_product_reviews_product_id on product_reviews(product_id);

      create table if not exists sales (
        id serial primary key,
        name text not null,
        active boolean not null default false,
        discount_pct numeric(5,2) not null default 0,
        label text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists sale_products (
        product_id text primary key,
        sale_id integer not null references sales(id) on delete cascade,
        assigned_at timestamptz not null default now()
      );
    `)

    // Additive column migrations (safe to run on existing tables)
    await client.query(`
      alter table razorpay_payment_references
        add column if not exists last_webhook_event_id text;
    `)

    console.log("[migrate] All custom table migrations complete.")
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("[migrate] Migration failed:", err)
  process.exit(1)
})
