import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    AreaChart, Area 
} from 'recharts';
import { format } from 'date-fns';
import { 
    LayoutDashboard, Store, ShoppingCart, TrendingUp, DollarSign, 
    Activity, ArrowUpRight, ArrowDownRight, Package 
} from 'lucide-react';

// URL API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Dashboard = () => {
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, orders: 0, stockSold: 0 });
    const [selectedStore, setSelectedStore] = useState(1);
    
    const STORES = [
        { id: 1, name: "Cửa hàng Quận 1" },
        { id: 2, name: "Cửa hàng Cầu Giấy" }
    ];

    // Xử lý dữ liệu biểu đồ & Thống kê tổng
    const processData = (data) => {
        const revenueMap = {};
        let totalRev = 0;
        let totalOrd = 0;
        let totalSold = 0;

        data.forEach(item => {
            if (item.change_amount < 0) {
                const productName = item.product_name;
                const qty = Math.abs(item.change_amount);
                const revenue = qty * parseFloat(item.price);
                
                // Cộng dồn cho biểu đồ
                revenueMap[productName] = (revenueMap[productName] || 0) + revenue;

                // Cộng dồn thống kê
                totalRev += revenue;
                totalOrd += 1; // Mỗi log bán là 1 đơn (giả định)
                totalSold += qty;
            }
        });

        setStats({ revenue: totalRev, orders: totalOrd, stockSold: totalSold });

        return Object.keys(revenueMap).map(name => ({
            name: name,
            revenue: revenueMap[name]
        }));
    };

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/logs?store_id=${selectedStore}`);
            setLogs(res.data);
            setChartData(processData(res.data));
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
        }
    };

    // Hàm xử lý bán hàng nhanh
    const handleQuickSell = async (productId) => {
        if (!confirm("Xác nhận bán 1 sản phẩm?")) return;
        try {
            await axios.post(`${API_URL}/api/inventory/transaction`, {
                store_id: selectedStore,
                product_id: productId,
                amount: -1,
                reason: 'WEB_POS'
            });
            fetchData();
            // Hiệu ứng thông báo nhỏ (Toast) có thể thêm sau
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.error || "Thất bại"));
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [selectedStore]);

    return (
        <div style={styles.container}>
            {/* --- HEADER --- */}
            <header style={styles.header}>
                <div style={styles.brand}>
                    <LayoutDashboard size={28} color="#4f46e5" />
                    <h1 style={styles.title}>Inventory Manager</h1>
                </div>
                
                <div style={styles.storeSelectWrapper}>
                    <Store size={20} style={{marginRight: 10, color: '#64748b'}} />
                    <select 
                        value={selectedStore} 
                        onChange={(e) => setSelectedStore(e.target.value)}
                        style={styles.select}
                    >
                        {STORES.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* --- STATS CARDS (Thẻ thống kê) --- */}
            <div style={styles.statsGrid}>
                <StatCard 
                    title="Tổng Doanh Thu" 
                    value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)} 
                    icon={<DollarSign size={24} color="white" />}
                    color="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                />
                <StatCard 
                    title="Đơn Hàng" 
                    value={stats.orders} 
                    icon={<ShoppingCart size={24} color="white" />}
                    color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                />
                <StatCard 
                    title="Sản Phẩm Đã Bán" 
                    value={stats.stockSold} 
                    icon={<Package size={24} color="white" />}
                    color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                />
            </div>

            {/* --- MAIN CONTENT --- */}
            <div style={styles.mainGrid}>
                
                {/* CỘT TRÁI: BIỂU ĐỒ & POS */}
                <div style={styles.leftColumn}>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}><TrendingUp size={20} /> Biểu đồ Doanh thu</h3>
                        </div>
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                        formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                                    />
                                    <Bar 
                                        dataKey="revenue" 
                                        fill="#6366f1" 
                                        radius={[6, 6, 0, 0]} 
                                        barSize={50}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* MINI POS */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}>⚡ Thao tác nhanh (POS)</h3>
                        </div>
                        <div style={styles.posGrid}>
                            <button onClick={() => handleQuickSell(1)} style={{...styles.posBtn, background: '#e0e7ff', color: '#4338ca'}}>
                                📱 Bán iPhone 15 Pro
                            </button>
                            <button onClick={() => handleQuickSell(2)} style={{...styles.posBtn, background: '#dcfce7', color: '#15803d'}}>
                                📱 Bán Samsung S24
                            </button>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: LỊCH SỬ GIAO DỊCH */}
                <div style={styles.rightColumn}>
                    <div style={{...styles.card, height: '100%'}}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}><Activity size={20} /> Hoạt động gần đây</h3>
                        </div>
                        <div style={styles.logList}>
                            {logs.length === 0 ? (
                                <p style={{textAlign: 'center', color: '#94a3b8', marginTop: 20}}>Chưa có dữ liệu</p>
                            ) : logs.map(log => (
                                <div key={log.id} style={styles.logItem}>
                                    <div style={styles.logIconWrapper(log.change_amount)}>
                                        {log.change_amount < 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    </div>
                                    <div style={{flex: 1}}>
                                        <div style={styles.logProduct}>{log.product_name}</div>
                                        <div style={styles.logTime}>{format(new Date(log.created_at), 'HH:mm - dd/MM/yyyy')}</div>
                                    </div>
                                    <div style={styles.logAmount(log.change_amount)}>
                                        {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CON: STAT CARD ---
const StatCard = ({ title, value, icon, color }) => (
    <div style={{...styles.statCard, background: color}}>
        <div style={{flex: 1}}>
            <p style={styles.statTitle}>{title}</p>
            <h2 style={styles.statValue}>{value}</h2>
        </div>
        <div style={styles.statIcon}>{icon}</div>
    </div>
);

// --- CSS IN JS (STYLES) ---
const styles = {
    container: {
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        backgroundColor: '#f8fafc', // Slate 50
        minHeight: '100vh',
        padding: '24px',
        color: '#1e293b'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        background: 'white',
        padding: '16px 24px',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    title: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#0f172a',
        margin: 0
    },
    storeSelectWrapper: {
        display: 'flex',
        alignItems: 'center',
        background: '#f1f5f9',
        padding: '8px 16px',
        borderRadius: '8px'
    },
    select: {
        border: 'none',
        background: 'transparent',
        fontSize: '14px',
        fontWeight: '600',
        color: '#334155',
        outline: 'none',
        cursor: 'pointer'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
    },
    statCard: {
        padding: '24px',
        borderRadius: '16px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    statTitle: {
        margin: '0 0 8px 0',
        fontSize: '14px',
        opacity: 0.9,
        fontWeight: '500'
    },
    statValue: {
        margin: 0,
        fontSize: '28px',
        fontWeight: '700'
    },
    statIcon: {
        background: 'rgba(255,255,255,0.2)',
        padding: '12px',
        borderRadius: '12px',
        display: 'flex'
    },
    mainGrid: {
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap'
    },
    leftColumn: {
        flex: 2,
        minWidth: '350px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    rightColumn: {
        flex: 1,
        minWidth: '300px'
    },
    card: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid #e2e8f0'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    cardTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '600',
        color: '#334155',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    posGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
    },
    posBtn: {
        padding: '16px',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'transform 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    logList: {
        maxHeight: '500px',
        overflowY: 'auto',
        paddingRight: '4px'
    },
    logItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9'
    },
    logIconWrapper: (amount) => ({
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: amount < 0 ? '#fee2e2' : '#dcfce7',
        color: amount < 0 ? '#ef4444' : '#16a34a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }),
    logProduct: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b'
    },
    logTime: {
        fontSize: '12px',
        color: '#94a3b8',
        marginTop: '2px'
    },
    logAmount: (amount) => ({
        fontSize: '14px',
        fontWeight: '700',
        color: amount < 0 ? '#ef4444' : '#16a34a'
    })
};

export default Dashboard;