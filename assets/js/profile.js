// ========================================
// PROFILE PAGE - BACKEND INTEGRATION
// Complete Working Code - Copy this to profile.js
// ========================================

let currentUser = null;
let userStores = [];
let userOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize Lucide icons safely
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    await loadUserProfile();
    await Promise.all([loadUserStores(), loadUserOrders()]);
    setupEventListeners();
});

async function loadUserProfile() {
    try {
        showLoadingState();
        const response = await api.get(API_CONFIG.ENDPOINTS.PROFILE);
        console.log('Profile response:', response);
        
        if (response && (response.id || response.email)) {
            currentUser = response;
        } else if (response.success && response.data) {
            currentUser = response.data;
        } else if (response.user) {
            currentUser = response.user;
        } else {
            throw new Error('Invalid profile response');
        }
        
        console.log('Current user:', currentUser);
        populateProfileData(currentUser);
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile data', 'error');
        const storedUser = localStorage.getItem(API_CONFIG.TOKEN_KEYS.USER);
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                populateProfileData(currentUser);
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }
    } finally {
        hideLoadingState();
    }
}

function populateProfileData(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPhone = document.getElementById('userPhone');
    
    if (userName) userName.textContent = user.full_name || 'User';
    if (userEmail) {
        userEmail.innerHTML = `<i data-lucide="mail" class="h-4 w-4"></i> ${user.email || 'No email'}`;
    }
    if (userPhone) {
        userPhone.innerHTML = `<i data-lucide="phone" class="h-4 w-4"></i> ${user.phone_number || 'No phone'}`;
    }
    
    updateQuickStats(user);
    
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    if (contactEmail) contactEmail.value = user.email || '';
    if (contactPhone) contactPhone.value = user.phone_number || '';
    
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    if (cityInput) cityInput.value = user.city || '';
    if (stateInput) stateInput.value = user.state || '';
    
    // Initialize Lucide icons safely
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updateQuickStats(user) {
    // Update wallet balance
    const walletBalance = document.getElementById('walletBalance');
    const orderCount = document.getElementById('orderCount');
    const storeRating = document.getElementById('storeRating');
    
    if (walletBalance) {
        const balance = parseFloat(user.wallet_balance || 0);
        walletBalance.textContent = formatCurrency(balance);
    }
    
    if (orderCount) {
        orderCount.textContent = userOrders.length || 0;
    }
    
    if (storeRating) {
        // For now, show 0.0 until we have rating data
        // This will be updated when we fetch store ratings from backend
        storeRating.textContent = '0.0';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(amount);
}

async function loadUserStores() {
    if (!currentUser || !currentUser.is_seller) {
        updateShopStatus(false, null);
        return;
    }
    
    try {
        const response = await api.get(API_CONFIG.ENDPOINTS.STORES);
        console.log('Stores response:', response);
        
        let stores = [];
        if (response.success && response.data && response.data.results) {
            stores = response.data.results;
        } else if (response.results) {
            stores = response.results;
        } else if (Array.isArray(response)) {
            stores = response;
        }
        
        userStores = stores.filter(store => store.seller_id === currentUser.id || store.seller === currentUser.id);
        console.log('User stores:', userStores);
        
        if (userStores.length > 0) {
            updateShopStatus(true, userStores[0]);
        } else {
            // If user is a seller but we can't find their store, 
            // still show "View My Store" because they should have one
            updateShopStatus(false, null);
        }
    } catch (error) {
        console.error('Error loading stores:', error);
        // If user is a seller but we can't load stores,
        // still show "View My Store" because they should have one
        updateShopStatus(false, null);
    }
}

function updateShopStatus(hasStore, store) {
    const shopStatus = document.getElementById('shopStatus');
    const shopActionBtn = document.getElementById('shopActionBtn');
    
    if (!shopStatus || !shopActionBtn) return;
    
    if (hasStore && store) {
        // User has a store - show store info and "View Shop" button
        shopStatus.textContent = `Active: ${store.name}`;
        shopActionBtn.textContent = 'View Shop';
        shopActionBtn.className = 'px-6 py-2 bg-primary-green text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5';
        shopActionBtn.onclick = () => {
            window.location.href = `shop.html?store_id=${store.id}`;
        };
    } else if (currentUser && currentUser.is_seller) {
        // User is a seller but store data hasn't loaded yet - show "View My Store" button
        shopStatus.textContent = 'Active Seller';
        shopActionBtn.textContent = 'View My Store';
        shopActionBtn.className = 'px-6 py-2 bg-primary-green text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5';
        shopActionBtn.onclick = () => {
            // Navigate to shop page - the backend will find the seller's store
            window.location.href = 'shop.html';
        };
    } else {
        // User is not a seller - show "Become a Seller" button
        shopStatus.textContent = 'Not a seller';
        shopActionBtn.textContent = 'Become a Seller';
        shopActionBtn.className = 'px-6 py-2 bg-primary-orange text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5';
        shopActionBtn.onclick = () => {
            handleBecomeSellerClick();
        };
    }
}

async function loadUserOrders() {
    try {
        const response = await api.get(API_CONFIG.ENDPOINTS.ORDERS);
        console.log('Orders response:', response);
        
        if (response.success && response.data && response.data.results) {
            userOrders = response.data.results;
        } else if (response.results) {
            userOrders = response.results;
        } else if (Array.isArray(response)) {
            userOrders = response;
        } else {
            userOrders = [];
        }
        
        console.log('User orders:', userOrders);
    } catch (error) {
        console.error('Error loading orders:', error);
        userOrders = [];
    }
}

function setupEventListeners() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) passwordForm.addEventListener('submit', handlePasswordUpdate);
    
    const locationForm = document.getElementById('locationForm');
    if (locationForm) locationForm.addEventListener('submit', handleLocationUpdate);
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) contactForm.addEventListener('submit', handleContactUpdate);
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Help Modal Event Listeners
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) helpBtn.addEventListener('click', showHelpModal);
    
    const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');
    if (closeHelpModalBtn) closeHelpModalBtn.addEventListener('click', hideHelpModal);
    
    // Become Seller Modal Event Listeners
    const cancelBecomeSellerBtn = document.getElementById('cancelBecomeSellerBtn');
    if (cancelBecomeSellerBtn) cancelBecomeSellerBtn.addEventListener('click', hideBecomeSellerModal);
    
    const confirmBecomeSellerBtn = document.getElementById('confirmBecomeSellerBtn');
    if (confirmBecomeSellerBtn) confirmBecomeSellerBtn.addEventListener('click', confirmBecomeSellerAction);
    
    // Success Modal Event Listeners
    const exploreMarketplaceBtn = document.getElementById('exploreMarketplaceBtn');
    if (exploreMarketplaceBtn) {
        exploreMarketplaceBtn.addEventListener('click', () => {
            hideSellerSuccessModal();
            window.location.href = 'shop.html';
        });
    }
    
    const viewMyStoreBtn = document.getElementById('viewMyStoreBtn');
    if (viewMyStoreBtn) {
        viewMyStoreBtn.addEventListener('click', () => {
            hideSellerSuccessModal();
            // Navigate to the user's store page
            if (userStores.length > 0) {
                window.location.href = `shop.html?store_id=${userStores[0].id}`;
            } else {
                showToast('Store not found. Please refresh the page.', 'error');
            }
        });
    }
    
    // Close modals when clicking outside
    const becomeSellerModal = document.getElementById('becomeSellerModal');
    if (becomeSellerModal) {
        becomeSellerModal.addEventListener('click', (e) => {
            if (e.target === becomeSellerModal) {
                hideBecomeSellerModal();
            }
        });
    }
    
    const sellerSuccessModal = document.getElementById('sellerSuccessModal');
    if (sellerSuccessModal) {
        sellerSuccessModal.addEventListener('click', (e) => {
            if (e.target === sellerSuccessModal) {
                hideSellerSuccessModal();
            }
        });
    }
    
    // Help Modal click outside to close
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                hideHelpModal();
            }
        });
    }
    
    // Report Modal Event Listeners
    const reportSellerForm = document.getElementById('reportSellerForm');
    if (reportSellerForm) reportSellerForm.addEventListener('submit', handleReportSellerSubmit);
    
    const closeReportSellerModalBtn = document.getElementById('closeReportSellerModalBtn');
    if (closeReportSellerModalBtn) closeReportSellerModalBtn.addEventListener('click', hideReportSellerModal);
    
    const reportSellerModal = document.getElementById('reportSellerModal');
    if (reportSellerModal) {
        reportSellerModal.addEventListener('click', (e) => {
            if (e.target === reportSellerModal) {
                hideReportSellerModal();
            }
        });
    }
    
    const reportBuyerForm = document.getElementById('reportBuyerForm');
    if (reportBuyerForm) reportBuyerForm.addEventListener('submit', handleReportBuyerSubmit);
    
    const closeReportBuyerModalBtn = document.getElementById('closeReportBuyerModalBtn');
    if (closeReportBuyerModalBtn) closeReportBuyerModalBtn.addEventListener('click', hideReportBuyerModal);
    
    const reportBuyerModal = document.getElementById('reportBuyerModal');
    if (reportBuyerModal) {
        reportBuyerModal.addEventListener('click', (e) => {
            if (e.target === reportBuyerModal) {
                hideReportBuyerModal();
            }
        });
    }
    
    const reportProductForm = document.getElementById('reportProductForm');
    if (reportProductForm) reportProductForm.addEventListener('submit', handleReportProductSubmit);
    
    const closeReportProductModalBtn = document.getElementById('closeReportProductModalBtn');
    if (closeReportProductModalBtn) closeReportProductModalBtn.addEventListener('click', hideReportProductModal);
    
    const reportProductModal = document.getElementById('reportProductModal');
    if (reportProductModal) {
        reportProductModal.addEventListener('click', (e) => {
            if (e.target === reportProductModal) {
                hideReportProductModal();
            }
        });
    }
    
    const reportTransactionForm = document.getElementById('reportTransactionForm');
    if (reportTransactionForm) reportTransactionForm.addEventListener('submit', handleReportTransactionSubmit);
    
    const closeReportTransactionModalBtn = document.getElementById('closeReportTransactionModalBtn');
    if (closeReportTransactionModalBtn) closeReportTransactionModalBtn.addEventListener('click', hideReportTransactionModal);
    
    const reportTransactionModal = document.getElementById('reportTransactionModal');
    if (reportTransactionModal) {
        reportTransactionModal.addEventListener('click', (e) => {
            if (e.target === reportTransactionModal) {
                hideReportTransactionModal();
            }
        });
    }
}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword.value !== confirmPassword.value) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.value.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
    }
    
    try {
        showButtonLoading(e.submitter);
        
        const response = await api.post('/auth/password/change/', {
            old_password: currentPassword.value,
            new_password: newPassword.value,
            new_password_confirm: confirmPassword.value
        });
        
        console.log('Password change response:', response);
        
        if (response.success || response.message) {
            showToast('Password updated successfully! Please login again.', 'success');
            e.target.reset();
            setTimeout(() => handleLogout(), 2000);
        } else {
            throw new Error(response.message || 'Failed to update password');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        const errorMsg = error.response?.data?.old_password?.[0] || 
                        error.response?.data?.new_password?.[0] ||
                        error.message || 
                        'Failed to update password';
        showToast(errorMsg, 'error');
    } finally {
        hideButtonLoading(e.submitter);
    }
}

async function handleLocationUpdate(e) {
    e.preventDefault();
    
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    
    if (!city || !state) {
        showToast('Please fill in all location fields', 'error');
        return;
    }
    
    try {
        showButtonLoading(e.submitter);
        
        const response = await api.patch(API_CONFIG.ENDPOINTS.PROFILE, {
            city: city,
            state: state
        });
        
        console.log('Location update response:', response);
        
        if (response.success || response.message || response.user) {
            showToast('Location updated successfully!', 'success');
            
            if (response.user) {
                currentUser = response.user;
                populateProfileData(currentUser);
            } else if (response.data) {
                currentUser = response.data;
                populateProfileData(currentUser);
            }
            
            localStorage.setItem(API_CONFIG.TOKEN_KEYS.USER, JSON.stringify(currentUser));
        } else {
            throw new Error('Failed to update location');
        }
    } catch (error) {
        console.error('Error updating location:', error);
        showToast(error.message || 'Failed to update location', 'error');
    } finally {
        hideButtonLoading(e.submitter);
    }
}

async function handleContactUpdate(e) {
    e.preventDefault();
    
    const phone = document.getElementById('contactPhone').value.trim();
    
    if (!phone) {
        showToast('Please enter a phone number', 'error');
        return;
    }
    
    try {
        showButtonLoading(e.submitter);
        
        const response = await api.patch(API_CONFIG.ENDPOINTS.PROFILE, {
            phone_number: phone
        });
        
        console.log('Contact update response:', response);
        
        if (response.success || response.message || response.user) {
            showToast('Contact information updated successfully!', 'success');
            
            if (response.user) {
                currentUser = response.user;
                populateProfileData(currentUser);
            } else if (response.data) {
                currentUser = response.data;
                populateProfileData(currentUser);
            }
            
            localStorage.setItem(API_CONFIG.TOKEN_KEYS.USER, JSON.stringify(currentUser));
        } else {
            throw new Error('Failed to update contact information');
        }
    } catch (error) {
        console.error('Error updating contact:', error);
        const errorMsg = error.response?.data?.phone_number?.[0] || 
                        error.message || 
                        'Failed to update contact information';
        showToast(errorMsg, 'error');
    } finally {
        hideButtonLoading(e.submitter);
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem(API_CONFIG.TOKEN_KEYS.ACCESS);
        localStorage.removeItem(API_CONFIG.TOKEN_KEYS.REFRESH);
        localStorage.removeItem(API_CONFIG.TOKEN_KEYS.USER);
        showToast('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

async function handleBecomeSellerClick() {
    // Show the become seller modal
    showBecomeSellerModal();
}

function showBecomeSellerModal() {
    const modal = document.getElementById('becomeSellerModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Re-initialize icons for the modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideBecomeSellerModal() {
    const modal = document.getElementById('becomeSellerModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

function showSellerSuccessModal() {
    const modal = document.getElementById('sellerSuccessModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Re-initialize icons for the modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideSellerSuccessModal() {
    const modal = document.getElementById('sellerSuccessModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

function showHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Re-initialize icons for the modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Report Modal Functions
function showReportSellerModal() {
    const modal = document.getElementById('reportSellerModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideReportSellerModal() {
    const modal = document.getElementById('reportSellerModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showReportBuyerModal() {
    const modal = document.getElementById('reportBuyerModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideReportBuyerModal() {
    const modal = document.getElementById('reportBuyerModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showReportProductModal() {
    const modal = document.getElementById('reportProductModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideReportProductModal() {
    const modal = document.getElementById('reportProductModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showReportTransactionModal() {
    const modal = document.getElementById('reportTransactionModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideReportTransactionModal() {
    const modal = document.getElementById('reportTransactionModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function confirmBecomeSellerAction() {
    try {
        // Hide the confirmation modal first
        hideBecomeSellerModal();
        
        // Get the shop action button to show loading state
        const shopActionBtn = document.getElementById('shopActionBtn');
        showButtonLoading(shopActionBtn);
        
        // Call the become seller API
        const response = await api.post(API_CONFIG.ENDPOINTS.BECOME_SELLER, {});
        
        console.log('Become seller response:', response);
        
        if (response.success || response.message) {
            // Update current user data
            if (response.user) {
                currentUser = response.user;
                localStorage.setItem(API_CONFIG.TOKEN_KEYS.USER, JSON.stringify(currentUser));
            }
            
            // Update userStores with the new store
            if (response.store) {
                userStores = [response.store]; // Add the new store to the array
                console.log('New store created:', response.store);
            }
            
            // Update the UI to reflect seller status and store immediately
            populateProfileData(currentUser);
            updateShopStatus(userStores.length > 0, userStores[0]); // Show store info
            
            // Show professional success modal
            showSellerSuccessModal();
            
        } else {
            throw new Error(response.message || 'Failed to activate seller status');
        }
        
    } catch (error) {
        console.error('Error becoming seller:', error);
        showToast(
            error.message || 'Failed to activate seller status. Please try again.',
            'error'
        );
    } finally {
        // Hide loading state
        const shopActionBtn = document.getElementById('shopActionBtn');
        hideButtonLoading(shopActionBtn);
    }
}

function showLoadingState() {
    const userName = document.getElementById('userName');
    if (userName) userName.textContent = 'Loading...';
}

function hideLoadingState() {}

function showButtonLoading(button) {
    if (!button) return;
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `<div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Processing...</span></div>`;
}

function hideButtonLoading(button) {
    if (!button) return;
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    const colors = {
        success: 'bg-primary-green',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    toast.className = `fixed top-4 right-4 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm ${colors[type] || colors.success}`;
    toast.classList.remove('hidden');
    
    // Initialize Lucide icons safely
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Report Submit Handlers
async function handleReportSellerSubmit(e) {
    e.preventDefault();
    
    const sellerName = document.getElementById('sellerName').value.trim();
    const issue = document.getElementById('sellerIssue').value.trim();
    
    if (!sellerName || !issue) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Here, in a real app, you would send the report to the backend
    // For now, just show success message
    showToast('Your report has been received and will be looked at. You will get an email notification via result or phone call from our service help staff.', 'success');
    
    hideReportSellerModal();
    e.target.reset();
}

async function handleReportBuyerSubmit(e) {
    e.preventDefault();
    
    const buyerName = document.getElementById('buyerName').value.trim();
    const issue = document.getElementById('buyerIssue').value.trim();
    
    if (!buyerName || !issue) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Here, in a real app, you would send the report to the backend
    showToast('Your report has been received and will be looked at. You will get an email notification via result or phone call from our service help staff.', 'success');
    
    hideReportBuyerModal();
    e.target.reset();
}

async function handleReportProductSubmit(e) {
    e.preventDefault();
    
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const issue = document.getElementById('orderIssue').value.trim();
    
    if (!orderNumber || !issue) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Here, in a real app, you would send the report to the backend
    showToast('Your report has been received and will be looked at. You will get an email notification via result or phone call from our service help staff.', 'success');
    
    hideReportProductModal();
    e.target.reset();
}

async function handleReportTransactionSubmit(e) {
    e.preventDefault();
    
    const transactionType = document.getElementById('transactionType').value;
    const transactionId = document.getElementById('transactionId').value.trim();
    const issue = document.getElementById('transactionIssue').value.trim();
    
    if (!transactionType || !transactionId || !issue) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Here, in a real app, you would send the report to the backend
    showToast('Your report has been received and will be looked at. You will get an email notification via result or phone call from our service help staff.', 'success');
    
    hideReportTransactionModal();
    e.target.reset();
}
