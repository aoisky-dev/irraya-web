const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT * FROM \"order_summary\" LIMIT 1").then(res => {
  console.log(res.rows[0] ? Object.keys(res.rows[0]) : "No summary table");
  process.exit(0);
}).catch(e => {
  console.log("Error querying order_summary:", e.message);
  process.exit(1);
});
