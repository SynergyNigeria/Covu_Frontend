// Shop Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();

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
            // Navigate to seller gallery page
            window.location.href = 'seller-gallery.html';
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

    function openStoreModal() {
        const modal = document.getElementById('storeModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Load current values
            loadStoreDetailsData();

            // Re-render icons
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }

    function openWithdrawalModal() {
        const modal = document.getElementById('withdrawalModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Reset form
            document.getElementById('withdrawalForm').reset();
            document.getElementById('bankDetails').classList.add('hidden');
            document.getElementById('withdrawalSummary').classList.add('hidden');

            // Re-render icons
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }

    function closeAllModals() {
        const modals = ['deliveryModal', 'contactModal', 'storeModal', 'withdrawalModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
        document.body.style.overflow = 'auto';
    }

    // Modal Event Listeners
    const closeDeliveryModal = document.getElementById('closeDeliveryModal');
    const cancelDelivery = document.getElementById('cancelDelivery');
    const deliveryForm = document.getElementById('deliveryForm');

    if (closeDeliveryModal) {
        closeDeliveryModal.addEventListener('click', closeAllModals);
    }
    if (cancelDelivery) {
        cancelDelivery.addEventListener('click', closeAllModals);
    }
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', handleDeliverySubmit);
    }

    const closeContactModal = document.getElementById('closeContactModal');
    const cancelContact = document.getElementById('cancelContact');
    const contactForm = document.getElementById('contactForm');

    if (closeContactModal) {
        closeContactModal.addEventListener('click', closeAllModals);
    }
    if (cancelContact) {
        cancelContact.addEventListener('click', closeAllModals);
    }
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
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

    // Load store data and update UI
    loadStoreData();

    function loadStoreData() {
        const storeData = JSON.parse(localStorage.getItem('storeData') || '{}');
        const products = JSON.parse(localStorage.getItem('products') || '[]');

        // Update hero stats
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.status === 'active').length;

        const totalProductsEl = document.getElementById('totalProducts');
        const activeProductsEl = document.getElementById('activeProducts');

        if (totalProductsEl) totalProductsEl.textContent = totalProducts;
        if (activeProductsEl) activeProductsEl.textContent = activeProducts;

        // Update store info
        const storeNameEl = document.getElementById('storeName');
        const storeDescriptionEl = document.getElementById('storeDescription');

        if (storeNameEl && storeData.name) {
            storeNameEl.textContent = storeData.name;
        }
        if (storeDescriptionEl && storeData.description) {
            storeDescriptionEl.textContent = storeData.description;
        }
    }

    function loadDeliveryData() {
        const storeData = JSON.parse(localStorage.getItem('storeData') || '{}');

        const deliveryRateSameEl = document.getElementById('deliveryRateSameModal');
        const deliveryRateOutsideEl = document.getElementById('deliveryRateOutsideModal');

        if (deliveryRateSameEl) {
            deliveryRateSameEl.value = storeData.deliveryRateSame || '';
        }
        if (deliveryRateOutsideEl) {
            deliveryRateOutsideEl.value = storeData.deliveryRateOutside || '';
        }
    }

    function loadContactData() {
        const storeData = JSON.parse(localStorage.getItem('storeData') || '{}');

        const whatsappEl = document.getElementById('whatsappNumberModal');
        const emailEl = document.getElementById('emailModal');
        const addressEl = document.getElementById('addressModal');

        if (whatsappEl) whatsappEl.value = storeData.whatsapp || '';
        if (emailEl) emailEl.value = storeData.email || '';
        if (addressEl) addressEl.value = storeData.address || '';
    }

    function loadStoreDetailsData() {
        const storeData = JSON.parse(localStorage.getItem('storeData') || '{}');

        const nameEl = document.getElementById('storeNameModal');
        const descriptionEl = document.getElementById('storeDescriptionModal');
        const categoryEl = document.getElementById('storeCategoryModal');

        if (nameEl) nameEl.value = storeData.name || '';
        if (descriptionEl) descriptionEl.value = storeData.description || '';
        if (categoryEl) categoryEl.value = storeData.category || '';
    }

    function handleDeliverySubmit(e) {
        e.preventDefault();

        const deliveryRateSame = document.getElementById('deliveryRateSameModal').value;
        const deliveryRateOutside = document.getElementById('deliveryRateOutsideModal').value;

        // Update store data
        const storeData = JSON.parse(localStorage.getItem('storeData') || '{}');
        storeData.deliveryRateSame = deliveryRateSame;
        storeData.deliveryRateOutside = deliveryRateOutside;
        localStorage.setItem('storeData', JSON.stringify(storeData));

        showToast('Delivery settings saved successfully!', 'success');
        closeAllModals();
    }

    function handleContactSubmit(e) {
        e.preventDefault();

        const whatsapp = document.getElementById('whatsappNumberModal').value;
        const email = document.getElementById('emailModal').value;
        const address = document.getElementById('addressModal').value;

        // Update store data
        const storeData = JSON.parse(localStorage.getItem('storeData') || '{}');
        storeData.whatsapp = whatsapp;
        storeData.email = email;
        storeData.address = address;
        localStorage.setItem('storeData', JSON.stringify(storeData));

        // Update display
        const storeDescriptionEl = document.getElementById('storeDescription');
        if (storeDescriptionEl && storeData.description) {
            storeDescriptionEl.textContent = storeData.description;
        }

        showToast('Contact information saved successfully!', 'success');
        closeAllModals();
    }

    function handleStoreSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('storeNameModal').value;
        const description = document.getElementById('storeDescriptionModal').value;
        const category = document.getElementById('storeCategoryModal').value;

        if (!name || !description) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Update store data
        const storeData = JSON.parse(localStorage.getItem('storeData') || '{}');
        storeData.name = name;
        storeData.description = description;
        storeData.category = category;
        localStorage.setItem('storeData', JSON.stringify(storeData));

        // Update display
        const storeNameEl = document.getElementById('storeName');
        const storeDescriptionEl = document.getElementById('storeDescription');

        if (storeNameEl) storeNameEl.textContent = name;
        if (storeDescriptionEl) storeDescriptionEl.textContent = description;

        showToast('Store details saved successfully!', 'success');
        closeAllModals();
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

    // Make functions globally available
    window.showToast = showToast;
    window.openStoreConfigModal = openStoreConfigModal;
});