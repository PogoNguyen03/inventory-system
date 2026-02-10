// File: server/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Cần cài thêm thư viện này: npm install dotenv

const pool = mysql.createPool({
    // Nếu có biến môi trường thì dùng, không thì dùng localhost (để test máy nhà)
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'chuoi_cung_ung',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;