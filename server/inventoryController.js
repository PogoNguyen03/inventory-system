const db = require('./db');

// --- API MỚI: Lấy tồn kho của một cửa hàng ---
// GET /api/inventory?store_id=1
exports.getInventoryByStore = async (req, res) => {
    const storeId = req.query.store_id;

    if (!storeId) {
        return res.status(400).json({ error: "Cần cung cấp store_id" });
    }

    try {
        const [rows] = await db.execute(`
            SELECT 
                p.id as product_id,
                p.sku, 
                p.name, 
                p.price,
                i.quantity,
                i.last_updated
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.store_id = ?
        `, [storeId]);

        return res.json({
            store_id: storeId,
            data: rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Lỗi server" });
    }
};

// --- API MỚI: Xem lịch sử giao dịch (Audit Log) ---
// GET /api/logs?store_id=1
exports.getTransactionLogs = async (req, res) => {
    const storeId = req.query.store_id;
    
    try {
        const query = `
            SELECT 
                l.id,
                p.name as product_name,
                p.price,
                l.change_amount,
                l.reason,
                l.created_at
            FROM inventory_logs l
            JOIN products p ON l.product_id = p.id
            WHERE l.store_id = ?
            ORDER BY l.created_at DESC
            LIMIT 50
        `;
        const [rows] = await db.execute(query, [storeId]);
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Lỗi server" });
    }
};


// API: POST /api/inventory/transaction
// Body: { product_id: 101, store_id: 1, amount: -1, reason: 'SALE' }
exports.processTransaction = async (req, res) => {
    const { product_id, store_id, amount, reason } = req.body;
    
    // Validate cơ bản
    if (!product_id || !store_id || !amount) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const connection = await db.getConnection();

    try {
        // 1. BẮT ĐẦU TRANSACTION
        await connection.beginTransaction();

        // 2. Thực hiện cập nhật kho (Atomic Update)
        // Logic: Nếu amount là số âm (bán hàng), SQL sẽ kiểm tra xem (quantity + amount) có >= 0 không
        // Nếu amount là số dương (nhập hàng), luôn thành công
        const [updateResult] = await connection.execute(
            `UPDATE inventory 
             SET quantity = quantity + ? 
             WHERE product_id = ? AND store_id = ? 
             AND (quantity + ?) >= 0`, 
            [amount, product_id, store_id, amount]
        );

        // Kiểm tra xem có dòng nào được update không?
        if (updateResult.affectedRows === 0) {
            // Nếu không: Có thể do hết hàng hoặc sai ID
            // Chúng ta cần check xem sản phẩm/kho có tồn tại không để báo lỗi chính xác
            await connection.rollback();
            return res.status(409).json({ 
                error: "Giao dịch thất bại. Có thể do hết hàng hoặc mã sản phẩm/kho không đúng." 
            });
        }

        // 3. Ghi vào bảng Log (Audit Trail)
        await connection.execute(
            `INSERT INTO inventory_logs (product_id, store_id, change_amount, reason) 
             VALUES (?, ?, ?, ?)`,
            [product_id, store_id, amount, reason]
        );

        // 4. Lấy số lượng tồn kho mới nhất để trả về cho Client
        const [rows] = await connection.execute(
            `SELECT quantity FROM inventory WHERE product_id = ? AND store_id = ?`,
            [product_id, store_id]
        );
        const newQuantity = rows[0].quantity;

        // 5. COMMIT TRANSACTION (Lưu vĩnh viễn)
        await connection.commit();

        // --- PHẦN REAL-TIME (Tích hợp Socket.io ở đây) ---
        // io.emit('inventory_update', { product_id, store_id, newQuantity });
        
        return res.status(200).json({
            success: true,
            message: "Giao dịch thành công",
            current_quantity: newQuantity
        });

    } catch (error) {
        // 6. ROLLBACK (Nếu có bất kỳ lỗi nào xảy ra, hoàn tác tất cả)
        await connection.rollback();
        console.error("Lỗi giao dịch:", error);
        return res.status(500).json({ error: "Lỗi hệ thống nội bộ" });
    } finally {
        // Trả kết nối về pool
        connection.release();
    }
};