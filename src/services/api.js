const API_BASE_URL = 'http://localhost:8080/api';
const TOKEN_KEY = 'dosebuddy_token';
const USER_KEY = 'dosebuddy_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
    try {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const setAuthData = (token, user) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const loginApi = async (usernameOrEmail, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
    }
    return data;
};

export const registerApi = async (formData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
    }
    return data;
};

export const demoLoginApi = async (role = 'CAREGIVER') => {
    const response = await fetch(`${API_BASE_URL}/auth/demo-login?role=${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Demo login failed');
    }
    return data;
};

export const fetchProfileApi = async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Session expired');
    }
    return await response.json();
};

export const sendChatMessageApi = async (message, conversationId) => {
    const token = getStoredToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, conversationId })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get response from DoseBuddy AI');
    }
    return await response.json();
};

export const fetchChatHistoryApi = async (conversationId) => {
    if (!conversationId) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/chat/history/${encodeURIComponent(conversationId)}`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
};

export const clearChatHistoryApi = async (conversationId) => {
    if (!conversationId) return;
    try {
        await fetch(`${API_BASE_URL}/chat/history/${encodeURIComponent(conversationId)}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error('Error clearing history:', e);
    }
};

export const uploadPrescriptionPdfApi = async (file, conversationId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
        formData.append('conversationId', conversationId);
    }

    const token = getStoredToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/rag/upload`, {
        method: 'POST',
        headers,
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to process prescription PDF');
    }
    return data;
};

