import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import POS from './POS';
import { LayoutDashboard, ShoppingCart } from 'lucide-react';

// Component Menu điều hướng
const Navigation = () => {
  const location = useLocation();
  
  // Style cho link active
  const getLinkStyle = (path) => ({
    display: 'flex', alignItems: 'center', gap: '8px', 
    textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '500',
    color: location.pathname === path ? '#fff' : '#94a3b8',
    backgroundColor: location.pathname === path ? '#4f46e5' : 'transparent',
    transition: 'all 0.2s'
  });

  return (
    <nav style={{
      display: 'flex', gap: '10px', padding: '10px 24px', 
      background: '#1e293b', alignItems: 'center'
    }}>
      <div style={{color: 'white', fontWeight: 'bold', fontSize: '18px', marginRight: '20px'}}>
        🚀 TECH STORE
      </div>
      <Link to="/" style={getLinkStyle('/')}>
        <LayoutDashboard size={18} /> Dashboard
      </Link>
      <Link to="/pos" style={getLinkStyle('/pos')}>
        <ShoppingCart size={18} /> Bán Hàng (POS)
      </Link>
    </nav>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* Menu luôn hiển thị ở trên cùng */}
      <Navigation />
      
      {/* Nội dung thay đổi tùy theo Route */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;