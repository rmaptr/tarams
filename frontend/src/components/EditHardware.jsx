import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCloudUploadAlt, FaSave, FaCheck, FaWifi, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../services/api';

const EditHardware = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const rfidInputRefs = useRef([]);

    const [loading, setLoading] = useState(true);
    const [orderInfo, setOrderInfo] = useState({
        do_number: '', po_number: '', delivery_date: '',
        entity: 'PT Bank SeaBank Indonesia', remark: '', file: null, existing_file_url: null
    });
    const [activeTab, setActiveTab] = useState('Computers');
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchDO = async () => {
            try {
                const response = await api.get(`warehousing/${id}/`);
                const data = response.data;
                setOrderInfo({
                    do_number: data.do_number || '',
                    po_number: data.po_number || '',
                    delivery_date: data.delivery_date || '',
                    entity: data.entity || 'PT Bank SeaBank Indonesia',
                    remark: data.remark || '',
                    file: null,
                    existing_file_url: data.file
                });
                if (data.items && data.items.length > 0) {
                    setActiveTab(data.items[0].category || 'Computers');
                    setItems(data.items);
                } else {
                    setItems([{ model_name: '', serial_number: '', quantity: 1, store_room: 'IT Storage Lt 35' }]);
                }
                setLoading(false);
            } catch (error) {
                console.error("Fetch Error:", error);
                alert("Gagal: Data tidak ditemukan atau masalah koneksi.");
                navigate('/warehousing');
            }
        };
        fetchDO();
    }, [id, navigate]);

    const addNewItem = () => {
        setItems([...items, {
            model_name: '', serial_number: '', finance_tag: '', rfid_tag: '', 
            quantity: 1, processor: '', ram: '', storage: '', 
            store_room: 'IT Storage Lt 35', warranty_start: '', warranty_end: '',
            asset_owner_name: '', owner_department: ''
        }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return alert("Minimal 1 item!");
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...items];
        newItems[index][name] = value;
        setItems(newItems);
    };

    const simulateScan = (index) => {
        const fakeTag = "E200" + Math.floor(Math.random() * 1000000000);
        const newItems = [...items];
        newItems[index].rfid_tag = fakeTag;
        setItems(newItems);
    };

    // Tambahan logika fokus scanner agar konsisten dengan AddHardware
    const focusScanner = (index) => {
        if (rfidInputRefs.current[index]) {
            rfidInputRefs.current[index].focus();
            rfidInputRefs.current[index].select();
        }
    };
    
    const handleOrderChange = (e) => setOrderInfo({ ...orderInfo, [e.target.name]: e.target.value });
    const handleFileClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => { if (e.target.files[0]) setOrderInfo({ ...orderInfo, file: e.target.files[0] }); };

    const handleUpdate = async (status) => {
        if (!orderInfo.do_number) return alert("DO Number wajib diisi!");
        
        for (let item of items) {
            if(!item.model_name || !item.serial_number) return alert("Model Name & Serial Number wajib diisi!");
        }

        const itemsWithCategory = items.map(item => ({ ...item, category: activeTab }));
        const payload = { ...orderInfo, file: null, status: status, items: itemsWithCategory };

        try {
            await api.put(`warehousing/${id}/`, payload);
            alert(`Data berhasil diperbarui! Status: ${status}`);
            navigate('/warehousing');
        } catch (error) {
            console.error("Update Error:", error);
            // --- LOGIKA HANDLE ERROR ---
            if (error.response) {
                if (error.response.status === 400) {
                    alert("Gagal Update: Terdapat data duplikat (RFID atau Serial Number) atau input tidak valid.");
                } else if (error.response.status === 404) {
                    alert("Gagal: Data tidak ditemukan di server.");
                } else {
                    alert(`Gagal Update: ${error.response.data.message || "Terjadi kesalahan pada server."}`);
                }
            } else {
                alert("Gagal: Masalah koneksi jaringan. Pastikan backend server aktif.");
            }
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400 animate-pulse">Loading Asset Data...</div>;

    return (
        <div className="max-w-6xl mx-auto pb-20 font-sans">
             <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition"><FaArrowLeft className="text-gray-600" /></button>
                <div>
                    <div className="text-sm text-gray-500 font-medium">Warehousing &gt; Edit Hardware</div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Edit DO: {orderInfo.do_number}</h1>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-seabank-orange rounded-full"></div>
                    <h3 className="text-lg font-bold text-seabank-blue tracking-tight">I. Order Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">DO Number</label><input name="do_number" value={orderInfo.do_number} onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-1 focus:ring-seabank-blue outline-none" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Date</label><input name="delivery_date" type="date" value={orderInfo.delivery_date} onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded outline-none" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">PO Number</label><input name="po_number" value={orderInfo.po_number} onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-1 focus:ring-seabank-blue outline-none" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Entity</label><select name="entity" value={orderInfo.entity} onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded bg-white outline-none"><option>PT Bank SeaBank Indonesia</option></select></div>
                </div>
                <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-1">Remark</label><textarea name="remark" value={orderInfo.remark} onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded h-24 outline-none"></textarea></div>

                 <div onClick={handleFileClick} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer mb-10 group hover:border-seabank-blue transition">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto mb-3 group-hover:text-seabank-blue transition" />
                    {orderInfo.file ? <p className="text-sm text-green-600 font-bold">{orderInfo.file.name}</p> : orderInfo.existing_file_url ? <p className="text-sm text-seabank-blue font-bold">File Terlampir (Klik untuk ganti)</p> : <p className="text-sm text-gray-700">Browse files to upload</p>}
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-seabank-orange rounded-full"></div>
                    <h3 className="text-lg font-bold text-seabank-blue tracking-tight">II. Hardware List</h3>
                </div>
                
                 {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50/30 mb-6 relative hover:shadow-md transition">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h4 className="font-bold text-gray-600 text-sm italic">Item #{index + 1}</h4>
                            {items.length > 1 && <button onClick={() => removeItem(index)} className="text-red-500 text-sm flex items-center gap-1 hover:text-red-700 transition"><FaTrash /> Remove</button>}
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="col-span-1"><label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-tight">Model Name *</label><input name="model_name" value={item.model_name || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" /></div>
                            <div className="col-span-1"><label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-tight">Serial Number *</label><input name="serial_number" value={item.serial_number || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" /></div>
                            <div className="col-span-1"><label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-tight">Finance Tag</label><input name="finance_tag" value={item.finance_tag || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" /></div>
                            <div className="col-span-1 relative">
                                <label className="block text-[10px] font-bold text-seabank-orange mb-1 flex justify-between uppercase">
                                    RFID TAG
                                    <span onClick={() => simulateScan(index)} className="cursor-pointer text-[10px] text-gray-400 hover:text-blue-500 tracking-tighter">(Simulate)</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        ref={el => rfidInputRefs.current[index] = el} 
                                        name="rfid_tag" value={item.rfid_tag || ''} 
                                        onChange={(e) => handleItemChange(index, e)} 
                                        className="w-full border border-orange-200 bg-white p-2 pl-8 rounded text-sm font-mono outline-none focus:border-seabank-orange" 
                                    />
                                    <FaWifi onClick={() => focusScanner(index)} className="absolute left-2.5 top-2.5 text-seabank-orange cursor-pointer" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="col-span-1"><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Processor</label><select name="processor" value={item.processor || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none"><option value="">N/A / None</option><option>Intel Core i5</option><option>Intel Core i7</option></select></div>
                            <div className="col-span-1"><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">RAM</label><select name="ram" value={item.ram || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none"><option value="">N/A / None</option><option>8 GB</option><option>16 GB</option></select></div>
                            <div className="col-span-1"><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Storage</label><select name="storage" value={item.storage || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none"><option value="">N/A / None</option><option>256 GB</option><option>512 GB</option></select></div>
                            <div className="col-span-1"><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Quantity</label><input name="quantity" type="number" value={item.quantity || 1} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" /></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                             <div className="col-span-1"><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Warranty Start</label><input name="warranty_start" type="date" value={item.warranty_start || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm text-gray-600 outline-none" /></div>
                             <div className="col-span-1"><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Warranty End</label><input name="warranty_end" type="date" value={item.warranty_end || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm text-gray-600 outline-none" /></div>
                             <div className="col-span-2"><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Storeroom</label><select name="store_room" value={item.store_room || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none"><option value="IT Storage Lt 35">IT Storage Lt 35</option><option value="Server Room">Server Room</option></select></div>
                        </div>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Owner Name (Optional)</label><input name="asset_owner_name" value={item.asset_owner_name || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" /></div>
                                <div><label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Owner Dept</label><input name="owner_department" value={item.owner_department || ''} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" /></div>
                            </div>
                        </div>
                    </div>
                 ))}

                <button onClick={addNewItem} className="w-full py-3 border-2 border-dashed border-seabank-blue text-seabank-blue rounded-lg font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2 mb-8 uppercase text-xs tracking-widest">
                    <FaPlus /> Add Another Hardware
                </button>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 uppercase text-xs font-bold tracking-widest">
                    <button onClick={() => navigate('/warehousing')} className="px-6 py-2.5 text-gray-600 hover:text-gray-800 transition">Cancel</button>
                    <button onClick={() => handleUpdate('Draft')} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded bg-white hover:bg-gray-50 transition flex items-center gap-2">
                        <FaSave /> Update Draft
                    </button>
                    <button onClick={() => handleUpdate('Completed')} className="px-6 py-2.5 bg-seabank-orange text-white rounded hover:bg-orange-600 transition flex items-center gap-2 shadow-sm shadow-orange-100">
                        Update & Finalize <FaCheck />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditHardware;