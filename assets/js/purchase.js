// Purchase page functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Lucide icons
    lucide.createIcons();

    // Check if returning from Paystack payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('ref');
    
    if (paymentStatus === 'success' && reference) {
        // Show success message
        showToast('Payment successful! Updating wallet...', 'success');
        
        // Wait a moment for any background processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try to verify payment with backend
        try {
            const verifyResponse = await api.get(`/wallet/verify/${reference}/`);
            console.log('Payment verified:', verifyResponse);
            
            if (verifyResponse.status === 'success') {
                showToast(`Wallet credited: ${formatCurrency(verifyResponse.amount)}`, 'success');
            }
        } catch (error) {
            console.error('Verification error:', error);
            // Verification failed, but payment might still be processed
            // Just refresh the wallet balance to check
            showToast('Verifying payment status...', 'info');
        }
        
        // Clean URL (remove query parameters)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Always refresh wallet balance regardless of verification result
        try {
            const updatedUser = await api.get(API_CONFIG.ENDPOINTS.PROFILE);
            localStorage.setItem(API_CONFIG.TOKEN_KEYS.USER, JSON.stringify(updatedUser));
            
            // Update display
            const walletElement = document.getElementById('walletBalance');
            if (walletElement) {
                walletElement.textContent = formatCurrency(updatedUser.wallet_balance);
            }
            
            console.log('Wallet balance refreshed:', updatedUser.wallet_balance);
            
            // Show final success message
            setTimeout(() => {
                showToast('Wallet balance updated!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Error refreshing wallet balance:', error);
            showToast('Please refresh the page to see updated balance', 'warning');
        }
    }

    // Load product data from localStorage
    const currentBalance = await loadProductData();

    // Set up event listeners
    setupEventListeners(currentBalance);
});

async function loadProductData() {
    // Get product data from localStorage (set by product-detail.js)
    const productData = JSON.parse(localStorage.getItem('selectedProduct') || '{}');

    if (productData.name) {
        // Populate product information
        const imageUrl = productData.images || productData.image || '/assets/images/placeholder.jpg';
        document.getElementById('productImage').src = imageUrl;
        document.getElementById('productName').textContent = productData.name;
        document.getElementById('productStore').textContent = productData.store_name || productData.store || 'Store Name';
        document.getElementById('productPrice').textContent = formatCurrency(productData.price);

        // Calculate totals with delivery fee from store
        const subtotal = parseFloat(productData.price) || 0;
        
        // Get delivery fee from store_info (defaults to delivery_outside_lga if buyer location unknown)
        let deliveryFee = 2500; // Default fallback if no store_info
        
        if (productData.store_info) {
            // Get current user to check if same city as seller
            const currentUser = JSON.parse(localStorage.getItem(API_CONFIG.TOKEN_KEYS.USER) || '{}');
            
            if (currentUser.city && productData.store_info.city) {
                // Compare buyer's city with seller's city (case-insensitive)
                const buyerCity = currentUser.city.toLowerCase().trim();
                const sellerCity = productData.store_info.city.toLowerCase().trim();
                
                if (buyerCity === sellerCity) {
                    // Same city/LGA - use lower delivery fee
                    deliveryFee = parseFloat(productData.store_info.delivery_within_lga);
                } else {
                    // Different city - use higher delivery fee
                    deliveryFee = parseFloat(productData.store_info.delivery_outside_lga);
                }
            } else {
                // No buyer location info - use outside LGA fee (higher/safer default)
                deliveryFee = parseFloat(productData.store_info.delivery_outside_lga);
            }
        }
        
        const total = subtotal + deliveryFee;

        document.getElementById('subtotalAmount').textContent = formatCurrency(subtotal);
        document.getElementById('deliveryFeeAmount').textContent = formatCurrency(deliveryFee);
        document.getElementById('totalAmount').textContent = formatCurrency(total);

        // Pre-fill payment amount (readonly)
        document.getElementById('paymentAmount').value = total;
        
        // Store delivery fee for later use in order creation
        productData.calculatedDeliveryFee = deliveryFee;
        localStorage.setItem('selectedProduct', JSON.stringify(productData));
    } else {
        // Fallback if no product data
        console.warn('No product data found in localStorage');
        showToast('No product selected. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 2000);
    }

    // Load wallet balance from backend user data
    const balance = await loadWalletBalance();

    // Return balance for use in event listeners
    return balance;
}

async function loadWalletBalance() {
    try {
        // Fetch fresh user data from backend API
        const response = await api.get(API_CONFIG.ENDPOINTS.PROFILE);
        console.log('Fresh user data:', response);
        
        let user;
        if (response && (response.id || response.email)) {
            user = response;
        } else if (response.success && response.data) {
            user = response.data;
        } else if (response.user) {
            user = response.user;
        } else {
            throw new Error('Invalid profile response');
        }
        
        const balance = parseFloat(user.wallet_balance || 0);
        
        // Update localStorage with fresh data
        localStorage.setItem(API_CONFIG.TOKEN_KEYS.USER, JSON.stringify(user));
        
        // Update wallet balance display
        document.getElementById('walletBalance').textContent = formatCurrency(balance);
        
        console.log('Wallet balance loaded:', balance);
        return balance;
        
    } catch (error) {
        console.error('Error loading wallet balance:', error);
        
        // Fallback to cached data if API fails
        const currentUser = api.getCurrentUser();
        const balance = currentUser ? parseFloat(currentUser.wallet_balance || 0) : 0;
        document.getElementById('walletBalance').textContent = formatCurrency(balance);
        
        showToast('Could not refresh wallet balance. Using cached data.', 'warning');
        return balance;
    }
}

function setupEventListeners(currentBalance) {
    const proceedBtn = document.getElementById('proceedToPaymentBtn');
    const paymentAmountInput = document.getElementById('paymentAmount');
    const deliveryAddressInput = document.getElementById('deliveryAddress');
    const topUpBtn = document.getElementById('topUpBtn');

    // Get product data for order creation
    const productData = JSON.parse(localStorage.getItem('selectedProduct') || '{}');

    // Proceed to payment button (show confirmation modal)
    proceedBtn.addEventListener('click', function() {
        const paymentAmount = parseFloat(paymentAmountInput.value) || 0;
        const deliveryAddress = deliveryAddressInput.value.trim();
        const totalAmount = parseFloat(document.getElementById('totalAmount').textContent.replace('₦', '').replace(',', '')) || 0;

        // Validation
        if (!deliveryAddress) {
            alert('Please enter your delivery address.');
            deliveryAddressInput.focus();
            return;
        }

        if (deliveryAddress.length < 10) {
            alert('Please provide a detailed delivery address (at least 10 characters).');
            deliveryAddressInput.focus();
            return;
        }

        if (paymentAmount < totalAmount) {
            alert('Payment amount cannot be less than the total amount.');
            return;
        }

        if (paymentAmount > currentBalance) {
            alert('Insufficient wallet balance. Please top up your wallet first.');
            return;
        }

        // Show purchase confirmation modal
        showPurchaseModal(paymentAmount, productData, deliveryAddress);
    });

    // Top Up button (show modal)
    topUpBtn.addEventListener('click', function() {
        showTopUpModal();
    });

    // Top Up Modal event listeners
    setupTopUpModalListeners();
}

function formatCurrency(amount) {
    return '₦' + parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

function setupTopUpModalListeners() {
    const closeModalBtn = document.getElementById('closeTopUpModal');
    const cancelBtn = document.getElementById('cancelTopUp');
    const confirmBtn = document.getElementById('confirmTopUp');
    const topUpAmountInput = document.getElementById('topUpAmount');

    // Close modal buttons
    closeModalBtn.addEventListener('click', hideTopUpModal);
    cancelBtn.addEventListener('click', hideTopUpModal);

    // Confirm top-up button
    confirmBtn.addEventListener('click', function() {
        const amount = parseFloat(topUpAmountInput.value) || 0;

        if (amount < 100) {
            alert('Minimum top-up amount is ₦100.');
            return;
        }

        if (amount > 100000) {
            alert('Maximum top-up amount is ₦100,000.');
            return;
        }

        hideTopUpModal();
        processTopUp(amount);
    });

    // Allow Enter key to confirm
    topUpAmountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });

    // Auto-focus input when modal opens
    // This will be handled in showTopUpModal
}

function showTopUpModal() {
    const modal = document.getElementById('topUpModal');
    const amountInput = document.getElementById('topUpAmount');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Focus and select the input
    setTimeout(() => {
        amountInput.focus();
        amountInput.select();
    }, 100);
}

function hideTopUpModal() {
    const modal = document.getElementById('topUpModal');
    const amountInput = document.getElementById('topUpAmount');

    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling

    // Clear the input
    amountInput.value = '';
}

async function processTopUp(amount) {
    try {
        // Show loading toast
        showToast('Initializing payment with Paystack...');

        // Call backend to initialize Paystack payment
        const response = await api.post(API_CONFIG.ENDPOINTS.WALLET_FUND, {
            amount: amount
        });

        if (response.status === 'success') {
            // Backend returns Paystack authorization URL
            // Redirect user to Paystack payment page
            window.location.href = response.data.authorization_url;
        } else {
            throw new Error(response.message || 'Failed to initialize payment');
        }

    } catch (error) {
        console.error('Top-up error:', error);
        
        // Show error message
        alert(error.message || 'Failed to initialize payment. Please try again.');
    }
}

// Note: Payment happens on Paystack's site via backend
// Webhook automatically credits wallet after successful payment
// User will see updated balance when they return to the site

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Set the message
    toastMessage.textContent = message;

    // Remove previous type classes
    toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-orange-500');
    
    // Add type-specific styling
    if (type === 'success') {
        toast.classList.add('bg-green-500');
    } else if (type === 'error') {
        toast.classList.add('bg-red-500');
    } else if (type === 'warning') {
        toast.classList.add('bg-orange-500');
    } else {
        toast.classList.add('bg-blue-500');
    }

    // Show the toast
    toast.classList.remove('hidden');

    // Re-initialize icons for the toast
    lucide.createIcons();

    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);

    // Add slide-in animation
    toast.style.animation = 'slideInRight 0.3s ease-out';
}

// Add slide-in animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Purchase modal functions
function showPurchaseModal(paymentAmount, productData, deliveryAddress) {
    const modal = document.getElementById('purchaseModal');
    const loadingState = document.getElementById('purchaseLoadingState');
    const successState = document.getElementById('purchaseSuccessState');
    const orderIdElement = document.getElementById('orderId');
    const orderAmountElement = document.getElementById('orderAmount');

    // Show modal and loading state
    modal.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    successState.classList.add('hidden');

    // Set order amount in success state
    orderAmountElement.textContent = formatCurrency(paymentAmount);

    // Simulate processing delay
    setTimeout(() => {
        // Process the payment
        processPurchase(paymentAmount, productData, deliveryAddress, loadingState, successState, orderIdElement);
    }, 1500); // 1.5 second delay to show processing
}

async function processPurchase(paymentAmount, productData, deliveryAddress, loadingState, successState, orderIdElement) {
    try {
        console.log('Creating order...', {
            product_id: productData.id,
            delivery_address: deliveryAddress
        });

        // Call backend API to create order
        const response = await api.post(API_CONFIG.ENDPOINTS.ORDERS, {
            product_id: productData.id,
            delivery_address: deliveryAddress
        });

        console.log('Order created:', response);

        // Refresh wallet balance from backend
        await loadWalletBalance();

        // Show success state with animation
        loadingState.classList.add('hidden');
        successState.classList.remove('hidden');
        orderIdElement.textContent = response.order_number || response.id;

        // Animate the success tick
        const successTick = document.getElementById('successTick');
        successTick.classList.add('animate-pulse');

        // After 2 seconds, transition to order management message
        setTimeout(() => {
            const successMessage = document.getElementById('successMessage');
            const orderManagementMessage = document.getElementById('orderManagementMessage');

            successMessage.classList.add('hidden');
            orderManagementMessage.classList.remove('hidden');
        }, 2000);

        // Clear selected product from localStorage
        localStorage.removeItem('selectedProduct');

        // Show toast notification
        showToast('Order created successfully! Funds held in escrow.', 'success');

    } catch (error) {
        console.error('Order creation error:', error);

        let errorMessage = 'Failed to create order. Please try again.';

        if (error.message && error.message.includes('Insufficient funds')) {
            errorMessage = 'Insufficient wallet balance. Please top up your wallet.';
        } else if (error.errors && error.errors.error) {
            errorMessage = error.errors.error;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // Hide modal and show error
        document.getElementById('purchaseModal').classList.add('hidden');
        alert(errorMessage);
    }
}

// Purchase modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Purchase modal close button
    document.getElementById('purchaseModalClose').addEventListener('click', function() {
        document.getElementById('purchaseModal').classList.add('hidden');
    });

    // Purchase modal cancel button
    document.getElementById('cancelPurchaseBtn').addEventListener('click', function() {
        document.getElementById('purchaseModal').classList.add('hidden');
    });

    // Purchase modal view order button
    document.getElementById('viewOrderBtn').addEventListener('click', function() {
        window.location.href = 'orders.html';
    });
});