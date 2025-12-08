// Authentication Management
const Auth = {
    users: JSON.parse(localStorage.getItem('healbuddyUsers')) || {},
    currentUser: JSON.parse(localStorage.getItem('healbuddyCurrentUser')) || null,

    // Register new user
    register(name, email, password, confirmPassword) {
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return { success: false, message: 'All fields are required' };
        }

        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        // Check if email already exists
        if (this.users[email]) {
            return { success: false, message: 'Email already registered' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        // Create user
        this.users[email] = {
            name: name,
            email: email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('healbuddyUsers', JSON.stringify(this.users));

        return { success: true, message: 'Registration successful! Please login.' };
    },

    // Login user
    login(email, password) {
        // Validation
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        // Check if user exists
        const user = this.users[email];
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Check password
        if (!this.verifyPassword(password, user.password)) {
            return { success: false, message: 'Incorrect password' };
        }

        // Set current user
        this.currentUser = {
            email: user.email,
            name: user.name,
            loginTime: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('healbuddyCurrentUser', JSON.stringify(this.currentUser));

        return { success: true, message: 'Login successful!', user: this.currentUser };
    },

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('healbuddyCurrentUser');
        return { success: true, message: 'Logged out successfully' };
    },

    // Simple hash function (for demo - in production use proper hashing)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    },

    // Verify password
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
};

// UI Functions
function switchToRegister(event) {
    event.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function switchToLogin(event) {
    event.preventDefault();
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
}

function showAuthMessage(message, type) {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = message;
    messageEl.className = 'auth-message ' + type;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const result = Auth.login(email, password);
            
            if (result.success) {
                showAuthMessage(result.message, 'success');
                setTimeout(() => {
                    showApp();
                }, 500);
            } else {
                showAuthMessage(result.message, 'error');
            }

            loginForm.reset();
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;

            const result = Auth.register(name, email, password, confirmPassword);
            
            if (result.success) {
                showAuthMessage(result.message, 'success');
                setTimeout(() => {
                    switchToLogin({ preventDefault: () => {} });
                    document.getElementById('loginEmail').focus();
                }, 1000);
            } else {
                showAuthMessage(result.message, 'error');
            }

            registerForm.reset();
        });
    }
});

// Show/Hide App
function showApp() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('mainApp').classList.remove('hidden');
    
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('userDisplay').textContent = `Welcome, ${user.name}`;
    }
}

function logout() {
    Auth.logout();
    document.getElementById('authModal').classList.add('active');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

// Check if user is already logged in
window.addEventListener('load', () => {
    if (Auth.isLoggedIn()) {
        setTimeout(showApp, 500);
    }
});