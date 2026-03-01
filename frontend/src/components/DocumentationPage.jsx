import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaDatabase, FaReact, FaMicrochip, FaQuestionCircle } from 'react-icons/fa';

const DocumentationPage = () => {
    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        // BG GRADASI ORANYE SENADA DENGAN LANDING PAGE
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 text-gray-800 font-sans">
            
            {/* Navbar Doc */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-seabank-orange transition font-medium">
                        <FaArrowLeft /> Kembali ke Home
                    </Link>
                    <span className="font-bold text-seabank-blue flex items-center gap-2">
                        <span className="bg-seabank-orange text-white px-2 rounded text-xs py-0.5">DOCS</span>
                        Sistem v2.1.0
                    </span>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6 pt-12 pb-24">
                <motion.div variants={container} initial="hidden" animate="show">
                    
                    {/* Header */}
                    <motion.div variants={item} className="mb-12 text-center">
                        <h1 className="text-4xl font-extrabold text-seabank-blue mb-4">Dokumentasi Sistem</h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Panduan singkat penggunaan SeaBank IT Center Asset Management untuk Administrator dan IT Support.
                        </p>
                    </motion.div>

                    {/* Section 1: Workflow */}
                    <motion.div variants={item} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                        <h2 className="text-2xl font-bold text-seabank-blue mb-6 border-b pb-4">
                            🔄 Alur Kerja Utama
                        </h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 bg-blue-100 text-seabank-blue rounded-full flex items-center justify-center font-bold">1</div>
                                    <div className="h-full w-0.5 bg-gray-100 my-2"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">Warehousing (Input DO)</h3>
                                    <p className="text-gray-500 text-sm mt-1">Admin menerima barang dari vendor. Masukkan data Delivery Order (DO) di menu <b>Warehousing</b>. Status awal adalah <i>Draft</i>.</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 bg-blue-100 text-seabank-blue rounded-full flex items-center justify-center font-bold">2</div>
                                    <div className="h-full w-0.5 bg-gray-100 my-2"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">Finalisasi Aset</h3>
                                    <p className="text-gray-500 text-sm mt-1">Setelah fisik barang dicek, ubah status DO menjadi <i>Completed</i>. Data otomatis masuk ke <b>Master Assets</b> sebagai barang <i>Available</i>.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 bg-seabank-orange text-white rounded-full flex items-center justify-center font-bold">3</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">RFID Enrollment</h3>
                                    <p className="text-gray-500 text-sm mt-1">Tempel stiker RFID pada aset. Gunakan Desktop Reader di menu <b>Assets</b> untuk melakukan pairing antara Data Digital dan Fisik (Tagging).</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 2: FAQ */}
                    <motion.div variants={item} className="grid md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <FaQuestionCircle className="text-seabank-orange text-2xl mb-3" />
                            <h3 className="font-bold text-gray-800 mb-2">Lupa Password Admin?</h3>
                            <p className="text-sm text-gray-500">Silakan hubungi Super Admin atau Database Administrator untuk melakukan reset password via Django Admin.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <FaMicrochip className="text-seabank-orange text-2xl mb-3" />
                            <h3 className="font-bold text-gray-800 mb-2">Alat RFID Tidak Terbaca?</h3>
                            <p className="text-sm text-gray-500">Pastikan driver Desktop Reader sudah terinstall dan kursor aktif di kolom input saat melakukan scanning.</p>
                        </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div variants={item} className="text-center bg-seabank-blue text-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-2">Siap Mengelola Aset?</h2>
                        <p className="text-blue-200 mb-6">Login sekarang untuk mengakses dashboard.</p>
                        <Link to="/login" className="bg-seabank-orange text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition shadow-lg inline-block">
                            Login Portal
                        </Link>
                    </motion.div>

                </motion.div>
            </main>
        </div>
    );
};

export default DocumentationPage;