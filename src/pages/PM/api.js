import axios from 'axios';

const api = axios.create({
    // Point this at your backend host (env or localhost)
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001',
    withCredentials: true,
});

export default api;
