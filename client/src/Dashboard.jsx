import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Lấy URL từ biến môi trường (hoặc fallback về localhost nếu chạy máy nhà)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Dashboard = () => {
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState([]);
    
    // --- NÂNG CẤP 1: State để lưu cửa hàng đang chọn (Mặc định là 1) ---
    const [selectedStore, setSelectedStore] = useState(1);
    
    // Danh sách cửa hàng giả định (Sau này có thể gọi API lấy về)
    const STORES = [
        { id: 1, name: "Cửa hàng Quận 1" },
        { id: 2, name: "Cửa hàng Cầu Giấy" }
    ];

    // Hàm xử lý dữ liệu biểu đồ (Logic cũ)
    const processChartData = (data) => {
        const revenueMap = {};
        data.forEach(item => {
            if (item.change_amount < 0) {
                const productName = item.product_name;
                const revenue = Math.abs(item.change_amount) * parseFloat(item.price);
                if (revenueMap[productName]) {
                    revenueMap[productName] += revenue;
                } else {
                    revenueMap[productName] = revenue;
                }
            }
        });
        return Object.keys(revenueMap).map(name => ({
            name: name,
            revenue: revenueMap[name]
        }));
    };

    // Hàm lấy dữ liệu (Tách riêng để tái sử dụng)
    const fetchData = async () => {
        try {
            // Gọi API với store_id động
            const res = await axios.get(`${API_URL}/api/logs?store_id=${selectedStore}`);
            setLogs(res.data);
            setChartData(processChartData(res.data));
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
        }
    };

    // --- NÂNG CẤP 2: Hàm xử lý Bán hàng nhanh (Test POS) ---
    const handleQuickSell = async (productId) => {
        if (!confirm("Bạn muốn bán thử 1 sản phẩm này?")) return;

        try {
            await axios.post(`${API_URL}/api/inventory/transaction`, {
                store_id: selectedStore,
                product_id: productId,
                amount: -1,
                reason: 'WEB_POS_TEST'
            });
            // Sau khi bán xong, gọi lại fetchData để cập nhật ngay lập tức
            fetchData(); 
            alert("Đã bán thành công! Kiểm tra biểu đồ.");
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.error || "Không thể bán hàng"));
        }
    };

    // useEffect: Chạy khi component load HOẶC khi selectedStore thay đổi
    useEffect(() => {
        fetchData();
        
        // Polling: Tự động refresh mỗi 5 giây
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [selectedStore]); // <--- Quan trọng: Khi đổi store, code này chạy lại

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#2c3e50', margin: 0 }}>📊 Quản Lý Kho</h1>
                
                {/* --- MENU CHỌN CỬA HÀNG --- */}
                <select 
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px', borderRadius: '5px' }}
                >
                    {STORES.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                </select>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* PHẦN 1: BIỂU ĐỒ */}
                <div style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h3>💰 Doanh thu: {STORES.find(s => s.id == selectedStore)?.name}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
                            <Legend />
                            <Bar dataKey="revenue" name="Doanh thu (VND)" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Nút Test Bán Hàng */}
                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                        <h4>⚡ Thử nghiệm bán hàng (Fake POS)</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleQuickSell(1)} style={btnStyle}>
                                🛒 Bán 1 iPhone 15 Pro
                            </button>
                            <button onClick={() => handleQuickSell(2)} style={btnStyle}>
                                🛒 Bán 1 Samsung S24
                            </button>
                        </div>
                    </div>
                </div>

                {/* PHẦN 2: BẢNG LỊCH SỬ */}
                <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h3>📝 Giao dịch gần nhất</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {logs.map(log => (
                            <li key={log.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <strong>{log.product_name}</strong>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{format(new Date(log.created_at), 'HH:mm dd/MM')}</div>
                                </div>
                                <div style={{ 
                                    color: log.change_amount < 0 ? 'red' : 'green', 
                                    fontWeight: 'bold' 
                                }}>
                                    {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// Style đơn giản cho nút bấm
const btnStyle = {
    padding: '10px 15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

export default Dashboard;