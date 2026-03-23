export const getAdminId = () => {
    return localStorage.getItem('admin_id') || '';
};

export const getAdminPassword = () => {
    return localStorage.getItem('admin_password') || '';
};

export const secureFetch = async (url, options = {}) => {
    const headers = {
        ...options.headers,
        'X-Admin-ID': getAdminId(),
        'X-Admin-Password': getAdminPassword(),
    };
    
    console.log('Fetching:', url, 'with credentials for:', getAdminId());

    const response = await fetch(url, { ...options, headers });

    // If we get an unauthorized error, we might want to clear the password
    if (response.status === 401) {
        console.warn('Unauthorized detected, clearing session and broadcasting event');
        localStorage.removeItem('admin_id');
        localStorage.removeItem('admin_password');
        window.dispatchEvent(new Event('admin-unauthorized'));
        throw new Error('Unauthorized');
    }

    return response;
};

export const verifyCredentials = async (id, password) => {
    try {
        const res = await fetch('/api/analytics/summary?days=1', {
            headers: {
                'X-Admin-ID': id,
                'X-Admin-Password': password
            }
        });
        return res.status === 200;
    } catch (error) {
        return false;
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
