import mysql from 'mysql2/promise'

const db = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'automation_db',
  waitForConnections: true,
  connectionLimit:    10,
  connectTimeout:     30000,
  idleTimeout:        60000,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 10000,
})

// ✅ Har naye connection pe IST timezone set karo
;(db as mysql.Pool).on('connection', (connection: mysql.PoolConnection) => {
  connection.query("SET time_zone = '+05:30'")
})

export default db