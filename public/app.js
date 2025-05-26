const API_URL = 'http://localhost:4000/';
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
    if (result.errors) alert(result.errors[0].message);
    return result.data;
};

window.onload = async () => {
    updateUI();
};

function updateUI() {
    const isLoggedIn = !!token;
    document.getElementById('authSection').classList.toggle('hidden', isLoggedIn);
    document.getElementById('appSection').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('authControls').style.display = isLoggedIn ? 'block' : 'none';
    const name = localStorage.getItem('userName');
    document.getElementById('welcomeMessage').textContent = isLoggedIn
        ? `Welcome, ${name} (${role})`
        : 'GraphQL + MongoDB + JWT';
    document.getElementById('adminPanel').classList.toggle('hidden', role !== 'admin');
    document.getElementById('clientPanel').classList.toggle('hidden', role !== 'client');
    if (isLoggedIn) {
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
    const userRole = prompt("Enter role: admin or client", "client");
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
    const data = await sendQuery(`query { products { id name stock } }`);
    const select = document.getElementById('orderProductSelect');
    select.innerHTML = '';
    data.products.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name} (${p.stock})</option>`;
    });
}

async function createOrder() {
    const productId = document.getElementById('orderProductSelect').value;
    const quantity = parseInt(document.getElementById('orderQuantity').value);
    await sendQuery(`
        mutation($items: [OrderItemInput!]!) {
            createOrder(items: $items) {
                id
            }
        }
    `, {
        items: [{ productId, quantity }]
    });
    alert('Order placed!');
    await fetchOrders();
    await updateProductSelect();
}

async function createProduct() {
    const name = document.getElementById('adminProductName').value;
    const price = parseFloat(document.getElementById('adminProductPrice').value);
    const stock = parseInt(document.getElementById('adminProductStock').value);
    await sendQuery(`
        mutation($name: String!, $price: Float!, $stock: Int!) {
            createProduct(name: $name, price: $price, stock: $stock) {
                id
            }
        }
    `, { name, price, stock });
    alert('Product created');
    fetchAllProducts();
}

async function fetchAllProducts() {
    const data = await sendQuery(`query { products { id name price stock } }`);
    const list = document.getElementById('productListAdmin');
    list.innerHTML = '';
    data.products.forEach(p => {
        list.innerHTML += `
            <li>
                <b>${p.name}</b> - $${p.price} | Stock: ${p.stock}
                <button onclick="deleteProduct('${p.id}')">❌</button>
            </li>
        `;
    });
}

async function deleteProduct(id) {
    await sendQuery(`
        mutation($id: ID!) {
            deleteProduct(id: $id)
        }
    `, { id });
    alert('Product deleted');
    fetchAllProducts();
}

async function fetchOrders() {
    const query = role === 'admin'
        ? `query { orders { id date user { name } items { product { name } quantity } } }`
        : `query($userId: ID!) { ordersByUser(userId: $userId) { id date items { product { name } quantity } user { name } } }`;
    const variables = role === 'client' ? { userId } : undefined;
    const data = await sendQuery(query, variables);
    const orders = role === 'admin' ? data.orders : data.ordersByUser;
    document.getElementById('ordersList').textContent = JSON.stringify(orders, null, 2);
}
