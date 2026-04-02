import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FaRss, FaArrowCircleRight, FaArrowCircleLeft, FaFileDownload, FaSyncAlt, FaPlug, FaTimes, FaChevronLeft, FaChevronRight, FaSearch, FaClock, FaExclamationTriangle, FaCheckCircle, FaHourglass, FaRegListAlt, FaLaptop, FaUndo, FaDesktop } from 'react-icons/fa';

const Monitoring = () => {
    // Top Level Tabs
    const [mainTab, setMainTab] = useState('Main'); // 'Main' or 'Borrow'

    // State untuk Asset Status (Tabel 1)
    const [assets, setAssets] = useState([]);
    const [activeTab, setActiveTab] = useState('Computers');
    const [assetPage, setAssetPage] = useState(1);
    const [assetSearch, setAssetSearch] = useState('');
    const ASSET_PER_PAGE = 10;

    // State untuk Log History (Tabel 2)
    const [logs, setLogs] = useState([]);
    const [logPage, setLogPage] = useState(1);
    const [logSearch, setLogSearch] = useState('');
    const LOG_PER_PAGE = 10;

    const [loading, setLoading] = useState(true);
    const [wsStatus, setWsStatus] = useState('Connecting...');
    const wsRef = useRef(null);

    const FIXED_LOCATION = "IT Storage Lt 35";
    const CATEGORIES = ['Computers', 'Equipment', 'Peripherals', 'Servers', 'Network Devices', 'SIM Cards'];

    // State untuk Borrow Summary (Hour Glass)
    const [borrows, setBorrows] = useState([]);
    
    // State untuk Borrow Monitoring Tabel
    const [borrowListMode, setBorrowListMode] = useState('Active'); // Active, History
    const [borrowSearch, setBorrowSearch] = useState('');
    const [borrowPage, setBorrowPage] = useState(1);
    const BORROW_PER_PAGE = 10;

    const [, setTick] = useState(0);

    // Countdown ticker
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // --- LOAD DATA AWAL ---
    useEffect(() => {
        fetchAssets();
        fetchLogs();
        fetchBorrows();
    }, []);

    // --- WEBSOCKET ---
    useEffect(() => {
        connectWebSocket();
        return () => { if (wsRef.current) wsRef.current.close(); };
    }, []);

    const connectWebSocket = () => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://127.0.0.1:8000/ws/monitoring/`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => { setWsStatus('Connected'); };
        ws.onmessage = (event) => {
            const newLog = JSON.parse(event.data);
            // Update asset status (tabel 1)
            setAssets(prev => prev.map(asset =>
                asset.asset_id === newLog.asset_id
                    ? { ...asset, is_present: newLog.movement_type === 'IN', last_detection: newLog.timestamp, last_antenna: newLog.antenna_display }
                    : asset
            ));
            // Tambah log baru ke history (tabel 2)
            setLogs(prev => [newLog, ...prev]);
        };
        ws.onclose = () => {
            setWsStatus('Disconnected');
            setTimeout(connectWebSocket, 3000);
        };
        ws.onerror = () => { setWsStatus('Error'); };
    };

    const fetchAssets = async () => {
        try {
            const response = await api.get('assets/');
            setAssets(response.data);
        } catch (error) { console.error("Error assets:", error); }
    };

    const fetchBorrows = async () => {
        try {
            const response = await api.get('borrows/');
            setBorrows(response.data);
        } catch (error) { console.error("Error borrows:", error); }
    };

    const fetchLogs = async () => {
        try {
            const response = await api.get('monitoring-logs/');
            const sorted = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setLogs(sorted);
            setLoading(false);
        } catch (error) {
            console.error("Error logs:", error);
            setLoading(false);
        }
    };

    // --- RETURN BORROW API ---
    const handleReturnBorrow = async (borrowId) => {
        if (!window.confirm('Verifikasi Pintu RFID dapat menutup peminjaman secara otomatis. Lanjutkan tutup manual?')) return;
        try {
            await api.post(`borrows/${borrowId}/return_asset/`);
            alert('Aset berhasil dikembalikan!');
            fetchBorrows();
            fetchAssets();
        } catch (error) { alert('Gagal memproses pengembalian'); }
    };

    // --- TIME REMAINING FORMATTER ---
    const getTimeRemaining = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        const totalSec = Math.floor(Math.abs(diff) / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        if (diff < 0) {
            return { text: `- ${hours}h ${mins}m ${secs}s`, label: 'OVERDUE', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
        } else if (hours < 3) {
            return { text: `${hours}h ${mins}m ${secs}s`, label: 'URGENT', color: 'text-red-500', bg: 'bg-red-50 border-red-100' };
        } else if (hours <= 12) {
            return { text: `${hours}h ${mins}m`, label: 'SOON', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' };
        } else {
            return { text: `${hours}h ${mins}m`, label: 'OK', color: 'text-green-600', bg: 'bg-green-50 border-green-100' };
        }
    };

    // --- FILTER ASSETS BY CATEGORY + SEARCH ---
    const q1 = assetSearch.toLowerCase();
    const filteredAssets = assets.filter(a => a.asset_type === activeTab && (
        !q1 || (a.serial_number || '').toLowerCase().includes(q1) || (a.asset_id || '').toLowerCase().includes(q1) || (a.model_name || '').toLowerCase().includes(q1)
    ));
    const totalAssetPages = Math.max(1, Math.ceil(filteredAssets.length / ASSET_PER_PAGE));
    const paginatedAssets = filteredAssets.slice((assetPage - 1) * ASSET_PER_PAGE, assetPage * ASSET_PER_PAGE);

    // --- FILTER LOGS BY SEARCH + PAGINATE ---
    const q2 = logSearch.toLowerCase();
    const filteredLogs = logs.filter(log => (
        !q2 || (log.asset_id || '').toLowerCase().includes(q2) || (log.model_name || '').toLowerCase().includes(q2)
    ));
    const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOG_PER_PAGE));
    const paginatedLogs = filteredLogs.slice((logPage - 1) * LOG_PER_PAGE, logPage * LOG_PER_PAGE);

    // --- FILTER BORROWS (BORROW MONITORING TAB) ---
    const q3 = borrowSearch.toLowerCase();
    const filteredBorrows = borrows.filter(b => {
        const matchesTab = borrowListMode === 'Active' ? (b.status === 'Active' || b.status === 'Overdue') : (b.status === 'Returned');
        const matchesSearch = !q3 || 
            (b.asset_id_display && b.asset_id_display.toLowerCase().includes(q3)) ||
            (b.serial_number && b.serial_number.toLowerCase().includes(q3)) || 
            (b.borrower_name && b.borrower_name.toLowerCase().includes(q3));
        return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(b.due_date) - new Date(a.due_date)); // sort urgen ke lambat
    
    // Sort logic for borrows:
    if (borrowListMode === 'Active') {
        // Sort by closest to due date (ascending order of due_date)
        filteredBorrows.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    } else {
        // Sort by most recently returned (descending order of returned_at)
        filteredBorrows.sort((a, b) => new Date(b.returned_at) - new Date(a.returned_at));
    }

    const totalBorrowPages = Math.max(1, Math.ceil(filteredBorrows.length / BORROW_PER_PAGE));
    const paginatedBorrows = filteredBorrows.slice((borrowPage - 1) * BORROW_PER_PAGE, borrowPage * BORROW_PER_PAGE);

    // Reset pagination
    useEffect(() => { setAssetPage(1); }, [activeTab, assetSearch]);
    useEffect(() => { setLogPage(1); }, [logSearch]);
    useEffect(() => { setBorrowPage(1); }, [borrowListMode, borrowSearch]);

    // --- EXPORT ---
    const handleExport = () => {
        if (assets.length === 0) return alert("Tidak ada data");
        let csv = "data:text/csv;charset=utf-8,";
        csv += "Asset ID,Model Name,Category,Status,Location,Last Seen\n";
        assets.forEach(a => {
            const status = a.is_present ? 'PRESENT' : 'OUT';
            const lastSeen = a.last_detection ? new Date(a.last_detection).toLocaleString() : '-';
            csv += `${a.asset_id},${a.model_name},${a.asset_type},${status},${FIXED_LOCATION},${lastSeen}\n`;
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", `Stock_Opname_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- WS BADGE ---
    const getWsBadge = () => {
        const styles = {
            'Connected': 'bg-green-50 text-green-700 border-green-200',
            'Connecting...': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'Disconnected': 'bg-red-50 text-red-700 border-red-200',
            'Error': 'bg-red-50 text-red-700 border-red-200',
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${styles[wsStatus] || styles['Error']}`}>
                {wsStatus === 'Connected' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
                WS: {wsStatus}
            </span>
        );
    };

    // --- STATUS BADGE ---
    const getPresenceBadge = (isPresent) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[9px] ${isPresent ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {isPresent ? <FaArrowCircleRight /> : <FaArrowCircleLeft />}
            {isPresent ? 'IN AREA' : 'OUT AREA'}
        </span>
    );

    // --- PAGINATION COMPONENT ---
    const Pagination = ({ currentPage, totalPages, onPageChange }) => (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-[10px] text-gray-500 font-medium">
                Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                >
                    <FaChevronLeft />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                        page = i + 1;
                    } else if (currentPage <= 3) {
                        page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                    } else {
                        page = currentPage - 2 + i;
                    }
                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-7 h-7 rounded text-xs font-bold ${currentPage === page ? 'bg-seabank-orange text-white' : 'border border-gray-200 text-gray-600 hover:bg-white'}`}
                        >
                            {page}
                        </button>
                    );
                })}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );

    // --- RENDER MINI LIST FOR SUMMARY CARDS ---
    const renderMiniList = (title, items, icon, colorClass, borderClass, bgClass, isReturnedCheck = false) => {
        return (
            <div className={`bg-white rounded-lg border ${borderClass} shadow-sm overflow-hidden flex flex-col`}>
                <div className={`p-5 flex items-center gap-3 border-b ${borderClass} bg-gray-50/50`}>
                    <div className={`w-10 h-10 ${bgClass} rounded-lg flex items-center justify-center ${colorClass}`}>
                        {icon}
                    </div>
                    <div>
                        <p className={`text-2xl font-black ${isReturnedCheck ? 'text-gray-800' : (colorClass.replace('-500','-600').replace('-blue', '-gray'))}`}>{items.length}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                    </div>
                </div>
                <div className="flex-1 divide-y divide-gray-100 text-xs">
                    {items.slice(0, 5).map(b => (
                        <div key={b.id} className="p-3 hover:bg-gray-50 transition flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-800">{b.asset_id_display}</p>
                                <p className="text-[10px] text-gray-500">{b.borrower_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-600">{b.model_name || '-'}</p>
                                <p className="text-[9px] text-gray-400">
                                    {b.status === 'Returned' && b.returned_at ? new Date(b.returned_at).toLocaleTimeString() : getTimeRemaining(b.due_date).text}
                                </p>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="p-4 text-center text-gray-400 italic text-[10px]">No records found</div>
                    )}
                </div>
                <button 
                    onClick={() => {
                        setMainTab('Borrow');
                        setBorrowListMode(isReturnedCheck ? 'History' : 'Active');
                    }} 
                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[10px] font-bold text-gray-500 transition border-t border-gray-100 uppercase tracking-wider"
                >
                    Show More
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6 font-sans flex flex-col min-h-[85vh]">
            {/* ============================================ */}
            {/* HEADER & TOP TABS */}
            {/* ============================================ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaRss className="text-seabank-orange" /> Live Asset Monitoring
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                Current Area: <span className="text-seabank-blue">{FIXED_LOCATION}</span>
                            </p>
                            {getWsBadge()}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 transition shadow-sm">
                            <FaFileDownload /> Export Stock Opname
                        </button>
                        <button onClick={() => { fetchAssets(); fetchLogs(); fetchBorrows(); }} className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition" title="Refresh">
                            <FaSyncAlt />
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 mt-6 border-b border-gray-100">
                    <button
                        onClick={() => setMainTab('Main')}
                        className={`pb-3 text-sm font-bold transition-all relative ${mainTab === 'Main' ? 'text-seabank-blue' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FaDesktop className="inline mr-1.5" /> Main Monitoring
                        {mainTab === 'Main' && <span className="absolute bottom-0 left-0 w-full h-1 bg-seabank-blue rounded-t-lg"></span>}
                    </button>
                    <button
                        onClick={() => setMainTab('Borrow')}
                        className={`pb-3 text-sm font-bold transition-all relative ${mainTab === 'Borrow' ? 'text-seabank-orange' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FaHourglass className="inline mr-1.5" /> Borrow Monitoring
                        {mainTab === 'Borrow' && <span className="absolute bottom-0 left-0 w-full h-1 bg-seabank-orange rounded-t-lg"></span>}
                    </button>
                </div>
            </div>

            {/* ============================================ */}
            {/* TAB CONTENT: MAIN MONITORING */}
            {/* ============================================ */}
            {mainTab === 'Main' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* BORROW SUMMARY 5-ITEM CARDS */}
                    {(() => {
                        const activeBorrows = borrows.filter(b => b.status === 'Active' || b.status === 'Overdue');
                        // Sort active so overdue/urgent is at the top
                        activeBorrows.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                        
                        const overdueBorrows = borrows.filter(b => b.status === 'Overdue');
                        overdueBorrows.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

                        const returnedToday = borrows.filter(b => {
                            if (b.status !== 'Returned' || !b.returned_at) return false;
                            return new Date(b.returned_at).toDateString() === new Date().toDateString();
                        });
                        returnedToday.sort((a, b) => new Date(b.returned_at) - new Date(a.returned_at));

                        return (
                            <div className="grid grid-cols-3 gap-6">
                                {renderMiniList("Active Borrows", activeBorrows, <FaClock />, "text-blue-500", "border-gray-200", "bg-blue-50")}
                                {renderMiniList("Overdue", overdueBorrows, <FaExclamationTriangle />, "text-red-500", "border-gray-200", "bg-red-50")}
                                {renderMiniList("Returned Today", returnedToday, <FaCheckCircle />, "text-green-500", "border-gray-200", "bg-green-50", true)}
                            </div>
                        );
                    })()}

                    {/* TABLE 1: STATUS ASSET PER KATEGORI */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="text-base font-bold text-seabank-blue flex items-center gap-2">
                                <span className="w-1 h-5 bg-seabank-orange rounded-full inline-block"></span>
                                I. Asset Status
                            </h2>
                            <div className="flex gap-1 mt-3 border-b border-gray-200">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveTab(cat)}
                                        className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${activeTab === cat ? 'border-seabank-orange text-seabank-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {cat}
                                        <span className="ml-1.5 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                            {assets.filter(a => a.asset_type === cat).length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative mt-3">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                <input
                                    type="text"
                                    placeholder="Search by Serial Number, Asset ID, or Model..."
                                    value={assetSearch}
                                    onChange={(e) => setAssetSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-seabank-orange focus:ring-1 focus:ring-seabank-orange/30"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Asset ID</th>
                                        <th className="px-6 py-3">Model</th>
                                        <th className="px-6 py-3">Serial Number</th>
                                        <th className="px-6 py-3">Owner</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Presence</th>
                                        <th className="px-6 py-3">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {paginatedAssets.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center py-12 text-gray-400 italic">Tidak ada aset kategori {activeTab}</td></tr>
                                    ) : (
                                        paginatedAssets.map((asset, i) => (
                                            <tr key={asset.id || i} className="hover:bg-blue-50/20 transition">
                                                <td className="px-6 py-3 font-bold text-seabank-blue">{asset.asset_id}</td>
                                                <td className="px-6 py-3 text-gray-700">{asset.model_name}</td>
                                                <td className="px-6 py-3 text-gray-500 font-mono text-[10px]">{asset.serial_number}</td>
                                                <td className="px-6 py-3 text-gray-600">{asset.asset_owner_name || '-'}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${asset.status === 'Available' ? 'bg-blue-50 text-blue-600' : asset.status === 'Assigned' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">{getPresenceBadge(asset.is_present)}</td>
                                                <td className="px-6 py-3 text-gray-400 text-[10px]">
                                                    {asset.last_detection ? new Date(asset.last_detection).toLocaleString() : 'Belum terdeteksi'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={assetPage} totalPages={totalAssetPages} onPageChange={setAssetPage} />
                    </div>

                    {/* TABLE 2: LOG HISTORY */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="text-base font-bold text-seabank-blue flex items-center gap-2">
                                <span className="w-1 h-5 bg-seabank-orange rounded-full inline-block"></span>
                                II. Detection Log History
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal ml-2">
                                    {logs.length} records
                                </span>
                            </h2>
                            <div className="relative mt-3">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                <input
                                    type="text"
                                    placeholder="Search by Asset ID or Model..."
                                    value={logSearch}
                                    onChange={(e) => setLogSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-seabank-orange focus:ring-1 focus:ring-seabank-orange/30"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Detection Time</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Asset Info</th>
                                        <th className="px-6 py-3">Direction</th>
                                        <th className="px-6 py-3">Antenna</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-12 italic text-gray-400">Loading data...</td></tr>
                                    ) : paginatedLogs.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-12 text-gray-400">Belum ada data scan. Menunggu data dari Raspberry Pi...</td></tr>
                                    ) : (
                                        paginatedLogs.map((log, index) => (
                                            <tr key={log.id || index} className={`hover:bg-blue-50/20 transition ${logPage === 1 && index === 0 ? 'bg-green-50/30' : ''}`}>
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-gray-900">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                                    <div className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-3 uppercase font-bold text-[9px] text-gray-400">
                                                    {log.category || 'General'}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-seabank-blue">{log.asset_id}</div>
                                                    <div className="text-[10px] text-gray-500">{log.model_name}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[9px] ${log.movement_type === 'IN' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                        {log.movement_type === 'IN' ? <FaArrowCircleRight /> : <FaArrowCircleLeft />}
                                                        {log.movement_type === 'IN' ? 'IN AREA' : 'OUT AREA'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-gray-500 text-[10px] font-medium">
                                                    {log.antenna_display || `Port ${log.antenna_port}`}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={logPage} totalPages={totalLogPages} onPageChange={setLogPage} />
                    </div>
                </div>
            )}

            {/* ============================================ */}
            {/* TAB CONTENT: BORROW MONITORING */}
            {/* ============================================ */}
            {mainTab === 'Borrow' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 animate-fade-in flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaHourglass className="text-seabank-orange" /> Borrow Monitoring
                            </h2>
                            <div className="relative w-80">
                                <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="Cari Asset ID, Serial, atau Peminjam..."
                                    value={borrowSearch}
                                    onChange={e => setBorrowSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:border-seabank-orange"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setBorrowListMode('Active')}
                                className={`px-5 py-2 text-sm font-bold rounded-full transition-all ${borrowListMode === 'Active' ? 'bg-seabank-orange text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                Active Borrows <span className="ml-2 text-xs opacity-80">({borrows.filter(b => b.status === 'Active' || b.status === 'Overdue').length})</span>
                            </button>
                            <button
                                onClick={() => setBorrowListMode('History')}
                                className={`px-5 py-2 text-sm font-bold rounded-full transition-all ${borrowListMode === 'History' ? 'bg-seabank-blue text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                Return History <span className="ml-2 text-xs opacity-80">({borrows.filter(b => b.status === 'Returned').length})</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Status & Waktu</th>
                                    <th className="px-6 py-4">Informasi Aset</th>
                                    <th className="px-6 py-4">Peminjam</th>
                                    <th className="px-6 py-4">Catatan / Detail</th>
                                    {borrowListMode === 'Active' && <th className="px-6 py-4 text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedBorrows.length === 0 ? (
                                    <tr><td colSpan={borrowListMode === 'Active' ? 5 : 4} className="py-20 text-center text-gray-400">Tidak ada peminjaman di kategori ini.</td></tr>
                                ) : (
                                    paginatedBorrows.map(borrow => {
                                        const countdown = borrow.status === 'Returned' ? null : getTimeRemaining(borrow.due_date);
                                        return (
                                            <tr key={borrow.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-6 py-4 align-top">
                                                    {borrow.status === 'Returned' ? (
                                                        <div>
                                                            <span className="inline-block px-2.5 py-1 rounded bg-green-50 text-green-700 text-[10px] font-bold border border-green-200 mb-2">✅ DIKEMBALIKAN</span>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Dipinjam:</p>
                                                            <p className="text-xs text-gray-700">{new Date(borrow.borrowed_at).toLocaleDateString()}</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Dikembalikan:</p>
                                                            <p className="text-xs text-gray-700 font-bold">{new Date(borrow.returned_at).toLocaleDateString()} {new Date(borrow.returned_at).toLocaleTimeString()}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-start gap-2">
                                                            <span className={`px-2.5 py-1 rounded tracking-wide text-[10px] font-bold border ${countdown.bg} ${countdown.color}`}>
                                                                {countdown.label === 'OVERDUE' ? '⚠️ OVERDUE' : '⏳ ACTIVE'}
                                                            </span>
                                                            <div className={`font-mono font-bold text-sm tracking-tighter ${countdown.color}`}>
                                                                {countdown.text}
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">Jatuh Tempo:</p>
                                                                <p className="text-xs font-medium text-gray-700">{new Date(borrow.due_date).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-bold text-seabank-blue text-sm mb-1">{borrow.asset_id_display}</div>
                                                    <div className="text-gray-800 font-medium text-xs mb-1">{borrow.model_name}</div>
                                                    <div className="font-mono text-[10px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 inline-block">SN: {borrow.serial_number}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <p className="font-bold text-gray-800 mb-1">{borrow.borrower_name}</p>
                                                    <span className="text-[10px] px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-500">{borrow.borrower_department}</span>
                                                </td>
                                                <td className="px-6 py-4 align-top max-w-xs">
                                                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                                        {borrow.purpose || <span className="text-gray-400 italic">Tidak ada catatan</span>}
                                                    </p>
                                                </td>
                                                {borrowListMode === 'Active' && (
                                                    <td className="px-6 py-4 align-top text-center">
                                                        <button
                                                            onClick={() => handleReturnBorrow(borrow.id)}
                                                            className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all shadow-sm border border-green-200 hover:border-transparent mr-2"
                                                            title="Kembalikan Aset"
                                                        >
                                                            <FaUndo />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={borrowPage} totalPages={totalBorrowPages} onPageChange={setBorrowPage} />
                </div>
            )}
        </div>
    );
};

export default Monitoring;