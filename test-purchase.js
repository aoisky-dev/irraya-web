const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5433/irraya' });
async function run() {
  await client.connect();
  const res = await client.query(`
         select 1
         from "order" o
         join order_item oi on oi.order_id = o.id
         join order_line_item oli on oli.id = oi.item_id
         where o.customer_id = $1
           and oli.product_id = $2
           and o.deleted_at is null
           and (o.metadata->'shipment'->>'status' = 'delivered')
         limit 1
  `, ['cus_01M3HF316J7RWB98T9SBBK2RMG', 'prod_01M3SJ2CRDPRT5GNJC354GE9CH']);
  console.log('Result:', res.rows);
  await client.end();
}
run().catch(console.error);
