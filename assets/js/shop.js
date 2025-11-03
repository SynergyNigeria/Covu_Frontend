// Shop Management JavaScript - Backend Integration

// Global variables
let currentUser = null;
let currentStore = null;
let storeStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    storeRating: 0.0
};

// Track newly uploaded images (not yet saved to database)
let pendingLogoUpload = null;
let pendingSellerPhotoUpload = null;

// Initialize API handler
// let api = null;

// Wait for API to be available and fully initialized
function waitForAPI() {
    return new Promise((resolve) => {
        const checkAPI = () => {
            if (typeof APIHandler !== 'undefined' && APIHandler) {
                // Initialize the API handler if not already done
                if (!api) {
                    api = new APIHandler();
                }
                resolve();
            } else {
                setTimeout(checkAPI, 100);
            }
        };
        checkAPI();
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    // Delivery Modal: X and Cancel buttons
    const closeDeliveryModal = document.getElementById('closeDeliveryModal');
    const cancelDelivery = document.getElementById('cancelDelivery');
    if (closeDeliveryModal) {
        closeDeliveryModal.addEventListener('click', closeAllModals);
    }
    if (cancelDelivery) {
        cancelDelivery.addEventListener('click', closeAllModals);
    }

    // Store Modal: X and Cancel buttons
    // (These are already handled below, but ensure they are set after DOMContentLoaded)
    // Initialize Lucide icons
    lucide.createIcons();

    // Wait for API to be available
    await waitForAPI();
    
    // Check authentication and load store data
    await initializeShop();

    // Quick Actions Menu Toggle
    const quickActionsBtn = document.getElementById('quickActionsBtn');
    const quickActionsMenu = document.getElementById('quickActionsMenu');

    if (quickActionsBtn && quickActionsMenu) {
        quickActionsBtn.addEventListener('click', function() {
            const isHidden = quickActionsMenu.classList.contains('hidden');

            if (isHidden) {
                quickActionsMenu.classList.remove('hidden');
                setTimeout(() => {
                    quickActionsMenu.classList.remove('translate-y-full', 'opacity-0');
                }, 10);
            } else {
                quickActionsMenu.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => {
                    quickActionsMenu.classList.add('hidden');
                }, 300);
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!quickActionsBtn.contains(event.target) && !quickActionsMenu.contains(event.target)) {
                quickActionsMenu.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => {
                    quickActionsMenu.classList.add('hidden');
                }, 300);
            }
        });
    }

    // Quick Actions Functionality
    const quickViewProducts = document.getElementById('quickViewProducts');
    const quickAddProduct = document.getElementById('quickAddProduct');
    const quickEditStore = document.getElementById('quickEditStore');
    const withdrawBtn = document.getElementById('withdrawBtn');

    if (quickViewProducts) {
        quickViewProducts.addEventListener('click', function() {
            // Navigate to seller gallery page with store ID
            if (currentStore && currentStore.id) {
                window.location.href = `seller-gallery.html?store_id=${currentStore.id}`;
            } else {
                window.location.href = 'seller-gallery.html';
            }
            closeQuickActionsMenu();
        });
    }

    if (quickAddProduct) {
        quickAddProduct.addEventListener('click', function() {
            showToast('Add Product feature coming soon!', 'info');
            closeQuickActionsMenu();
        });
    }

    if (quickEditStore) {
        quickEditStore.addEventListener('click', function() {
            openStoreConfigModal('store');
            closeQuickActionsMenu();
        });
    }

    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            openWithdrawalModal();
        });
    }

    function closeQuickActionsMenu() {
        if (quickActionsMenu) {
            quickActionsMenu.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                quickActionsMenu.classList.add('hidden');
            }, 300);
        }
    }

    // Store Configuration Modal Functionality
    function openStoreConfigModal(type) {
        // Close any open modals first
        closeAllModals();

        // Open the specific modal
        if (type === 'delivery') {
            openDeliveryModal();
            // Attach submit handler (ensure only one listener)
            const deliveryForm = document.getElementById('deliveryForm');
            if (deliveryForm) {
                deliveryForm.removeEventListener('submit', handleDeliverySubmit);
                deliveryForm.addEventListener('submit', handleDeliverySubmit);
            }
        } else if (type === 'contact') {
            openContactModal();
        } else if (type === 'store') {
            openStoreModal();
        }
    }

    function openDeliveryModal() {
        const modal = document.getElementById('deliveryModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Load current values
            loadDeliveryData();

            // Re-render icons
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }

    function openContactModal() {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Load current values
            loadContactData();

            // Re-render icons
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }

    async function openStoreModal() {
        const modal = document.getElementById('storeModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Load current values
            loadStoreDetailsData();

            // Re-render icons for upload buttons
            setTimeout(() => {
                lucide.createIcons();
            }, 100);

            // Fetch and update store ratings and user rating for this store
            try {
                if (!currentStore || !currentStore.id) {
                    console.debug('[StoreModal] No currentStore or missing id');
                    return;
                }
                // Fetch store stats (average rating, total ratings)
                const stats = await api.get(`/ratings/store/${currentStore.id}/stats/`);
                console.debug('[StoreModal] Store stats API response:', stats);
                // Fetch user's ratings for this store
                const myRatingsResp = await api.get(`/ratings/my-ratings/`);
                console.debug('[StoreModal] My ratings API response:', myRatingsResp);
                let myStoreRatings = [];
                if (myRatingsResp && myRatingsResp.results) {
                    myStoreRatings = myRatingsResp.results.filter(r => r.product_name && currentStore.name && r.product_name.includes(currentStore.name));
                }
                console.debug('[StoreModal] Filtered myStoreRatings:', myStoreRatings);

                // Update stars and review count
                const starsEl = document.getElementById('modalStoreStars');
                const ratingEl = document.getElementById('modalStoreRating');
                if (starsEl && stats.average_rating !== undefined) {
                    const avg = parseFloat(stats.average_rating);
                    console.debug('[StoreModal] Calculated avg:', avg);
                    let starsHtml = '';
                    for (let i = 1; i <= 5; i++) {
                        if (avg >= i) {
                            starsHtml += `<i data-lucide="star" class="h-5 w-5 text-yellow-400"></i>`;
                        } else if (avg > i - 1 && avg < i) {
                            starsHtml += `<i data-lucide="star-half" class="h-5 w-5 text-yellow-400"></i>`;
                        } else {
                            starsHtml += `<i data-lucide="star" class="h-5 w-5 text-gray-300"></i>`;
                        }
                    }
                    starsEl.innerHTML = starsHtml;
                    console.debug('[StoreModal] Rendered starsHtml:', starsHtml);
                } else {
                    console.debug('[StoreModal] starsEl missing or stats.average_rating undefined', starsEl, stats.average_rating);
                }
                if (ratingEl && stats.average_rating !== undefined) {
                    if (parseFloat(stats.average_rating) > 0) {
                        ratingEl.textContent = stats.average_rating + (stats.total_ratings ? ` (${stats.total_ratings} reviews)` : '');
                    } else {
                        ratingEl.textContent = 'No ratings yet';
                    }
                    console.debug('[StoreModal] Updated ratingEl:', ratingEl.textContent);
                } else {
                    console.debug('[StoreModal] ratingEl missing or stats.average_rating undefined', ratingEl, stats.average_rating);
                }
                // Update rating message
                const ratingMsg = document.getElementById('ratingMessage');
                if (ratingMsg) {
                    if (myStoreRatings.length > 0) {
                        ratingMsg.textContent = `You rated this seller ${myStoreRatings.length} time${myStoreRatings.length > 1 ? 's' : ''}`;
                    } else {
                        ratingMsg.textContent = 'You can rate this store after completing a purchase. Ratings can be submitted from your confirmed orders.';
                    }
                    console.debug('[StoreModal] Updated ratingMsg:', ratingMsg.textContent);
                }
            } catch (err) {
                console.warn('Could not fetch store/user ratings:', err);
            }
        }
    }

    const closeStoreModal = document.getElementById('closeStoreModal');
    const cancelStore = document.getElementById('cancelStore');
    const storeForm = document.getElementById('storeForm');

    if (closeStoreModal) {
        closeStoreModal.addEventListener('click', closeAllModals);
    }
    if (cancelStore) {
        cancelStore.addEventListener('click', closeAllModals);
    }
    if (storeForm) {
        storeForm.addEventListener('submit', handleStoreSubmit);
    }

    const closeWithdrawalModal = document.getElementById('closeWithdrawalModal');
    const cancelWithdrawal = document.getElementById('cancelWithdrawal');
    const withdrawalForm = document.getElementById('withdrawalForm');
    const withdrawalMethod = document.getElementById('withdrawalMethod');
    const withdrawalAmount = document.getElementById('withdrawalAmount');

    if (closeWithdrawalModal) {
        closeWithdrawalModal.addEventListener('click', closeAllModals);
    }
    if (cancelWithdrawal) {
        cancelWithdrawal.addEventListener('click', closeAllModals);
    }
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', handleWithdrawalSubmit);
    }
    if (withdrawalMethod) {
        withdrawalMethod.addEventListener('change', handlePaymentMethodChange);
    }
    if (withdrawalAmount) {
        withdrawalAmount.addEventListener('input', updateWithdrawalSummary);
    }

    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const modals = ['deliveryModal', 'contactModal', 'storeModal', 'withdrawalModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && event.target === modal) {
                closeAllModals();
            }
        });
    });

    // Toast Notification System
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform translate-x-full transition-all duration-300 max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;

        const iconName = type === 'success' ? 'check-circle' :
                        type === 'error' ? 'x-circle' :
                        type === 'warning' ? 'alert-triangle' : 'info';

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="h-5 w-5 flex-shrink-0"></i>
            <span class="text-sm font-medium">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);

        // Re-render icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    // Initialize Shop Data and UI
    async function initializeShop() {
        try {
            showLoadingState();
            
            // Double-check API is available
            if (!api || typeof api.isAuthenticated !== 'function') {
                console.error('API not properly initialized');
                showErrorState('System initialization error. Please refresh the page.');
                return;
            }
            
            // Check if user is authenticated
            if (!api.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }

            // Load user profile
            await loadUserProfile();
            
            // Check if user is a seller
            if (!currentUser || !currentUser.is_seller) {
                showErrorState('You must be a seller to access this page.');
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 3000);
                return;
            }

            // Load user's store
            await loadUserStore();
            
            // Load additional statistics
            await loadStoreStatistics();
            
            // Update UI with loaded data
            updateStoreUI();
            
        } catch (error) {
            console.error('Error initializing shop:', error);
            showToast('Failed to load store data. Please refresh the page.', 'error');
        } finally {
            hideLoadingState();
        }
    }

    async function loadUserProfile() {
        try {
            const response = await apiRequest('GET', API_CONFIG.ENDPOINTS.PROFILE);
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
        } catch (error) {
            console.error('Error loading profile:', error);
            throw error;
        }
    }

    async function loadUserStore() {
        try {
            // First try to get user's stores
            const response = await apiRequest('GET', API_CONFIG.ENDPOINTS.STORES + 'my_stores/');
            console.log('My stores response:', response);
            
            let stores = [];
            if (response.success && response.data && response.data.results) {
                stores = response.data.results;
            } else if (response.results) {
                stores = response.results;
            } else if (Array.isArray(response)) {
                stores = response;
            }
            
            if (stores.length > 0) {
                // Get detailed store info
                currentStore = await loadStoreDetails(stores[0].id);
            } else {
                throw new Error('No store found for user');
            }
            
            console.log('Current store:', currentStore);
        } catch (error) {
            console.error('Error loading user store:', error);
            
            // Fallback: try to get store from general stores list
            try {
                const allStoresResponse = await apiRequest('GET', API_CONFIG.ENDPOINTS.STORES);
                const allStores = allStoresResponse.results || allStoresResponse.data?.results || [];
                // Only match by seller_id or seller (never by name)
                const userStore = allStores.find(store => 
                    store.seller_id === currentUser.id || 
                    store.seller === currentUser.id
                );
                if (userStore) {
                    currentStore = await loadStoreDetails(userStore.id);
                } else {
                    throw new Error('Store not found');
                }
            } catch (fallbackError) {
                console.error('Error in fallback store loading:', fallbackError);
                throw new Error('Unable to load your store. Please contact support.');
            }
        }
    }

    async function loadStoreDetails(storeId) {
        try {
            const storeDetail = await apiRequest('GET', API_CONFIG.ENDPOINTS.STORE_DETAIL(storeId));
            return storeDetail;
        } catch (error) {
            console.error('Error loading store details:', error);
            throw error;
        }
    }

    async function loadStoreStatistics() {
        try {
            // Reset stats
            storeStats = {
                totalProducts: 0,
                totalOrders: 0,
                totalRevenue: 0,
                storeRating: 0.0
            };

            // Load products count from store data
            if (currentStore && currentStore.products) {
                storeStats.totalProducts = currentStore.products.length;
            } else {
                storeStats.totalProducts = currentStore?.product_count || 0;
            }

            // Fetch backend stats for orders and revenue
            try {
                // The endpoint may be /orders/stats/ or similar; adjust as needed
                const statsResponse = await apiRequest('GET', '/orders/stats/');
                // Use seller stats for this store's owner
                storeStats.totalOrders = statsResponse && typeof statsResponse.active_orders === 'number' ? statsResponse.active_orders : 0;
                storeStats.totalRevenue = statsResponse && typeof statsResponse.revenue === 'number' ? statsResponse.revenue : 0;
            } catch (error) {
                console.warn('Could not load backend stats:', error);
            }

            // Get store rating
            storeStats.storeRating = parseFloat(currentStore?.average_rating || 0);

            console.log('Store statistics:', storeStats);
        } catch (error) {
            console.error('Error loading store statistics:', error);
        }
    }

    function updateStoreUI() {
        if (!currentStore) return;

        // Update hero section
        const storeNameEl = document.getElementById('storeName');
        const storeDescriptionEl = document.getElementById('storeDescription');
        const heroSection = document.querySelector('.relative.bg-gradient-to-br');
        
        if (storeNameEl) {
            storeNameEl.textContent = currentStore.name || 'My Store';
        }
        if (storeDescriptionEl) {
            storeDescriptionEl.textContent = currentStore.description || 'Welcome to my store!';
        }
        
        // Set store logo as hero background image
        if (heroSection && currentStore.logo) {
            heroSection.style.backgroundImage = `url('${currentStore.logo}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
            // Add a darker overlay to ensure text is readable
            const overlay = heroSection.querySelector('.absolute.inset-0.opacity-10');
            if (overlay) {
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                overlay.style.opacity = '1';
            }
        }

        // Update stats
        const totalProductsEl = document.getElementById('totalProducts');
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalRevenueEl = document.getElementById('totalRevenue');
        const storeRatingEl = document.getElementById('storeRating');

        if (totalProductsEl) {
            totalProductsEl.textContent = storeStats.totalProducts.toString();
        }
        if (totalOrdersEl) {
            totalOrdersEl.textContent = storeStats.totalOrders.toString();
        }
        if (totalRevenueEl) {
            totalRevenueEl.textContent = formatCurrency(storeStats.totalRevenue);
        }
        if (storeRatingEl) {
            storeRatingEl.textContent = storeStats.storeRating.toFixed(1);
        }

        console.log('UI updated with store data');
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // API Request Helper (using existing API handler)
    async function apiRequest(method, endpoint, data = null) {
        try {
            if (method === 'GET') {
                return await api.get(endpoint);
            } else if (method === 'POST') {
                return await api.post(endpoint, data);
            } else if (method === 'PUT') {
                return await api.put(endpoint, data);
            } else if (method === 'PATCH') {
                return await api.patch(endpoint, data);
            } else if (method === 'DELETE') {
                return await api.delete(endpoint);
            }
        } catch (error) {
            console.error(`API ${method} request failed:`, error);
            throw error;
        }
    }

    // Loading States
    function showLoadingState() {
        // Show loading indicators
        const elements = ['storeName', 'storeDescription', 'totalProducts', 'totalOrders', 'totalRevenue', 'storeRating'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = 'Loading...';
                el.classList.add('animate-pulse');
            }
        });
    }

    function hideLoadingState() {
        // Remove loading indicators
        const elements = ['storeName', 'storeDescription', 'totalProducts', 'totalOrders', 'totalRevenue', 'storeRating'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('animate-pulse');
            }
        });
    }

    function showErrorState(message) {
        const storeNameEl = document.getElementById('storeName');
        const storeDescriptionEl = document.getElementById('storeDescription');
        
        if (storeNameEl) {
            storeNameEl.textContent = 'Error';
        }
        if (storeDescriptionEl) {
            storeDescriptionEl.textContent = message;
        }
        
        showToast(message, 'error');
    }

    function loadDeliveryData() {
        if (!currentStore) return;

        const deliveryRateSameEl = document.getElementById('deliveryRateSameModal');
        const deliveryRateOutsideEl = document.getElementById('deliveryRateOutsideModal');
        const deliveryRateOutsideStateEl = document.getElementById('deliveryRateOutsideStateModal');

        if (deliveryRateSameEl) {
            deliveryRateSameEl.value = currentStore.delivery_within_lga || '';
        }
        if (deliveryRateOutsideEl) {
            deliveryRateOutsideEl.value = currentStore.delivery_outside_lga || '';
        }
        if (deliveryRateOutsideStateEl) {
            deliveryRateOutsideStateEl.value = currentStore.delivery_outside_state || '';
        }
    }

    function loadContactData() {
        if (!currentUser) return;

        const whatsappEl = document.getElementById('whatsappNumberModal');
        const emailEl = document.getElementById('emailModal');
        const addressEl = document.getElementById('addressModal');

        if (whatsappEl) whatsappEl.value = currentUser.phone_number || '';
        if (emailEl) emailEl.value = currentUser.email || '';
        if (addressEl) {
            const address = `${currentUser.city || ''}, ${currentUser.state || ''}`.trim().replace(/^,\s*|,\s*$/, '');
            addressEl.value = address || '';
        }
    }

    function loadStoreDetailsData() {
        if (!currentStore) return;

        const nameEl = document.getElementById('storeNameModal');
        const descriptionEl = document.getElementById('storeDescriptionModal');
        const categoryEl = document.getElementById('storeCategoryModal');

        if (nameEl) nameEl.value = currentStore.name || '';
        if (descriptionEl) descriptionEl.value = currentStore.description || '';
        if (categoryEl) categoryEl.value = currentStore.category || '';

        // Restore pending uploads from sessionStorage (in case of page reload)
        pendingLogoUpload = sessionStorage.getItem('pendingLogoUpload');
        pendingSellerPhotoUpload = sessionStorage.getItem('pendingSellerPhotoUpload');

        // Load current logo preview (prefer pending upload over saved logo)
        const logoPreview = document.getElementById('storeLogoPreview');
        if (logoPreview) {
            if (pendingLogoUpload) {
                logoPreview.src = pendingLogoUpload;
            } else if (currentStore.logo) {
                logoPreview.src = currentStore.logo;
            }
        }

        // Load current seller photo preview (prefer pending upload over saved photo)
        const photoPreview = document.getElementById('sellerPhotoPreview');
        if (photoPreview) {
            if (pendingSellerPhotoUpload) {
                photoPreview.src = pendingSellerPhotoUpload;
            } else if (currentStore.seller_photo) {
                photoPreview.src = currentStore.seller_photo;
            }
        }

        // Setup image upload handlers
        setupImageUploadHandlers();

        // Show 60-day edit info if needed
        const editInfo = document.getElementById('storeEditInfo');
        if (editInfo) {
            if (currentStore.updated_at && currentStore.created_at) {
                const lastEdit = new Date(currentStore.updated_at);
                const created = new Date(currentStore.created_at);
                const now = new Date();
                const diffDays = Math.floor((now - lastEdit) / (1000 * 60 * 60 * 24));
                
                // Check if store has been genuinely edited (not just created)
                // Allow small time difference (< 5 seconds) to account for microsecond differences
                const timeDiff = Math.abs((lastEdit - created) / 1000); // Convert to seconds
                const hasBeenEdited = timeDiff > 5; // More than 5 seconds means it was edited
                
                // Enforce 60-day lock: After ANY edit, user must wait 60 days before editing again
                if (hasBeenEdited) {
                    // Store has been edited before - check if 60 days have passed
                    if (diffDays < 60) {
                        // LESS than 60 days - LOCKED (must wait)
                        const daysLeft = 60 - diffDays;
                        editInfo.textContent = `Store details are locked. You can edit again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Images can be updated anytime.`;
                        editInfo.classList.remove('hidden');
                        if (nameEl) {
                            nameEl.disabled = true;
                            nameEl.style.backgroundColor = '#f3f4f6';
                            nameEl.style.cursor = 'not-allowed';
                        }
                        if (descriptionEl) {
                            descriptionEl.disabled = true;
                            descriptionEl.style.backgroundColor = '#f3f4f6';
                            descriptionEl.style.cursor = 'not-allowed';
                        }
                        if (categoryEl) {
                            categoryEl.disabled = true;
                            categoryEl.style.backgroundColor = '#f3f4f6';
                            categoryEl.style.cursor = 'not-allowed';
                        }
                        // Don't disable submit button - allow image-only updates
                    } else {
                        // 60+ days have passed - UNLOCKED (can edit again)
                        editInfo.textContent = 'You can edit your store details now. Note: After editing, fields will be locked for 60 days.';
                        editInfo.classList.remove('hidden');
                        if (nameEl) {
                            nameEl.disabled = false;
                            nameEl.style.backgroundColor = '';
                            nameEl.style.cursor = '';
                        }
                        if (descriptionEl) {
                            descriptionEl.disabled = false;
                            descriptionEl.style.backgroundColor = '';
                            descriptionEl.style.cursor = '';
                        }
                        if (categoryEl) {
                            categoryEl.disabled = false;
                            categoryEl.style.backgroundColor = '';
                            categoryEl.style.cursor = '';
                        }
                    }
                } else {
                    // Store has never been edited, allow first edit
                    editInfo.textContent = 'You can edit your store details now. Note: After editing, fields will be locked for 60 days.';
                    editInfo.classList.remove('hidden');
                    if (nameEl) {
                        nameEl.disabled = false;
                        nameEl.style.backgroundColor = '';
                        nameEl.style.cursor = '';
                    }
                    if (descriptionEl) {
                        descriptionEl.disabled = false;
                        descriptionEl.style.backgroundColor = '';
                        descriptionEl.style.cursor = '';
                    }
                    if (categoryEl) {
                        categoryEl.disabled = false;
                        categoryEl.style.backgroundColor = '';
                        categoryEl.style.cursor = '';
                    }
                }
            } else {
                editInfo.textContent = 'Note: Store details can only be edited within 60 days of your last update.';
                editInfo.classList.remove('hidden');
            }
        }
    }

    async function handleDeliverySubmit(e) {
        e.preventDefault();

        const deliveryRateSame = parseFloat(document.getElementById('deliveryRateSameModal').value);
        const deliveryRateOutside = parseFloat(document.getElementById('deliveryRateOutsideModal').value);
        const deliveryRateOutsideState = parseFloat(document.getElementById('deliveryRateOutsideStateModal').value);

        if (isNaN(deliveryRateSame) || isNaN(deliveryRateOutside) || isNaN(deliveryRateOutsideState)) {
            showToast('Please enter valid delivery rates', 'error');
            return;
        }

        if (deliveryRateSame < 0 || deliveryRateOutside < 0 || deliveryRateOutsideState < 0) {
            showToast('Delivery rates must be positive numbers', 'error');
            return;
        }

        try {
            // Show loading
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            // Update store via API
            const updateData = {
                delivery_within_lga: deliveryRateSame,
                delivery_outside_lga: deliveryRateOutside,
                delivery_outside_state: deliveryRateOutsideState
            };

            const updatedStore = await apiRequest('PATCH', API_CONFIG.ENDPOINTS.STORE_DETAIL(currentStore.id), updateData);
            
            // Update local store data
            currentStore.delivery_within_lga = updatedStore.delivery_within_lga;
            currentStore.delivery_outside_lga = updatedStore.delivery_outside_lga;
            currentStore.delivery_outside_state = updatedStore.delivery_outside_state;

            showToast('Delivery settings saved successfully!', 'success');
            closeAllModals();

        } catch (error) {
            console.error('Error updating delivery settings:', error);
            showToast('Failed to save delivery settings. Please try again.', 'error');
        }
    }

    async function handleContactSubmit(e) {
        e.preventDefault();
        
        // Note: Contact info is tied to user profile, not store
        // This would require updating the user profile endpoint
        showToast('Contact information updates will be available in profile settings', 'info');
        closeAllModals();
    }

    // Image upload handler setup
    function setupImageUploadHandlers() {
        const logoInput = document.getElementById('storeLogoInput');
        const photoInput = document.getElementById('sellerPhotoInput');

        if (logoInput) {
            logoInput.addEventListener('change', handleLogoUpload);
        }

        if (photoInput) {
            photoInput.addEventListener('change', handleSellerPhotoUpload);
        }
    }

    async function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showToast('Image size must be less than 5MB', 'error');
            return;
        }

        try {
            // Show upload progress
            const progressEl = document.getElementById('logoUploadProgress');
            if (progressEl) progressEl.classList.remove('hidden');

            // Upload to Cloudinary
            const uploadedUrl = await uploadImageToCloudinary(file, 'store_logos');

            // Update preview
            const preview = document.getElementById('storeLogoPreview');
            if (preview) preview.src = uploadedUrl;

            // Store URL for form submission (persist across page reloads)
            pendingLogoUpload = uploadedUrl;
            sessionStorage.setItem('pendingLogoUpload', uploadedUrl);

            showToast('Logo uploaded successfully!', 'success');

        } catch (error) {
            console.error('Error uploading logo:', error);
            showToast('Failed to upload logo. Please try again.', 'error');
        } finally {
            const progressEl = document.getElementById('logoUploadProgress');
            if (progressEl) progressEl.classList.add('hidden');
        }
    }

    async function handleSellerPhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showToast('Image size must be less than 5MB', 'error');
            return;
        }

        try {
            // Show upload progress
            const progressEl = document.getElementById('photoUploadProgress');
            if (progressEl) progressEl.classList.remove('hidden');

            // Upload to Cloudinary
            const uploadedUrl = await uploadImageToCloudinary(file, 'seller_photos');

            // Update preview
            const preview = document.getElementById('sellerPhotoPreview');
            if (preview) preview.src = uploadedUrl;

            // Store URL for form submission (persist across page reloads)
            pendingSellerPhotoUpload = uploadedUrl;
            sessionStorage.setItem('pendingSellerPhotoUpload', uploadedUrl);

            showToast('Photo uploaded successfully!', 'success');

        } catch (error) {
            console.error('Error uploading photo:', error);
            showToast('Failed to upload photo. Please try again.', 'error');
        } finally {
            const progressEl = document.getElementById('photoUploadProgress');
            if (progressEl) progressEl.classList.add('hidden');
        }
    }

    async function uploadImageToCloudinary(file, folder) {
        const formData = new FormData();
        formData.append('file', file);
        // Remove upload_preset for now - we'll use backend upload instead
        // formData.append('upload_preset', 'ml_default');
        formData.append('folder', folder);

        // Use backend API to handle Cloudinary upload (more secure)
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/stores/upload_image/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            return data.url || data.secure_url;
        } catch (error) {
            console.error('Backend upload failed, trying direct Cloudinary upload:', error);
            
            // Fallback: Try direct Cloudinary upload without upload_preset
            // This will work if your Cloudinary account allows unsigned uploads
            const directFormData = new FormData();
            directFormData.append('file', file);
            directFormData.append('folder', folder);
            
            const directResponse = await fetch('https://api.cloudinary.com/v1_1/dpmxcjkfl/image/upload', {
                method: 'POST',
                body: directFormData
            });

            if (!directResponse.ok) {
                const errorData = await directResponse.json();
                console.error('Cloudinary error:', errorData);
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const directData = await directResponse.json();
            return directData.secure_url;
        }
    }

    async function handleStoreSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('storeNameModal').value.trim();
        const description = document.getElementById('storeDescriptionModal').value.trim();
        const category = document.getElementById('storeCategoryModal').value;

        if (!name || !description || !category) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (name.length < 3) {
            showToast('Store name must be at least 3 characters long', 'error');
            return;
        }

        if (description.length < 10) {
            showToast('Store description must be at least 10 characters long', 'error');
            return;
        }

        try {
            // Show loading
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            // Check sessionStorage in case variables were lost (page reload)
            const logoToUpload = pendingLogoUpload || sessionStorage.getItem('pendingLogoUpload');
            const photoToUpload = pendingSellerPhotoUpload || sessionStorage.getItem('pendingSellerPhotoUpload');

            // Check if only images are being updated (no text field changes)
            const isImageOnlyUpdate = (logoToUpload || photoToUpload) && 
                                      name === currentStore.name && 
                                      description === currentStore.description && 
                                      category === currentStore.category;

            // Prepare update data
            const updateData = {};

            // Always allow image updates (not affected by 60-day limit)
            if (logoToUpload) {
                updateData.logo = logoToUpload;
            }
            if (photoToUpload) {
                updateData.seller_photo = photoToUpload;
            }

            // Add text fields only if they're being changed or if it's image-only update
            if (isImageOnlyUpdate) {
                // Image-only update - don't include text fields to avoid 60-day check
                console.log('Image-only update detected');
            } else {
                // Include text fields (will be checked by backend 60-day limit)
                updateData.name = name;
                updateData.description = description;
                updateData.category = category;
            }

            const updatedStore = await apiRequest('PATCH', API_CONFIG.ENDPOINTS.STORE_DETAIL(currentStore.id), updateData);
            
            // Update local store data
            currentStore.name = updatedStore.name;
            currentStore.description = updatedStore.description;
            currentStore.category = updatedStore.category;
            if (updatedStore.logo) currentStore.logo = updatedStore.logo;
            if (updatedStore.seller_photo) currentStore.seller_photo = updatedStore.seller_photo;

            // Clear pending uploads after successful save
            pendingLogoUpload = null;
            pendingSellerPhotoUpload = null;
            sessionStorage.removeItem('pendingLogoUpload');
            sessionStorage.removeItem('pendingSellerPhotoUpload');

            // Update UI immediately
            const storeNameEl = document.getElementById('storeName');
            const storeDescriptionEl = document.getElementById('storeDescription');

            if (storeNameEl) storeNameEl.textContent = name;
            if (storeDescriptionEl) storeDescriptionEl.textContent = description;

            showToast('Store details saved successfully!', 'success');
            closeAllModals();

        } catch (error) {
            console.error('Error updating store details:', error);
            // Handle 60-day edit limit error
            if (error && error.response && error.response.status === 403 && error.response.data && error.response.data.error && error.response.data.error.includes('60 days')) {
                showToast(error.response.data.error, 'error');
                // Optionally, reload store data to update UI
                await loadUserStore();
                loadStoreDetailsData();
            } else {
                showToast('Failed to save store details. Please try again.', 'error');
            }
        }
    }

    function handleWithdrawalSubmit(e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('withdrawalAmount').value);
        const method = document.getElementById('withdrawalMethod').value;

        if (!amount || amount < 5000) {
            showToast('Minimum withdrawal amount is ₦5,000', 'error');
            return;
        }

        if (!method) {
            showToast('Please select a payment method', 'error');
            return;
        }

        if (method === 'bank') {
            const bankName = document.getElementById('bankName').value;
            const accountNumber = document.getElementById('accountNumber').value;
            const accountName = document.getElementById('accountName').value;

            if (!bankName || !accountNumber || !accountName) {
                showToast('Please fill in all bank details', 'error');
                return;
            }
        }

        // Simulate withdrawal request
        showToast('Withdrawal request submitted successfully! Processing may take 1-3 business days.', 'success');
        closeAllModals();

        // Update wallet balance (simulate)
        setTimeout(() => {
            showToast('Withdrawal processed! Funds will be transferred to your account.', 'success');
        }, 2000);
    }

    function handlePaymentMethodChange() {
        const method = document.getElementById('withdrawalMethod').value;
        const bankDetails = document.getElementById('bankDetails');

        if (method === 'bank') {
            bankDetails.classList.remove('hidden');
        } else {
            bankDetails.classList.add('hidden');
        }
    }

    function updateWithdrawalSummary() {
        const amount = parseFloat(document.getElementById('withdrawalAmount').value) || 0;
        const summary = document.getElementById('withdrawalSummary');

        if (amount >= 5000) {
            const fee = 100;
            const total = amount - fee;

            document.getElementById('summaryAmount').textContent = `₦${amount.toLocaleString()}`;
            document.getElementById('summaryFee').textContent = `₦${fee.toLocaleString()}`;
            document.getElementById('summaryTotal').textContent = `₦${total.toLocaleString()}`;

            summary.classList.remove('hidden');
        } else {
            summary.classList.add('hidden');
        }
    }

    // Close all modals function
    function closeAllModals() {
        const modalIds = ['deliveryModal', 'contactModal', 'storeModal', 'withdrawalModal'];
        modalIds.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
        document.body.style.overflow = '';
    }

    // Make functions globally available
    window.showToast = showToast;
    window.openStoreConfigModal = openStoreConfigModal;
    window.closeAllModals = closeAllModals;
});
