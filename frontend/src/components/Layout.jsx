import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBox, FaLaptop, FaSignOutAlt, FaRss } from 'react-icons/fa';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Fungsi Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `flex items-center gap-3 px-4 py-3 mb-1 rounded-r-full transition-all duration-200 ${
            isActive 
            ? 'bg-seabank-orange text-white font-medium shadow-md' 
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`;
    };

    return (
        <div className="w-64 bg-seabank-blue h-screen fixed left-0 top-0 flex flex-col text-white shadow-xl z-50">
            {/* --- LOGO AREA (FIXED) --- */}
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
                {/* Icon S Box */}
                <div className="w-8 h-8 bg-seabank-orange rounded-lg flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
                    S
                </div>
                
                {/* Teks Branding */}
                <div className="flex flex-col justify-center">
                    <h1 className="text-lg font-bold tracking-tight leading-none">
                        SeaBank
                    </h1>
                    <span className="text-xs text-seabank-orange font-bold tracking-wide">IT CENTER</span>
                    <span className="text-[10px] text-gray-400 leading-tight mt-0.5">Asset Management System</span>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 mt-6 pr-4">
                {/* --- MENU BARU UNTUK PROYEK AKHIR --- */}
                <Link to="/monitoring" className={getLinkClass('/monitoring')}>
                    <FaRss /> Live Monitoring
                </Link>
                
                <Link to="/warehousing" className={getLinkClass('/warehousing')}>
                    <FaBox /> Warehousing
                </Link>
                <Link to="/assets" className={getLinkClass('/assets')}>
                    <FaLaptop /> Assets
                </Link>
            </nav>

            {/* Footer Sidebar */}
            <div className="p-4 border-t border-white/10">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition w-full"
                >
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </div>
    );
};

const Layout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-seabank-bg">
            <Sidebar />
            <div className="ml-64 flex-1 p-8">
                {children}
            </div>
        </div>
    );
};

export default Layout;