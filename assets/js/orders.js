

// Orders page functionality
// Move displayOrders and dependencies above loadOrders to avoid ReferenceError
function displayOrders(orders, view) {
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
        const orderCard = createOrderCard(order, view);
        container.appendChild(orderCard);
    });

    // Re-initialize icons for new elements
    lucide.createIcons();
}

function createOrderCard(order, view) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm p-4';

    const statusInfo = getStatusInfo(order.status, view);
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
            ${statusInfo.button || statusInfo.secondaryButton ? createActionButton(order, statusInfo.button, statusInfo.secondaryButton) : ''}
        </div>
    `;

    return card;
}

function getStatusInfo(status, view) {
    // view: 'buyer' or 'seller'
    // status: PENDING, ACCEPTED, DELIVERED, CONFIRMED, CANCELLED
    if (view === 'seller') {
        switch (status) {
            case 'PENDING':
                return {
                    text: 'Pending',
                    class: 'status-pending',
                    description: 'New order. You must accept or cancel.',
                    button: { text: 'Accept Order', action: 'accept', class: 'bg-primary-green hover:bg-green-600' },
                    secondaryButton: { text: 'Cancel Order', action: 'cancel', class: 'bg-red-500 hover:bg-red-600' }
                };
            case 'ACCEPTED':
                return {
                    text: 'Accepted',
                    class: 'status-confirmed',
                    description: 'Preparing for delivery. Mark as delivered when ready.',
                    button: { text: 'Mark as Delivered', action: 'deliver', class: 'bg-primary-orange hover:bg-orange-600' },
                    secondaryButton: { text: 'Cancel Order', action: 'cancel', class: 'bg-red-500 hover:bg-red-600' }
                };
            case 'DELIVERED':
                return {
                    text: 'Delivered',
                    class: 'status-delivered',
                    description: 'Waiting for buyer to confirm receipt.',
                    button: null
                };
            case 'CONFIRMED':
                return {
                    text: 'Completed',
                    class: 'status-delivered',
                    description: 'Order completed. Payment released.',
                    button: null
                };
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    class: 'status-cancelled',
                    description: 'Order has been cancelled.',
                    button: null
                };
            default:
                return { text: status, class: '', description: '', button: null };
        }
    } else {
        // Buyer view
        switch (status) {
            case 'PENDING':
                return {
                    text: 'Pending',
                    class: 'status-pending',
                    description: 'Waiting for seller to accept.',
                    button: { text: 'Cancel Order', action: 'cancel', class: 'bg-red-500 hover:bg-red-600' }
                };
            case 'ACCEPTED':
                return {
                    text: 'Accepted',
                    class: 'status-confirmed',
                    description: 'Seller accepted. Preparing for delivery.',
                    button: null
                };
            case 'DELIVERED':
                return {
                    text: 'Delivered',
                    class: 'status-delivered',
                    description: 'Order delivered. Please confirm receipt.',
                    button: { text: 'Confirm Receipt', action: 'confirm', class: 'bg-primary-green hover:bg-green-600' }
                };
            case 'CONFIRMED':
                return {
                    text: 'Completed',
                    class: 'status-delivered',
                    description: 'Order completed successfully.',
                    button: null
                };
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    class: 'status-cancelled',
                    description: 'Order has been cancelled.',
                    button: null
                };
            default:
                return { text: status, class: '', description: '', button: null };
        }
    }
}

function createActionButton(order, buttonInfo, secondaryButtonInfo) {
    let html = '';
    if (buttonInfo) {
        html += `<button class="px-4 py-2 ${buttonInfo.class} text-white text-sm font-medium rounded-lg transition-colors mr-2" onclick="handleOrderAction('${order.id}', '${buttonInfo.action}')">${buttonInfo.text}</button>`;
    }
    if (secondaryButtonInfo) {
        html += `<button class="px-4 py-2 ${secondaryButtonInfo.class} text-white text-sm font-medium rounded-lg transition-colors" onclick="handleOrderAction('${order.id}', '${secondaryButtonInfo.action}')">${secondaryButtonInfo.text}</button>`;
    }
    return html;
}

async function loadOrders(view = 'buyer') {
    const container = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        // Show loading state
        container.innerHTML = '<div class="col-span-full text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div><p class="text-gray-600">Loading orders...</p></div>';
        emptyState.classList.add('hidden');

        // Fetch orders from backend API
        let response;
        if (view === 'seller') {
            response = await api.get(API_CONFIG.ENDPOINTS.ORDERS, { as_seller: 'true' });
        } else {
            response = await api.get(API_CONFIG.ENDPOINTS.ORDERS);
        }
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

        displayOrders(orders, view);

    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-circle" class="h-8 w-8 text-red-500"></i>
                </div>
                <p class="text-red-500 mb-4">Failed to load orders</p>
                <button onclick="loadOrders('${view}')" class="bg-primary-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                    Retry
                </button>
            </div>
        `;
        lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Lucide icons
    lucide.createIcons();

    // Detect if user is seller
    const user = api.getCurrentUser();
    const isSeller = user && user.is_seller;

    // Render tabs
    renderOrdersTabs(isSeller);

    // Load default tab (Purchases)
    await loadOrders('buyer');
});

function renderOrdersTabs(isSeller) {
    const tabsContainer = document.getElementById('ordersTabs');
    tabsContainer.innerHTML = '';

    // Purchases tab
    const purchasesTab = document.createElement('button');
    purchasesTab.id = 'tab-purchases';
    purchasesTab.className = 'px-6 py-2 rounded-lg font-medium text-gray-700 bg-orange-primary border border-gray-200 hover:bg-orange-500 transition-colors';
    purchasesTab.textContent = 'My Purchases';
    purchasesTab.onclick = () => switchOrdersTab('buyer');
    tabsContainer.appendChild(purchasesTab);

    if (isSeller) {
        // Sales tab
        const salesTab = document.createElement('button');
        salesTab.id = 'tab-sales';
        salesTab.className = 'px-6 py-2 rounded-lg font-medium text-gray-700 bg-orange-primary border border-gray-200 hover:bg-orange-500 transition-colors';
        salesTab.textContent = 'My Sales';
        salesTab.onclick = () => switchOrdersTab('seller');
        tabsContainer.appendChild(salesTab);
    }

    // Highlight default tab
    highlightOrdersTab('buyer');
}

function switchOrdersTab(tab) {
    highlightOrdersTab(tab);
    loadOrders(tab);
}

function highlightOrdersTab(tab) {
    const purchasesTab = document.getElementById('tab-purchases');
    const salesTab = document.getElementById('tab-sales');
    // Remove highlight from both first
    if (purchasesTab) purchasesTab.classList.remove('bg-primary-orange', 'text-white');
    if (salesTab) salesTab.classList.remove('bg-primary-orange', 'text-white');
    // Add highlight to the selected tab
    if (tab === 'buyer' || tab === 'tab-purchases') {
        if (purchasesTab) purchasesTab.classList.add('bg-primary-orange', 'text-white');
    } else if (tab === 'seller' || tab === 'tab-sales') {
        if (salesTab) salesTab.classList.add('bg-primary-orange', 'text-white');
    }

// Ensure user is authenticated before loading orders page
if (window.api && typeof window.api.isAuthenticated === 'function') {
    if (!window.api.isAuthenticated()) {
        window.location.href = 'login.html';
    }
} else {
    // If api is not loaded for some reason, fallback to redirect
    window.location.href = 'login.html';
}
// ...existing code...
async function loadOrders(view = 'buyer') {
    const container = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        // Show loading state
        container.innerHTML = '<div class="col-span-full text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div><p class="text-gray-600">Loading orders...</p></div>';
        emptyState.classList.add('hidden');

        // Fetch orders from backend API
        let response;
        if (view === 'seller') {
            response = await api.get(API_CONFIG.ENDPOINTS.ORDERS, { as_seller: 'true' });
        } else {
            response = await api.get(API_CONFIG.ENDPOINTS.ORDERS);
        }
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

    displayOrders(orders, view);

    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-circle" class="h-8 w-8 text-red-500"></i>
                </div>
                <p class="text-red-500 mb-4">Failed to load orders</p>
                <button onclick="loadOrders('${view}')" class="bg-primary-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                    Retry
                </button>
            </div>
        `;
        lucide.createIcons();
    }
}

function displayOrders(orders, view) {
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
        const orderCard = createOrderCard(order, view);
        container.appendChild(orderCard);
    });

    // Re-initialize icons for new elements
    lucide.createIcons();
}

function createOrderCard(order, view) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm p-4';

    const statusInfo = getStatusInfo(order.status, view);
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
            ${statusInfo.button || statusInfo.secondaryButton ? createActionButton(order, statusInfo.button, statusInfo.secondaryButton) : ''}
        </div>
    `;

    return card;
}

function getStatusInfo(status, view) {
    // view: 'buyer' or 'seller'
    // status: PENDING, ACCEPTED, DELIVERED, CONFIRMED, CANCELLED
    if (view === 'seller') {
        switch (status) {
            case 'PENDING':
                return {
                    text: 'Pending',
                    class: 'status-pending',
                    description: 'New order. You must accept or cancel.',
                    button: { text: 'Accept Order', action: 'accept', class: 'bg-primary-green hover:bg-green-600' },
                    secondaryButton: { text: 'Cancel Order', action: 'cancel', class: 'bg-red-500 hover:bg-red-600' }
                };
            case 'ACCEPTED':
                return {
                    text: 'Accepted',
                    class: 'status-confirmed',
                    description: 'Preparing for delivery. Mark as delivered when ready.',
                    button: { text: 'Mark as Delivered', action: 'deliver', class: 'bg-primary-orange hover:bg-orange-600' },
                    secondaryButton: { text: 'Cancel Order', action: 'cancel', class: 'bg-red-500 hover:bg-red-600' }
                };
            case 'DELIVERED':
                return {
                    text: 'Delivered',
                    class: 'status-delivered',
                    description: 'Waiting for buyer to confirm receipt.',
                    button: null
                };
            case 'CONFIRMED':
                return {
                    text: 'Completed',
                    class: 'status-delivered',
                    description: 'Order completed. Payment released.',
                    button: null
                };
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    class: 'status-cancelled',
                    description: 'Order has been cancelled.',
                    button: null
                };
            default:
                return { text: status, class: '', description: '', button: null };
        }
    } else {
        // Buyer view
        switch (status) {
            case 'PENDING':
                return {
                    text: 'Pending',
                    class: 'status-pending',
                    description: 'Waiting for seller to accept.',
                    button: { text: 'Cancel Order', action: 'cancel', class: 'bg-red-500 hover:bg-red-600' }
                };
            case 'ACCEPTED':
                return {
                    text: 'Accepted',
                    class: 'status-confirmed',
                    description: 'Seller accepted. Preparing for delivery.',
                    button: null
                };
            case 'DELIVERED':
                return {
                    text: 'Delivered',
                    class: 'status-delivered',
                    description: 'Order delivered. Please confirm receipt.',
                    button: { text: 'Confirm Receipt', action: 'confirm', class: 'bg-primary-green hover:bg-green-600' }
                };
            case 'CONFIRMED':
                return {
                    text: 'Completed',
                    class: 'status-delivered',
                    description: 'Order completed successfully.',
                    button: null
                };
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    class: 'status-cancelled',
                    description: 'Order has been cancelled.',
                    button: null
                };
            default:
                return { text: status, class: '', description: '', button: null };
        }
    }
}
}

function createActionButton(order, buttonInfo, secondaryButtonInfo) {
    let html = '';
    if (buttonInfo) {
        html += `<button class="px-4 py-2 ${buttonInfo.class} text-white text-sm font-medium rounded-lg transition-colors mr-2" onclick="handleOrderAction('${order.id}', '${buttonInfo.action}')">${buttonInfo.text}</button>`;
    }
    if (secondaryButtonInfo) {
        html += `<button class="px-4 py-2 ${secondaryButtonInfo.class} text-white text-sm font-medium rounded-lg transition-colors" onclick="handleOrderAction('${order.id}', '${secondaryButtonInfo.action}')">${secondaryButtonInfo.text}</button>`;
    }
    return html;
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
    } else if (action === 'accept') {
        showConfirmationModal({
            title: 'Accept Order',
            message: 'Do you want to accept this order? You will be responsible for fulfilling and delivering it.',
            icon: 'check-circle',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            confirmText: 'Yes, Accept Order',
            confirmClass: 'bg-primary-green hover:bg-green-700',
            onConfirm: async () => {
                await performOrderAction(orderId, action, 'accept');
            }
        });
    } else if (action === 'deliver') {
        showConfirmationModal({
            title: 'Mark as Delivered',
            message: 'Are you sure you want to mark this order as delivered? The buyer will be notified to confirm receipt.',
            icon: 'truck',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            confirmText: 'Yes, Mark as Delivered',
            confirmClass: 'bg-primary-orange hover:bg-orange-600',
            onConfirm: async () => {
                await performOrderAction(orderId, action, 'deliver');
            }
        });
    }
}

async function performOrderAction(orderId, action, actionType) {
    try {
        closeConfirmationModal();
        showMessage(`Processing ${actionType}...`, 'info');
        let response;
        if (actionType === 'cancel') {
            response = await api.post(API_CONFIG.ENDPOINTS.ORDER_CANCEL(orderId), { reason: 'Changed my mind' });
            showMessage('Order cancelled successfully. Refund processed to wallet.', 'success');
        } else if (actionType === 'confirm') {
            response = await api.post(API_CONFIG.ENDPOINTS.ORDER_CONFIRM(orderId), {});
            showMessage('Order confirmed successfully. Payment released to seller.', 'success');
            // Set pending rating flag for global popup
            if (window.setPendingRatingOrder) {
                window.setPendingRatingOrder(orderId);
            } else {
                localStorage.setItem('pendingRatingOrderId', orderId);
            }
        } else if (actionType === 'accept') {
            response = await api.post(API_CONFIG.ENDPOINTS.ORDER_ACCEPT(orderId), {});
            showMessage('Order accepted. Please prepare for delivery.', 'success');
        } else if (actionType === 'deliver') {
            response = await api.post(API_CONFIG.ENDPOINTS.ORDER_DELIVER(orderId), {});
            showMessage('Order marked as delivered. Buyer will be notified.', 'success');
        }
        // Reload orders display
        // Use last selected tab
        const activeTab = document.querySelector('.bg-primary-orange.text-white')?.id;
        let view = 'buyer';
        if (activeTab === 'tab-sales') view = 'seller';
        await loadOrders(view);
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