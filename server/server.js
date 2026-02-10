// File: server.js
const express = require('express');
const http = require('http'); // Thêm module này
const { Server } = require("socket.io"); // Thêm module này
const cors = require('cors'); // Thêm CORS

const inventoryController = require('./inventoryController');

const app = express();
const server = http.createServer(app); // Tạo server HTTP
const io = new Server(server, {
    cors: { origin: "*" } // Cho phép mọi kết nối (để test cho dễ)
});

app.use(cors());
app.use(express.json());

// Truyền biến 'io' vào request để Controller có thể dùng
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.get('/api/inventory', inventoryController.getInventoryByStore);
app.get('/api/logs', inventoryController.getTransactionLogs);
app.post('/api/inventory/transaction', inventoryController.processTransaction);

// Lắng nghe kết nối từ Client (Cửa hàng)
io.on('connection', (socket) => {
    console.log('⚡ Một cửa hàng vừa kết nối: ' + socket.id);
    
    socket.on('disconnect', () => {
        console.log('❌ Cửa hàng ngắt kết nối: ' + socket.id);
    });
});

const PORT = 3000;
// Lưu ý: Thay app.listen bằng server.listen
server.listen(PORT, () => {
    console.log(`Server Real-time đang chạy tại http://localhost:${PORT}`);
});