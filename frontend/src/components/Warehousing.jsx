import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaPlus, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash } from 'react-icons/fa'; // Tambah FaTrash

const Warehousing = () => {
    const [doList, setDoList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('warehousing/');
            setDoList(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Gagal ambil data:", error);
            setLoading(false);
        }
    };

    // --- FITUR DELETE (BARU) ---
    const handleDelete = async (id, doNumber) => {
        if (window.confirm(`Yakin ingin menghapus DO Number: ${doNumber}? Data aset terkait juga akan terhapus.`)) {
            try {
                await api.delete(`warehousing/${id}/`);
                alert("Data berhasil dihapus!");
                fetchData(); // Refresh tabel
            } catch (error) {
                console.error("Gagal hapus:", error);
                alert("Gagal menghapus data.");
            }
        }
    };

    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "DO Number,Date,Assets Qty,Operator,Status\n";
        doList.forEach(item => {
            const date = new Date(item.created_at).toLocaleDateString();
            csvContent += `${item.do_number},${date},${item.total_assets},${item.operator_name},${item.status}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "warehousing_data.csv");
        document.body.appendChild(link);
        link.click();
    };

    const getStatusBadge = (status) => {
        if (status === 'Completed') {
            return <span className="flex items-center gap-2 text-green-600 font-medium"><span className="w-2 h-2 rounded-full bg-green-600"></span> Completed</span>;
        }
        return <span className="flex items-center gap-2 text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Draft</span>;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[80vh] font-sans">
            <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-gray-800">Warehousing</h1>
                    <div className="flex gap-3">
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition text-sm">
                            <FaFileExport /> Export
                        </button>
                        <button onClick={() => navigate('/add-hardware')} className="flex items-center gap-2 px-4 py-2 bg-seabank-orange text-white rounded hover:bg-orange-600 transition text-sm font-medium shadow-sm">
                            <FaPlus /> Add Hardware
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input type="text" placeholder="Search by DO number..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"/>
                    </div>
                    <div className="w-48 relative">
                        <select className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none appearance-none bg-white">
                            <option>All Entity</option>
                            <option>PT Bank SeaBank Indonesia</option>
                        </select>
                        <FaFilter className="absolute right-3 top-3 text-gray-400 text-xs" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">DO Number</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4 text-center">Assets Qty</th>
                            <th className="px-6 py-4">Operator</th>
                            <th className="px-6 py-4">Entity</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-10 text-gray-400">Loading Data...</td></tr>
                        ) : doList.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-10 text-gray-400">Belum ada data DO. Klik "Add Hardware" untuk menambah.</td></tr>
                        ) : (
                            doList.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/40 transition cursor-pointer">
                                    <td className="px-6 py-4 font-medium text-blue-600">{item.do_number}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-800">{item.total_assets}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold border border-orange-200">
                                                {item.operator_name ? item.operator_name.substring(0, 2).toUpperCase() : 'AD'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{item.operator_name || 'Admin'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{item.entity}</td>
                                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                                    
                                    {/* BUTTONS ACTION */}
                                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/edit-hardware/${item.id}`);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                            title="Edit DO"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.id, item.do_number);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                            title="Delete DO"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 text-sm text-gray-500">
                <button className="px-3 py-1 border rounded disabled:opacity-50" disabled>&lt;</button>
                <button className="px-3 py-1 bg-seabank-blue text-white rounded">1</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50">&gt;</button>
            </div>
        </div>
    );
};

export default Warehousing;