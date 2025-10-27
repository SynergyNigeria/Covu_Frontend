// Global rating popup logic for Covu
// Place this script on all pages (e.g., include in base template)

(function() {
    // Helper: Create modal HTML
    async function createRatingModal(orderId) {
        console.log('[GlobalRating] Opening rating modal for order:', orderId);
        // Remove any existing modal
        const existing = document.getElementById('globalRatingModal');
        if (existing) existing.remove();

        // Try to fetch order details to get seller/store name
        let storeName = '';
        try {
            let api = window.api || (window.APIHandler && new window.APIHandler());
            if (!api) {
                console.error('[GlobalRating] API handler not available when fetching order details.');
                throw new Error('API not available');
            }
            // Try to get order details (assume endpoint: /orders/{id}/)
            const order = await api.get(`/orders/${orderId}/`);
            console.log('[GlobalRating] Order details:', order);
            if (order && order.product && order.product.store_name) {
                storeName = order.product.store_name;
            } else if (order && order.store_name) {
                storeName = order.store_name;
            } else if (order && order.product && order.product.store && order.product.store.name) {
                storeName = order.product.store.name;
            }
        } catch (e) {
            console.warn('[GlobalRating] Could not fetch store name for order:', e);
            storeName = '';
        }

        const modal = document.createElement('div');
        modal.id = 'globalRatingModal';
        modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
            <div style="background:#fff;padding:2rem 1.5rem;border-radius:1rem;max-width:95vw;width:370px;box-shadow:0 8px 32px rgba(0,0,0,0.18);text-align:center;">
                <h2 style="font-size:1.2rem;font-weight:600;margin-bottom:0.7rem;">You just completed an order purchase${storeName ? ` from <span style='color:#ff6b35'>${storeName}</span>` : ''}!</h2>
                <div style="font-size:1rem;color:#444;margin-bottom:1.1rem;">Please rate this seller and tell us your experience. Your feedback helps us improve Covu for everyone.</div>
                <div id="ratingStars" style="margin-bottom:1rem;font-size:2rem;">
                    ${[1,2,3,4,5].map(i=>`<span data-star="${i}" style="cursor:pointer;color:#ccc;">&#9733;</span>`).join('')}
                </div>
                <textarea id="ratingReview" rows="3" style="width:100%;border:1px solid #eee;border-radius:0.5rem;padding:0.5rem;margin-bottom:1rem;resize:none;" placeholder="Optional review..."></textarea>
                <button id="submitRatingBtn" style="background:#ff6b35;color:#fff;padding:0.7rem 1.5rem;border:none;border-radius:0.5rem;font-weight:600;cursor:pointer;">Submit</button>
                <button id="dismissRatingBtn" style="margin-left:1rem;background:#eee;color:#333;padding:0.7rem 1.5rem;border:none;border-radius:0.5rem;font-weight:500;cursor:pointer;">Later</button>
                <div id="ratingError" style="color:#d00;font-size:0.95rem;margin-top:0.7rem;display:none;"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Star selection logic
        let selected = 0;
        const stars = modal.querySelectorAll('[data-star]');
        stars.forEach(star => {
            star.addEventListener('mouseenter', function() {
                const val = parseInt(this.getAttribute('data-star'));
                stars.forEach(s => s.style.color = parseInt(s.getAttribute('data-star')) <= val ? '#ffb400' : '#ccc');
            });
            star.addEventListener('mouseleave', function() {
                stars.forEach(s => s.style.color = parseInt(s.getAttribute('data-star')) <= selected ? '#ffb400' : '#ccc');
            });
            star.addEventListener('click', function() {
                selected = parseInt(this.getAttribute('data-star'));
                stars.forEach(s => s.style.color = parseInt(s.getAttribute('data-star')) <= selected ? '#ffb400' : '#ccc');
            });
        });

        // Submit handler
        modal.querySelector('#submitRatingBtn').onclick = async function() {
            if (!selected) {
                showError('Please select a star rating.');
                return;
            }
            const review = modal.querySelector('#ratingReview').value.trim();
            try {
                let api = window.api || (window.APIHandler && new window.APIHandler());
                if (!api) {
                    console.error('[GlobalRating] API handler not available on submit.');
                    throw new Error('API not available');
                }
                console.log('[GlobalRating] Submitting rating:', {order_id: orderId, rating: selected, review});
                await api.post('/ratings/', {
                    order_id: orderId,
                    rating: selected,
                    review: review
                });
                localStorage.removeItem('pendingRatingOrderId');
                modal.innerHTML = `<div style='padding:2rem 1rem;'><h2 style='color:#2d5a3d'>Thank you for your feedback!</h2><p>Your rating has been submitted for moderation.</p></div>`;
                setTimeout(()=>modal.remove(), 2500);
            } catch (err) {
                console.error('[GlobalRating] Error submitting rating:', err);
                showError((err && err.message) ? err.message : 'Failed to submit rating. Please make sure you are logged in.');
            }
        };
        // Dismiss handler
        modal.querySelector('#dismissRatingBtn').onclick = function() {
            localStorage.removeItem('pendingRatingOrderId');
            modal.remove();
        };
        function showError(msg) {
            const err = modal.querySelector('#ratingError');
            err.textContent = msg;
            err.style.display = 'block';
        }
    }

    // On page load, check for pending rating
    document.addEventListener('DOMContentLoaded', function() {
        const orderId = localStorage.getItem('pendingRatingOrderId');
        if (orderId) {
            console.log('[GlobalRating] Pending rating orderId found:', orderId);
            setTimeout(()=>createRatingModal(orderId), 800); // slight delay for UX
        } else {
            console.log('[GlobalRating] No pending rating orderId found.');
        }
    });

    // Expose a helper to set the flag after order confirmation
    window.setPendingRatingOrder = function(orderId) {
        localStorage.setItem('pendingRatingOrderId', orderId);
    };
})();
