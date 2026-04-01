import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FaRss, FaArrowCircleRight, FaArrowCircleLeft, FaFileDownload, FaSyncAlt, FaPlug, FaTimes, FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';

const Monitoring = () => {
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

    // --- LOAD DATA AWAL ---
    useEffect(() => {
        fetchAssets();
        fetchLogs();
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
            // Update asset status (tabel 1): update status aset terkait
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

    // Reset page when tab/search changes
    useEffect(() => { setAssetPage(1); }, [activeTab, assetSearch]);
    useEffect(() => { setLogPage(1); }, [logSearch]);

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

    return (
        <div className="space-y-6 font-sans">

            {/* ============================================ */}
            {/* HEADER */}
            {/* ============================================ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-between items-center">
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
                    <button onClick={() => { fetchAssets(); fetchLogs(); }} className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition" title="Refresh">
                        <FaSyncAlt />
                    </button>
                </div>
            </div>

            {/* ============================================ */}
            {/* TABLE 1: STATUS ASSET PER KATEGORI */}
            {/* ============================================ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-seabank-blue flex items-center gap-2">
                        <span className="w-1 h-5 bg-seabank-orange rounded-full inline-block"></span>
                        I. Asset Status
                    </h2>
                    {/* Category Tabs */}
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
                    {/* Search */}
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

            {/* ============================================ */}
            {/* TABLE 2: LOG HISTORY */}
            {/* ============================================ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-seabank-blue flex items-center gap-2">
                        <span className="w-1 h-5 bg-seabank-orange rounded-full inline-block"></span>
                        II. Detection Log History
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal ml-2">
                            {logs.length} records
                        </span>
                    </h2>
                    {/* Search */}
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
    );
};

export default Monitoring;