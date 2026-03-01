import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBoxOpen, FaBarcode, FaChartLine, FaBuilding, FaUsers, FaServer } from 'react-icons/fa';

const LandingPage = () => {
    // Variabel Animasi
    const fadeInUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    return (
        // UBAH DISINI: Ganti bg-white jadi gradasi oranye halus
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 font-sans text-gray-800 overflow-x-hidden flex flex-col">
            
            {/* --- BACKGROUND BLOB (Tetap ada biar estetik) --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[100px]"></div>
            </div>

            {/* --- NAVBAR --- */}
            <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-bold tracking-tight text-seabank-blue cursor-pointer flex items-center gap-2">
                        <div className="w-8 h-8 bg-seabank-orange rounded-lg flex items-center justify-center text-white text-sm font-black">S</div>
                        <span>SeaBank <span className="font-light text-seabank-orange">IT Center</span></span>
                    </div>
                    <Link to="/login" className="bg-seabank-orange text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-600 hover:shadow-lg transition transform hover:-translate-y-0.5">
                        Login Portal
                    </Link>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10 flex-grow">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                        <motion.span variants={fadeInUp} className="inline-block py-1 px-3 rounded-full bg-white text-seabank-orange text-sm font-semibold mb-6 border border-orange-100 shadow-sm">
                            🚀 Internal Asset Management System v2.1.0
                        </motion.span>
                        
                        <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-extrabold text-seabank-blue mb-6 leading-tight">
                            SeaBank <span className="text-seabank-orange">IT Center</span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Platform manajemen aset terintegrasi. Kelola Delivery Order, Warehousing, dan Pendaftaran RFID dalam satu ekosistem pintar.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/login" className="bg-seabank-blue text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-900 transition flex items-center justify-center gap-2 transform hover:scale-105 duration-200">
                                <FaBoxOpen /> Masuk Dashboard
                            </Link>
                            <Link to="/docs" className="px-8 py-4 rounded-xl font-bold text-lg text-seabank-orange bg-white hover:bg-orange-50 border border-orange-100 shadow-sm transition flex items-center justify-center gap-2">
                                📖 Pelajari Dokumentasi
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </header>

            {/* --- FEATURES SECTION --- */}
            <section className="py-24 z-10 relative border-t border-gray-100/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-seabank-blue mb-4">Fitur Utama</h2>
                        <p className="text-gray-500">Didesain khusus untuk kebutuhan Tim IT Support & Infrastructure.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<FaBarcode className="text-4xl text-seabank-orange" />}
                            title="RFID Enrollment"
                            desc="Input aset otomatis menggunakan Desktop Reader UHF. Selamat tinggal input manual!"
                        />
                        <FeatureCard 
                            icon={<FaBoxOpen className="text-4xl text-blue-500" />}
                            title="Smart Warehousing"
                            desc="Sinkronisasi data Delivery Order (DO) vendor langsung ke database inventory."
                        />
                        <FeatureCard 
                            icon={<FaChartLine className="text-4xl text-green-500" />}
                            title="Live Tracking"
                            desc="Monitoring pergerakan aset secara real-time dengan status yang akurat."
                        />
                    </div>
                </div>
            </section>

            {/* --- STATS SECTION --- */}
            <section className="py-20 bg-seabank-blue text-white relative z-10 overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center divide-x divide-blue-800/50">
                        <StatItem number="2,500+" label="Total Assets" icon={<FaBoxOpen />} />
                        <StatItem number="99.9%" label="Data Accuracy" icon={<FaChartLine />} />
                        <StatItem number="15s" label="Avg. Input Time" icon={<FaBarcode />} />
                        <StatItem number="4" label="Office Locations" icon={<FaBuilding />} />
                        <StatItem number="12" label="Departments" icon={<FaServer />} />
                        <StatItem number="50+" label="Active Users" icon={<FaUsers />} className="border-r-0" />
                    </div>
                </div>
            </section>

            {/* --- FOOTER DETAIL --- */}
            <footer className="bg-gray-900 text-white py-16 relative z-10 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-2xl font-bold text-white mb-4">SeaBank <span className="text-seabank-orange">IT Center</span></h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                                Sistem manajemen aset internal yang dibangun untuk meningkatkan efisiensi operasional IT, meminimalisir human-error, dan memastikan akurasi data inventaris perusahaan.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                System Operational
                            </div>
                        </div>

                        {/* Quick Links Update */}
                        <div>
                            <h4 className="font-bold text-gray-200 mb-6">Quick Links</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><Link to="/login" className="hover:text-seabank-orange transition">Login Portal</Link></li>
                                <li><Link to="/docs" className="hover:text-seabank-orange transition">Dokumentasi</Link></li>
                                {/* Mailto Link untuk Report Issue */}
                                <li><a href="mailto:it.support@seabank.co.id?subject=Report%20Issue%20IT%20Asset%20System" className="hover:text-seabank-orange transition">Report Issue</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-200 mb-6">Internal Support</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li>IT Helpdesk (Ext. 1234)</li>
                                <li>it.support@seabank.co.id</li>
                                <li>Gama Tower, Lt. 35</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                        <div>&copy; 2025 PT Bank SeaBank Indonesia. Internal Use Only.</div>
                        <div className="flex items-center gap-6">
                            <span>System v2.1.0</span>
                            <span className="hidden md:inline">|</span>
                            <span>Developed by IT Project Management Intern</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all text-center group"
        >
            <div className="mb-6 bg-orange-50 group-hover:bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
        </motion.div>
    );
};

const StatItem = ({ number, label, icon, className }) => {
    return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`flex flex-col items-center justify-center p-4 ${className}`}
        >
            <div className="text-blue-300 mb-2 text-2xl opacity-80">{icon}</div>
            <div className="text-3xl font-extrabold text-white mb-1">{number}</div>
            <div className="text-blue-200 font-medium text-xs uppercase tracking-wider">{label}</div>
        </motion.div>
    );
};

export default LandingPage;