export const secureFetch = async (url, options = {}) => {
    const response = await fetch(url, options);

    // If we get an unauthorized error, we might want to clear the password
    if (response.status === 401) {
        console.warn('Unauthorized detected, clearing session and broadcasting event');
        window.dispatchEvent(new Event('admin-unauthorized'));
        throw new Error('Unauthorized');
    }

    return response;
};

export const verifyCredentials = async (id, password) => {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, password }),
        });
        return res.status === 200;
    } catch (error) {
        console.error('Login verification network error:', error);
        return false;
    }
};

export const verifySession = async () => {
    try {
        const res = await fetch('/api/auth/session');
        return res.status === 200;
    } catch {
        return false;
    }
};

export const logout = async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout network error:', error);
    }
};

export const fetchSummary = async (days) => {
    const res = await secureFetch(`/api/analytics/summary?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
};

export const fetchUsers = async (page, limit, search) => {
    const url = `/api/analytics/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    const res = await secureFetch(url);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
};

export const fetchUserDetails = async (userId) => {
    const res = await secureFetch(`/api/analytics/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user details');
    return res.json();
};
