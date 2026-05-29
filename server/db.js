const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: parseInt(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
});

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('underwriter','manager','admin','fraud_analyst') DEFAULT 'underwriter',
        branch VARCHAR(255),
        employee_id VARCHAR(50),
        phone VARCHAR(20),
        avatar_color VARCHAR(10) DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(50) PRIMARY KEY,
        applicant_name VARCHAR(255) NOT NULL,
        loan_type VARCHAR(100),
        amount BIGINT,
        amount_display VARCHAR(30),
        branch VARCHAR(255),
        submitted_at DATETIME,
        status ENUM('Under Review','Approved','Flagged','Rejected','Escalated','On Hold') DEFAULT 'Under Review',
        risk_score INT DEFAULT 0,
        risk_tier ENUM('low','medium','high','critical') DEFAULT 'low',
        doc_count INT DEFAULT 0,
        flag_count INT DEFAULT 0,
        analyst_id INT,
        analyst_name VARCHAR(255),
        ai_summary TEXT,
        forensic_score INT DEFAULT 0,
        semantic_score INT DEFAULT 0,
        behavioral_score INT DEFAULT 0,
        metadata_score INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (analyst_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS flags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id VARCHAR(50) NOT NULL,
        severity ENUM('low','medium','high','critical') NOT NULL,
        layer ENUM('forensic','semantic','behavioral','metadata') NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        document_name VARCHAR(255),
        page_num INT,
        confidence INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS application_actions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        user_id INT,
        user_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        pages INT DEFAULT 1,
        status ENUM('clean','suspicious','flagged') DEFAULT 'clean',
        confidence INT DEFAULT 100,
        file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS behavioral_signals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id VARCHAR(50) NOT NULL,
        signal VARCHAR(255),
        value VARCHAR(500),
        risk ENUM('low','medium','high','critical') DEFAULT 'low',
        detail TEXT,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id VARCHAR(50) NOT NULL,
        event_time DATETIME,
        event_text TEXT,
        event_type ENUM('info','alert','critical') DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ TiDB tables initialized successfully');
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDB };
