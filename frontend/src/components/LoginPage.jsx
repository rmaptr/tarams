import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaArrowLeft } from 'react-icons/fa'; // Import Icon Panah

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Kirim data login ke backend
            const response = await api.post('api_token_auth/', {
                username: username,
                password: password
            });

            // Simpan token di LocalStorage (Saku Browser)
            localStorage.setItem('token', response.data.token);

            // Pindah ke Dashboard
            navigate('/warehousing');
        } catch (err) {
            console.error("Login Error:", err);
            setError('Login Gagal. Cek username atau password.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans relative">
            
            {/* --- TOMBOL BALIK KE LANDING PAGE (BARU) --- */}
            <button 
                onClick={() => navigate('/')} 
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-seabank-orange transition font-medium text-sm group"
            >
                <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition">
                    <FaArrowLeft />
                </div>
                Back to Landing Page
            </button>

            {/* CARD LOGIN */}
            <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
                
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-seabank-orange rounded-lg flex items-center justify-center text-white text-xl font-black shadow-md mx-auto mb-4">
                        S
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">SeaBank IT Center</h2>
                    <p className="text-sm text-gray-500">Please sign in to continue</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded border border-red-200 text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-seabank-orange focus:border-transparent transition"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-seabank-orange focus:border-transparent transition"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-seabank-orange text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; 2025 SeaBank IT Center. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default LoginPage;