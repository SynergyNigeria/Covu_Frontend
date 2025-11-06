// Central API Handler for Covu Fashion Marketplace
// Handles all API requests with JWT authentication and infinite scroll support

class APIHandler {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.tokenKeys = API_CONFIG.TOKEN_KEYS;
    }

    // Get stored access token
    getAccessToken() {
        return localStorage.getItem(this.tokenKeys.ACCESS);
    }

    // Get stored refresh token
    getRefreshToken() {
        return localStorage.getItem(this.tokenKeys.REFRESH);
    }

    // Store tokens
    setTokens(accessToken, refreshToken) {
        localStorage.setItem(this.tokenKeys.ACCESS, accessToken);
        if (refreshToken) {
            localStorage.setItem(this.tokenKeys.REFRESH, refreshToken);
        }
    }

    // Clear tokens (logout)
    clearTokens() {
        localStorage.removeItem(this.tokenKeys.ACCESS);
        localStorage.removeItem(this.tokenKeys.REFRESH);
        localStorage.removeItem(this.tokenKeys.USER);
    }

    // Get stored user data
    getCurrentUser() {
        const userStr = localStorage.getItem(this.tokenKeys.USER);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Store user data
    setCurrentUser(userData) {
        localStorage.setItem(this.tokenKeys.USER, JSON.stringify(userData));
    }

    // Build request headers
    buildHeaders(includeAuth = true, isFormData = false) {
        const headers = {};
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (includeAuth) {
            const token = this.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }

    // Refresh access token
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.setTokens(data.access, null); // Only update access token
            console.log('✅ Token refreshed successfully');
            return data.access;
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            
            // Don't immediately logout - give user a chance to see payment status
            // Only clear tokens and redirect after user interaction
            // This prevents auto-logout during payment verification
            throw error;
        }
    }

    // Main request method
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            params = null,
            requiresAuth = true,
            isFormData = false,
            retryOnAuthFailure = true
        } = options;

        // Build URL with query parameters
        let url = `${this.baseURL}${endpoint}`;
        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url += `?${queryString}`;
        }

        // Build request config
        const config = {
            method,
            headers: this.buildHeaders(requiresAuth, isFormData)
        };

        // Add body for POST/PUT/PATCH
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            config.body = isFormData ? data : JSON.stringify(data);
        }

        try {
            // Make the request
            const response = await fetch(url, config);

            // Handle 401 (Unauthorized) - Try to refresh token
            if (response.status === 401 && requiresAuth && retryOnAuthFailure) {
                try {
                    await this.refreshAccessToken();
                    // Retry the request with new token
                    return this.request(endpoint, { ...options, retryOnAuthFailure: false });
                } catch (refreshError) {
                    console.error('Token refresh failed, clearing tokens');
                    // Only logout and redirect for non-payment pages
                    // Check if user is on payment-related page
                    const currentPath = window.location.pathname;
                    const isPaymentPage = currentPath.includes('purchase') || 
                                         window.location.search.includes('payment=success');
                    
                    if (!isPaymentPage) {
                        // Clear tokens and redirect to login
                        this.clearTokens();
                        window.location.href = '/templates/login.html';
                    }
                    throw refreshError;
                }
            }

            // Parse response
            const contentType = response.headers.get('content-type');
            let responseData = null;
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Handle non-OK responses
            if (!response.ok) {
                throw {
                    status: response.status,
                    message: responseData.detail || responseData.message || 'Request failed',
                    errors: responseData,
                    response
                };
            }

            return responseData;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Convenience methods
    async get(endpoint, params = null, requiresAuth = true) {
        return this.request(endpoint, { method: 'GET', params, requiresAuth });
    }

    async post(endpoint, data, requiresAuth = true, isFormData = false) {
        return this.request(endpoint, { method: 'POST', data, requiresAuth, isFormData });
    }

    async put(endpoint, data, requiresAuth = true, isFormData = false) {
        return this.request(endpoint, { method: 'PUT', data, requiresAuth, isFormData });
    }

    async patch(endpoint, data, requiresAuth = true, isFormData = false) {
        return this.request(endpoint, { method: 'PATCH', data, requiresAuth, isFormData });
    }

    async delete(endpoint, requiresAuth = true) {
        return this.request(endpoint, { method: 'DELETE', requiresAuth });
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getAccessToken();
    }

    // Redirect to login if not authenticated
    requireAuth(redirectUrl = '/templates/login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Create global API instance
window.api = new APIHandler();

// Export for use in other files (Node/CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIHandler, api: window.api };
}
