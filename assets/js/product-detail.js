// ========================================
// PRODUCT DETAIL PAGE - BACKEND INTEGRATION
// ========================================

let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    await loadProductDetails();
    setupBuyNowButton();
    setupBackButton();
    setupImageLightbox();
    lucide.createIcons();
});

// Load product details from backend API
async function loadProductDetails() {
    try {
        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        console.log('Product ID from URL:', productId);

        if (!productId) {
            console.error('No product ID found in URL');
            showError('Product ID not found');
            setTimeout(() => {
                window.location.href = 'products.html';
            }, 2000);
            return;
        }

        // Show loading state
        showLoading();

        // Fetch product details from backend
        const endpoint = API_CONFIG.ENDPOINTS.PRODUCT_DETAIL(productId);
        console.log('Fetching from endpoint:', endpoint);
        console.log('Full URL:', `${API_CONFIG.BASE_URL}${endpoint}`);
        
        const response = await api.get(endpoint);
        console.log('API Response:', response);

        // Check if response has data (our api.js wrapper adds success/data)
        // OR if it's the direct product data from backend
        let productData = null;
        
        if (response.success && response.data) {
            // Wrapped response from api.js
            productData = response.data;
        } else if (response.id) {
            // Direct product data from backend
            productData = response;
        }

        if (productData) {
            currentProduct = productData;
            console.log('Current product:', currentProduct);
            populateProductDetails(currentProduct);
            await loadRelatedProducts(currentProduct.category);
        } else {
            console.error('Invalid response format:', response);
            showError('Invalid product data received');
            setTimeout(() => {
                window.location.href = 'products.html';
            }, 3000);
        }
    } catch (error) {
        console.error('Error loading product details:', error);
        console.error('Error stack:', error.stack);
        showError(`Failed to load product. Error: ${error.message}`);
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 3000);
    } finally {
        hideLoading();
    }
}

// Populate product details on the page
function populateProductDetails(product) {
    // Update page title
    document.title = `${product.name} - Product Details`;

    // Populate product information
    const productImage = document.getElementById('productImage');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const productDescription = document.getElementById('productDescription');
    const productStars = document.getElementById('productStars');
    const productRating = document.getElementById('productRating');

    if (productImage) {
        // Handle image URL
        let imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
        if (product.images) {
            if (typeof product.images === 'string' && product.images.startsWith('http')) {
                imageUrl = product.images;
            }
        }
        productImage.src = imageUrl;
        productImage.alt = product.name;
    }

    if (productName) productName.textContent = product.name;
    
    if (productPrice) {
        const formattedPrice = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(parseFloat(product.price));
        productPrice.textContent = formattedPrice;
    }

    if (productDescription) {
        productDescription.textContent = product.description || 'No description available.';
    }

    // Store information
    const storeImage = document.getElementById('storeImage');
    const storeName = document.getElementById('storeName');
    const storeLocation = document.getElementById('storeLocation');
    const storeRating = document.getElementById('storeRating');

    if (product.store_info) {
        if (storeImage) {
            // Use seller_photo for transparency (shows actual seller's face)
            // Fallback to default if no photo uploaded yet
            const sellerPhoto = product.store_info.seller_photo && product.store_info.seller_photo.startsWith('http')
                ? product.store_info.seller_photo
                : 'https://res.cloudinary.com/dpmxcjkfl/image/upload/v1762100746/covu-flyer_hotir6.png';
            storeImage.src = sellerPhoto;
        }
        if (storeName) storeName.textContent = product.store_info.name;
        if (storeLocation) {
            const location = `${product.store_info.city}, ${product.store_info.state}`;
            storeLocation.textContent = location;
        }
        if (storeRating) storeRating.textContent = product.store_info.average_rating || '0.0';
        if (productStars) {
            productStars.innerHTML = createStars(product.store_info.average_rating || 0);
        }
    }

    // Product features
    const featuresContainer = document.getElementById('productFeatures');
    if (featuresContainer && product.premium_quality !== undefined) {
        const features = [];
        if (product.premium_quality) features.push('Premium Quality');
        if (product.durable) features.push('Durable');
        if (product.modern_design) features.push('Modern Design');
        if (product.easy_maintain) features.push('Easy to Maintain');

        if (features.length > 0) {
            featuresContainer.innerHTML = features.map(feature => 
                `<span class="inline-block bg-primary-orange/10 text-primary-orange px-3 py-1 rounded-full text-sm">${feature}</span>`
            ).join('');
        }
    }

    // Category badge
    const categoryBadge = document.getElementById('productCategory');
    if (categoryBadge) {
        categoryBadge.textContent = getCategoryDisplay(product.category);
    }

    // Initialize icons
    lucide.createIcons();
}

function getCategoryDisplay(category) {
    if (!category) return 'Uncategorized';
    
    // Convert to lowercase for consistent mapping
    const lowerCategory = category.toLowerCase();
    
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
    
    return categoryMap[lowerCategory] || category;
}

// Load related products from backend
async function loadRelatedProducts(category) {
    try {
        if (!category) {
            console.log('No category provided for related products');
            return;
        }
        
        // Convert category to lowercase for API
        const categoryLower = category.toLowerCase();
        
        // Fetch products from same category
        const endpoint = `${API_CONFIG.ENDPOINTS.PRODUCTS}?category=${categoryLower}`;
        console.log('Loading related products from:', endpoint);
        const response = await api.get(endpoint);
        console.log('Related products response:', response);

        // Handle both wrapped and direct responses
        let results = [];
        if (response.success && response.data && response.data.results) {
            results = response.data.results;
        } else if (response.results) {
            results = response.results;
        } else if (Array.isArray(response)) {
            results = response;
        }

        if (results.length > 0) {
            // Filter out current product and take first 4
            const relatedProducts = results
                .filter(p => p.id !== currentProduct.id)
                .slice(0, 4)
                .map(product => ({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    image: product.images && product.images.startsWith('http') 
                        ? product.images 
                        : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'
                }));

            const relatedContainer = document.getElementById('relatedProducts');
            if (relatedContainer && relatedProducts.length > 0) {
                relatedContainer.innerHTML = '';
                relatedProducts.forEach(product => {
                    const productCard = createRelatedProductCard(product);
                    relatedContainer.appendChild(productCard);
                });
                lucide.createIcons();
            }
        } else {
            console.log('No related products found');
        }
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

// Create related product card
function createRelatedProductCard(product) {
    const card = document.createElement('div');
    card.className = 'bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer';
    
    const formattedPrice = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(product.price);

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover" loading="lazy">
        <div class="p-3">
            <h4 class="text-sm font-medium text-gray-800 mb-1 line-clamp-2">${product.name}</h4>
            <p class="text-primary-orange font-semibold">${formattedPrice}</p>
        </div>
    `;

    card.addEventListener('click', () => {
        // Navigate to the product detail page with the product ID
        window.location.href = `product-detail.html?id=${product.id}`;
    });

    return card;
}

// Create star rating
function createStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i data-lucide="star" class="h-4 w-4 fill-current text-yellow-400"></i>';
    }

    if (hasHalfStar) {
        stars += '<i data-lucide="star" class="h-4 w-4 fill-current text-yellow-400 opacity-50"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i data-lucide="star" class="h-4 w-4 text-gray-300"></i>';
    }

    return stars;
}

// Setup Buy Now button functionality
function setupBuyNowButton() {
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (currentProduct) {
                // Store product in localStorage for purchase page
                localStorage.setItem('selectedProduct', JSON.stringify(currentProduct));
                // Navigate to purchase page
                window.location.href = 'purchase.html';
            }
        });
    }
}

// Back button functionality
function setupBackButton() {
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    }
}

// Setup image lightbox functionality
function setupImageLightbox() {
    const productImageContainer = document.getElementById('productImageContainer');
    const productImage = document.getElementById('productImage');
    const imageLightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeLightbox = document.getElementById('closeLightbox');

    if (productImageContainer && imageLightbox) {
        // Open lightbox when clicking product image
        productImageContainer.addEventListener('click', () => {
            if (productImage.src) {
                lightboxImage.src = productImage.src;
                imageLightbox.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
                lucide.createIcons(); // Initialize icons in lightbox
            }
        });

        // Close lightbox when clicking close button
        if (closeLightbox) {
            closeLightbox.addEventListener('click', closeLightboxModal);
        }

        // Close lightbox when clicking outside image
        imageLightbox.addEventListener('click', (e) => {
            if (e.target === imageLightbox) {
                closeLightboxModal();
            }
        });

        // Close lightbox with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !imageLightbox.classList.contains('hidden')) {
                closeLightboxModal();
            }
        });
    }
}

// Close lightbox modal
function closeLightboxModal() {
    const imageLightbox = document.getElementById('imageLightbox');
    if (imageLightbox) {
        imageLightbox.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Loading and Error States
function showLoading() {
    const productName = document.getElementById('productName');
    if (productName) {
        productName.textContent = 'Loading product details...';
    }
}

function hideLoading() {
    // Loading state is replaced by actual content
}

function showError(message) {
    const productName = document.getElementById('productName');
    if (productName) {
        productName.textContent = message;
        productName.className = 'text-red-500 text-xl font-semibold';
    }
}