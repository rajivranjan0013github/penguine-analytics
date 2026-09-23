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

export const fetchDemographyData = async (range) => {
    let url = '/api/analytics/users/timezones';
    if (typeof range === 'number' && range > 0) {
        url += `?days=${range}`;
    } else if (range && typeof range === 'object' && range.startDate && range.endDate) {
        url += `?startDate=${range.startDate}&endDate=${range.endDate}`;
    }
    const res = await secureFetch(url);
    if (!res.ok) throw new Error('Failed to fetch demography data');
    return res.json();
};

export const fetchCallHealth = async (range) => {
    let url = '/api/analytics/calls';
    if (typeof range === 'number' && range > 0) {
        url += `?days=${range}`;
    } else if (range && typeof range === 'object' && range.startDate && range.endDate) {
        url += `?startDate=${range.startDate}&endDate=${range.endDate}`;
    }
    const res = await secureFetch(url);
    if (!res.ok) throw new Error('Failed to fetch call health data');
    return res.json();
};

export const fetchQuestionEngagement = async (range) => {
    let url = '/api/analytics/questions';
    if (typeof range === 'number' && range > 0) {
        url += `?days=${range}`;
    } else if (range && typeof range === 'object' && range.startDate && range.endDate) {
        url += `?startDate=${range.startDate}&endDate=${range.endDate}`;
    }
    const res = await secureFetch(url);
    if (!res.ok) throw new Error('Failed to fetch question engagement data');
    return res.json();
};

export const fetchUsers = async (page = 1, limit = 15, search = '', country = '') => {
    let url = `/api/analytics/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    if (country) {
        url += `&country=${encodeURIComponent(country)}`;
    }
    const res = await secureFetch(url);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
};

export const fetchPaginatedUsers = fetchUsers;

export const fetchUserDetails = async (userId) => {
    const res = await secureFetch(`/api/analytics/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user details');
    return res.json();
};
