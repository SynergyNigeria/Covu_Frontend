// Seller Gallery JavaScript - API Integration
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();

    // Global variables
    let currentProducts = [];
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;
    let api = null;

    // Wait for API to be available
    waitForAPI().then(() => {
        // Load products and initialize
        loadSellerProducts();
        setupEventListeners();
    }).catch(error => {
        console.error('Failed to initialize API:', error);
        showToast('Failed to connect to server. Please refresh the page.', 'error');
    });

    async function waitForAPI() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkAPI = () => {
                if (typeof APIHandler !== 'undefined') {
                    api = new APIHandler();
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkAPI, 100);
                } else {
                    reject(new Error('API handler not available'));
                }
            };
            
            checkAPI();
        });
    }

    async function loadSellerProducts(page = 1, append = false) {
        if (isLoading) return;
        
        isLoading = true;
        
        try {
            showLoadingState(!append);
            
            // Fetch seller's products from API
            const response = await api.request('/products/my_products/', {
                params: { page, page_size: API_CONFIG.PAGE_SIZE }
            });

            const products = response.results || [];
            
            if (append) {
                currentProducts = [...currentProducts, ...products];
            } else {
                currentProducts = products;
            }

            // Update pagination info
            hasMore = response.next !== null;
            currentPage = page;

            // Update statistics
            updateStatistics(response);

            // Display products in gallery
            displayProducts(currentProducts, append);
            
            // Show/hide load more button
            toggleLoadMoreButton();
        } catch (error) {
            console.error('Error loading products:', error);
            showToast('Failed to load products. Please try again.', 'error');
            
            // Show empty state if first load failed
            if (!append) {
                showEmptyState();
            }
        } finally {
            isLoading = false;
            hideLoadingState();
        }
    }

    function updateStatistics(data) {
        const totalProducts = data.count || currentProducts.length;
        const activeProducts = currentProducts.filter(p => p.is_active).length;
        
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('activeProducts').textContent = activeProducts;
        
        // Mock total views - this could be added to your backend model
        const totalViews = Math.floor(Math.random() * totalProducts * 100) + (totalProducts * 10);
        document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    }

    function displayProducts(products, append = false) {
        const gallery = document.getElementById('productsGallery');
        const emptyState = document.getElementById('emptyState');

        if (products.length === 0 && !append) {
            showEmptyState();
            return;
        }

        // Hide empty state if we have products
        emptyState.classList.add('hidden');

        const productHTML = products.map((product, index) => `
            <div class="relative group cursor-pointer overflow-hidden rounded-lg" onclick="openProductModal('${product.id}')">
                <div class="aspect-square bg-gray-100 relative overflow-hidden">
                    <img src="${getProductImageUrl(product)}"
                         alt="${product.name}"
                         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                         onerror="this.src='${getCloudImage(index)}'">

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
                            product.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }">
                            ${product.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <!-- Price overlay -->
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div class="text-white font-semibold text-sm">₦${parseFloat(product.price).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `).join('');

        if (append) {
            gallery.innerHTML += productHTML;
        } else {
            gallery.innerHTML = productHTML;
        }

        // Re-initialize icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    function getProductImageUrl(product) {
        if (product.images) {
            // Handle Cloudinary URL from backend
            return product.images.url || product.images;
        }
        return getCloudImage(0);
    }

    function showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const gallery = document.getElementById('productsGallery');
        
        gallery.innerHTML = '';
        emptyState.classList.remove('hidden');
    }

    function showLoadingState(clearGallery = false) {
        if (clearGallery) {
            const gallery = document.getElementById('productsGallery');
            gallery.innerHTML = `
                <div class="col-span-full flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading your products...</p>
                    </div>
                </div>
            `;
        }
    }

    function hideLoadingState() {
        // Loading state will be replaced by actual content
    }

    function toggleLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (hasMore && currentProducts.length > 0) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
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

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', handleLoadMore);
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

        // Edit Product Modal
        const closeEditProductModal = document.getElementById('closeEditProductModal');
        const cancelEditProduct = document.getElementById('cancelEditProduct');
        const editProductForm = document.getElementById('editProductForm');
        const editProductPhoto = document.getElementById('editProductPhoto');
        const editPhotoPreview = document.getElementById('editPhotoPreview');

        if (closeEditProductModal) {
            closeEditProductModal.addEventListener('click', closeEditProductModalFunc);
        }

        if (cancelEditProduct) {
            cancelEditProduct.addEventListener('click', closeEditProductModalFunc);
        }

        if (editProductForm) {
            editProductForm.addEventListener('submit', handleEditProductSubmit);
        }

        // Edit photo upload functionality
        if (editProductPhoto && editPhotoPreview) {
            editProductPhoto.addEventListener('change', handleEditPhotoUpload);
            editPhotoPreview.addEventListener('click', () => editProductPhoto.click());
        }

        // Close modal on background click
        const productModal = document.getElementById('productModal');
        const addProductModal = document.getElementById('addProductModal');
        const editProductModal = document.getElementById('editProductModal');

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

        if (editProductModal) {
            editProductModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeEditProductModalFunc();
                }
            });
        }
    }

    function openProductModal(productId) {
        // Find product in current products array
        const product = currentProducts.find(p => p.id === productId);
        if (!product) return;

        // Populate modal with product data
        document.getElementById('modalProductName').textContent = product.name;
        document.getElementById('modalProductNameDisplay').textContent = product.name;
        document.getElementById('modalProductPrice').textContent = `₦${parseFloat(product.price).toLocaleString()}`;
        document.getElementById('modalProductDescription').textContent = product.description || 'Beautiful product showcasing quality craftsmanship and attention to detail.';

        // Set product image
        const imageElement = document.getElementById('modalProductImage');
        imageElement.src = getProductImageUrl(product);
        imageElement.alt = product.name;

        // Set status badge
        const statusElement = document.getElementById('modalProductStatus');
        const isActive = product.is_active;
        statusElement.textContent = isActive ? 'Active' : 'Inactive';
        statusElement.className = `px-3 py-1 rounded-full text-sm font-medium ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`;

        // Mock stats for demo (these could be added to your backend model)
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

    function closeEditProductModalFunc() {
        document.getElementById('editProductModal').classList.add('hidden');
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

    function handleEditPhotoUpload(event) {
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
            const previewImg = document.getElementById('editPhotoPreviewImg');
            const placeholder = document.getElementById('editPhotoPlaceholder');

            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    async function handleAddProductSubmit(e) {
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

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding Product...</span>
                </div>
            `;

            // Check if user has a store first
            const currentUser = api.getCurrentUser();
            if (!currentUser || !currentUser.is_seller) {
                showToast('You need to become a seller first to add products.', 'error');
                return;
            }

            // Prepare form data for API
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            // Note: store will be auto-assigned by backend based on authenticated user
            
            // Map frontend categories to backend categories
            const categoryMapping = {
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
            
            formData.append('category', categoryMapping[category] || category.toLowerCase().replace(' ', '_'));
            formData.append('images', photoFile);
            
            // Key feature flags from checkboxes
            const premiumQuality = document.getElementById('premiumQuality').checked;
            const durable = document.getElementById('durable').checked;
            const modernDesign = document.getElementById('modernDesign').checked;
            const easyMaintain = document.getElementById('easyMaintain').checked;
            
            formData.append('premium_quality', premiumQuality);
            formData.append('durable', durable);
            formData.append('modern_design', modernDesign);
            formData.append('easy_maintain', easyMaintain);

            // Create product via API
            const response = await api.request('/products/', {
                method: 'POST',
                data: formData,
                isFormData: true
            });

            // Close modal and show success
            closeAddProductModalFunc();
            showToast('Product added successfully!', 'success');

            // Reload gallery to show new product
            loadSellerProducts();
        } catch (error) {
            console.error('Error creating product:', error);
            
            // Handle specific error messages
            let errorMessage = 'Failed to add product. Please try again.';
            
            if (error.errors) {
                if (error.errors.non_field_errors) {
                    errorMessage = Array.isArray(error.errors.non_field_errors) ? error.errors.non_field_errors[0] : error.errors.non_field_errors;
                } else if (error.errors.category) {
                    errorMessage = 'Category validation error: ' + (Array.isArray(error.errors.category) ? error.errors.category[0] : error.errors.category);
                } else if (error.errors.images) {
                    errorMessage = 'Image validation error: ' + (Array.isArray(error.errors.images) ? error.errors.images[0] : error.errors.images);
                } else if (error.errors.name) {
                    errorMessage = 'Name validation error: ' + (Array.isArray(error.errors.name) ? error.errors.name[0] : error.errors.name);
                } else if (error.errors.price) {
                    errorMessage = 'Price validation error: ' + (Array.isArray(error.errors.price) ? error.errors.price[0] : error.errors.price);
                } else if (error.errors.detail) {
                    errorMessage = error.errors.detail;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showToast(errorMessage, 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function handleEditProduct() {
        const productId = document.getElementById('productModal').dataset.productId;
        const product = currentProducts.find(p => p.id === productId);
        
        if (!product) {
            showToast('Product not found', 'error');
            return;
        }
        
        // Close product detail modal
        document.getElementById('productModal').classList.add('hidden');
        
        // Open edit modal and populate with product data
        openEditProductModal(product);
    }
    
    function openEditProductModal(product) {
        const modal = document.getElementById('editProductModal');
        const form = document.getElementById('editProductForm');
        
        // Store product ID in modal for later use
        modal.dataset.productId = product.id;
        
        // Populate form fields
        document.getElementById('editProductName').value = product.name || '';
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('editProductPrice').value = product.price || '';
        document.getElementById('editProductCategory').value = product.category || '';
        
        // Set checkboxes
        document.getElementById('editPremiumQuality').checked = product.premium_quality || false;
        document.getElementById('editDurable').checked = product.durable || false;
        document.getElementById('editModernDesign').checked = product.modern_design || false;
        document.getElementById('editEasyMaintain').checked = product.easy_maintain || false;
        
        // Set current image
        const previewImg = document.getElementById('editPhotoPreviewImg');
        const placeholder = document.getElementById('editPhotoPlaceholder');
        
        if (product.images) {
            previewImg.src = product.images;
            previewImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            previewImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Re-render icons
        setTimeout(() => lucide.createIcons(), 100);
    }

    async function handleEditProductSubmit(e) {
        e.preventDefault();

        const modal = document.getElementById('editProductModal');
        const productId = modal.dataset.productId;

        const name = document.getElementById('editProductName').value.trim();
        const description = document.getElementById('editProductDescription').value.trim();
        const price = parseFloat(document.getElementById('editProductPrice').value);
        const category = document.getElementById('editProductCategory').value;
        const photoFile = document.getElementById('editProductPhoto').files[0];

        // Validation
        if (!name) {
            showToast('Please enter a product name', 'error');
            return;
        }

        if (!description) {
            showToast('Please enter a product description', 'error');
            return;
        }

        if (!price || price <= 0) {
            showToast('Please enter a valid price', 'error');
            return;
        }

        if (!category) {
            showToast('Please select a category', 'error');
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
            </div>
        `;

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            
            // Map frontend categories to backend categories
            const categoryMapping = {
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
            
            formData.append('category', categoryMapping[category] || category.toLowerCase().replace(' ', '_'));

            // Add image if new one was selected
            if (photoFile) {
                formData.append('images', photoFile);
            }

            // Add key features
            const premiumQuality = document.getElementById('editPremiumQuality').checked;
            const durable = document.getElementById('editDurable').checked;
            const modernDesign = document.getElementById('editModernDesign').checked;
            const easyMaintain = document.getElementById('editEasyMaintain').checked;
            
            formData.append('premium_quality', premiumQuality);
            formData.append('durable', durable);
            formData.append('modern_design', modernDesign);
            formData.append('easy_maintain', easyMaintain);

            // Update product via API
            const response = await api.request(`/products/${productId}/`, {
                method: 'PATCH',
                data: formData,
                isFormData: true
            });

            // Close modal and show success
            closeEditProductModalFunc();
            showToast('Product updated successfully!', 'success');

            // Reload gallery to show updated product
            loadSellerProducts();
        } catch (error) {
            console.error('Error updating product:', error);
            console.error('Full error details:', JSON.stringify(error.errors, null, 2));
            
            // Handle specific error messages
            let errorMessage = 'Failed to update product. Please try again.';
            
            if (error.errors) {
                // Log all error fields for debugging
                console.log('Error fields:', Object.keys(error.errors));
                
                if (error.errors.non_field_errors) {
                    errorMessage = Array.isArray(error.errors.non_field_errors) ? error.errors.non_field_errors[0] : error.errors.non_field_errors;
                } else if (error.errors.category) {
                    errorMessage = 'Category validation error: ' + (Array.isArray(error.errors.category) ? error.errors.category[0] : error.errors.category);
                } else if (error.errors.images) {
                    errorMessage = 'Image validation error: ' + (Array.isArray(error.errors.images) ? error.errors.images[0] : error.errors.images);
                } else if (error.errors.name) {
                    errorMessage = 'Name validation error: ' + (Array.isArray(error.errors.name) ? error.errors.name[0] : error.errors.name);
                } else if (error.errors.price) {
                    errorMessage = 'Price validation error: ' + (Array.isArray(error.errors.price) ? error.errors.price[0] : error.errors.price);
                } else if (error.errors.detail) {
                    errorMessage = error.errors.detail;
                } else {
                    // Show the first error found
                    const firstErrorKey = Object.keys(error.errors)[0];
                    const firstError = error.errors[firstErrorKey];
                    errorMessage = `${firstErrorKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showToast(errorMessage, 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async function handleDeleteProduct() {
        const productId = document.getElementById('productModal').dataset.productId;

        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        // Show loading state
        const deleteBtn = document.getElementById('deleteProductBtn');
        const originalText = deleteBtn.innerHTML;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                <span>Deleting...</span>
            </div>
        `;

        try {
            // Delete product via API
            const response = await api.request(`/products/${productId}/`, {
                method: 'DELETE'
            });

            // Close modal
            document.getElementById('productModal').classList.add('hidden');
            
            // Show success message
            showToast('Product deleted successfully', 'success');

            // Reload gallery
            loadSellerProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast(error.message || 'Failed to delete product. Please try again.', 'error');
            
            // Reset button state
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = originalText;
        }
    }

    async function handleLoadMore() {
        if (isLoading || !hasMore) return;
        
        await loadSellerProducts(currentPage + 1, true);
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