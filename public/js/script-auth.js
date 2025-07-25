// Authentication management
let currentUser = null;
let authToken = null;

// DOM elements
const authStatus = document.getElementById('authStatus');
const authModal = new bootstrap.Modal(document.getElementById('authModal'));
const authModalLabel = document.getElementById('authModalLabel');
const authError = document.getElementById('authError');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const mainContent = document.getElementById('mainContent');

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

async function initializeAuth() {
    try {
        // Check if user is already authenticated
        const response = await fetch('/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainContent();
        } else {
            showLoginModal();
        }
    } catch (error) {
        console.error('Auth initialization error:', error);
        showLoginModal();
    }
}

function showMainContent() {
    updateAuthStatus();
    mainContent.classList.remove('d-none');
    
    // Store current user globally for access from other scripts
    window.currentUser = currentUser;
    console.log('Current user stored:', currentUser._id);
    
    // Initialize JSON editor after main content is visible
    if (typeof initializeJSONEditor === 'function') {
        initializeJSONEditor();
    }
    
    // Initialize the main app functionality
    if (typeof fetchRoutes === 'function') {
        fetchRoutes();
    }
}

function hideMainContent() {
    mainContent.classList.add('d-none');
}

function updateAuthStatus() {
    if (currentUser) {
        authStatus.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user"></i> ${currentUser.name}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="showProfile()">
                        <i class="fas fa-user-edit"></i> Profile
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a></li>
                </ul>
            </div>
        `;
    } else {
        authStatus.innerHTML = `
            <button class="btn btn-primary" onclick="showLoginModal()">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
        `;
    }
}

function showLoginModal() {
    hideMainContent();
    setAuthMode('login');
    authModal.show();
}

function setAuthMode(mode) {
    if (mode === 'login') {
        authModalLabel.textContent = 'Login';
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        toggleAuthMode.textContent = "Don't have an account? Register here";
        toggleAuthMode.onclick = () => setAuthMode('register');
    } else {
        authModalLabel.textContent = 'Register';
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
        toggleAuthMode.textContent = "Already have an account? Login here";
        toggleAuthMode.onclick = () => setAuthMode('login');
    }
    hideAuthError();
}

function showAuthError(message) {
    authError.textContent = message;
    authError.classList.remove('d-none');
}

function hideAuthError() {
    authError.classList.add('d-none');
}

// Login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            authToken = data.token;
            authModal.hide();
            showMainContent();
            loginForm.reset();
        } else {
            showAuthError(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthError('Network error. Please try again.');
    }
});

// Register form handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showAuthError('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            authToken = data.token;
            authModal.hide();
            showMainContent();
            registerForm.reset();
        } else {
            showAuthError(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAuthError('Network error. Please try again.');
    }
});

async function logout() {
    try {
        await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        currentUser = null;
        authToken = null;
        hideMainContent();
        updateAuthStatus();
        showLoginModal();
    }
}

function showProfile() {
    // TODO: Implement profile modal
    alert('Profile management coming soon!');
}

// Utility function to make authenticated requests
async function authenticatedFetch(url, options = {}) {
    const config = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, config);
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
        logout();
        return null;
    }
    
    return response;
} 