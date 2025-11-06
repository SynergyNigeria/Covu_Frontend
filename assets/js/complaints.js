/**
 * Complaints & Reports System - Smart Version
 * Handles complaint/report submissions with auto-populate, conditional fields, and file uploads
 */

// Complaint categories fetched from backend
let complaintCategories = {};

// Initialize the complaints system
async function initializeComplaintsSystem() {
    try {
        // Fetch complaint categories from backend
        const data = await api.get('/complaints/categories/');
        
        if (data && data.categories) {
            complaintCategories = data.categories;
            console.log('✅ Complaint categories loaded:', complaintCategories);
        } else {
            console.error('❌ Failed to load complaint categories');
        }
    } catch (error) {
        console.error('❌ Error loading complaint categories:', error);
    }
}

// Populate category dropdown based on complaint type
function populateCategories(selectElement, complaintType) {
    selectElement.innerHTML = '<option value="">Select a category...</option>';
    
    const categories = complaintCategories[complaintType] || [];
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.label;
        selectElement.appendChild(option);
    });
}

// Show/hide conditional fields based on complaint type
function updateConditionalFields(complaintType) {
    const orderFields = document.getElementById('orderFields');
    const transactionFields = document.getElementById('transactionFields');
    const reportedUserFields = document.getElementById('reportedUserFields');
    
    // Hide all conditional fields first
    if (orderFields) orderFields.classList.add('hidden');
    if (transactionFields) transactionFields.classList.add('hidden');
    if (reportedUserFields) reportedUserFields.classList.add('hidden');
    
    // Show relevant fields based on type
    switch (complaintType) {
        case 'SELLER':
        case 'BUYER':
            if (reportedUserFields) reportedUserFields.classList.remove('hidden');
            break;
        case 'ORDER':
            if (orderFields) orderFields.classList.remove('hidden');
            break;
        case 'TRANSACTION':
            if (transactionFields) transactionFields.classList.remove('hidden');
            break;
    }
}

// Auto-populate user information
function autoPopulateUserInfo() {
    const user = api.getCurrentUser();
    
    if (user) {
        // Populate email fields if they exist
        const emailInputs = document.querySelectorAll('[data-auto-email]');
        emailInputs.forEach(input => {
            input.value = user.email || '';
        });
        
        // Populate phone fields if they exist
        const phoneInputs = document.querySelectorAll('[data-auto-phone]');
        phoneInputs.forEach(input => {
            input.value = user.phone_number || '';
        });
        
        // Populate name fields if they exist
        const nameInputs = document.querySelectorAll('[data-auto-name]');
        nameInputs.forEach(input => {
            input.value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        });
    }
}

// Load user's orders for complaint dropdown
async function loadUserOrdersForComplaint() {
    const orderSelect = document.getElementById('orderIdInput');
    if (!orderSelect) return;
    
    try {
        // Show loading state
        orderSelect.innerHTML = '<option value="">Loading your orders...</option>';
        orderSelect.disabled = true;
        
        // Fetch user's orders from API
        const response = await api.get('/orders/');
        
        let orders = [];
        if (response && response.results) {
            orders = response.results;
        } else if (Array.isArray(response)) {
            orders = response;
        }
        
        // Clear and populate dropdown
        orderSelect.innerHTML = '<option value="">Select an order...</option>';
        
        if (orders.length === 0) {
            orderSelect.innerHTML = '<option value="">No orders found</option>';
            return;
        }
        
        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        orders.forEach(order => {
            const option = document.createElement('option');
            option.value = order.order_number || order.id;
            
            // Format: "ORD-12345 - Product Name"
            const productName = order.product_name_snapshot || order.product_name || 'Unknown Product';
            const orderNumber = order.order_number || order.id;
            option.textContent = `${orderNumber} - ${productName}`;
            
            // Store full order data as data attribute for potential future use
            option.dataset.orderId = order.id;
            option.dataset.productName = productName;
            
            orderSelect.appendChild(option);
        });
        
        orderSelect.disabled = false;
        console.log(`✅ Loaded ${orders.length} orders for complaint form`);
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        orderSelect.innerHTML = '<option value="">Error loading orders</option>';
        orderSelect.disabled = false;
    }
}

// Submit complaint to backend
async function submitComplaint(formData, complaintType) {
    try {
        // Show loading state
        showToast('Submitting complaint...', 'info');
        
        // Use api.post with isFormData=true for file upload support
        const data = await api.post('/complaints/', formData, true, true);
        
        if (data && (data.id || data.complaint_number)) {
            // Show success message with complaint number
            showToast(
                `✅ Complaint submitted successfully! Reference: ${data.complaint_number}`,
                'success'
            );
            
            // Close modal and reset form
            hideAllComplaintModals();
            
            return true;
        } else {
            const errorMessage = data.error || data.message || 'Failed to submit complaint';
            showToast(`❌ ${errorMessage}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Error submitting complaint:', error);
        const errorMessage = error.message || 'Network error. Please try again.';
        showToast(`❌ ${errorMessage}`, 'error');
        return false;
    }
}

// Handle Report Seller Form
async function handleReportSellerSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const category = document.getElementById('sellerCategory').value;
    const reportedName = document.getElementById('reportedSellerName').value;
    
    formData.append('complaint_type', 'SELLER');
    formData.append('category', category);
    formData.append('urgency', document.getElementById('sellerUrgency').value);
    formData.append('description', document.getElementById('sellerDescription').value);
    formData.append('reported_user_name', reportedName);
    
    // Auto-generate subject
    const categoryLabel = document.getElementById('sellerCategory').selectedOptions[0]?.text || category;
    formData.append('subject', `Report Seller: ${categoryLabel} - ${reportedName}`);
    
    // Add attachment if present
    const attachment = document.getElementById('sellerAttachment').files[0];
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    await submitComplaint(formData, 'SELLER');
}

// Handle Report Buyer Form
async function handleReportBuyerSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const category = document.getElementById('buyerCategory').value;
    const reportedName = document.getElementById('reportedBuyerName').value;
    
    formData.append('complaint_type', 'BUYER');
    formData.append('category', category);
    formData.append('urgency', document.getElementById('buyerUrgency').value);
    formData.append('description', document.getElementById('buyerDescription').value);
    formData.append('reported_user_name', reportedName);
    
    // Auto-generate subject
    const categoryLabel = document.getElementById('buyerCategory').selectedOptions[0]?.text || category;
    formData.append('subject', `Report Buyer: ${categoryLabel} - ${reportedName}`);
    
    // Add attachment if present
    const attachment = document.getElementById('buyerAttachment').files[0];
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    await submitComplaint(formData, 'BUYER');
}

// Handle Report Order Form
async function handleReportOrderSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const orderSelect = document.getElementById('orderIdInput');
    const category = document.getElementById('orderCategory').value;
    const orderId = orderSelect.value;
    
    // Get product name from selected option
    const selectedOption = orderSelect.selectedOptions[0];
    const productName = selectedOption?.dataset.productName || 'Product';
    
    formData.append('complaint_type', 'ORDER');
    formData.append('category', category);
    formData.append('urgency', document.getElementById('orderUrgency').value);
    formData.append('description', document.getElementById('orderDescription').value);
    formData.append('order_id', orderId);
    
    // Auto-generate subject with product name
    const categoryLabel = document.getElementById('orderCategory').selectedOptions[0]?.text || category;
    formData.append('subject', `Order Issue: ${categoryLabel} - ${productName} (${orderId})`);
    
    // Add attachment if present
    const attachment = document.getElementById('orderAttachment').files[0];
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    await submitComplaint(formData, 'ORDER');
}

// Handle Report Transaction Form
async function handleReportTransactionSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const category = document.getElementById('transactionCategory').value;
    const transactionId = document.getElementById('transactionIdInput').value;
    
    formData.append('complaint_type', 'TRANSACTION');
    formData.append('category', category);
    formData.append('urgency', document.getElementById('transactionUrgency').value);
    formData.append('description', document.getElementById('transactionDescription').value);
    formData.append('transaction_id', transactionId);
    formData.append('transaction_type', document.getElementById('transactionTypeInput').value);
    
    // Auto-generate subject
    const categoryLabel = document.getElementById('transactionCategory').selectedOptions[0]?.text || category;
    formData.append('subject', `Transaction Issue: ${categoryLabel} - ${transactionId}`);
    
    // Add attachment if present
    const attachment = document.getElementById('transactionAttachment').files[0];
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    await submitComplaint(formData, 'TRANSACTION');
}

// Show/hide modal functions
function showReportSellerModal() {
    const modal = document.getElementById('reportSellerModal');
    if (modal) {
        modal.classList.remove('hidden');
        autoPopulateUserInfo();
        populateCategories(document.getElementById('sellerCategory'), 'SELLER');
    }
}

function hideReportSellerModal() {
    const modal = document.getElementById('reportSellerModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('reportSellerForm').reset();
    }
}

function showReportBuyerModal() {
    const modal = document.getElementById('reportBuyerModal');
    if (modal) {
        modal.classList.remove('hidden');
        autoPopulateUserInfo();
        populateCategories(document.getElementById('buyerCategory'), 'BUYER');
    }
}

function hideReportBuyerModal() {
    const modal = document.getElementById('reportBuyerModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('reportBuyerForm').reset();
    }
}

async function showReportProductModal() {
    const modal = document.getElementById('reportOrderModal');
    if (modal) {
        modal.classList.remove('hidden');
        autoPopulateUserInfo();
        populateCategories(document.getElementById('orderCategory'), 'ORDER');
        
        // Load user's orders for the dropdown
        await loadUserOrdersForComplaint();
    }
}

function hideReportProductModal() {
    const modal = document.getElementById('reportOrderModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('reportOrderForm').reset();
    }
}

function showReportTransactionModal() {
    const modal = document.getElementById('reportTransactionModal');
    if (modal) {
        modal.classList.remove('hidden');
        autoPopulateUserInfo();
        populateCategories(document.getElementById('transactionCategory'), 'TRANSACTION');
    }
}

function hideReportTransactionModal() {
    const modal = document.getElementById('reportTransactionModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('reportTransactionForm').reset();
    }
}

function hideAllComplaintModals() {
    hideReportSellerModal();
    hideReportBuyerModal();
    hideReportProductModal();
    hideReportTransactionModal();
}

// Help modal functions
function showHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    // Remove any existing toast
    const existingToast = document.getElementById('complaintToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.id = 'complaintToast';
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md text-center transition-all duration-300`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize complaints system
    initializeComplaintsSystem();
    
    // Auto-populate user info on modal open
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelpModal);
    }
    
    const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');
    if (closeHelpModalBtn) {
        closeHelpModalBtn.addEventListener('click', hideHelpModal);
    }
    
    // Set up form event listeners
    const reportSellerForm = document.getElementById('reportSellerForm');
    if (reportSellerForm) {
        reportSellerForm.addEventListener('submit', handleReportSellerSubmit);
    }
    
    const reportBuyerForm = document.getElementById('reportBuyerForm');
    if (reportBuyerForm) {
        reportBuyerForm.addEventListener('submit', handleReportBuyerSubmit);
    }
    
    const reportOrderForm = document.getElementById('reportOrderForm');
    if (reportOrderForm) {
        reportOrderForm.addEventListener('submit', handleReportOrderSubmit);
    }
    
    const reportTransactionForm = document.getElementById('reportTransactionForm');
    if (reportTransactionForm) {
        reportTransactionForm.addEventListener('submit', handleReportTransactionSubmit);
    }
});
