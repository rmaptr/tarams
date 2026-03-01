import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCloudUploadAlt, FaSave, FaCheck, FaWifi, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../services/api';

const AddHardware = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const rfidInputRefs = useRef([]); 

    // --- LOGIKA AUTO-FOCUS ---
    useEffect(() => {
        if (rfidInputRefs.current[0]) {
            rfidInputRefs.current[0].focus();
        }
    }, []);

    const [orderInfo, setOrderInfo] = useState({
        do_number: '', po_number: '', delivery_date: '',
        entity: 'PT Bank SeaBank Indonesia', remark: '', file: null
    });
    const [activeTab, setActiveTab] = useState('Computers');

    const [items, setItems] = useState([{
        model_name: '', serial_number: '', finance_tag: '', rfid_tag: '', 
        quantity: 1, processor: '', ram: '', storage: '', 
        store_room: 'IT Storage Lt 35', warranty_start: '', warranty_end: '',
        asset_owner_name: '', owner_department: ''
    }]);

    const addNewItem = () => {
        setItems([...items, {
            model_name: '', serial_number: '', finance_tag: '', rfid_tag: '', 
            quantity: 1, processor: '', ram: '', storage: '', 
            store_room: 'IT Storage Lt 35', warranty_start: '', warranty_end: '',
            asset_owner_name: '', owner_department: ''
        }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return alert("Minimal harus ada 1 item!");
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
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

    const handleKeyDown = (e, index) => { if (e.key === 'Enter') e.preventDefault(); };

    const focusScanner = (index) => {
        if (rfidInputRefs.current[index]) {
            rfidInputRefs.current[index].focus();
            rfidInputRefs.current[index].select();
        }
    };

    const handleOrderChange = (e) => setOrderInfo({ ...orderInfo, [e.target.name]: e.target.value });
    const handleFileClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => { if (e.target.files[0]) setOrderInfo({ ...orderInfo, file: e.target.files[0] }); };

    const handleSubmit = async (status) => {
        if (!orderInfo.do_number) return alert("Mohon isi DO Number!");
        
        for (let item of items) {
            if(!item.model_name || !item.serial_number) {
                return alert("Model Name & Serial Number wajib diisi untuk setiap barang!");
            }
        }

        const itemsWithCategory = items.map(item => ({ ...item, category: activeTab }));
        const payload = { ...orderInfo, file: null, status: status, items: itemsWithCategory };

        try {
            await api.post('warehousing/', payload);
            alert(status === 'Draft' ? 'Disimpan sebagai Draft!' : 'SUKSES! Semua Aset masuk Inventory.');
            navigate('/warehousing');
        } catch (error) {
            console.error("Error detail:", error);
            // --- LOGIKA HANDLE ERROR ---
            if (error.response) {
                if (error.response.status === 400) {
                    // Menangkap error duplikasi unik (RFID/Serial Number) dari Backend
                    alert("GAGAL: Terdapat data duplikat! Pastikan Nomor RFID dan Serial Number belum pernah terdaftar di sistem.");
                } else if (error.response.status === 500) {
                    alert("Gagal: Terjadi kesalahan pada server. Mohon hubungi administrator.");
                } else {
                    alert(`Gagal: ${error.response.data.message || "Terjadi kesalahan saat menyimpan data."}`);
                }
            } else {
                alert("Gagal: Masalah koneksi jaringan. Pastikan server backend Anda menyala.");
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 font-sans">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <FaArrowLeft className="text-gray-600" />
                </button>
                <div>
                    <div className="text-sm text-gray-500 font-medium">Warehousing &gt; Add Hardware</div>
                    <h1 className="text-2xl font-bold text-gray-800">Add Hardware (Multi-Item)</h1>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-seabank-orange rounded-full"></div>
                    <h3 className="text-lg font-bold text-seabank-blue tracking-tight">I. Order Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">DO Number *</label>
                        <input name="do_number" onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-1 focus:ring-seabank-blue outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Date *</label>
                        <input name="delivery_date" type="date" onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">PO Number *</label>
                        <input name="po_number" onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-1 focus:ring-seabank-blue outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Entity *</label>
                        <select name="entity" onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded bg-white outline-none">
                            <option>PT Bank SeaBank Indonesia</option>
                        </select>
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Remark</label>
                    <textarea name="remark" onChange={handleOrderChange} className="w-full border border-gray-300 p-2.5 rounded h-24 outline-none"></textarea>
                </div>
                <div onClick={handleFileClick} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer mb-10 hover:border-seabank-blue transition">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto mb-3" />
                    {orderInfo.file ? <p className="text-sm text-green-600 font-bold">{orderInfo.file.name}</p> : <p className="text-sm text-gray-700">Browse files to upload</p>}
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-seabank-orange rounded-full"></div>
                        <h3 className="text-lg font-bold text-seabank-blue tracking-tight">II. Hardware List</h3>
                    </div>
                </div>
                <div className="flex gap-6 border-b border-gray-200 mb-6 font-semibold">
                    {['Computers', 'Equipment', 'Peripherals', 'Servers', 'Network Devices', 'SIM Cards'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium relative ${activeTab === tab ? 'text-seabank-blue font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
                            {tab}{activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-seabank-blue rounded-full"></span>}
                        </button>
                    ))}
                </div>

                {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50/30 mb-6 relative hover:shadow-md transition">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h4 className="font-bold text-gray-600 text-sm">Item #{index + 1}</h4>
                            {items.length > 1 && (
                                <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                                    <FaTrash /> Remove
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="col-span-1">
                                <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-tight">Model Name *</label>
                                <input name="model_name" value={item.model_name} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-tight">Serial Number *</label>
                                <input name="serial_number" value={item.serial_number} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-tight">Finance Tag</label>
                                <input name="finance_tag" value={item.finance_tag} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" />
                            </div>
                            <div className="col-span-1 relative">
                                <label className="block text-[10px] font-bold text-seabank-orange mb-1 flex justify-between uppercase">
                                    RFID TAG *
                                    <span onClick={() => simulateScan(index)} className="cursor-pointer text-[10px] text-gray-400 hover:text-blue-500 tracking-tighter">(Simulate)</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        ref={el => rfidInputRefs.current[index] = el}
                                        name="rfid_tag" value={item.rfid_tag} onChange={(e) => handleItemChange(index, e)} onKeyDown={(e) => handleKeyDown(e, index)} 
                                        className="w-full border border-orange-200 bg-white p-2 pl-8 rounded text-sm font-mono outline-none focus:border-seabank-orange" 
                                        placeholder="Scan RFID..."
                                    />
                                    <FaWifi onClick={() => focusScanner(index)} className="absolute left-2.5 top-2.5 text-seabank-orange cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Processor</label>
                                <select name="processor" value={item.processor} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none">
                                    <option value="">N/A / None</option>
                                    <option>Intel Core i5</option>
                                    <option>Intel Core i7</option>
                                    <option>Apple M1/M2/M3</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">RAM</label>
                                <select name="ram" value={item.ram} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none">
                                    <option value="">N/A / None</option>
                                    <option>8 GB</option>
                                    <option>16 GB</option>
                                    <option>32 GB</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Storage</label>
                                <select name="storage" value={item.storage} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none">
                                    <option value="">N/A / None</option>
                                    <option>256 GB</option>
                                    <option>512 GB</option>
                                    <option>1 TB</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Quantity</label>
                                <input name="quantity" type="number" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Warranty Start</label>
                                <input name="warranty_start" type="date" value={item.warranty_start} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm text-gray-600 outline-none" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Warranty End</label>
                                <input name="warranty_end" type="date" value={item.warranty_end} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm text-gray-600 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Storeroom</label>
                                <select name="store_room" value={item.store_room} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white outline-none">
                                    <option value="IT Storage Lt 35">IT Storage Lt 35</option>
                                    <option value="Server Room">Server Room</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Owner Name (Optional)</label>
                                    <input name="asset_owner_name" value={item.asset_owner_name} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-tight">Owner Dept</label>
                                    <input name="owner_department" value={item.owner_department} onChange={(e) => handleItemChange(index, e)} className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-seabank-blue" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button onClick={addNewItem} className="w-full py-3 border-2 border-dashed border-seabank-blue text-seabank-blue rounded-lg font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2 mb-8 uppercase text-xs tracking-widest">
                    <FaPlus /> Add Another Hardware
                </button>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 font-bold uppercase tracking-wider text-xs">
                    <button onClick={() => navigate('/warehousing')} className="px-6 py-2.5 text-gray-600 hover:text-gray-800 transition">Cancel</button>
                    <button onClick={() => handleSubmit('Draft')} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded bg-white hover:bg-gray-50 transition flex items-center gap-2">
                        <FaSave /> Save as draft
                    </button>
                    <button onClick={() => handleSubmit('Completed')} className="px-6 py-2.5 bg-seabank-orange text-white rounded hover:bg-orange-600 transition flex items-center gap-2 shadow-sm shadow-orange-100">
                        Add Asset <FaCheck />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddHardware;