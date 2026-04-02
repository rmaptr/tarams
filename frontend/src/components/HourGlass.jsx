import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
    FaHourglass, FaPlus, FaTimes, FaUndo, FaExclamationTriangle,
    FaCheckCircle, FaClock, FaChevronLeft, FaChevronRight, FaSearch,
    FaLaptop, FaUserAlt, FaBuilding, FaCalendarAlt, FaArrowDown, FaArrowUp
} from 'react-icons/fa';

const HourGlass = () => {
    const [borrows, setBorrows] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [searchActive, setSearchActive] = useState('');
    const [searchHistory, setSearchHistory] = useState('');
    const [activePage, setActivePage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [, setTick] = useState(0); // For forcing countdown re-render

    const PER_PAGE = 10;

    // Form state
    const [form, setForm] = useState({
        asset: '',
        borrower_name: '',
        borrower_department: '',
        purpose: '',
        due_days: 7,
    });
    const [formError, setFormError] = useState('');

    // --- LOAD DATA ---
    useEffect(() => {
        fetchBorrows();
        fetchAssets();
    }, []);

    // --- COUNTDOWN TICKER (update every second) ---
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchBorrows = async () => {
        try {
            const response = await api.get('borrows/');
            setBorrows(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error borrows:", error);
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        try {
            const response = await api.get('assets/');
            setAssets(response.data);
        } catch (error) { console.error("Error assets:", error); }
    };

    // --- ACTIONS ---
    const handleLend = async () => {
        setFormError('');
        if (!form.asset || !form.borrower_name || !form.borrower_department) {
            setFormError('Semua field wajib diisi!');
            return;
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(form.due_days));

        try {
            await api.post('borrows/', {
                asset: parseInt(form.asset),
                borrower_name: form.borrower_name,
                borrower_department: form.borrower_department,
                purpose: form.purpose,
                due_date: dueDate.toISOString(),
            });
            setShowModal(false);
            setForm({ asset: '', borrower_name: '', borrower_department: '', purpose: '', due_days: 7 });
            fetchBorrows();
            fetchAssets();
        } catch (error) {
            const msg = error.response?.data;
            if (msg?.asset) setFormError(Array.isArray(msg.asset) ? msg.asset[0] : msg.asset);
            else setFormError(JSON.stringify(msg) || 'Gagal membuat peminjaman');
        }
    };

    const handleReturn = async (id) => {
        if (!window.confirm('Konfirmasi pengembalian aset ini?')) return;
        try {
            await api.post(`borrows/${id}/return_asset/`);
            fetchBorrows();
            fetchAssets();
        } catch (error) { alert('Gagal mengembalikan aset'); }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Batalkan peminjaman ini?')) return;
        try {
            await api.delete(`borrows/${id}/`);
            fetchBorrows();
            fetchAssets();
        } catch (error) { alert('Gagal membatalkan peminjaman'); }
    };

    // --- COMPUTED DATA ---
    const activeBorrows = borrows.filter(b => b.status === 'Active' || b.status === 'Overdue');
    const returnedBorrows = borrows.filter(b => b.status === 'Returned');
    const overdueCount = borrows.filter(b => b.status === 'Overdue').length;
    const returnedTodayCount = returnedBorrows.filter(b => {
        if (!b.returned_at) return false;
        return new Date(b.returned_at).toDateString() === new Date().toDateString();
    }).length;

    const availableAssets = assets.filter(a => a.status === 'Available');

    // --- SEARCH + PAGINATE ---
    const q1 = searchActive.toLowerCase();
    const filteredActive = activeBorrows.filter(b =>
        !q1 || (b.asset_id_display || '').toLowerCase().includes(q1) || (b.serial_number || '').toLowerCase().includes(q1) || (b.borrower_name || '').toLowerCase().includes(q1) || (b.model_name || '').toLowerCase().includes(q1)
    );
    const totalActivePages = Math.max(1, Math.ceil(filteredActive.length / PER_PAGE));
    const paginatedActive = filteredActive.slice((activePage - 1) * PER_PAGE, activePage * PER_PAGE);

    const q2 = searchHistory.toLowerCase();
    const filteredHistory = returnedBorrows.filter(b =>
        !q2 || (b.asset_id_display || '').toLowerCase().includes(q2) || (b.serial_number || '').toLowerCase().includes(q2) || (b.borrower_name || '').toLowerCase().includes(q2) || (b.model_name || '').toLowerCase().includes(q2)
    );
    const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / PER_PAGE));
    const paginatedHistory = filteredHistory.slice((historyPage - 1) * PER_PAGE, historyPage * PER_PAGE);

    useEffect(() => { setActivePage(1); }, [searchActive]);
    useEffect(() => { setHistoryPage(1); }, [searchHistory]);

    // --- COUNTDOWN HELPERS ---
    const getTimeRemaining = (dueDate, returnedAt) => {
        if (returnedAt) return { text: 'Returned', color: 'text-gray-400', bg: 'bg-gray-50' };
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        const totalSec = Math.floor(Math.abs(diff) / 1000);
        const days = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        if (diff < 0) {
            return {
                text: `- ${days}d ${hours}h ${mins}m ${secs}s`,
                label: 'OVERDUE',
                color: 'text-red-600',
                bg: 'bg-red-50 border-red-200',
                icon: '🔴'
            };
        } else if (days < 1) {
            return {
                text: `${hours}h ${mins}m ${secs}s`,
                label: 'URGENT',
                color: 'text-red-500',
                bg: 'bg-red-50 border-red-100',
                icon: '🔴'
            };
        } else if (days <= 3) {
            return {
                text: `${days}d ${hours}h ${mins}m`,
                label: 'SOON',
                color: 'text-yellow-600',
                bg: 'bg-yellow-50 border-yellow-100',
                icon: '🟡'
            };
        } else {
            return {
                text: `${days}d ${hours}h ${mins}m`,
                label: 'OK',
                color: 'text-green-600',
                bg: 'bg-green-50 border-green-100',
                icon: '🟢'
            };
        }
    };

    // --- PAGINATION COMPONENT ---
    const Pagination = ({ currentPage, totalPages, onPageChange }) => (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-[10px] text-gray-500 font-medium">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-1">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"><FaChevronLeft /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                        <button key={page} onClick={() => onPageChange(page)} className={`w-7 h-7 rounded text-xs font-bold ${currentPage === page ? 'bg-seabank-orange text-white' : 'border border-gray-200 text-gray-600 hover:bg-white'}`}>{page}</button>
                    );
                })}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"><FaChevronRight /></button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 font-sans">

            {/* ===== HEADER ===== */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaHourglass className="text-seabank-orange" /> Hour Glass
                    </h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                        Borrowed Asset Countdown Tracker
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-seabank-orange text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-sm"
                >
                    <FaPlus /> Lend Asset
                </button>
            </div>

            {/* ===== SUMMARY CARDS ===== */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500"><FaClock /></div>
                        <div>
                            <p className="text-2xl font-black text-gray-800">{activeBorrows.length}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Borrows</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500"><FaExclamationTriangle /></div>
                        <div>
                            <p className="text-2xl font-black text-red-600">{overdueCount}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Overdue</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-500"><FaCheckCircle /></div>
                        <div>
                            <p className="text-2xl font-black text-gray-800">{returnedTodayCount}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Returned Today</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== TABLE: ACTIVE BORROWS ===== */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-seabank-blue flex items-center gap-2">
                        <span className="w-1 h-5 bg-seabank-orange rounded-full inline-block"></span>
                        Active Borrows
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold ml-2">{activeBorrows.length}</span>
                    </h2>
                    <div className="relative mt-3">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                        <input
                            type="text" placeholder="Search by Asset ID, Serial Number, Model, or Borrower..."
                            value={searchActive} onChange={(e) => setSearchActive(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-seabank-orange focus:ring-1 focus:ring-seabank-orange/30"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-3">Asset</th>
                                <th className="px-5 py-3">Borrower</th>
                                <th className="px-5 py-3">Borrowed</th>
                                <th className="px-5 py-3">Due Date</th>
                                <th className="px-5 py-3">⏳ Time Left</th>
                                <th className="px-5 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-400 italic">Loading...</td></tr>
                            ) : paginatedActive.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-400">Tidak ada aset yang sedang dipinjam</td></tr>
                            ) : paginatedActive.map(b => {
                                const countdown = getTimeRemaining(b.due_date, b.returned_at);
                                return (
                                    <tr key={b.id} className={`hover:bg-blue-50/20 transition ${b.status === 'Overdue' ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-seabank-blue">{b.asset_id_display}</div>
                                            <div className="text-[10px] text-gray-500">{b.model_name}</div>
                                            <div className="text-[9px] text-gray-400 font-mono">{b.serial_number}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-gray-700">{b.borrower_name}</div>
                                            <div className="text-[10px] text-gray-400">{b.borrower_department}</div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-[10px]">
                                            {new Date(b.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-3 text-gray-700 text-[10px] font-bold">
                                            {new Date(b.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-[11px] ${countdown.bg} ${countdown.color}`}>
                                                <span>{countdown.icon}</span>
                                                <span>{countdown.text}</span>
                                            </div>
                                            {countdown.label && countdown.label !== 'OK' && (
                                                <span className={`ml-2 text-[8px] font-black uppercase ${countdown.color}`}>{countdown.label}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleReturn(b.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-[10px] font-bold hover:bg-green-700 transition" title="Return Asset">
                                                    <FaUndo /> Return
                                                </button>
                                                <button onClick={() => handleCancel(b.id)} className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-red-500 hover:border-red-200 transition" title="Cancel Borrow">
                                                    <FaTimes className="text-[10px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={activePage} totalPages={totalActivePages} onPageChange={setActivePage} />
            </div>

            {/* ===== TABLE: RETURN HISTORY ===== */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-base font-bold text-seabank-blue flex items-center gap-2 w-full text-left"
                    >
                        <span className="w-1 h-5 bg-green-500 rounded-full inline-block"></span>
                        Return History
                        <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">{returnedBorrows.length}</span>
                        {showHistory ? <FaArrowUp className="text-gray-400 text-xs ml-auto" /> : <FaArrowDown className="text-gray-400 text-xs ml-auto" />}
                    </button>
                    {showHistory && (
                        <div className="relative mt-3">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                            <input
                                type="text" placeholder="Search history..."
                                value={searchHistory} onChange={(e) => setSearchHistory(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-seabank-orange focus:ring-1 focus:ring-seabank-orange/30"
                            />
                        </div>
                    )}
                </div>

                {showHistory && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3">Asset</th>
                                        <th className="px-5 py-3">Borrower</th>
                                        <th className="px-5 py-3">Borrowed</th>
                                        <th className="px-5 py-3">Due Date</th>
                                        <th className="px-5 py-3">Returned</th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {paginatedHistory.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-12 text-gray-400">Belum ada riwayat pengembalian</td></tr>
                                    ) : paginatedHistory.map(b => {
                                        const wasOverdue = new Date(b.returned_at) > new Date(b.due_date);
                                        return (
                                            <tr key={b.id} className="hover:bg-blue-50/20 transition">
                                                <td className="px-5 py-3">
                                                    <div className="font-bold text-gray-600">{b.asset_id_display}</div>
                                                    <div className="text-[10px] text-gray-400">{b.model_name}</div>
                                                </td>
                                                <td className="px-5 py-3 text-gray-600">{b.borrower_name}</td>
                                                <td className="px-5 py-3 text-[10px] text-gray-500">{new Date(b.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                                                <td className="px-5 py-3 text-[10px] text-gray-500">{new Date(b.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                                                <td className="px-5 py-3 text-[10px] font-bold text-green-600">{new Date(b.returned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${wasOverdue ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                                                        <FaCheckCircle />
                                                        {wasOverdue ? 'Returned Late' : 'On Time'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={historyPage} totalPages={totalHistoryPages} onPageChange={setHistoryPage} />
                    </>
                )}
            </div>

            {/* ===== LEND MODAL ===== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-seabank-blue text-white p-5 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2"><FaHourglass /> Lend Asset</h3>
                                <p className="text-xs text-blue-200 mt-0.5">Buat peminjaman aset baru</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white"><FaTimes /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-xs font-medium">{formError}</div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1"><FaLaptop /> Select Asset</label>
                                <select
                                    value={form.asset}
                                    onChange={e => setForm({ ...form, asset: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-seabank-orange"
                                >
                                    <option value="">-- Pilih aset yang tersedia --</option>
                                    {availableAssets.map(a => (
                                        <option key={a.id} value={a.id}>{a.asset_id} — {a.model_name} ({a.serial_number})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1"><FaUserAlt /> Borrower Name</label>
                                    <input
                                        type="text" placeholder="Nama peminjam"
                                        value={form.borrower_name} onChange={e => setForm({ ...form, borrower_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-seabank-orange"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1"><FaBuilding /> Department</label>
                                    <input
                                        type="text" placeholder="Department"
                                        value={form.borrower_department} onChange={e => setForm({ ...form, borrower_department: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-seabank-orange"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Purpose / Notes</label>
                                <textarea
                                    rows="2" placeholder="Alasan peminjaman (opsional)"
                                    value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-seabank-orange resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1"><FaCalendarAlt /> Lending Period</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number" min="1" max="365"
                                        value={form.due_days} onChange={e => setForm({ ...form, due_days: e.target.value })}
                                        className="w-24 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-center font-bold focus:outline-none focus:border-seabank-orange"
                                    />
                                    <span className="text-sm text-gray-500">hari dari sekarang</span>
                                    <span className="text-xs text-gray-400 ml-auto">
                                        Due: {(() => { const d = new Date(); d.setDate(d.getDate() + parseInt(form.due_days || 0)); return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); })()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
                                Cancel
                            </button>
                            <button onClick={handleLend} className="px-5 py-2 bg-seabank-orange text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-sm">
                                Confirm Lending
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HourGlass;
