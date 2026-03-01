import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

import { FaSearch, FaFilter, FaLaptop, FaEdit, FaUserSlash, FaSave, FaTimes, FaFileExport, FaFileImport, FaRss, FaMapMarkerAlt } from 'react-icons/fa';

const Assets = () => {
    const [assetList, setAssetList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Computers');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const fileImportRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [formData, setFormData] = useState({
        asset_owner_name: '',
        owner_department: '',
        asset_location: '', 
        status: '',
        rfid_tag: '' 
    });

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const response = await api.get('assets/');
            setAssetList(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Gagal ambil data assets:", error);
            setLoading(false);
        }
    };

    // FIX: Fungsi Tutup Modal
    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingAsset(null);
    };

    const filteredAssets = assetList.filter(asset => {
        const matchesTab = asset.asset_type === activeTab;
        const matchesStatus = statusFilter === 'All Status' || asset.status === statusFilter;
        const matchesSearch = 
            asset.asset_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.model_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.rfid_tag?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesStatus && matchesSearch;
    });

    const handleExport = () => {
        if (filteredAssets.length === 0) return alert("Tidak ada data untuk di-export");
        const headers = ["Asset ID", "Status", "Model Name", "Serial Number", "RFID UID", "Owner", "Dept", "Location", "Storeroom"];
        const csvRows = filteredAssets.map(asset => [
            asset.asset_id,
            asset.status,
            asset.model_name,
            asset.serial_number,
            asset.rfid_tag || '-',
            asset.asset_owner_name,
            asset.owner_department,
            asset.asset_location,
            asset.storeroom
        ]);
        const csvContent = [headers, ...csvRows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `SeaBank_Assets_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditClick = (asset) => {
        setEditingAsset(asset);
        setFormData({
            asset_owner_name: asset.asset_owner_name === '-' ? '' : asset.asset_owner_name,
            owner_department: asset.owner_department === '-' ? '' : asset.owner_department,
            asset_location: asset.asset_location === '-' ? '' : asset.asset_location,
            status: asset.status,
            rfid_tag: asset.rfid_tag || '' 
        });
        setIsModalOpen(true);
    };

    const handleSaveAssignment = async () => {
        try {
            // Kita pastikan kalau lokasi kosong, kita kirim '-' biar database gak marah
            const submissionData = {
                ...formData,
                asset_location: formData.asset_location.trim() === '' ? '-' : formData.asset_location
            };

            const response = await api.patch(`assets/${editingAsset.id}/`, submissionData);
            if (response.status === 200) {
                alert("Aset Berhasil Diupdate!");
                handleModalClose();
                fetchAssets();
            }
        } catch (error) {
            console.error("Update Error Detail:", error.response?.data);
            const detail = error.response?.data ? JSON.stringify(error.response.data) : "Network Error";
            alert("Gagal update data ke database: " + detail);
        }
    };

    const handleUnassign = async () => {
        if (!confirm("Unassign aset ini?")) return;
        try {
            await api.patch(`assets/${editingAsset.id}/`, {
                asset_owner_name: '-', owner_department: '-', asset_location: '-', status: 'Available',
                rfid_tag: editingAsset.rfid_tag 
            });
            handleModalClose();
            fetchAssets();
        } catch (error) { alert("Gagal."); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'text-green-600 bg-green-50 border-green-200',
            'Assigned': 'text-blue-600 bg-blue-50 border-blue-200',
            'Faulty': 'text-red-600 bg-red-50 border-red-200',
        };
        return <span className={`px-2 py-1 rounded-md border text-[10px] font-bold ${styles[status] || 'text-gray-500 bg-gray-50 border-gray-200'}`}>{status}</span>;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[85vh] flex flex-col font-sans relative">
            
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaLaptop className="text-seabank-blue" /> Assets Inventory
                    </h1>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 transition">
                            <FaFileExport className="text-green-600" /> Export Excel
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="relative w-96">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by ID, Serial, RFID, or Model..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-seabank-blue transition" 
                        />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded bg-white text-gray-600 text-sm">
                        <FaFilter className="text-xs text-gray-400" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="outline-none bg-transparent cursor-pointer font-medium">
                            <option value="All Status">All Status</option>
                            <option value="Available">Available</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Faulty">Faulty</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-8 border-b border-gray-200">
                    {['Computers', 'Equipment', 'Peripherals', 'Servers', 'Network Devices'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium relative ${activeTab === tab ? 'text-seabank-blue font-bold' : 'text-gray-400 hover:text-gray-600'}`}>
                            {tab}
                            {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-seabank-blue rounded-t-full"></span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[2000px]">
                    <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase font-bold tracking-widest sticky top-0 border-b border-gray-200 z-10">
                        <tr>
                            <th className="px-4 py-4 bg-gray-50 text-center">Action</th>
                            <th className="px-4 py-4 bg-gray-50">Status</th>
                            <th className="px-4 py-4 bg-gray-50">Asset ID</th>
                            <th className="px-4 py-4 bg-gray-50">Asset Owner</th>
                            <th className="px-4 py-4 bg-gray-50">Owner Dept</th>
                            <th className="px-4 py-4 bg-gray-50">Location</th>
                            <th className="px-4 py-4 bg-gray-50 text-blue-600 font-black"><FaRss className="inline mr-1"/> RFID UID</th>
                            <th className="px-4 py-4 bg-gray-50">Serial Number</th>
                            <th className="px-4 py-4 bg-gray-50">Model Name</th>
                            <th className="px-4 py-4 bg-gray-50">Storeroom</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                        {loading ? (
                            <tr><td colSpan="10" className="text-center py-20 italic text-gray-400">Fetching Assets Data...</td></tr>
                        ) : filteredAssets.length === 0 ? (
                            <tr><td colSpan="10" className="text-center py-20 text-gray-400">No assets found.</td></tr>
                        ) : (
                            filteredAssets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-blue-50/40 transition group">
                                    <td className="px-4 py-3 text-center border-r border-gray-50">
                                        <button onClick={() => handleEditClick(asset)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition shadow-sm bg-white border border-blue-50">
                                            <FaEdit />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">{getStatusBadge(asset.status)}</td>
                                    <td className="px-4 py-3 font-mono text-blue-600 font-bold">{asset.asset_id}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{asset.asset_owner_name}</td>
                                    <td className="px-4 py-3 text-gray-500 font-medium">{asset.owner_department}</td>
                                    <td className="px-4 py-3 text-gray-500">{asset.asset_location}</td>
                                    <td className="px-4 py-3 font-mono text-blue-500 font-bold bg-blue-50/20">{asset.rfid_tag || '-'}</td>
                                    <td className="px-4 py-3 font-mono text-gray-500">{asset.serial_number}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-800">{asset.model_name}</td>
                                    <td className="px-4 py-3 text-[10px] text-gray-400">{asset.storeroom}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL EDIT --- */}
            {isModalOpen && editingAsset && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-7 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Edit Asset Status</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{editingAsset.asset_id} | {editingAsset.model_name}</p>
                            </div>
                            <button onClick={handleModalClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition"><FaTimes /></button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Change Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-seabank-blue outline-none font-semibold text-gray-700">
                                    <option value="Available">Available</option>
                                    <option value="Assigned">Assigned</option>
                                    <option value="Faulty">Faulty</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Owner Name</label>
                                    <input value={formData.asset_owner_name} onChange={(e) => setFormData({...formData, asset_owner_name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="-" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Department</label>
                                    <input value={formData.owner_department} onChange={(e) => setFormData({...formData, owner_department: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="-" />
                                </div>
                            </div>
                            
                            {/* --- INI KOLOM BARU YANG LO MINTA --- */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <FaMapMarkerAlt className="text-seabank-blue" /> Physical Location
                                </label>
                                <input 
                                    value={formData.asset_location} 
                                    onChange={(e) => setFormData({...formData, asset_location: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-seabank-blue outline-none" 
                                    placeholder="Contoh: Gama Tower Lt. 35 Seat 12" 
                                />
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Registered RFID UID</label>
                                <p className="text-sm font-mono font-bold text-blue-700">{formData.rfid_tag || 'No RFID Tag'}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-10 pt-5 border-t">
                            {editingAsset.status === 'Assigned' && (
                                <button onClick={handleUnassign} className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold flex items-center gap-2 mr-auto transition">
                                    <FaUserSlash /> Unassign
                                </button>
                            )}
                            <button onClick={handleModalClose} className="px-5 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg transition">Cancel</button>
                            <button onClick={handleSaveAssignment} className="px-6 py-2.5 bg-seabank-blue text-white rounded-lg text-sm font-bold hover:bg-blue-800 flex items-center gap-2 shadow-lg shadow-blue-200 transition">
                                <FaSave /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assets;