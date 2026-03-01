import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaRss, FaArrowCircleRight, FaArrowCircleLeft, FaFileDownload, FaSyncAlt, FaLaptop, FaServer, FaMicrochip, FaNetworkWired, FaMemory } from 'react-icons/fa';

const Monitoring = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Konfigurasi Lokasi Paten
    const FIXED_LOCATION = "IT Storage Lt 35";

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('monitoring-logs/');
            setLogs(response.data);
            setLoading(false);
        } catch (error) { console.error("Error logs:", error); }
    };

    // --- LOGIKA SMART EXPORT (ANTI-DOUBLE) ---
    const handleDownloadStockOpname = () => {
        if (logs.length === 0) return alert("Tidak ada data untuk di-export");

        // Filter: Hanya ambil 1 data terbaru per Asset ID
        const uniqueAssets = {};
        logs.forEach(log => {
            if (!uniqueAssets[log.asset_id]) {
                uniqueAssets[log.asset_id] = log;
            }
        });

        const stockData = Object.values(uniqueAssets);
        
        // Header CSV
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Asset ID,Model Name,Category,Status,Location,Last Seen\n";

        // Isi Data
        stockData.forEach(item => {
            const date = new Date(item.timestamp).toLocaleString();
            const status = item.movement_type === 'IN' ? 'PRESENT' : 'OUT';
            csvContent += `${item.asset_id},${item.model_name},${item.category || 'Hardware'},${status},${FIXED_LOCATION},${date}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Stock_Opname_SeaBank_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[85vh] flex flex-col font-sans">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-white to-orange-50/30">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaRss className="text-seabank-orange" /> Live Asset Monitoring
                    </h1>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
                        Current Area: <span className="text-seabank-blue">{FIXED_LOCATION}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleDownloadStockOpname} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 transition shadow-sm">
                        <FaFileDownload /> Export Stock Opname
                    </button>
                    <button onClick={fetchLogs} className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition">
                        <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Detection Time</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Asset Info</th>
                            <th className="px-6 py-4">Direction</th>
                            <th className="px-6 py-4">Current Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-blue-50/20 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                    <div className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 uppercase font-bold text-[9px] text-gray-400">
                                    {log.category || 'General'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-seabank-blue">{log.asset_id}</div>
                                    <div className="text-[10px] text-gray-500">{log.model_name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[9px] ${log.movement_type === 'IN' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                        {log.movement_type === 'IN' ? <FaArrowCircleRight /> : <FaArrowCircleLeft />}
                                        {log.movement_type === 'IN' ? 'IN AREA' : 'OUT AREA'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-600 italic">
                                    {FIXED_LOCATION}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Monitoring;