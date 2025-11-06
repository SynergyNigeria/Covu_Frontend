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
    
    // Populate contact form (phone only - email cannot be changed)
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) contactPhone.value = user.phone_number || '';
    
    // Check and disable contact form if within 30-day limit
    checkContactUpdateEligibility(user);
    
    // Populate location form
    const stateInput = document.getElementById('state');
    if (stateInput) {
        stateInput.value = user.state || '';
        // Populate LGAs for the user's current state
        if (user.state) {
            populateLGAsForCurrentState(user.state, user.city);
        }
    }
    
    // Check and disable location form if within 30-day limit
    checkLocationUpdateEligibility(user);
    
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

function handleStateChange(e) {
    const selectedState = e.target.value;
    const citySelect = document.getElementById('city');
    
    if (!citySelect) return;
    
    // Clear existing options
    citySelect.innerHTML = '<option value="">Select LGA</option>';
    
    if (!selectedState || !NIGERIA_LGAS[selectedState]) {
        citySelect.disabled = true;
        return;
    }
    
    // Enable LGA dropdown
    citySelect.disabled = false;
    
    // Populate LGAs for selected state
    const lgas = NIGERIA_LGAS[selectedState];
    lgas.forEach(lga => {
        const option = document.createElement('option');
        option.value = lga;
        option.textContent = lga;
        citySelect.appendChild(option);
    });
    
    console.log(`Loaded ${lgas.length} LGAs for ${STATE_DISPLAY_NAMES[selectedState]}`);
}

function populateLGAsForCurrentState(state, currentLGA) {
    const citySelect = document.getElementById('city');
    
    if (!citySelect || !state) return;
    
    // Clear existing options
    citySelect.innerHTML = '<option value="">Select LGA</option>';
    
    if (NIGERIA_LGAS[state]) {
        citySelect.disabled = false;
        const lgas = NIGERIA_LGAS[state];
        
        lgas.forEach(lga => {
            const option = document.createElement('option');
            option.value = lga;
            option.textContent = lga;
            if (lga === currentLGA) {
                option.selected = true;
            }
            citySelect.appendChild(option);
        });
        
        console.log(`Populated ${lgas.length} LGAs for ${STATE_DISPLAY_NAMES[state]}, selected: ${currentLGA}`);
    } else {
        citySelect.disabled = true;
    }
}

function checkContactUpdateEligibility(user) {
    const contactPhone = document.getElementById('contactPhone');
    const contactForm = document.getElementById('contactForm');
    const submitBtn = contactForm?.querySelector('button[type="submit"]');
    
    // Use backend-provided eligibility check
    const canUpdate = user.can_update_contact !== false; // Default to true if not provided
    const daysRemaining = user.contact_update_available_in_days || 0;
    
    if (!canUpdate && daysRemaining > 0) {
        // Disable form and show remaining days
        if (contactPhone) {
            contactPhone.disabled = true;
            contactPhone.classList.add('bg-gray-200', 'cursor-not-allowed');
            contactPhone.classList.remove('bg-gray-50');
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            submitBtn.innerHTML = `Available in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
        }
        
        // Add info message if not already present
        const existingInfo = contactForm?.querySelector('.contact-update-info');
        if (!existingInfo && contactForm) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'contact-update-info bg-yellow-50 border border-yellow-200 rounded-xl p-3 -mt-2';
            infoDiv.innerHTML = `
                <p class="text-xs text-yellow-800">
                    <i data-lucide="clock" class="h-3 w-3 inline"></i>
                    You can update your phone number again in <strong>${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</strong>
                </p>
            `;
            contactForm.insertBefore(infoDiv, submitBtn);
            
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } else {
        // Enable form - 30 days have passed
        enableContactForm();
    }
}

function enableContactForm() {
    const contactPhone = document.getElementById('contactPhone');
    const contactForm = document.getElementById('contactForm');
    const submitBtn = contactForm?.querySelector('button[type="submit"]');
    const infoDiv = contactForm?.querySelector('.contact-update-info');
    
    if (contactPhone) {
        contactPhone.disabled = false;
        contactPhone.classList.remove('bg-gray-200', 'cursor-not-allowed');
        contactPhone.classList.add('bg-gray-50');
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitBtn.textContent = 'Update Phone Number';
    }
    
    if (infoDiv) {
        infoDiv.remove();
    }
}

function checkLocationUpdateEligibility(user) {
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const locationForm = document.getElementById('locationForm');
    const submitBtn = locationForm?.querySelector('button[type="submit"]');
    
    // Use backend-provided eligibility check
    const canUpdate = user.can_update_location !== false; // Default to true if not provided
    const daysRemaining = user.location_update_available_in_days || 0;
    
    if (!canUpdate && daysRemaining > 0) {
        // Disable form and show remaining days
        if (cityInput) {
            cityInput.disabled = true;
            cityInput.classList.add('bg-gray-200', 'cursor-not-allowed');
            cityInput.classList.remove('bg-gray-50');
        }
        
        if (stateInput) {
            stateInput.disabled = true;
            stateInput.classList.add('bg-gray-200', 'cursor-not-allowed');
            stateInput.classList.remove('bg-gray-50');
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            submitBtn.innerHTML = `🔒 Available in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
        }
        
        // Update the info message to show remaining days
        const infoDiv = locationForm?.querySelector('.bg-blue-50');
        if (infoDiv) {
            infoDiv.className = 'bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-2';
            infoDiv.innerHTML = `
                <p class="text-xs text-yellow-800">
                    <i data-lucide="clock" class="h-3 w-3 inline"></i>
                    You can update your location again in <strong>${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</strong>
                </p>
            `;
            
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } else {
        // Enable form - 30 days have passed
        enableLocationForm();
    }
}

function enableLocationForm() {
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const locationForm = document.getElementById('locationForm');
    const submitBtn = locationForm?.querySelector('button[type="submit"]');
    
    if (cityInput) {
        cityInput.disabled = false;
        cityInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
        cityInput.classList.add('bg-gray-50');
    }
    
    if (stateInput) {
        stateInput.disabled = false;
        stateInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
        stateInput.classList.add('bg-gray-50');
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitBtn.textContent = 'Update Location';
    }
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
    
    // State/LGA dropdown handler
    const stateSelect = document.getElementById('state');
    if (stateSelect) stateSelect.addEventListener('change', handleStateChange);
    
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
    

}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    // Validation
    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword.value !== confirmPassword.value) {
        showToast('New passwords do not match', 'error');
        confirmPassword.focus();
        return;
    }
    
    if (newPassword.value.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        newPassword.focus();
        return;
    }
    
    if (currentPassword.value === newPassword.value) {
        showToast('New password must be different from current password', 'error');
        newPassword.focus();
        return;
    }
    
    try {
        showButtonLoading(e.submitter);
        
        const response = await api.post(API_CONFIG.ENDPOINTS.PASSWORD_CHANGE, {
            old_password: currentPassword.value,
            new_password: newPassword.value,
            new_password_confirm: confirmPassword.value
        });
        
        console.log('Password change response:', response);
        
        if (response.success || response.message) {
            showToast('✓ Password changed successfully! Logging you out...', 'success');
            e.target.reset();
            // Logout after 2 seconds to allow user to read the message
            setTimeout(() => handleLogout(), 2000);
        } else {
            throw new Error(response.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        console.log('Full error object:', JSON.stringify(error, null, 2));
        
        // Handle specific error types with helpful messages
        let errorMsg = 'Failed to change password';
        
        // Check error.errors (from our API handler) or error.response.data
        const errorData = error.errors || error.response?.data || error;
        
        console.log('Error data:', errorData);
        
        // Check for incorrect old password
        if (errorData.old_password) {
            if (Array.isArray(errorData.old_password)) {
                errorMsg = errorData.old_password[0];
            } else {
                errorMsg = errorData.old_password;
            }
            // Make it more user-friendly
            if (errorMsg.includes('incorrect') || errorMsg.includes('wrong')) {
                errorMsg = '🔒 Current password is incorrect. Please try again.';
            }
            currentPassword.focus();
        }
        // Check for new password validation errors
        else if (errorData.new_password) {
            if (Array.isArray(errorData.new_password)) {
                errorMsg = errorData.new_password[0];
            } else {
                errorMsg = errorData.new_password;
            }
            newPassword.focus();
        }
        // Check for validation errors
        else if (errorData.detail) {
            errorMsg = errorData.detail;
        }
        // Check error message directly
        else if (error.message && !error.message.includes('Failed to fetch')) {
            errorMsg = error.message;
        }
        // Generic error with all field errors
        else if (typeof errorData === 'object') {
            const errors = Object.values(errorData).flat().filter(e => typeof e === 'string');
            if (errors.length > 0) {
                errorMsg = errors[0];
            }
        }
        
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
        showToast('Please fill in all location fields (City and State)', 'error');
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
            showToast('Location updated successfully! ✓', 'success');
            
            if (response.user) {
                currentUser = response.user;
                populateProfileData(currentUser);
            } else if (response.data) {
                currentUser = response.data;
                populateProfileData(currentUser);
            }
            
            localStorage.setItem(API_CONFIG.TOKEN_KEYS.USER, JSON.stringify(currentUser));
            
            // Disable the form immediately after successful update
            checkLocationUpdateEligibility(currentUser);
        } else {
            throw new Error('Failed to update location');
        }
    } catch (error) {
        console.error('Error updating location:', error);
        console.log('Full error object:', JSON.stringify(error, null, 2));
        
        // Handle specific error types with helpful messages
        let errorMsg = 'Failed to update location';
        
        // Check error.errors (from our API handler) or error.response.data (from other sources)
        const errorData = error.errors || error.response?.data || error;
        
        console.log('Error data:', errorData);
        
        // Check for rate limiting (30-day restriction)
        if (errorData.error && typeof errorData.error === 'string' && errorData.error.includes('30 days')) {
            errorMsg = errorData.error;
        }
        // Check for specific field errors
        else if (errorData.city || errorData.state) {
            const cityError = errorData.city ? (Array.isArray(errorData.city) ? errorData.city[0] : errorData.city) : '';
            const stateError = errorData.state ? (Array.isArray(errorData.state) ? errorData.state[0] : errorData.state) : '';
            errorMsg = cityError || stateError || errorMsg;
        }
        // Check for validation errors
        else if (errorData.detail) {
            errorMsg = errorData.detail;
        }
        // Check error message directly
        else if (error.message && !error.message.includes('Failed to fetch')) {
            errorMsg = error.message;
        }
        // Generic error with all field errors
        else if (typeof errorData === 'object') {
            const errors = Object.values(errorData).flat().filter(e => typeof e === 'string');
            if (errors.length > 0) {
                errorMsg = errors[0];
            }
        }
        
        showToast(errorMsg, 'error');
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
            showToast('Phone number updated successfully! ✓', 'success');
            
            if (response.user) {
                currentUser = response.user;
                populateProfileData(currentUser);
            } else if (response.data) {
                currentUser = response.data;
                populateProfileData(currentUser);
            }
            
            localStorage.setItem(API_CONFIG.TOKEN_KEYS.USER, JSON.stringify(currentUser));
            
            // Disable the form immediately after successful update
            checkContactUpdateEligibility(currentUser);
        } else {
            throw new Error('Failed to update phone number');
        }
    } catch (error) {
        console.error('Error updating contact:', error);
        console.log('Full error object:', JSON.stringify(error, null, 2));
        
        // Handle specific error types with helpful messages
        let errorMsg = 'Failed to update phone number';
        
        // Check error.errors (from our API handler) or error.response.data (from other sources)
        const errorData = error.errors || error.response?.data || error;
        
        console.log('Error data:', errorData);
        
        // Check for rate limiting (30-day restriction)
        if (errorData.error && typeof errorData.error === 'string' && errorData.error.includes('30 days')) {
            errorMsg = errorData.error;
        }
        // Check for duplicate phone number
        else if (errorData.phone_number) {
            if (Array.isArray(errorData.phone_number)) {
                errorMsg = errorData.phone_number[0];
            } else {
                errorMsg = errorData.phone_number;
            }
            // Make duplicate error more user-friendly
            if (errorMsg.includes('already') || errorMsg.includes('exists') || errorMsg.includes('use')) {
                errorMsg = '⚠️ This phone number is already registered by another user. Please use a different number.';
            }
        }
        // Check for validation errors
        else if (errorData.detail) {
            errorMsg = errorData.detail;
        }
        // Check error message directly
        else if (error.message && !error.message.includes('Failed to fetch')) {
            errorMsg = error.message;
        }
        // Generic error with all field errors
        else if (typeof errorData === 'object') {
            const errors = Object.values(errorData).flat().filter(e => typeof e === 'string');
            if (errors.length > 0) {
                errorMsg = errors[0];
                // Check if it's a duplicate error
                if (errorMsg.includes('already') || errorMsg.includes('exists') || errorMsg.includes('use')) {
                    errorMsg = '⚠️ This phone number is already registered by another user. Please use a different number.';
                }
            }
        }
        
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

// Help and Report Modal Functions are now in complaints.js

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
    
    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        info: 'info'
    };
    
    // Update icon based on type
    const iconElement = toast.querySelector('[data-lucide]');
    if (iconElement) {
        iconElement.setAttribute('data-lucide', icons[type] || icons.success);
    }
    
    // Make max-width larger for error messages (they tend to be longer)
    const maxWidth = type === 'error' ? 'max-w-lg' : 'max-w-sm';
    
    toast.className = `fixed top-4 right-4 text-white px-5 py-4 rounded-xl shadow-2xl z-50 ${maxWidth} ${colors[type] || colors.success}`;
    toast.classList.remove('hidden');
    
    // Initialize Lucide icons safely
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Show longer for error messages
    const duration = type === 'error' ? 6000 : 4000;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// All report/complaint handling is now in complaints.js with smart features
