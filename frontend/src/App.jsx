import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT SEMUA HALAMAN ---
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import DocumentationPage from './components/DocumentationPage';
import Warehousing from './components/Warehousing';
import AddHardware from './components/AddHardware';
import EditHardware from './components/EditHardware';
import Assets from './components/Assets';
import Monitoring from './components/Monitoring'; // <--- IMPORT HALAMAN BARU UNTUK PROYEK AKHIR

// --- KOMPONEN SATPAM (PROTECTED ROUTE) ---
// Tugas: Mengecek apakah user punya "Tiket" (Token) di saku browsernya.
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// --- APP UTAMA ---
function App() {
  return (
    <Router>
      <Routes>
        {/* =========================================
            1. HALAMAN PUBLIK (Bisa diakses siapa aja)
           ========================================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* =========================================
            2. HALAMAN PRIVATE (Wajib Login & Pake Sidebar)
           ========================================= */}
        
        {/* Dashboard Warehousing (Tabel DO) */}
        <Route path="/warehousing" element={
            <ProtectedRoute>
                <Layout>
                    <Warehousing />
                </Layout>
            </ProtectedRoute>
        } />

        {/* Form Add Hardware (Input Barang Baru) */}
        <Route path="/add-hardware" element={
            <ProtectedRoute>
                <Layout>
                    <AddHardware />
                </Layout>
            </ProtectedRoute>
        } />

        {/* Form Edit Hardware (Edit Barang Lama) */}
        <Route path="/edit-hardware/:id" element={
            <ProtectedRoute>
                <Layout>
                    <EditHardware />
                </Layout>
            </ProtectedRoute>
        } />
        
        {/* Dashboard Assets (Tabel Inventory Master) */}
        <Route path="/assets" element={
            <ProtectedRoute>
                <Layout>
                    <Assets />
                </Layout>
            </ProtectedRoute>
        } />

        {/* Dashboard Monitoring (Live Tracking RFID) - BARU UNTUK PROYEK AKHIR */}
        <Route path="/monitoring" element={
            <ProtectedRoute>
                <Layout>
                    <Monitoring />
                </Layout>
            </ProtectedRoute>
        } />

        {/* =========================================
            3. FALLBACK (Salah Alamat)
           ========================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;