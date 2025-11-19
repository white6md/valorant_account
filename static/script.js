document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentUser = null;

    // Elements
    const sections = {
        home: document.getElementById('home-section'),
        auth: document.getElementById('auth-section'),
        history: document.getElementById('history-section')
    };

    const navLinks = {
        home: document.getElementById('nav-home'),
        history: document.getElementById('nav-history'),
        login: document.getElementById('nav-login'),
        register: document.getElementById('nav-register'),
        logout: document.getElementById('nav-logout')
    };

    const forms = {
        login: document.getElementById('login-form'),
        register: document.getElementById('register-form')
    };

    const userDisplay = document.getElementById('user-display');
    const notification = document.getElementById('notification');

    // Initialization
    checkAuthStatus();
    initSpotlight();

    // Navigation Handlers
    navLinks.home.addEventListener('click', (e) => { e.preventDefault(); showSection('home'); });
    navLinks.history.addEventListener('click', (e) => { e.preventDefault(); showSection('history'); loadOrders(); });
    navLinks.login.addEventListener('click', (e) => { e.preventDefault(); showSection('auth'); showAuthForm('login'); });
    navLinks.register.addEventListener('click', (e) => { e.preventDefault(); showSection('auth'); showAuthForm('register'); });
    navLinks.logout.addEventListener('click', (e) => { e.preventDefault(); logout(); });

    document.getElementById('switch-to-register').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('register'); });
    document.getElementById('switch-to-login').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('login'); });

    // Event Delegation for Buy Buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-btn')) {
            const name = e.target.dataset.name;
            const price = e.target.dataset.price;
            buyProduct(name, price);
        }
    });

    // Form Handlers
    forms.login.addEventListener('submit', handleLogin);
    forms.register.addEventListener('submit', handleRegister);

    // Functions
    function showSection(sectionName) {
        Object.values(sections).forEach(el => el.classList.remove('active-section'));
        Object.values(sections).forEach(el => el.classList.add('hidden-section'));

        sections[sectionName].classList.remove('hidden-section');
        sections[sectionName].classList.add('active-section');

        // Update nav active state
        document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
        if (navLinks[sectionName]) navLinks[sectionName].classList.add('active');
    }

    function showAuthForm(type) {
        document.getElementById('login-form-container').style.display = type === 'login' ? 'block' : 'none';
        document.getElementById('register-form-container').style.display = type === 'register' ? 'block' : 'none';
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    async function checkAuthStatus() {
        try {
            const res = await fetch('/api/user_info');
            const data = await res.json();
            if (data.is_authenticated) {
                currentUser = data.username;
                updateUIForLoggedIn();
            } else {
                updateUIForLoggedOut();
            }
        } catch (err) {
            console.error('Auth check failed', err);
        }
    }

    function updateUIForLoggedIn() {
        navLinks.login.style.display = 'none';
        navLinks.register.style.display = 'none';
        navLinks.history.style.display = 'inline-block';
        navLinks.logout.style.display = 'inline-block';
        userDisplay.style.display = 'inline-block';
        userDisplay.textContent = `Welcome, ${currentUser}`;
    }

    function updateUIForLoggedOut() {
        navLinks.login.style.display = 'inline-block';
        navLinks.register.style.display = 'inline-block';
        navLinks.history.style.display = 'none';
        navLinks.logout.style.display = 'none';
        userDisplay.style.display = 'none';
        currentUser = null;
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                currentUser = data.username;
                updateUIForLoggedIn();
                showSection('home');
                showNotification('Login successful!');
                forms.login.reset();
            } else {
                showNotification(data.error || 'Login failed');
            }
        } catch (err) {
            showNotification('An error occurred');
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                showNotification('Registration successful! Please login.');
                showAuthForm('login');
                forms.register.reset();
            } else {
                showNotification(data.error || 'Registration failed');
            }
        } catch (err) {
            showNotification('An error occurred');
        }
    }

    async function logout() {
        await fetch('/api/logout', { method: 'POST' });
        updateUIForLoggedOut();
        showSection('home');
        showNotification('Logged out');
    }

    async function buyProduct(productName, productPrice) {
        if (!currentUser) {
            showNotification('Please login to purchase');
            showSection('auth');
            showAuthForm('login');
            return;
        }

        if (!confirm(`Confirm purchase of "${productName}" for $${productPrice}?`)) return;

        try {
            const res = await fetch('/api/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_name: productName })
            });
            const data = await res.json();

            if (res.ok) {
                showNotification('Purchase successful! Check your history.');
                showSection('history');
                loadOrders();
            } else {
                showNotification(data.error || 'Purchase failed');
            }
        } catch (err) {
            showNotification('An error occurred');
        }
    }

    async function loadOrders() {
        const list = document.getElementById('orders-list');
        list.innerHTML = '<p>Loading...</p>';

        try {
            const res = await fetch('/api/orders');
            const data = await res.json();

            if (data.orders.length === 0) {
                list.innerHTML = '<p>No orders found.</p>';
                return;
            }

            list.innerHTML = data.orders.map(order => `
                <div class="order-item spotlight-card">
                    <div class="order-header">
                        <h3>${order.product_name}</h3>
                        <span class="order-date">${order.created_at}</span>
                    </div>
                    <div class="account-list">
                        ${order.accounts.map(acc => `
                            <div class="account-item">
                                <div><span class="acc-label">User:</span>${acc.username}</div>
                                <div><span class="acc-label">Pass:</span>${acc.password}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            // Re-init spotlight for new items
            initSpotlight();
        } catch (err) {
            list.innerHTML = '<p>Failed to load orders.</p>';
        }
    }

    // Spotlight Effect
    function initSpotlight() {
        const cards = document.querySelectorAll('.spotlight-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }
});
