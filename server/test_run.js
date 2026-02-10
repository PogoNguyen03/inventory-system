// File: test_run.js
// Cần cài đặt axios: npm install axios
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const STORE_ID = 1;      // Cửa hàng Quận 1
const PRODUCT_ID = 2;    // iPhone 15 Pro

async function runSimulation() {
    try {
        console.log("=== BẮT ĐẦU MÔ PHỎNG ===");

        // 1. Kiểm tra kho ban đầu
        console.log("\n1. [GET] Kiểm tra tồn kho ban đầu...");
        let res = await axios.get(`${BASE_URL}/inventory?store_id=${STORE_ID}`);
        let iphone = res.data.data.find(p => p.product_id === PRODUCT_ID);
        console.log(`-> Kho hiện tại: ${iphone.name} = ${iphone.quantity} cái`);

        // 2. Khách mua 1 cái (Gửi transaction trừ 1)
        console.log("\n2. [POST] Khách mua 1 cái iPhone...");
        const saleRes = await axios.post(`${BASE_URL}/inventory/transaction`, {
            store_id: STORE_ID,
            product_id: PRODUCT_ID,
            amount: -1,
            reason: 'SALE_RETAIL'
        });
        
        if (saleRes.data.success) {
            console.log(`-> Giao dịch thành công! Tồn kho mới trả về: ${saleRes.data.new_quantity}`);
        }

        // 3. Kiểm tra lại kho lần nữa (để chắc chắn DB đã cập nhật)
        console.log("\n3. [GET] Kiểm tra lại dữ liệu kho...");
        res = await axios.get(`${BASE_URL}/inventory?store_id=${STORE_ID}`);
        iphone = res.data.data.find(p => p.product_id === PRODUCT_ID);
        console.log(`-> Kho sau khi bán: ${iphone.name} = ${iphone.quantity} cái`);

        // 4. Thử mua quá số lượng (Giả sử tồn còn 9, mua 100 cái)
        console.log("\n4. [POST] Thử mua lố (100 cái)...");
        try {
            await axios.post(`${BASE_URL}/inventory/transaction`, {
                store_id: STORE_ID,
                product_id: PRODUCT_ID,
                amount: -100,
                reason: 'SALE_FAIL'
            });
        } catch (error) {
            console.log(`-> Kết quả mong đợi: Lỗi ${error.response.status} - ${error.response.data.error}`);
        }

        // 5. Kiểm tra lịch sử giao dịch (Audit Log)
        console.log("\n5. [GET] Xem lịch sử giao dịch...");
        const logRes = await axios.get(`${BASE_URL}/logs?store_id=${STORE_ID}`);
        console.table(logRes.data); // In bảng log đẹp mắt

    } catch (error) {
        console.error("Lỗi test:", error.message);
    }
}

runSimulation();