const API_URL = 'https://tallergraphql.onrender.com/graphql';
let token = localStorage.getItem('token') || null;
let role = localStorage.getItem('role') || null;
let userId = localStorage.getItem('userId') || null;

const sendQuery = async (query, variables = {}) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ query, variables })
    });
    const result = await response.json();
    if (result.errors) {
        console.error('GraphQL Error:', result.errors);
        alert(result.errors[0].message);
    }
    return result.data;
};

window.onload = async () => {
    updateUI();
};

function updateUI() {
    const isLoggedIn = !!token;
    document.getElementById('authSection').classList.toggle('hidden', isLoggedIn);
    document.getElementById('appSection').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('authControls').style.display = isLoggedIn ? 'flex' : 'none';
    
    if (isLoggedIn) {
        const name = localStorage.getItem('userName');
        const userInitial = name ? name.charAt(0).toUpperCase() : 'U';
        document.getElementById('welcomeMessage').innerHTML = `
            <div class="user-avatar">${userInitial}</div>
            <span>Welcome, ${name} (${role})</span>
        `;
        
        document.getElementById('adminPanel').classList.toggle('hidden', role !== 'admin');
        document.getElementById('clientPanel').classList.toggle('hidden', role !== 'client');
        
        if (role === 'admin') {
            fetchAllProducts();
        }
        if (role === 'client') {
            updateProductSelect();
        }
        fetchOrders();
    }
}

async function register() {
    const name = document.getElementById('authName').value;
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const userRole = prompt("Select your role:\n• admin - Manage products\n• client - Place orders", "client");
    
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const data = await sendQuery(`
        mutation($name: String!, $email: String!, $password: String!, $role: String) {
            registerUser(name: $name, email: $email, password: $password, role: $role) {
                token
                user { id name role }
            }
        }
    `, { name, email, password, role: userRole });
    
    if (data?.registerUser) {
        token = data.registerUser.token;
        role = data.registerUser.user.role;
        userId = data.registerUser.user.id;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('userName', data.registerUser.user.name);
        localStorage.setItem('userId', userId);
        updateUI();
    }
}

async function login() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
        alert('Please enter your email and password');
        return;
    }
    
    const data = await sendQuery(`
        mutation($email: String!, $password: String!) {
            loginUser(email: $email, password: $password) {
                token
                user { id name role }
            }
        }
    `, { email, password });
    
    if (data?.loginUser) {
        token = data.loginUser.token;
        role = data.loginUser.user.role;
        userId = data.loginUser.user.id;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('userName', data.loginUser.user.name);
        localStorage.setItem('userId', userId);
        updateUI();
    }
}

function logout() {
    localStorage.clear();
    token = null;
    role = null;
    userId = null;
    updateUI();
}

async function updateProductSelect() {
    const data = await sendQuery(`query { products { id name stock price } }`);
    const select = document.getElementById('orderProductSelect');
    select.innerHTML = '<option value="">Select a product...</option>';
    
    data.products.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name} - $${p.price} (${p.stock} available)</option>`;
    });
}

async function createOrder() {
    const productId = document.getElementById('orderProductSelect').value;
    const quantity = parseInt(document.getElementById('orderQuantity').value);
    
    if (!productId || !quantity) {
        alert('Please select a product and quantity');
        return;
    }
    
    const data = await sendQuery(`
        mutation($items: [OrderItemInput!]!) {
            createOrder(items: $items) {
                id
            }
        }
    `, {
        items: [{ productId, quantity }]
    });
    
    if (data?.createOrder) {
        alert('🎉 Order placed successfully!');
        await fetchOrders();
        await updateProductSelect();
        document.getElementById('orderQuantity').value = '';
    }
}

async function createProduct() {
    const name = document.getElementById('adminProductName').value;
    const price = parseFloat(document.getElementById('adminProductPrice').value);
    const stock = parseInt(document.getElementById('adminProductStock').value);
    
    if (!name || !price || !stock) {
        alert('Please fill in all product details');
        return;
    }
    
    const data = await sendQuery(`
        mutation($name: String!, $price: Float!, $stock: Int!) {
            createProduct(name: $name, price: $price, stock: $stock) {
                id
            }
        }
    `, { name, price, stock });
    
    if (data?.createProduct) {
        alert('✅ Product created successfully!');
        document.getElementById('adminProductName').value = '';
        document.getElementById('adminProductPrice').value = '';
        document.getElementById('adminProductStock').value = '';
        fetchAllProducts();
    }
}

async function fetchAllProducts() {
    const data = await sendQuery(`query { products { id name price stock } }`);
    const list = document.getElementById('productListAdmin');
    list.innerHTML = '';
    
    data.products.forEach(p => {
        const li = document.createElement('li');
        li.className = 'product-item';
        li.innerHTML = `
            <div class="product-info">
                <div class="product-name">
                    <i class="fas fa-microchip"></i> ${p.name}
                </div>
                <div class="product-details">
                    Stock: ${p.stock} units available
                </div>
            </div>
            <div class="product-price">$${p.price}</div>
            <button class="delete-btn" onclick="deleteProduct('${p.id}')" title="Delete Product">
                <i class="fas fa-trash"></i>
            </button>
        `;
        list.appendChild(li);
    });
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const data = await sendQuery(`
        mutation($id: ID!) {
            deleteProduct(id: $id)
        }
    `, { id });
    
    if (data?.deleteProduct) {
        alert('🗑️ Product deleted successfully!');
        fetchAllProducts();
    }
}

async function fetchOrders() {
    const query = role === 'admin'
        ? `query { orders { id date user { name } items { product { name } quantity } } }`
        : `query($userId: ID!) { ordersByUser(userId: $userId) { id date items { product { name } quantity } user { name } } }`;
    const variables = role === 'client' ? { userId } : undefined;
    
    const data = await sendQuery(query, variables);
    const orders = role === 'admin' ? data.orders : data.ordersByUser;
    
    const container = document.getElementById('ordersList');
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No orders found</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div style="background: var(--dark-card); padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid var(--accent);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: var(--accent);">
                    <i class="fas fa-receipt"></i> Order #${order.id.substr(-6)}
                </strong>
                <span style="color: var(--text-secondary);">${new Date(order.date).toLocaleDateString()}</span>
            </div>
            ${role === 'admin' ? `<p><i class="fas fa-user"></i> Customer: ${order.user.name}</p>` : ''}
            <div style="margin-top: 10px;">
                <strong>Items:</strong>
                <ul style="margin: 10px 0; list-style: none;">
                    ${order.items.map(item => `
                        <li style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <i class="fas fa-box"></i> ${item.product.name} × ${item.quantity}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}