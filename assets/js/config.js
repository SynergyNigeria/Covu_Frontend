// API Configuration for Covu Fashion Marketplace
// This file contains all API endpoints and configuration settings

const API_CONFIG = {
    // Base URL - Update for production
    BASE_URL: 'https://covu.onrender.com/api',
    
    // Endpoints
    ENDPOINTS: {
        // Authentication
        LOGIN: '/auth/login/',
        REGISTER: '/auth/register/',
        REFRESH_TOKEN: '/auth/token/refresh/',
        PROFILE: '/auth/profile/',
        PASSWORD_CHANGE: '/auth/password/change/',
        BECOME_SELLER: '/auth/become-seller/',
        
        // Stores
        STORES: '/stores/',
        STORE_DETAIL: (id) => `/stores/${id}/`,
        STORE_PRODUCTS: (id) => `/stores/${id}/products/`,
        MY_STORES: '/stores/my_stores/',
        
        // Products
        PRODUCTS: '/products/',
        PRODUCT_DETAIL: (id) => `/products/${id}/`,
        MY_PRODUCTS: '/products/my_products/',
        
        // Orders
        ORDERS: '/orders/',
        ORDER_DETAIL: (id) => `/orders/${id}/`,
        ORDER_ACCEPT: (id) => `/orders/${id}/accept/`,
        ORDER_DELIVER: (id) => `/orders/${id}/deliver/`,
        ORDER_CONFIRM: (id) => `/orders/${id}/confirm/`,
        ORDER_CANCEL: (id) => `/orders/${id}/cancel/`,
        
        // Wallet
        WALLET_FUND: '/wallet/fund/',
        WALLET_VERIFY: '/wallet/verify-payment/',
        WALLET_TRANSACTIONS: '/wallet/transactions/',
        WALLET_WITHDRAW: '/wallet/withdraw/',
        
        // Ratings
        RATE_STORE: (id) => `/stores/${id}/rate/`,
        RATE_PRODUCT: (id) => `/products/${id}/rate/`,
    },
    
    // Token keys for localStorage
    TOKEN_KEYS: {
        ACCESS: 'access_token',
        REFRESH: 'refresh_token',
        USER: 'current_user'
    },
    
    // Request timeouts
    TIMEOUT: 30000, // 30 seconds
    
    // Infinite Scroll Settings
    PAGE_SIZE: 20,              // Items per API call
    SCROLL_THRESHOLD: 200       // Pixels from bottom to trigger load
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
