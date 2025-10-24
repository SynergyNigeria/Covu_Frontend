// Orders page functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Lucide icons
    lucide.createIcons();

    // Load and display orders from backend
    await loadOrders();
});

async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        // Show loading state
        container.innerHTML = '<div class="col-span-full text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div><p class="text-gray-600">Loading orders...</p></div>';
        emptyState.classList.add('hidden');

        // Fetch orders from backend API
        const response = await api.get(API_CONFIG.ENDPOINTS.ORDERS);
        console.log('Orders response:', response);

        // Handle different response formats
        let orders = [];
        if (response.results) {
            orders = response.results;
        } else if (Array.isArray(response)) {
            orders = response;
        } else if (response.data && response.data.results) {
            orders = response.data.results;
        }

        console.log('Processed orders:', orders);

        if (orders.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        displayOrders(orders);

    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-circle" class="h-8 w-8 text-red-500"></i>
                </div>
                <p class="text-red-500 mb-4">Failed to load orders</p>
                <button onclick="loadOrders()" class="bg-primary-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                    Retry
                </button>
            </div>
        `;
        lucide.createIcons();
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');

    if (orders.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '';

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        container.appendChild(orderCard);
    });

    // Re-initialize icons for new elements
    lucide.createIcons();
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm p-4';

    const statusInfo = getStatusInfo(order.status);
    const orderDate = formatDate(order.created_at);

    // Extract product details from backend response
    const productName = order.product?.name || 'Product';
    const productImage = order.product?.images || 'https://via.placeholder.com/100';
    const storeName = order.product?.store_name || 'Store';
    const totalAmount = parseFloat(order.total_amount);
    const orderNumber = order.order_number || order.id;

    card.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
            <img src="${productImage}" alt="${productName}" class="w-16 h-16 object-cover rounded-lg">
            <div class="flex-1">
                <h3 class="font-semibold text-gray-800 mb-1">${productName}</h3>
                <p class="text-sm text-gray-500 mb-1">${storeName}</p>
                <div class="flex items-center justify-between">
                    <span class="text-primary-orange font-bold">₦${totalAmount.toLocaleString()}</span>
                    <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>Order #${orderNumber}</span>
            <span>${orderDate}</span>
        </div>

        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
                ${statusInfo.description}
            </div>
            ${statusInfo.button ? createActionButton(order, statusInfo.button) : ''}
        </div>
    `;

    return card;
}

function getStatusInfo(status) {
    const statusMap = {
        'PENDING': {
            text: 'Pending',
            class: 'status-pending',
            description: 'Waiting for seller confirmation',
            button: { text: 'Cancel Order', action: 'cancel', class: 'bg-red-500 hover:bg-red-600' }
        },
        'ACCEPTED': {
            text: 'Accepted',
            class: 'status-confirmed',
            description: 'Seller accepted, preparing for delivery',
            button: null
        },
        'DELIVERED': {
            text: 'Delivered',
            class: 'status-delivered',
            description: 'Order delivered, please confirm receipt',
            button: { text: 'Confirm Receipt', action: 'confirm', class: 'bg-primary-green hover:bg-green-600' }
        },
        'CONFIRMED': {
            text: 'Completed',
            class: 'status-delivered',
            description: 'Order completed successfully',
            button: null
        },
        'CANCELLED': {
            text: 'Cancelled',
            class: 'status-cancelled',
            description: 'Order has been cancelled',
            button: null
        }
    };

    return statusMap[status] || statusMap['PENDING'];
}

function createActionButton(order, buttonInfo) {
    return `
        <button
            class="px-4 py-2 ${buttonInfo.class} text-white text-sm font-medium rounded-lg transition-colors"
            onclick="handleOrderAction('${order.id}', '${buttonInfo.action}')"
        >
            ${buttonInfo.text}
        </button>
    `;
}

async function handleOrderAction(orderId, action) {
    if (action === 'cancel') {
        showConfirmationModal({
            title: 'Cancel Order',
            message: 'Are you sure you want to cancel this order? Your wallet will be refunded with the full amount.',
            icon: 'alert-triangle',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            confirmText: 'Yes, Cancel Order',
            confirmClass: 'bg-red-500 hover:bg-red-600',
            onConfirm: async () => {
                await performOrderAction(orderId, action, 'cancel');
            }
        });
    } else if (action === 'confirm') {
        showConfirmationModal({
            title: 'Confirm Receipt',
            message: 'Please confirm that you have received this order in good condition. Once confirmed, the payment will be released to the seller and this action cannot be undone.',
            icon: 'check-circle',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            confirmText: 'Yes, Confirm Receipt',
            confirmClass: 'bg-primary-green hover:bg-green-700',
            details: '⚠️ Make sure you have inspected the product before confirming.',
            onConfirm: async () => {
                await performOrderAction(orderId, action, 'confirm');
            }
        });
    }
}

async function performOrderAction(orderId, action, actionType) {
    try {
        closeConfirmationModal();
        
        // Show loading message
        showMessage(`Processing ${actionType}...`, 'info');

        if (actionType === 'cancel') {
            // Call cancel order API
            const response = await api.post(API_CONFIG.ENDPOINTS.ORDER_CANCEL(orderId), {
                reason: 'Changed my mind'
            });

            showMessage('Order cancelled successfully. Refund processed to wallet.', 'success');
        } else if (actionType === 'confirm') {
            // Call confirm order API
            const response = await api.post(API_CONFIG.ENDPOINTS.ORDER_CONFIRM(orderId), {});

            showMessage('Order confirmed successfully. Payment released to seller.', 'success');
        }

        // Reload orders display
        await loadOrders();

    } catch (error) {
        console.error('Order action error:', error);
        const errorMessage = error.message || 'Failed to perform action. Please try again.';
        showMessage(errorMessage, 'error');
    }
}

function showConfirmationModal(options) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    const modalDetails = document.getElementById('modalDetails');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');

    // Set title and message
    modalTitle.textContent = options.title;
    modalMessage.textContent = options.message;

    // Set icon
    modalIcon.className = `w-12 h-12 rounded-full flex items-center justify-center ${options.iconBg}`;
    modalIcon.innerHTML = `<i data-lucide="${options.icon}" class="h-6 w-6 ${options.iconColor}"></i>`;

    // Set details if provided
    if (options.details) {
        modalDetails.textContent = options.details;
        modalDetails.classList.remove('hidden');
    } else {
        modalDetails.classList.add('hidden');
    }

    // Set confirm button
    modalConfirmBtn.textContent = options.confirmText;
    modalConfirmBtn.className = `flex-1 px-6 py-3 text-white font-medium rounded-lg transition-colors ${options.confirmClass}`;
    modalConfirmBtn.onclick = options.onConfirm;

    // Show modal
    modal.classList.remove('hidden');
    
    // Reinitialize icons
    lucide.createIcons();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.add('hidden');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

function showMessage(message, type) {
    const notification = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-orange-500'
    };
    
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${colors[type] || colors.info} text-white flex items-center gap-2`;
    
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        info: 'info',
        warning: 'alert-triangle'
    };
    
    notification.innerHTML = `
        <i data-lucide="${icons[type] || icons.info}" class="h-5 w-5"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);
    lucide.createIcons();

    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 'Today';
    } else if (diffDays === 2) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Make handleOrderAction globally available
window.handleOrderAction = handleOrderAction;

// Add keyboard support for modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('confirmationModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeConfirmationModal();
        }
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('confirmationModal');
    if (e.target === modal) {
        closeConfirmationModal();
    }
});