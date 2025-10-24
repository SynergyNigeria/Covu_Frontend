// Login Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();

    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const submitBtn = document.getElementById('submitBtn');

    // Check if user is already logged in
    if (api.isAuthenticated()) {
        // Redirect to shop list if already logged in
        window.location.href = 'shop-list.html';
        return;
    }

    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }

    // Password visibility toggle
    let passwordVisible = false;
    togglePasswordBtn.addEventListener('click', function() {
        passwordVisible = !passwordVisible;
        passwordInput.type = passwordVisible ? 'text' : 'password';

        const icon = togglePasswordBtn.querySelector('i');
        icon.setAttribute('data-lucide', passwordVisible ? 'eye-off' : 'eye');
        lucide.createIcons();
    });

    // Email validation
    emailInput.addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            showToast('Please enter a valid email address', 'error');
        }
    });

    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Email validation function
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Login handler
    async function handleLogin() {
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const rememberMe = rememberMeCheckbox.checked;

        // Validation
        let errors = [];

        // Email validation
        if (!email) {
            errors.push('Email is required');
        } else if (!validateEmail(email)) {
            errors.push('Please enter a valid email address');
        }

        // Password validation
        if (!password) {
            errors.push('Password is required');
        } else if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }

        // Show errors if any
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Signing in...';

        try {
            // Call backend API to authenticate
            const response = await api.post(API_CONFIG.ENDPOINTS.LOGIN, {
                email: email,
                password: password
            }, false); // false means no auth token needed for login

            // Store tokens and user data
            api.setTokens(response.access, response.refresh);
            api.setCurrentUser(response.user);

            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Success message
            showToast(`Welcome back, ${response.user.full_name}!`, 'success');

            // Redirect to shop list after a short delay
            setTimeout(() => {
                window.location.href = 'shop-list.html';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            
            // Handle different error types
            let errorMessage = 'An error occurred during login. Please try again.';
            
            if (error.response) {
                // API returned an error response
                if (error.response.status === 401) {
                    errorMessage = 'Invalid email or password. Please try again.';
                } else if (error.response.status === 400) {
                    errorMessage = error.response.data?.detail || 'Invalid login credentials.';
                } else if (error.response.status === 403) {
                    errorMessage = 'Your account has been deactivated. Please contact support.';
                } else if (error.response.data?.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data?.non_field_errors) {
                    errorMessage = error.response.data.non_field_errors[0];
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            showToast(errorMessage, 'error');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Sign In';
        }
    }

    // Toast notification system
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
});