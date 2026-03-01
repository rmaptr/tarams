import axios from 'axios';

// Bikin Instance Axios (Settingan Pusat)
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/', // Pastikan URL backend bener
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- INTERCEPTOR (SATPAM OTOMATIS) ---
// Tugas: Setiap kali mau kirim data, cek saku (localStorage), ambil token, tempel di header.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // INI KUNCINYA: Tempel Token dengan format "Token <isi_token>"
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;