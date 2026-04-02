import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaExclamationTriangle, FaTimes, FaBellSlash } from 'react-icons/fa';

const GlobalAlert = () => {
    const [breaches, setBreaches] = useState([]);

    const fetchBreaches = async () => {
        try {
            const response = await api.get('assets/breaches/');
            const currentBreaches = response.data;
            
            // Filter out muted breaches from localStorage
            const mutedState = JSON.parse(localStorage.getItem('muted_breaches') || '{}');
            
            const activeBreaches = currentBreaches.filter(asset => {
                const mutedLastSeen = mutedState[asset.asset_id];
                // If it is muted AND the last_seen hasn't changed since muting, hide it.
                if (mutedLastSeen && mutedLastSeen === asset.last_seen) {
                    return false;
                }
                return true;
            });

            setBreaches(activeBreaches);
        } catch (error) {
            console.error("Failed to fetch asset breaches:", error);
        }
    };

    useEffect(() => {
        fetchBreaches();
        const interval = setInterval(fetchBreaches, 60000); // 1 minute polling
        return () => clearInterval(interval);
    }, []);

    const handleMute = (asset) => {
        // Build or update the muted state in localStorage
        const mutedState = JSON.parse(localStorage.getItem('muted_breaches') || '{}');
        mutedState[asset.asset_id] = asset.last_seen; 
        localStorage.setItem('muted_breaches', JSON.stringify(mutedState));
        
        // Remove locally from state instantly
        setBreaches(prev => prev.filter(b => b.asset_id !== asset.asset_id));
    };

    if (breaches.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4 flex flex-col gap-3">
            {breaches.map(asset => (
                <div key={asset.asset_id} className="bg-red-500 text-white rounded-lg shadow-xl overflow-hidden flex items-stretch animate-bounce-once">
                    <div className="bg-red-600 flex items-center justify-center w-14">
                        <FaExclamationTriangle className="text-2xl" />
                    </div>
                    <div className="p-3 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-lg mb-0.5">UNAUTHORIZED REMOVAL ALERT</h4>
                            <p className="text-red-100 text-sm">
                                <b>{asset.asset_id}</b> ({asset.model_name}) was taken out without being assigned and has exceeded the 1-hour grace period!
                            </p>
                            <p className="text-xs text-red-100/70 mt-1">
                                Last seen OUT at {new Date(asset.last_seen).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex shrink-0">
                            <button 
                                onClick={() => handleMute(asset)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition"
                            >
                                <FaBellSlash /> Acknowledge & Mute
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GlobalAlert;
