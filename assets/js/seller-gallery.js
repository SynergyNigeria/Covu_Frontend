// Seller Gallery JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();

    // Load products and initialize
    loadSellerProducts();
    setupEventListeners();

    function loadSellerProducts() {
        // Load products from localStorage
        const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');

        // For design purposes, always show sample products with cloud CDN images
        const sampleProducts = createSampleProducts();

        // Combine saved products with sample products
        const allProducts = [...savedProducts, ...sampleProducts];

        // Update statistics
        updateStatistics(allProducts);

        // Display products in gallery
        displayProducts(allProducts);
    }

    function updateStatistics(products) {
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.status === 'active').length;
        const totalViews = Math.floor(Math.random() * 10000) + 1000; // Mock views for now

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('activeProducts').textContent = activeProducts;
        document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    }

    function displayProducts(products) {
        const gallery = document.getElementById('productsGallery');
        const emptyState = document.getElementById('emptyState');

        // Always hide empty state since we show sample products
        emptyState.classList.add('hidden');

        gallery.innerHTML = products.map((product, index) => `
            <div class="relative group cursor-pointer overflow-hidden rounded-lg" onclick="openProductModal('${product.id}')">
                <div class="aspect-square bg-gray-100 relative overflow-hidden">
                    <img src="${product.image || getCloudImage(index)}"
                         alt="${product.name}"
                         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110">

                    <!-- Overlay on hover -->
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                            <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <i data-lucide="eye" class="h-4 w-4 text-gray-800"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Status indicator -->
                    <div class="absolute top-2 right-2">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${
                            product.status === 'active' ? 'bg-green-500 text-white' :
                            product.status === 'draft' ? 'bg-gray-500 text-white' :
                            'bg-red-500 text-white'
                        }">
                            ${product.status || 'draft'}
                        </span>
                    </div>

                    <!-- Price overlay -->
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div class="text-white font-semibold text-sm">₦${product.price?.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-initialize icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    function createSampleProducts() {
        const sampleProducts = [
            {
                id: 'sample-1',
                name: 'Elegant Handbag',
                price: 25000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-2',
                name: 'Designer Watch',
                price: 45000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-3',
                name: 'Premium Sneakers',
                price: 35000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-4',
                name: 'Wireless Headphones',
                price: 28000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-5',
                name: 'Smartphone Case',
                price: 5000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-6',
                name: 'Leather Wallet',
                price: 12000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-7',
                name: 'Sunglasses',
                price: 18000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-8',
                name: 'Perfume Bottle',
                price: 22000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-9',
                name: 'Coffee Mug',
                price: 3500,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-10',
                name: 'Notebook Set',
                price: 8000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-11',
                name: 'Desk Lamp',
                price: 15000,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center'
            },
            {
                id: 'sample-12',
                name: 'Water Bottle',
                price: 6500,
                status: 'active',
                image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop&crop=center'
            }
        ];

        return sampleProducts;
    }

    function getCloudImage(index) {
        // Fallback cloud images if no product image
        const fallbackImages = [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=400&fit=crop&crop=center'
        ];
        return fallbackImages[index % fallbackImages.length];
    }

    function setupEventListeners() {
        // Add product buttons
        const addProductBtn = document.getElementById('addProductBtn');
        const addFirstProductBtn = document.getElementById('addFirstProductBtn');

        if (addProductBtn) {
            addProductBtn.addEventListener('click', handleAddProduct);
        }

        if (addFirstProductBtn) {
            addFirstProductBtn.addEventListener('click', handleAddProduct);
        }

        // Product modal
        const closeProductModal = document.getElementById('closeProductModal');
        const editProductBtn = document.getElementById('editProductBtn');
        const deleteProductBtn = document.getElementById('deleteProductBtn');

        if (closeProductModal) {
            closeProductModal.addEventListener('click', () => {
                document.getElementById('productModal').classList.add('hidden');
            });
        }

        if (editProductBtn) {
            editProductBtn.addEventListener('click', handleEditProduct);
        }

        if (deleteProductBtn) {
            deleteProductBtn.addEventListener('click', handleDeleteProduct);
        }

        // Add Product Modal
        const closeAddProductModal = document.getElementById('closeAddProductModal');
        const cancelAddProduct = document.getElementById('cancelAddProduct');
        const addProductForm = document.getElementById('addProductForm');
        const productPhoto = document.getElementById('productPhoto');
        const photoPreview = document.getElementById('photoPreview');
        const changePhotoBtn = document.getElementById('changePhotoBtn');

        if (closeAddProductModal) {
            closeAddProductModal.addEventListener('click', closeAddProductModalFunc);
        }

        if (cancelAddProduct) {
            cancelAddProduct.addEventListener('click', closeAddProductModalFunc);
        }

        if (addProductForm) {
            addProductForm.addEventListener('submit', handleAddProductSubmit);
        }

        // Photo upload functionality
        if (productPhoto && photoPreview) {
            productPhoto.addEventListener('change', handlePhotoUpload);
            photoPreview.addEventListener('click', () => productPhoto.click());
        }

        if (changePhotoBtn) {
            changePhotoBtn.addEventListener('click', () => productPhoto.click());
        }

        // Close modal on background click
        const productModal = document.getElementById('productModal');
        const addProductModal = document.getElementById('addProductModal');

        if (productModal) {
            productModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.add('hidden');
                }
            });
        }

        if (addProductModal) {
            addProductModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeAddProductModalFunc();
                }
            });
        }
    }

    function openProductModal(productId) {
        // First check saved products in localStorage
        const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        let product = savedProducts.find(p => p.id === productId);

        // If not found in saved products, check sample products
        if (!product) {
            const sampleProducts = createSampleProducts();
            product = sampleProducts.find(p => p.id === productId);
        }

        if (!product) return;

        // Populate modal with product data
        document.getElementById('modalProductName').textContent = product.name;
        document.getElementById('modalProductNameDisplay').textContent = product.name;
        document.getElementById('modalProductPrice').textContent = `₦${product.price?.toLocaleString()}`;
        document.getElementById('modalProductDescription').textContent = product.description || 'Beautiful product showcasing quality craftsmanship and attention to detail.';

        // Set product image
        const imageElement = document.getElementById('modalProductImage');
        imageElement.src = product.image || getCloudImage(0);
        imageElement.alt = product.name;

        // Set status badge
        const statusElement = document.getElementById('modalProductStatus');
        statusElement.textContent = product.status || 'active';
        statusElement.className = `px-3 py-1 rounded-full text-sm font-medium ${
            product.status === 'active' ? 'bg-green-100 text-green-700' :
            product.status === 'draft' ? 'bg-gray-100 text-gray-600' :
            'bg-red-100 text-red-700'
        }`;

        // Mock stats for demo
        document.getElementById('modalViews').textContent = Math.floor(Math.random() * 500) + 50;
        document.getElementById('modalLikes').textContent = Math.floor(Math.random() * 100) + 10;
        document.getElementById('modalShares').textContent = Math.floor(Math.random() * 20) + 1;

        // Store current product ID for edit/delete actions
        document.getElementById('productModal').dataset.productId = productId;

        // Show modal
        document.getElementById('productModal').classList.remove('hidden');

        // Re-initialize icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    function handleAddProduct() {
        // Reset form
        document.getElementById('addProductForm').reset();
        resetPhotoPreview();

        // Show modal
        document.getElementById('addProductModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Re-initialize icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    function closeAddProductModalFunc() {
        document.getElementById('addProductModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    function handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPreview = document.getElementById('photoPreview');
            const changePhotoBtn = document.getElementById('changePhotoBtn');

            photoPreview.innerHTML = `
                <img src="${e.target.result}" alt="Product preview" class="w-full h-full object-cover">
            `;
            changePhotoBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    function resetPhotoPreview() {
        const photoPreview = document.getElementById('photoPreview');
        const changePhotoBtn = document.getElementById('changePhotoBtn');

        photoPreview.innerHTML = `
            <div class="text-center">
                <i data-lucide="camera" class="h-12 w-12 text-gray-400 mb-2"></i>
                <p class="text-sm text-gray-500">Click to upload photo</p>
                <p class="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
            </div>
        `;
        changePhotoBtn.classList.add('hidden');

        // Reset file input
        document.getElementById('productPhoto').value = '';

        // Re-initialize icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    function handleAddProductSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('productName').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        const photoFile = document.getElementById('productPhoto').files[0];

        // Validation
        if (!name) {
            showToast('Please enter a product name', 'error');
            return;
        }

        if (!description) {
            showToast('Please enter a product description', 'error');
            return;
        }

        if (!price || price < 1) {
            showToast('Please enter a valid price', 'error');
            return;
        }

        if (!category) {
            showToast('Please select a category', 'error');
            return;
        }

        if (!photoFile) {
            showToast('Please upload a product photo', 'error');
            return;
        }

        // Create product object
        const newProduct = {
            id: 'product-' + Date.now(),
            name: name,
            description: description,
            price: price,
            category: category,
            status: 'active',
            image: null, // Will be set after file processing
            createdAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            shares: 0
        };

        // Process image file
        const reader = new FileReader();
        reader.onload = function(e) {
            newProduct.image = e.target.result;

            // Save to localStorage
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            products.push(newProduct);
            localStorage.setItem('products', JSON.stringify(products));

            // Close modal and show success
            closeAddProductModalFunc();
            showToast('Product added successfully!', 'success');

            // Reload gallery to show new product
            loadSellerProducts();
        };

        reader.onerror = function() {
            showToast('Error processing image. Please try again.', 'error');
        };

        reader.readAsDataURL(photoFile);
    }

    function handleEditProduct() {
        const productId = document.getElementById('productModal').dataset.productId;
        showToast('Edit Product feature coming soon!', 'info');
        document.getElementById('productModal').classList.add('hidden');
    }

    function handleDeleteProduct() {
        const productId = document.getElementById('productModal').dataset.productId;

        if (confirm('Are you sure you want to delete this product?')) {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const updatedProducts = products.filter(p => p.id !== productId);

            localStorage.setItem('products', JSON.stringify(updatedProducts));

            // Reload gallery
            loadSellerProducts();

            document.getElementById('productModal').classList.add('hidden');

            showToast('Product deleted successfully');
        }
    }

    function formatCurrency(amount) {
        return '₦' + amount.toLocaleString('en-NG');
    }

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

    // Make functions globally available
    window.openProductModal = openProductModal;
});