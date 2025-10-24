// ========================================
// STATE MANAGEMENT
// ========================================

// Store data from backend
let allStores = [];
let currentStores = [];

// Infinite scroll state
let currentPage = 1;
let isLoading = false;
let hasMoreStores = true;

// Categories (matching backend CATEGORIES choices)
const categories = [
    'Men Clothes',
    'Ladies Clothes',
    'Kids Clothes',
    'Beauty',
    'Body Accessories',
    'Clothing Extras',
    'Bags',
    'Wigs',
    'Body Scents'
];

// DOM elements
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const categoryFiltersContainer = document.getElementById('categoryFiltersContainer');
const filterToggle = document.getElementById('filterToggle');
const storeGrid = document.getElementById('storeGrid');
const searchContainer = document.getElementById('searchContainer');
const storeModal = document.getElementById('storeModal');
const closeModal = document.getElementById('closeModal');

// Modal elements
const modalStoreTitle = document.getElementById('modalStoreTitle');
const modalStoreImage = document.getElementById('modalStoreImage');
const modalStoreName = document.getElementById('modalStoreName');
const modalStoreDescription = document.getElementById('modalStoreDescription');
const modalStoreStars = document.getElementById('modalStoreStars');
const modalStoreRating = document.getElementById('modalStoreRating');
const modalStoreLocation = document.getElementById('modalStoreLocation');
const modalProductsGrid = document.getElementById('modalProductsGrid');

// Sticky search variables
let searchOriginalTop = 0;
let isSearchSticky = false;

// Debounce timer for search
let searchDebounceTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    populateCategories();
    lucide.createIcons(); // Initialize Lucide icons
    
    // Initialize sticky search
    initStickySearch();
    
    // Setup search input listener with debounce
    setupSearchListener();
    
    // Setup filter toggle
    setupFilterToggle();
    
    // Load initial stores from backend
    await loadStoresFromAPI();
    
    // Setup infinite scroll
    setupInfiniteScroll();
});

// Setup search input with debounce
function setupSearchListener() {
    searchInput.addEventListener('input', function() {
        // Clear previous timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        // Set new timer (wait 500ms after user stops typing)
        searchDebounceTimer = setTimeout(() => {
            console.log('Searching for:', searchInput.value);
            loadStoresFromAPI(true); // Reset scroll for new search
        }, 500);
    });
}

// Setup filter toggle button
function setupFilterToggle() {
    if (filterToggle) {
        filterToggle.addEventListener('click', toggleFilters);
    }
}

// Toggle filter visibility
function toggleFilters() {
    const isHidden = categoryFiltersContainer.classList.contains('hidden');
    // Lucide replaces <i> elements with <svg> elements, so we need to find the SVG
    const chevronIcon = filterToggle.querySelector('svg') || filterToggle.querySelector('i');
    const toggleText = filterToggle.querySelector('span');

    if (isHidden) {
        categoryFiltersContainer.classList.remove('hidden');
        if (chevronIcon) chevronIcon.setAttribute('data-lucide', 'chevron-up');
        if (toggleText) toggleText.textContent = 'Hide Filters';
    } else {
        categoryFiltersContainer.classList.add('hidden');
        if (chevronIcon) chevronIcon.setAttribute('data-lucide', 'chevron-down');
        if (toggleText) toggleText.textContent = 'Show Filters';
    }

    lucide.createIcons(); // Update icons
}

// ========================================
// API INTEGRATION & INFINITE SCROLL
// ========================================

// Load stores from backend API with search and filters
async function loadStoresFromAPI(resetScroll = false) {
    if (isLoading || (!hasMoreStores && !resetScroll)) return;
    
    try {
        isLoading = true;
        showLoadingIndicator();
        
        if (resetScroll) {
            currentPage = 1;
            hasMoreStores = true;
            allStores = [];
            storeGrid.innerHTML = ''; // Clear grid for fresh results
        }
        
        // Build query params with search and filters
        const params = new URLSearchParams({
            page: currentPage,
            page_size: API_CONFIG.PAGE_SIZE
        });
        
        // Add search query if present
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        
        // Add category filter if active
        const activeCategory = getActiveCategory();
        if (activeCategory) {
            params.append('category', activeCategory);
        }
        
        // Call backend API
        const response = await api.get(`${API_CONFIG.ENDPOINTS.STORES}?${params}`);
        
        // Transform backend data to frontend format
        const transformedStores = response.results.map(transformStoreData);
        
        allStores = resetScroll ? transformedStores : [...allStores, ...transformedStores];
        
        // Check if there are more pages
        hasMoreStores = response.next !== null;
        
        // Display stores
        displayStores(allStores);
        
        currentPage++;
        
    } catch (error) {
        console.error('Error loading stores:', error);
        showErrorMessage('Failed to load stores. Please try again.');
    } finally {
        isLoading = false;
        hideLoadingIndicator();
    }
}

// Get active category filter
function getActiveCategory() {
    const activeButton = Array.from(categoryFilters.children)
        .find(btn => btn.classList.contains('from-primary-orange'));
    return activeButton ? activeButton.textContent : null;
}

// Transform backend store data to frontend format
function transformStoreData(backendStore) {
    return {
        id: backendStore.id,
        image: backendStore.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        title: backendStore.name,
        description: backendStore.description || 'Quality products available',
        rating: parseFloat(backendStore.average_rating) || 0,
        location: `${backendStore.city}, ${backendStore.state}`,
        categories: [], // Categories will be inferred from products later
        products: [], // Products loaded when modal opens
        seller_name: backendStore.seller_name,
        product_count: backendStore.product_count || 0,
        delivery_within_lga: backendStore.delivery_within_lga || false,
        delivery_outside_lga: backendStore.delivery_outside_lga || false
    };
}

// Setup infinite scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMoreStores) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        // Check if user scrolled near bottom (within SCROLL_THRESHOLD)
        if (scrollTop + clientHeight >= scrollHeight - API_CONFIG.SCROLL_THRESHOLD) {
            loadStoresFromAPI();
        }
    });
}

// Show loading indicator
function showLoadingIndicator() {
    let loader = document.getElementById('storeLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'storeLoader';
        loader.className = 'flex justify-center items-center py-8';
        loader.innerHTML = `
            <div class="flex items-center gap-3 text-gray-600">
                <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="font-medium">Loading stores...</span>
            </div>
        `;
        storeGrid.parentNode.insertBefore(loader, storeGrid.nextSibling);
    }
    loader.classList.remove('hidden');
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loader = document.getElementById('storeLoader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2';
    errorDiv.innerHTML = `
        <i data-lucide="alert-circle" class="h-5 w-5"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-auto">
            <i data-lucide="x" class="h-5 w-5"></i>
        </button>
    `;
    storeGrid.parentNode.insertBefore(errorDiv, storeGrid);
    lucide.createIcons();
    
    // Auto remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize sticky search
function initStickySearch() {
    // Get initial position
    searchOriginalTop = searchContainer.offsetTop;
    
    // Add scroll listener
    window.addEventListener('scroll', handleStickySearch);
}

// Handle sticky search behavior
function handleStickySearch() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > searchOriginalTop && !isSearchSticky) {
        // Make search sticky
        searchContainer.classList.add('search-sticky');
        isSearchSticky = true;
    } else if (scrollTop <= searchOriginalTop && isSearchSticky) {
        // Remove sticky
        searchContainer.classList.remove('search-sticky');
        isSearchSticky = false;
    }
}

// Populate category filters
function populateCategories() {
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'px-6 py-3 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-primary-orange hover:to-primary-green hover:text-white transform hover:scale-105 transition-all duration-300 border border-gray-200 hover:border-transparent font-medium';
        button.textContent = category;
        button.addEventListener('click', () => toggleCategoryFilter(button, category));
        categoryFilters.appendChild(button);
    });
}

// Toggle category filter
function toggleCategoryFilter(button, category) {
    const isActive = button.classList.contains('bg-gradient-to-r') && button.classList.contains('from-primary-orange');
    
    // Deactivate all other category buttons first
    Array.from(categoryFilters.children).forEach(btn => {
        if (btn !== button) {
            btn.className = 'px-6 py-3 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-primary-orange hover:to-primary-green hover:text-white transform hover:scale-105 transition-all duration-300 border border-gray-200 hover:border-transparent font-medium';
        }
    });
    
    if (isActive) {
        // Deactivate this button (show all stores)
        button.className = 'px-6 py-3 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-primary-orange hover:to-primary-green hover:text-white transform hover:scale-105 transition-all duration-300 border border-gray-200 hover:border-transparent font-medium';
    } else {
        // Activate this button
        button.className = 'px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-green text-white rounded-full shadow-lg transform scale-105 transition-all duration-300 border border-transparent font-medium';
    }
    
    // Reload stores from API with new filter
    loadStoresFromAPI(true);
}

// Note: Search and filtering now handled by backend API
// The loadStoresFromAPI() function sends search and category params to backend

// Display stores
function displayStores(storeList) {
    storeGrid.innerHTML = '';
    storeList.forEach(store => {
        const card = createStoreCard(store);
        storeGrid.appendChild(card);
    });
    lucide.createIcons(); // Re-initialize icons for new elements
}

// Create store card
function createStoreCard(store) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer';
    card.addEventListener('click', () => openStoreModal(store.id));

    const stars = createStars(store.rating);

    card.innerHTML = `
        <img src="${store.image}" alt="${store.title}" class="w-full h-48 object-cover" loading="lazy">
        <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-800">${store.title}</h3>
            <p class="text-gray-600 text-sm mb-2">${store.description}</p>
            <div class="flex items-center mb-2">
                <div class="flex text-yellow-400">
                    ${stars}
                </div>
                <span class="ml-2 text-sm text-gray-600">${store.rating}</span>
            </div>
            <div class="flex items-center text-sm text-gray-500 mb-4">
                <i data-lucide="map-pin" class="h-4 w-4 mr-1"></i>
                ${store.location}
            </div>
            <button class="w-full bg-primary-orange text-white py-2 rounded-lg hover:bg-orange-600 transition-colors" onclick="event.stopPropagation(); openStoreModal('${store.id}')">View Store</button>
        </div>
    `;

    return card;
}

// Create star rating
function createStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i data-lucide="star" class="h-4 w-4 fill-current"></i>';
    }

    if (hasHalfStar) {
        stars += '<i data-lucide="star" class="h-4 w-4 fill-current opacity-50"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i data-lucide="star" class="h-4 w-4"></i>';
    }

    return stars;
}

// Note: Search and filter event listeners are now set up in setupSearchListener() and setupFilterToggle()
// during DOMContentLoaded initialization

// Modal event listeners
closeModal.addEventListener('click', closeStoreModal);
storeModal.addEventListener('click', (e) => {
    if (e.target === storeModal) {
        closeStoreModal();
    }
});

// Open store modal - Load full store details from API
async function openStoreModal(storeId) {
    try {
        // Show modal with loading state
        storeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Show loading in modal
        modalProductsGrid.innerHTML = '<div class="col-span-full flex justify-center py-8"><div class="animate-spin h-8 w-8 border-4 border-primary-orange border-t-transparent rounded-full"></div></div>';
        
        // Fetch full store details from backend
        const storeDetails = await api.get(`${API_CONFIG.ENDPOINTS.STORES}${storeId}/`);
        
        // Populate modal with store data
        modalStoreTitle.textContent = storeDetails.name;
        // Ensure logo URL is absolute or use placeholder
        const storeLogo = storeDetails.logo && storeDetails.logo.startsWith('http') 
            ? storeDetails.logo 
            : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
        modalStoreImage.src = storeLogo;
        modalStoreImage.alt = storeDetails.name;
        modalStoreName.textContent = storeDetails.name;
        modalStoreDescription.textContent = storeDetails.description || 'Quality products available';
        modalStoreStars.innerHTML = createStars(parseFloat(storeDetails.average_rating) || 0);
        modalStoreRating.textContent = parseFloat(storeDetails.average_rating).toFixed(1) || '0.0';
        modalStoreLocation.textContent = `${storeDetails.city}, ${storeDetails.state}`;

        // Populate products
        modalProductsGrid.innerHTML = '';
        if (storeDetails.products && storeDetails.products.length > 0) {
            storeDetails.products.forEach(product => {
                const productCard = createProductCard(product);
                modalProductsGrid.appendChild(productCard);
            });
        } else {
            modalProductsGrid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i data-lucide="package" class="h-12 w-12 mx-auto mb-2 opacity-50"></i>
                    <p>No products available yet</p>
                </div>
            `;
        }

        // Initialize icons first
        lucide.createIcons();

        // Initialize rating functionality
        initializeRatingSystem(storeId);
        
    } catch (error) {
        console.error('Error loading store details:', error);
        closeStoreModal();
        showErrorMessage('Failed to load store details. Please try again.');
    }
}

// Close store modal
function closeStoreModal() {
    storeModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Initialize rating system for the modal
function initializeRatingSystem(storeId) {
    const ratingSection = document.querySelector('.mt-4.p-4.bg-gray-50.rounded-lg');
    
    // Update rating section to show info message
    ratingSection.innerHTML = `
        <h4 class="text-sm font-medium text-gray-700 mb-2">Store Ratings</h4>
        <div class="flex items-center gap-2 text-sm text-gray-600">
            <i data-lucide="info" class="h-4 w-4"></i>
            <span>You can rate this store after completing a purchase</span>
        </div>
        <p class="text-xs text-gray-500 mt-2">Ratings can be submitted from your confirmed orders</p>
    `;
    
    // Re-initialize icons
    lucide.createIcons();
}

// Update the visual display of rating stars (for orders page)
function updateRatingDisplay(stars, rating, isHover = false) {
    stars.forEach((star, index) => {
        // Lucide replaces <i> elements with <svg> elements, so we need to find the SVG
        const icon = star.querySelector('svg') || star.querySelector('i');
        if (icon) {
            if (index < rating) {
                icon.className = 'h-5 w-5 fill-current text-yellow-400';
            } else {
                icon.className = 'h-5 w-5 text-gray-300';
            }
        } else {
            console.warn('Rating star icon not found for star', index);
        }
    });
}

// Show feedback after rating submission
function showRatingFeedback() {
    const ratingMessage = document.getElementById('ratingMessage');
    const originalText = ratingMessage.textContent;

    ratingMessage.textContent = 'Thank you for your rating!';
    ratingMessage.className = 'text-xs text-green-600 mt-1 font-medium';

    // Reset after 2 seconds
    setTimeout(() => {
        ratingMessage.textContent = originalText;
        ratingMessage.className = 'text-xs text-gray-500 mt-1';
    }, 2000);
}

// Open product detail page
function openProductDetail(product) {
    // Store product ID in localStorage for the detail page to fetch
    localStorage.setItem('selectedProductId', product.id);
    // Also store basic product data as fallback
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    // Navigate to product detail page
    window.location.href = `product-detail.html?id=${product.id}`;
}

// Create product card for modal
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer';
    card.addEventListener('click', () => openProductDetail(product));

    // Get first image or use placeholder - ensure it's a valid URL
    let productImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop';
    if (product.images && product.images.length > 0) {
        const img = product.images[0];
        // Check if it's a valid URL (starts with http)
        if (img && typeof img === 'string' && img.startsWith('http')) {
            productImage = img;
        }
    }

    card.innerHTML = `
        <img src="${productImage}" alt="${product.name}" class="w-full h-32 object-cover" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'">
        <div class="p-3">
            <h4 class="text-sm font-medium text-gray-800 mb-1 line-clamp-2">${product.name}</h4>
            <p class="text-primary-orange font-semibold">₦${parseFloat(product.price).toLocaleString()}</p>
        </div>
    `;

    return card;
}