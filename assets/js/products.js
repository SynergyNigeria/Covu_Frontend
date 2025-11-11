// ========================================
// PRODUCTS PAGE - BACKEND INTEGRATION
// ========================================

// State Management
let allProducts = [];
let currentPage = 1;
let isLoading = false;
let hasMoreProducts = true;
let currentFilters = {
    search: '',
    category: '',
    store_id: ''
};

// Categories matching backend
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

// DOM Elements - These will be initialized after DOMContentLoaded
let searchInput;
let categoryFilters;
let categoryFiltersContainer;
let filterToggle;
let productGrid;
let productModal;
let closeModal;

// Debounce timer
let searchDebounceTimer = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM elements
    searchInput = document.getElementById('searchInput');
    categoryFilters = document.getElementById('categoryFilters');
    categoryFiltersContainer = document.getElementById('categoryFiltersContainer');
    filterToggle = document.getElementById('filterToggle');
    productGrid = document.getElementById('productGrid');
    productModal = document.getElementById('productModal');
    closeModal = document.getElementById('closeModal');

    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize UI
    populateCategories();
    setupEventListeners();
    lucide.createIcons();

    // Check if there's a store_id in URL
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store_id');
    if (storeId) {
        currentFilters.store_id = storeId;
    }

    // Load initial products
    await loadProducts(true);

    // Setup infinite scroll
    setupInfiniteScroll();
});

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Search with debounce
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = searchInput.value.trim();
            
            // Clear previous timer
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
            }
            
            // If search is cleared, reload all products immediately
            if (searchTerm === '') {
                currentFilters.search = '';
                loadProducts(true);
                return;
            }
            
            // Only search if at least 2 characters entered
            if (searchTerm.length < 2) {
                return;
            }
            
            // Set new timer (wait 800ms after user stops typing)
            searchDebounceTimer = setTimeout(() => {
                console.log('Searching for:', searchTerm);
                currentFilters.search = searchTerm;
                loadProducts(true);
            }, 800);
        });
    }

    // Filter toggle
    if (filterToggle) {
        filterToggle.addEventListener('click', toggleFilters);
    }

    // Modal close
    if (closeModal) {
        closeModal.addEventListener('click', closeProductModal);
    }

    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }
}

// ========================================
// API INTEGRATION
// ========================================

async function loadProducts(resetScroll = false) {
    if (isLoading || (!hasMoreProducts && !resetScroll)) return;

    try {
        isLoading = true;
        showLoadingIndicator();

        if (resetScroll) {
            currentPage = 1;
            hasMoreProducts = true;
            allProducts = [];
            productGrid.innerHTML = '';
        }

        // Build query params
        const params = new URLSearchParams({
            page: currentPage,
            page_size: 20
        });

        // Add filters
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        if (currentFilters.category) {
            params.append('category', currentFilters.category);
        }
        if (currentFilters.store_id) {
            params.append('store_id', currentFilters.store_id);
        }

        // Call API
        const response = await api.get(`${API_CONFIG.ENDPOINTS.PRODUCTS}?${params}`);
        
        // Debug: Log first product to see image format
        if (response.results && response.results.length > 0) {
            console.log('Sample product from API:', response.results[0]);
            console.log('Image field:', response.results[0].images);
        }

        // Transform products
        const products = response.results.map(transformProductData);
        
        allProducts = resetScroll ? products : [...allProducts, ...products];
        
        // Check if more pages
        hasMoreProducts = response.next !== null;

        // Display products
        displayProducts(products);

        currentPage++;

    } catch (error) {
        console.error('Error loading products:', error);
        showErrorMessage('Failed to load products. Please try again.');
    } finally {
        isLoading = false;
        hideLoadingIndicator();
    }
}

// Transform backend product data
function transformProductData(product) {
    // Handle images - Cloudinary field returns URL or path
    let imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
    
    if (product.images) {
        // Cloudinary can return full URL or relative path
        if (typeof product.images === 'string') {
            // If it starts with http, validate it's a complete URL
            if (product.images.startsWith('http://') || product.images.startsWith('https://')) {
                // Check if it's a valid complete Cloudinary URL (has cloud name)
                if (product.images.includes('res.cloudinary.com/') && product.images.split('/').length > 5) {
                    imageUrl = product.images;
                } else {
                    // Incomplete URL, keep placeholder
                    console.warn('Incomplete Cloudinary URL, using placeholder:', product.images);
                }
            } else if (product.images.includes('image/upload')) {
                // Relative Cloudinary path without cloud name - use placeholder
                console.warn('Cloudinary path missing cloud name, using placeholder:', product.images);
            }
        }
    }

    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        category: product.category,
        image: imageUrl,
        store_name: product.store_name || 'Unknown Store',
        store_location: product.store_city && product.store_state 
            ? `${product.store_city}, ${product.store_state}` 
            : '',
        store_rating: product.store_rating || 0,
        is_active: product.is_active,
        features: {
            premium_quality: product.premium_quality,
            durable: product.durable,
            modern_design: product.modern_design,
            easy_maintain: product.easy_maintain
        }
    };
}

// ========================================
// DISPLAY FUNCTIONS
// ========================================

function displayProducts(products) {
    products.forEach(product => {
        const card = createProductCard(product);
        productGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer';
    
    // Format price
    const formattedPrice = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(product.price);

    card.innerHTML = `
        <div class="relative">
            <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
            ${!product.is_active ? '<div class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Unavailable</div>' : ''}
        </div>
        <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
            
            <div class="flex items-center justify-between mb-2">
                <span class="text-2xl font-bold text-primary-orange">${formattedPrice}</span>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${getCategoryDisplay(product.category)}</span>
            </div>
            
            <div class="flex items-center text-sm text-gray-600 mb-3">
                <i data-lucide="store" class="h-4 w-4 mr-1"></i>
                <span class="line-clamp-1">${product.store_name}</span>
            </div>
            
            ${product.store_location ? `
                <div class="flex items-center text-xs text-gray-500">
                    <i data-lucide="map-pin" class="h-3 w-3 mr-1"></i>
                    <span>${product.store_location}</span>
                </div>
            ` : ''}
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `product-detail.html?id=${product.id}`;
    });

    return card;
}

function getCategoryDisplay(category) {
    const categoryMap = {
        'mens_clothes': 'Men Clothes',
        'ladies_clothes': 'Ladies Clothes',
        'kids_clothes': 'Kids Clothes',
        'beauty': 'Beauty',
        'body_accessories': 'Body Accessories',
        'clothing_extras': 'Clothing Extras',
        'bags': 'Bags',
        'wigs': 'Wigs',
        'body_scents': 'Body Scents'
    };
    return categoryMap[category] || category;
}

// ========================================
// CATEGORY FILTERS
// ========================================

function populateCategories() {
    if (!categoryFilters) return;

    categoryFilters.innerHTML = '';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-filter-btn px-6 py-3 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 font-medium';
        button.textContent = category;
        button.addEventListener('click', () => toggleCategoryFilter(button, category));
        categoryFilters.appendChild(button);
    });
}

function toggleCategoryFilter(button, category) {
    const isActive = button.classList.contains('active-category');

    // Deactivate all other buttons
    Array.from(categoryFilters.children).forEach(btn => {
        if (btn !== button) {
            btn.className = 'category-filter-btn px-6 py-3 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 font-medium';
        }
    });

    if (isActive) {
        // Deactivate - show all
        button.className = 'category-filter-btn px-6 py-3 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 font-medium';
        currentFilters.category = '';
    } else {
        // Activate - convert display name to backend format
        button.className = 'category-filter-btn active-category px-6 py-3 bg-primary-orange text-white rounded-full shadow-lg transform scale-105 transition-all duration-300 border border-primary-orange font-medium';
        currentFilters.category = categoryDisplayToBackend(category);
    }

    loadProducts(true);
}

function categoryDisplayToBackend(displayName) {
    const categoryMap = {
        'Men Clothes': 'mens_clothes',
        'Ladies Clothes': 'ladies_clothes',
        'Kids Clothes': 'kids_clothes',
        'Beauty': 'beauty',
        'Body Accessories': 'body_accessories',
        'Clothing Extras': 'clothing_extras',
        'Bags': 'bags',
        'Wigs': 'wigs',
        'Body Scents': 'body_scents'
    };
    return categoryMap[displayName] || displayName.toLowerCase().replace(/ /g, '_');
}

function toggleFilters() {
    if (!categoryFiltersContainer || !filterToggle) return;

    const isHidden = categoryFiltersContainer.classList.contains('hidden');
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

    lucide.createIcons();
}

// ========================================
// INFINITE SCROLL
// ========================================

function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMoreProducts) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 300) {
            loadProducts();
        }
    });
}

// ========================================
// UI HELPERS
// ========================================

function showLoadingIndicator() {
    let loader = document.getElementById('productLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'productLoader';
        loader.className = 'flex justify-center items-center py-8';
        loader.innerHTML = `
            <div class="flex items-center gap-3 text-gray-600">
                <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="font-medium">Loading products...</span>
            </div>
        `;
        productGrid.parentNode.insertBefore(loader, productGrid.nextSibling);
    }
    loader.classList.remove('hidden');
}

function hideLoadingIndicator() {
    const loader = document.getElementById('productLoader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

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
    productGrid.parentNode.insertBefore(errorDiv, productGrid);
    lucide.createIcons();

    setTimeout(() => errorDiv.remove(), 5000);
}

function closeProductModal() {
    if (productModal) {
        productModal.classList.add('hidden');
    }
}





