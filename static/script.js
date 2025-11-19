document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const navHome = document.getElementById('nav-home');
    const navHistory = document.getElementById('nav-history');
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navLogout = document.getElementById('nav-logout');
    const userDisplay = document.getElementById('user-display');
    
    const homeSection = document.getElementById('home-section');
    const authSection = document.getElementById('auth-section');
    const historySection = document.getElementById('history-section');
    
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    
    const notification = document.getElementById('notification');
    const buyButtons = document.querySelectorAll('.buy-btn');
    const ordersList = document.getElementById('orders-list');

    // State
    let currentUser = null;

    // --- LocalStorage Helpers ---
    const USERS_KEY = 'g4_users';
    const ORDERS_KEY = 'g4_orders';
    const SESSION_KEY = 'g4_session';

    function getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    }

    function saveUser(username, password) {
        const users = getUsers();
        if (users[username]) return false; // User exists
        users[username] = { password }; // In real app, hash this!
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    }

    function verifyUser(username, password) {
        const users = getUsers();
        return users[username] && users[username].password === password;
    }

    function getSession() {
        return localStorage.getItem(SESSION_KEY);
    }

    function setSession(username) {
        localStorage.setItem(SESSION_KEY, username);
        currentUser = username;
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        currentUser = null;
    }

    function getOrders(username) {
        const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        return allOrders.filter(order => order.username === username);
    }

    function saveOrder(username, product_name, accounts) {
        const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        const newOrder = {
            id: Date.now(),
            username,
            product_name,
            accounts,
            created_at: new Date().toLocaleString()
        };
        allOrders.push(newOrder);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
        return newOrder;
    }

    // --- Initialization ---
    function init() {
        const sessionUser = getSession();
        if (sessionUser) {
            currentUser = sessionUser;
            updateUIState(true);
        } else {
            updateUIState(false);
        }
        setupSpotlightEffect();
    }

    // --- UI Updates ---
    function updateUIState(isLoggedIn) {
        if (isLoggedIn) {
            navLogin.style.display = 'none';
            navRegister.style.display = 'none';
            navHistory.style.display = 'inline-block';
            navLogout.style.display = 'inline-block';
            userDisplay.textContent = `Hi, ${currentUser}`;
            userDisplay.style.display = 'inline-block';
        } else {
            navLogin.style.display = 'inline-block';
            navRegister.style.display = 'inline-block';
            navHistory.style.display = 'none';
            navLogout.style.display = 'none';
            userDisplay.style.display = 'none';
            showSection(homeSection); // Redirect to home if logged out
        }
    }

    function showSection(section) {
        homeSection.classList.add('hidden-section');
        homeSection.classList.remove('active-section');
        authSection.classList.add('hidden-section');
        authSection.classList.remove('active-section');
        historySection.classList.add('hidden-section');
        historySection.classList.remove('active-section');

        section.classList.remove('hidden-section');
        section.classList.add('active-section');
    }

    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        setTimeout(() => {
            notification.className = 'notification';
        }, 3000);
    }

    // --- Event Listeners ---
    
    // Navigation
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(homeSection);
    });

    navLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(authSection);
        loginFormContainer.style.display = 'block';
        registerFormContainer.style.display = 'none';
    });

    navRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(authSection);
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'block';
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser) return;
        loadOrderHistory();
        showSection(historySection);
    });

    navLogout.addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
        updateUIState(false);
        showNotification('Logged out successfully');
    });

    // Auth Forms
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'block';
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (verifyUser(username, password)) {
            setSession(username);
            updateUIState(true);
            showSection(homeSection);
            showNotification('Login successful');
            loginForm.reset();
        } else {
            showNotification('Invalid username or password', 'error');
        }
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        if (saveUser(username, password)) {
            showNotification('Registration successful! Please login.');
            registerForm.reset();
            registerFormContainer.style.display = 'none';
            loginFormContainer.style.display = 'block';
        } else {
            showNotification('Username already exists', 'error');
        }
    });

    // Buying Logic
    buyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please login to purchase', 'error');
                showSection(authSection);
                return;
            }

            const productName = btn.dataset.name;
            const price = btn.dataset.price;
            
            // Simulate processing
            btn.textContent = 'Processing...';
            btn.disabled = true;

            setTimeout(() => {
                const accounts = generateRandomAccounts(productName);
                saveOrder(currentUser, productName, accounts);
                
                btn.textContent = 'BUY NOW';
                btn.disabled = false;
                
                showNotification('Purchase successful! Check Order History.');
                
                // Optional: Show immediate result (simple alert for now, or modal)
                alert(`Purchase Successful!\n\nHere are your accounts:\n${accounts.map(a => `${a.username}:${a.password}`).join('\n')}\n\n(Also saved to Order History)`);
            }, 1000);
        });
    });

    function generateRandomAccounts(productName) {
        let count = 10;
        if (productName.includes('5')) count = 5;
        if (productName.includes('(1)')) count = 1;

        const accounts = [];
        for (let i = 0; i < count; i++) {
            accounts.push({
                username: 'val_' + Math.random().toString(36).substring(2, 10),
                password: Math.random().toString(36).substring(2, 14) + '!'
            });
        }
        return accounts;
    }

    // Order History
    function loadOrderHistory() {
        const orders = getOrders(currentUser);
        ordersList.innerHTML = '';

        if (orders.length === 0) {
            ordersList.innerHTML = '<p>No orders found.</p>';
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card spotlight-card';
            
            let accountsHtml = '<ul class="account-list">';
            order.accounts.forEach(acc => {
                accountsHtml += `<li><span class="acc-user">${acc.username}</span> : <span class="acc-pass">${acc.password}</span></li>`;
            });
            accountsHtml += '</ul>';

            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>${order.product_name}</h3>
                    <span class="order-date">${order.created_at}</span>
                </div>
                <div class="order-body">
                    ${accountsHtml}
                </div>
            `;
            ordersList.appendChild(orderCard);
        });
        
        // Re-apply spotlight effect to new elements
        setupSpotlightEffect(); 
    }

    // --- Effects ---
    function setupSpotlightEffect() {
        const cards = document.querySelectorAll('.spotlight-card');
        cards.forEach(card => {
            card.onmousemove = e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            };
        });
    }

    // Start
    init();
});
