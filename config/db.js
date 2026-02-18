const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

const connectDB = async () => {
  try {
    await promisePool.query("SELECT 1");
    console.log("MySQL Database Connected Successfully");
  } catch (err) {
    console.error("Database Connection Failed", err);
    process.exit(1);
  }
};

module.exports = { connectDB, pool: promisePool };
