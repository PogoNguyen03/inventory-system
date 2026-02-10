import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, LayoutGrid } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Mặc định lấy kho Quận 1 để bán (Sau này có thể dùng Context để lưu store đã chọn)
    const STORE_ID = 1; 

    // 1. Lấy danh sách sản phẩm từ API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Tận dụng API inventory để lấy list sản phẩm & giá
                const res = await axios.get(`${API_URL}/api/inventory?store_id=${STORE_ID}`);
                // Lọc bỏ những sản phẩm hết hàng (quantity = 0) nếu muốn
                setProducts(res.data.data);
            } catch (error) {
                console.error("Lỗi tải sản phẩm:", error);
            }
        };
        fetchProducts();
    }, []);

    // 2. Thêm vào giỏ hàng
    const addToCart = (product) => {
        const existItem = cart.find(x => x.product_id === product.product_id);
        if (existItem) {
            // Nếu có rồi thì tăng số lượng
            setCart(cart.map(x => x.product_id === product.product_id ? { ...existItem, qty: existItem.qty + 1 } : x));
        } else {
            // Chưa có thì thêm mới
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    // 3. Tăng/Giảm số lượng
    const updateQty = (id, amount) => {
        setCart(cart.map(item => {
            if (item.product_id === id) {
                const newQty = item.qty + amount;
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }));
    };

    // 4. Xóa khỏi giỏ
    const removeFromCart = (id) => {
        setCart(cart.filter(x => x.product_id !== id));
    };

    // 5. Tính tổng tiền
    const totalAmount = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.qty), 0);

    // 6. Xử lý Thanh toán (Checkout)
    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Giỏ hàng đang trống!");
        if (!confirm(`Xác nhận thanh toán: ${new Intl.NumberFormat('vi-VN').format(totalAmount)} đ?`)) return;

        setLoading(true);
        try {
            // Duyệt qua từng món trong giỏ và gọi API trừ kho
            // (Lưu ý: Cách tốt nhất là viết 1 API nhận cả mảng, nhưng để tận dụng API cũ ta dùng vòng lặp)
            for (const item of cart) {
                await axios.post(`${API_URL}/api/inventory/transaction`, {
                    store_id: STORE_ID,
                    product_id: item.product_id,
                    amount: -item.qty, // Số âm để trừ kho
                    reason: 'POS_SALE'
                });
            }
            alert("✅ Thanh toán thành công!");
            setCart([]); // Xóa trắng giỏ hàng
        } catch (error) {
            alert("❌ Lỗi thanh toán: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Lọc sản phẩm theo tìm kiếm
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={styles.container}>
            {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM --- */}
            <div style={styles.leftPanel}>
                <div style={styles.header}>
                    <h2 style={styles.title}><LayoutGrid size={24} /> Bán Hàng (POS)</h2>
                    <div style={styles.searchBox}>
                        <Search size={18} color="#64748b" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên hoặc mã SP..." 
                            style={styles.searchInput}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div style={styles.productGrid}>
                    {filteredProducts.map(product => (
                        <div key={product.product_id} style={styles.productCard} onClick={() => addToCart(product)}>
                            <div style={styles.imagePlaceholder}>{product.sku}</div>
                            <div style={styles.productInfo}>
                                <h4 style={styles.productName}>{product.name}</h4>
                                <div style={styles.productMeta}>
                                    <span style={styles.price}>{new Intl.NumberFormat('vi-VN').format(product.price)} ₫</span>
                                    <span style={styles.stock}>Kho: {product.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CỘT PHẢI: GIỎ HÀNG --- */}
            <div style={styles.rightPanel}>
                <div style={styles.cartHeader}>
                    <ShoppingCart size={20} /> Giỏ Hàng ({cart.length})
                </div>
                
                <div style={styles.cartList}>
                    {cart.length === 0 ? (
                        <div style={styles.emptyCart}>Chưa có sản phẩm nào</div>
                    ) : cart.map(item => (
                        <div key={item.product_id} style={styles.cartItem}>
                            <div style={{flex: 1}}>
                                <div style={styles.cartItemName}>{item.name}</div>
                                <div style={styles.cartItemPrice}>{new Intl.NumberFormat('vi-VN').format(item.price)} ₫</div>
                            </div>
                            <div style={styles.qtyControl}>
                                <button onClick={() => updateQty(item.product_id, -1)} style={styles.qtyBtn}><Minus size={14}/></button>
                                <span style={{fontWeight: 'bold', width: '20px', textAlign: 'center'}}>{item.qty}</span>
                                <button onClick={() => updateQty(item.product_id, 1)} style={styles.qtyBtn}><Plus size={14}/></button>
                            </div>
                            <button onClick={() => removeFromCart(item.product_id)} style={styles.deleteBtn}><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>

                <div style={styles.checkoutSection}>
                    <div style={styles.totalRow}>
                        <span>Tổng tiền:</span>
                        <span style={styles.totalAmount}>{new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫</span>
                    </div>
                    <button 
                        style={{...styles.payBtn, opacity: loading ? 0.7 : 1}} 
                        onClick={handleCheckout}
                        disabled={loading}
                    >
                        <CreditCard size={20} style={{marginRight: 8}} />
                        {loading ? "Đang xử lý..." : "THANH TOÁN NGAY"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- STYLES (CSS-in-JS) ---
const styles = {
    container: { display: 'flex', height: '100vh', backgroundColor: '#f1f5f9', overflow: 'hidden' },
    leftPanel: { flex: 7, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
    rightPanel: { flex: 3, backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { display: 'flex', gap: '10px', alignItems: 'center', margin: 0, color: '#1e293b' },
    searchBox: { display: 'flex', alignItems: 'center', background: 'white', padding: '10px 15px', borderRadius: '8px', width: '300px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    searchInput: { border: 'none', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '14px' },

    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' },
    productCard: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #transparent' },
    imagePlaceholder: { height: '100px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold' },
    productInfo: { padding: '12px' },
    productName: { margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#334155' },
    productMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    price: { color: '#2563eb', fontWeight: '700' },
    stock: { fontSize: '12px', color: '#94a3b8' },

    cartHeader: { padding: '20px', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'center' },
    cartList: { flex: 1, overflowY: 'auto', padding: '20px' },
    emptyCart: { textAlign: 'center', color: '#94a3b8', marginTop: '50px' },
    cartItem: { display: 'flex', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f8fafc' },
    cartItemName: { fontSize: '14px', fontWeight: '600', color: '#334155' },
    cartItemPrice: { fontSize: '13px', color: '#64748b' },
    qtyControl: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '4px' },
    qtyBtn: { border: 'none', background: 'white', borderRadius: '4px', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', marginLeft: '10px' },

    checkoutSection: { padding: '20px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' },
    totalAmount: { color: '#2563eb' },
    payBtn: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }
};

export default POS;