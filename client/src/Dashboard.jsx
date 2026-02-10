import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const Dashboard = () => {
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const STORE_ID = 1; // Mặc định xem Kho Quận 1

    // Hàm xử lý dữ liệu để vẽ biểu đồ
    const processChartData = (data) => {
        // Gom nhóm theo tên sản phẩm và tính tổng doanh thu
        const revenueMap = {};

        data.forEach(item => {
            // Chỉ tính giao dịch BÁN (change_amount < 0)
            if (item.change_amount < 0) {
                const productName = item.product_name;
                // Doanh thu = Số lượng bán (dương) * Giá
                const revenue = Math.abs(item.change_amount) * parseFloat(item.price);
                
                if (revenueMap[productName]) {
                    revenueMap[productName] += revenue;
                } else {
                    revenueMap[productName] = revenue;
                }
            }
        });

        // Chuyển đổi object thành mảng cho Recharts
        return Object.keys(revenueMap).map(name => ({
            name: name,
            revenue: revenueMap[name]
        }));
    };

    // Gọi API khi component được load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 2. Dùng biến API_URL thay vì link cứng
                const res = await axios.get(`${API_URL}/api/logs?store_id=${STORE_ID}`);
                setLogs(res.data);
                setChartData(processChartData(res.data));
            } catch (error) {
                console.error("Lỗi kết nối API:", error);
            }
        };

        fetchData();
        // Mẹo: Có thể dùng setInterval để tự động refresh mỗi 5s
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <h1 style={{ color: '#2c3e50' }}>📊 Dashboard Quản Lý Kho - Cửa Hàng Quận 1</h1>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* PHẦN 1: BIỂU ĐỒ DOANH THU */}
                <div style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h3>💰 Doanh thu theo Sản phẩm</h3>
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

export default Dashboard;