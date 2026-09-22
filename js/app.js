// Global Data State
let categories = [];
let suppliers = [];
let customers = [];
let products = [];
let stockMovements = [];
let deliveryOrders = [];
let deliveryStatusFilter = 'all';
let stockChartInstance = null;

// API Base URL
const API_URL = 'http://localhost:8000/api';

// Navigation State
let currentView = 'dashboard';
let appCurrency = '₹';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initTheme();
    initNavigation();
    initFilters();
    fetchData().then(() => {
        renderAll();
    });
});

// --- API Calls ---
async function fetchData() {
    try {
        const [catRes, supRes, prodRes, moveRes, custRes, doRes] = await Promise.all([
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/suppliers`),
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/stock-movements`),
            fetch(`${API_URL}/customers`),
            fetch(`${API_URL}/delivery-orders`)
        ]);
        
        categories = await catRes.json();
        suppliers = await supRes.json();
        products = await prodRes.json();
        stockMovements = await moveRes.json();
        customers = await custRes.json();
        deliveryOrders = await doRes.json();
    } catch (err) {
        showToast('Error loading data from server.', 'danger');
        console.error(err);
    }
}

// --- Navigation & View Logic ---
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.querySelector('#theme-toggle i');
        if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    }
}
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    const icon = document.querySelector('#theme-toggle i');
    if (isDark) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

function initFilters() {
    const search = document.getElementById('search-product');
    const cat = document.getElementById('filter-category');
    if (search) search.addEventListener('input', renderProducts);
    if (cat) cat.addEventListener('change', renderProducts);
    
    // Set max date for calendar inputs to today
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('collect-start');
    const endInput = document.getElementById('collect-end');
    if (startInput) startInput.max = today;
    if (endInput) endInput.max = today;
}

function toggleNotifications(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
    
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileDropdown) profileDropdown.classList.remove('active');
}

function toggleProfile(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
    
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifDropdown) notifDropdown.classList.remove('active');
}

// Global click to close dropdowns
document.addEventListener('click', (e) => {
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifDropdown && notifDropdown.classList.contains('active')) {
        const container = document.querySelector('.notification-container');
        if (container && !container.contains(e.target)) {
            notifDropdown.classList.remove('active');
        }
    }
    
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileDropdown && profileDropdown.classList.contains('active')) {
        const container = document.querySelector('.profile-container');
        if (container && !container.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    }
});

function handleNotificationClick(productId) {
    // Close dropdowns
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifDropdown) notifDropdown.classList.remove('active');
    
    // Switch to stock management tab
    const navItem = document.querySelector('.sidebar-nav .nav-item[data-target="stock-management"]');
    if (navItem) navItem.click();
    
    // Auto-select the product for stock in
    setTimeout(() => {
        const select = document.getElementById('stock-in-product');
        if (select) {
            select.value = productId;
            const qty = document.getElementById('stock-in-qty');
            if (qty) qty.focus();
        }
    }, 100);
}

function logout() {
    showToast('Logged out successfully!', 'success');
    setTimeout(() => {
        location.reload();
    }, 1500);
}

function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            // Update active nav link
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active view
            document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
            document.getElementById(`view-${target}`).classList.add('active');
            
            // Update Page Title
                const titles = {
                    'dashboard': 'Dashboard',
                    'products': 'Product Catalog',
                    'categories': 'Categories',
                    'suppliers': 'Suppliers List',
                    'customers': 'Customers',
                    'transport': 'Delivery Orders',
                    'stock-management': 'Stock Management',
                    'pos': 'Point of Sale',
                    'po': 'Purchase Orders',
                    'reports': 'Reports & Analytics'
                };
            document.getElementById('page-title').textContent = titles[target];
            
            currentView = target;
            
            if (target === 'pos') renderPOSProducts();
            if (target === 'po') renderPOProducts();
            
            await fetchData(); // Refresh data when navigating
            renderAll(); 
            
            // Close sidebar on mobile if active
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            }
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// --- Render Logic ---
function renderAll() {
    renderDashboard();
    renderProducts();
    renderCategories();
    renderSuppliers();
    renderCustomers();
    renderDeliveryOrders();
    populateSelectDropdowns();
    checkLowStockAlerts();
}

function renderDashboard() {
    if(currentView !== 'dashboard') return;
    
    // Stats
    document.getElementById('stat-total-products').textContent = products.length;
    
    const totalStock = products.reduce((sum, p) => sum + parseInt(p.stock), 0);
    document.getElementById('stat-total-stock').textContent = totalStock;
    
    const lowStockItems = products.filter(p => parseInt(p.stock) <= parseInt(p.min_stock));
    const statLowStock = document.getElementById('stat-low-stock');
    if (statLowStock) statLowStock.textContent = lowStockItems.length;
    
    // Update Notifications Dropdown
    const notifBadge = document.getElementById('low-stock-badge');
    const notifList = document.getElementById('notification-list');
    
    if (lowStockItems.length > 0) {
        if(notifBadge) {
            notifBadge.style.display = 'flex';
            notifBadge.textContent = lowStockItems.length;
        }
        if(notifList) {
            notifList.innerHTML = '';
            lowStockItems.forEach(item => {
                notifList.innerHTML += `
                    <li onclick="handleNotificationClick(${item.id})">
                        <div class="notif-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
                        <div class="notif-content">
                            <h4>${item.name}</h4>
                            <p>Low stock: Only ${item.stock} left (Min: ${item.min_stock})</p>
                        </div>
                    </li>
                `;
            });
        }
    } else {
        if(notifBadge) notifBadge.style.display = 'none';
        if(notifList) notifList.innerHTML = '<li class="dropdown-empty">No new notifications</li>';
    }
    
    calculateAmountCollected();

    renderChart();

    // Recent Movements
    const movementsBody = document.getElementById('recent-movements-body');
    movementsBody.innerHTML = '';
    
    // Sort by id desc, take top 5
    const recent = [...stockMovements].sort((a, b) => b.id - a.id).slice(0, 5);
    recent.forEach(m => {
        const product = products.find(p => p.id == m.product_id) || { name: 'Unknown' };
        const tr = document.createElement('tr');
        const date = new Date(m.created_at).toLocaleDateString();
        tr.innerHTML = `
            <td><span class="type-badge type-${m.type}">${m.type === 'in' ? 'Stock In' : 'Stock Out'}</span></td>
            <td>${product.name}</td>
            <td>${m.qty}</td>
            <td>${date}</td>
        `;
        movementsBody.appendChild(tr);
    });

    // Low Stock Alert List
    const alertList = document.getElementById('dashboard-low-stock-list');
    alertList.innerHTML = '';
    if (lowStockItems.length === 0) {
        alertList.innerHTML = '<p class="text-muted">No low stock alerts.</p>';
    } else {
        lowStockItems.forEach(p => {
            const li = document.createElement('li');
            li.className = 'alert-item';
            li.innerHTML = `
                <div class="alert-info">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <div class="alert-text">
                        <h4>${p.name}</h4>
                        <p>Current: ${p.stock} | Min: ${p.min_stock}</p>
                    </div>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="document.querySelector('[data-target=stock-management]').click()">Restock</button>
            `;
            alertList.appendChild(li);
        });
    }
}

function calculateAmountCollected() {
    const startDate = document.getElementById('collect-start')?.value;
    const endDate = document.getElementById('collect-end')?.value;
    
    let filteredMoves = stockMovements.filter(m => m.type === 'out');
    
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        filteredMoves = filteredMoves.filter(m => new Date(m.created_at) >= start);
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        filteredMoves = filteredMoves.filter(m => new Date(m.created_at) <= end);
    }
    
    const totalCollected = filteredMoves.reduce((sum, m) => {
        const product = products.find(p => p.id == m.product_id);
        if (product && product.selling_price) {
            return sum + (m.qty * parseFloat(product.selling_price));
        }
        return sum;
    }, 0);
    
    const valueEl = document.getElementById('stat-total-value');
    if (valueEl) valueEl.textContent = totalCollected.toFixed(2);
}

function renderChart() {
    const ctx = document.getElementById('stockChart');
    if(!ctx) return;
    
    if (stockChartInstance) {
        stockChartInstance.destroy();
    }
    
    const labels = [];
    const inData = [];
    const outData = [];
    
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString(undefined, {month:'short', day:'numeric'}));
        
        const dayStart = new Date(d.setHours(0,0,0,0));
        const dayEnd = new Date(d.setHours(23,59,59,999));
        
        const dayMoves = stockMovements.filter(m => {
            const mDate = new Date(m.created_at);
            return mDate >= dayStart && mDate <= dayEnd;
        });
        
        const dIn = dayMoves.filter(m => m.type === 'in').reduce((sum, m) => sum + m.qty, 0);
        const dOut = dayMoves.filter(m => m.type === 'out').reduce((sum, m) => sum + m.qty, 0);
        
        inData.push(dIn);
        outData.push(dOut);
    }
    
    stockChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Stock In', data: inData, backgroundColor: '#10b981' },
                { label: 'Stock Out', data: outData, backgroundColor: '#ef4444' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderProducts() {
    if(currentView !== 'products') return;
    
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const searchTerm = (document.getElementById('search-product')?.value || '').toLowerCase();
    const filterCat = document.getElementById('filter-category')?.value || '';
    
    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || (p.sku || '').toLowerCase().includes(searchTerm);
        const matchCat = filterCat === '' || p.category_id == filterCat;
        return matchSearch && matchCat;
    });
    
    filteredProducts.forEach(p => {
        const category = categories.find(c => c.id == p.category_id) || { name: 'None' };
        
        let stockStatusClass = 'status-in-stock';
        let stockStatusText = 'In Stock';
        
        if (p.stock == 0) {
            stockStatusClass = 'status-out-stock';
            stockStatusText = 'Out of Stock';
        } else if (p.stock <= p.min_stock) {
            stockStatusClass = 'status-low-stock';
            stockStatusText = 'Low Stock';
        }

        const tr = document.createElement('tr');
        const price = parseFloat(p.selling_price).toFixed(2);
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.sku}</td>
            <td>${category.name}</td>
            <td>
                ${p.stock} <br>
                <span class="status-badge ${stockStatusClass}">${stockStatusText}</span>
            </td>
            <td>₹${price}</td>
            <td>
                <button class="btn-icon" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCategories() {
    if(currentView !== 'categories') return;
    
    const tbody = document.getElementById('categories-table-body');
    tbody.innerHTML = '';
    
    categories.forEach(c => {
        const count = products.filter(p => p.category_id == c.id).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.name}</strong></td>
            <td>${c.desc || '-'}</td>
            <td>${count} items</td>
            <td>
                <button class="btn-icon" onclick="editCategory(${c.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteCategory(${c.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSuppliers() {
    if(currentView !== 'suppliers') return;
    
    const tbody = document.getElementById('suppliers-table-body');
    tbody.innerHTML = '';
    
    suppliers.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.name}</strong></td>
            <td>${s.phone}</td>
            <td>${s.email || '-'}</td>
            <td>${s.address || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editSupplier(${s.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteSupplier(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateSelectDropdowns() {
    // Populate Category Dropdowns
    const catSelect = document.getElementById('product-category');
    const filterCatSelect = document.getElementById('filter-category');
    
    if (catSelect) catSelect.innerHTML = '<option value="">Select Category</option>';
    if (filterCatSelect) filterCatSelect.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(c => {
        if (catSelect) catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        if (filterCatSelect) filterCatSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    // Populate suppliers
    const supplierSelects = [
        document.getElementById('product-supplier'),
        document.getElementById('po-supplier')
    ];
    
    supplierSelects.forEach(select => {
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Select Supplier</option>';
        suppliers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            select.appendChild(opt);
        });
        if (currentVal) select.value = currentVal;
    });

    // Populate Stock Movement Product Dropdowns
    const inSelect = document.getElementById('stock-in-product');
    const outSelect = document.getElementById('stock-out-product');
    if(inSelect && outSelect) {
        let options = '<option value="">Select Product</option>';
        products.forEach(p => {
            options += `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`;
        });
        inSelect.innerHTML = options;
        outSelect.innerHTML = options;
    }
}

function checkLowStockAlerts() {
    const lowStockItems = products.filter(p => parseInt(p.stock) <= parseInt(p.min_stock));
    const badge = document.getElementById('low-stock-badge');
    if (lowStockItems.length > 0) {
        badge.style.display = 'flex';
        badge.textContent = lowStockItems.length;
    } else {
        badge.style.display = 'none';
    }
}

// --- Modal Logic ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Clear forms on close
    const formMap = {
        'product-modal': 'form-product',
        'category-modal': 'form-category',
        'supplier-modal': 'form-supplier',
        'customer-modal': 'form-customer',
        'address-modal':  'form-address',
        'delivery-order-modal': 'form-delivery-order'
    };
    if (formMap[modalId]) {
        document.getElementById(formMap[modalId]).reset();
        const hidden = document.getElementById(formMap[modalId]).querySelector('input[type="hidden"]');
        if (hidden) hidden.value = '';
    }
    if (modalId === 'delivery-order-modal') {
        const addrSelect = document.getElementById('do-address');
        if (addrSelect) addrSelect.innerHTML = '<option value="">Select Customer first...</option>';
        const hint = document.getElementById('do-no-address-hint');
        if (hint) hint.style.display = 'none';
        toggleTransportMethod('own_rider');
    }
}

// --- CRUD API Helpers ---
async function apiCall(endpoint, method, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const res = await fetch(`${API_URL}/${endpoint}`, options);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
    }
    return method === 'DELETE' ? true : await res.json();
}

// --- Products ---
async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    
    const productData = {
        name: document.getElementById('product-name').value,
        sku: document.getElementById('product-sku').value,
        category_id: document.getElementById('product-category').value || null,
        supplier_id: document.getElementById('product-supplier').value || null,
        purchase_price: parseFloat(document.getElementById('product-purchase').value),
        selling_price: parseFloat(document.getElementById('product-selling').value),
        stock: parseInt(document.getElementById('product-stock').value),
        min_stock: parseInt(document.getElementById('product-min-stock').value)
    };

    try {
        if (id) {
            await apiCall(`products/${id}`, 'PUT', productData);
            showToast('Product updated successfully!', 'success');
        } else {
            await apiCall(`products`, 'POST', productData);
            showToast('Product added successfully!', 'success');
        }
        closeModal('product-modal');
        await fetchData();
        renderAll();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function editProduct(id) {
    const p = products.find(prod => prod.id == id);
    if (!p) return;
    
    document.getElementById('product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-sku').value = p.sku;
    document.getElementById('product-category').value = p.category_id || '';
    document.getElementById('product-supplier').value = p.supplier_id || '';
    document.getElementById('product-purchase').value = p.purchase_price;
    document.getElementById('product-selling').value = p.selling_price;
    document.getElementById('product-stock').value = p.stock;
    document.getElementById('product-min-stock').value = p.min_stock;
    
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    openModal('product-modal');
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await apiCall(`products/${id}`, 'DELETE');
            showToast('Product deleted.', 'success');
            await fetchData();
            renderAll();
        } catch (error) {
            showToast('Error deleting product', 'danger');
        }
    }
}

// --- Categories ---
async function saveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const catData = {
        name: document.getElementById('category-name').value,
        desc: document.getElementById('category-desc').value
    };

    try {
        if (id) {
            await apiCall(`categories/${id}`, 'PUT', catData);
            showToast('Category updated!', 'success');
        } else {
            await apiCall(`categories`, 'POST', catData);
            showToast('Category added!', 'success');
        }
        closeModal('category-modal');
        await fetchData();
        renderAll();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function editCategory(id) {
    const c = categories.find(cat => cat.id == id);
    if (!c) return;
    document.getElementById('category-id').value = c.id;
    document.getElementById('category-name').value = c.name;
    document.getElementById('category-desc').value = c.desc || '';
    
    document.getElementById('category-modal-title').textContent = 'Edit Category';
    openModal('category-modal');
}

async function deleteCategory(id) {
    const hasProducts = products.some(p => p.category_id == id);
    if (hasProducts) {
        showToast('Cannot delete category with assigned products.', 'danger');
        return;
    }

    if (confirm('Are you sure you want to delete this category?')) {
        try {
            await apiCall(`categories/${id}`, 'DELETE');
            showToast('Category deleted.', 'success');
            await fetchData();
            renderAll();
        } catch (error) {
            showToast('Error deleting category', 'danger');
        }
    }
}

// --- Suppliers ---
async function saveSupplier(e) {
    e.preventDefault();
    const id = document.getElementById('supplier-id').value;
    const supData = {
        name: document.getElementById('supplier-name').value,
        phone: document.getElementById('supplier-phone').value,
        email: document.getElementById('supplier-email').value,
        address: document.getElementById('supplier-address').value
    };

    try {
        if (id) {
            await apiCall(`suppliers/${id}`, 'PUT', supData);
            showToast('Supplier updated!', 'success');
        } else {
            await apiCall(`suppliers`, 'POST', supData);
            showToast('Supplier added!', 'success');
        }
        closeModal('supplier-modal');
        await fetchData();
        renderAll();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function editSupplier(id) {
    const s = suppliers.find(sup => sup.id == id);
    if (!s) return;
    document.getElementById('supplier-id').value = s.id;
    document.getElementById('supplier-name').value = s.name;
    document.getElementById('supplier-phone').value = s.phone;
    document.getElementById('supplier-email').value = s.email || '';
    document.getElementById('supplier-address').value = s.address || '';
    
    document.getElementById('supplier-modal-title').textContent = 'Edit Supplier';
    openModal('supplier-modal');
}

async function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        try {
            await apiCall(`suppliers/${id}`, 'DELETE');
            showToast('Supplier deleted.', 'success');
            await fetchData();
            renderAll();
        } catch (error) {
            showToast('Error deleting supplier', 'danger');
        }
    }
}

// --- Customers ---
function renderCustomers() {
    if (currentView !== 'customers') return;

    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchTerm = (document.getElementById('search-customer')?.value || '').toLowerCase();

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.phone || '').toLowerCase().includes(searchTerm) ||
        (c.email || '').toLowerCase().includes(searchTerm) ||
        (c.city || '').toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--text-muted); padding: 2rem;">No customers found. <a href="#" onclick="openAddCustomer(); return false;">Add one now.</a></td></tr>`;
        return;
    }

    filtered.forEach(c => {
        // Main customer row
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.setAttribute('data-customer-id', c.id);
        tr.innerHTML = `
            <td style="padding: 0.5rem; text-align:center;">
                <button class="btn-icon" onclick="toggleAddressDrawer(${c.id}, event)" title="View Addresses" id="addr-toggle-${c.id}">
                    <i class="fa-solid fa-chevron-right" style="font-size:0.75rem; transition: transform 0.2s;"></i>
                </button>
            </td>
            <td><strong>${c.name}</strong></td>
            <td>${c.phone}</td>
            <td>${c.email || '-'}</td>
            <td>${c.city || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editCustomer(${c.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteCustomer(${c.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);

        // Hidden address drawer row
        const drawerTr = document.createElement('tr');
        drawerTr.id = `addr-drawer-${c.id}`;
        drawerTr.style.display = 'none';
        drawerTr.innerHTML = `
            <td colspan="6" style="padding: 0; background: var(--bg-main); border-bottom: 2px solid var(--border-color);">
                <div style="padding: 1rem 2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <strong style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-location-dot"></i> Delivery Addresses</strong>
                        <button class="btn btn-sm btn-primary" onclick="openAddAddress(${c.id})">
                            <i class="fa-solid fa-plus"></i> Add Address
                        </button>
                    </div>
                    <div id="addr-list-${c.id}"><em style="color:var(--text-muted);">Loading...</em></div>
                </div>
            </td>
        `;
        tbody.appendChild(drawerTr);
    });
}

async function toggleAddressDrawer(customerId, event) {
    if (event) event.stopPropagation();
    const drawer = document.getElementById(`addr-drawer-${customerId}`);
    const icon = document.querySelector(`#addr-toggle-${customerId} i`);
    if (!drawer) return;

    const isOpen = drawer.style.display !== 'none';
    drawer.style.display = isOpen ? 'none' : 'table-row';
    if (icon) icon.style.transform = isOpen ? '' : 'rotate(90deg)';

    if (!isOpen) {
        await renderAddressDrawer(customerId);
    }
}

async function renderAddressDrawer(customerId) {
    const container = document.getElementById(`addr-list-${customerId}`);
    if (!container) return;
    container.innerHTML = '<em style="color:var(--text-muted);">Loading...</em>';

    try {
        const res = await fetch(`${API_URL}/customer-addresses?customer_id=${customerId}`);
        const addresses = await res.json();

        if (!addresses.length) {
            container.innerHTML = `<p style="color:var(--text-muted); margin:0;">No addresses yet. <a href="#" onclick="openAddAddress(${customerId}); return false;">Add one now.</a></p>`;
            return;
        }

        container.innerHTML = '';
        addresses.forEach(addr => {
            const card = document.createElement('div');
            card.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.75rem; margin-bottom:0.5rem; border-radius:8px; background:var(--bg-card); border:1px solid var(--border-color);';
            card.innerHTML = `
                <div>
                    <span style="font-weight:600; margin-right:0.5rem;">${addr.label}</span>
                    ${addr.is_default ? '<span style="background:var(--primary); color:#fff; font-size:0.7rem; padding:2px 8px; border-radius:20px;">Default</span>' : ''}
                    <div style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">${addr.street}, ${addr.city}</div>
                </div>
                <div style="display:flex; gap:0.4rem; flex-shrink:0;">
                    ${!addr.is_default ? `<button class="btn btn-sm btn-secondary" onclick="setDefaultAddress(${addr.id}, ${customerId})" title="Set as Default"><i class="fa-solid fa-star"></i></button>` : ''}
                    <button class="btn-icon" onclick="editAddress(${addr.id}, ${customerId})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" onclick="deleteAddress(${addr.id}, ${customerId})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = '<em style="color:var(--danger);">Failed to load addresses.</em>';
    }
}

function openAddAddress(customerId) {
    document.getElementById('address-modal-title').textContent = 'Add Delivery Address';
    document.getElementById('form-address').reset();
    document.getElementById('address-id').value = '';
    document.getElementById('address-customer-id').value = customerId;
    document.getElementById('address-is-default').checked = false;
    openModal('address-modal');
}

async function editAddress(addressId, customerId) {
    try {
        const res = await fetch(`${API_URL}/customer-addresses/${addressId}`);
        const addr = await res.json();
        document.getElementById('address-id').value = addr.id;
        document.getElementById('address-customer-id').value = customerId;
        document.getElementById('address-label').value = addr.label;
        document.getElementById('address-street').value = addr.street;
        document.getElementById('address-city').value = addr.city;
        document.getElementById('address-is-default').checked = !!addr.is_default;
        document.getElementById('address-modal-title').textContent = 'Edit Delivery Address';
        openModal('address-modal');
    } catch (err) {
        showToast('Could not load address.', 'danger');
    }
}

async function saveAddress(e) {
    e.preventDefault();
    const id = document.getElementById('address-id').value;
    const customerId = document.getElementById('address-customer-id').value;
    const data = {
        customer_id: parseInt(customerId),
        label:       document.getElementById('address-label').value,
        street:      document.getElementById('address-street').value,
        city:        document.getElementById('address-city').value,
        is_default:  document.getElementById('address-is-default').checked,
    };

    try {
        if (id) {
            await apiCall(`customer-addresses/${id}`, 'PUT', data);
            showToast('Address updated!', 'success');
        } else {
            await apiCall('customer-addresses', 'POST', data);
            showToast('Address added!', 'success');
        }
        closeModal('address-modal');
        await renderAddressDrawer(customerId);
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

async function deleteAddress(addressId, customerId) {
    if (confirm('Delete this address?')) {
        try {
            await apiCall(`customer-addresses/${addressId}`, 'DELETE');
            showToast('Address deleted.', 'success');
            await renderAddressDrawer(customerId);
        } catch (err) {
            showToast('Error deleting address.', 'danger');
        }
    }
}

async function setDefaultAddress(addressId, customerId) {
    try {
        await apiCall(`customer-addresses/${addressId}`, 'PUT', { is_default: true });
        showToast('Default address set!', 'success');
        await renderAddressDrawer(customerId);
    } catch (err) {
        showToast('Error setting default.', 'danger');
    }
}

function openAddCustomer() {
    document.getElementById('customer-modal-title').textContent = 'Add Customer';
    document.getElementById('form-customer').reset();
    document.getElementById('customer-id').value = '';
    openModal('customer-modal');
}

async function saveCustomer(e) {
    e.preventDefault();
    const id = document.getElementById('customer-id').value;
    const data = {
        name:    document.getElementById('customer-name').value,
        phone:   document.getElementById('customer-phone').value,
        email:   document.getElementById('customer-email').value,
        city:    document.getElementById('customer-city').value,
        address: document.getElementById('customer-address').value
    };

    try {
        if (id) {
            await apiCall(`customers/${id}`, 'PUT', data);
            showToast('Customer updated!', 'success');
        } else {
            await apiCall('customers', 'POST', data);
            showToast('Customer added!', 'success');
        }
        closeModal('customer-modal');
        await fetchData();
        renderAll();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function editCustomer(id) {
    const c = customers.find(cust => cust.id == id);
    if (!c) return;
    document.getElementById('customer-id').value = c.id;
    document.getElementById('customer-name').value = c.name;
    document.getElementById('customer-phone').value = c.phone;
    document.getElementById('customer-email').value = c.email || '';
    document.getElementById('customer-city').value = c.city || '';
    document.getElementById('customer-address').value = c.address || '';
    document.getElementById('customer-modal-title').textContent = 'Edit Customer';
    openModal('customer-modal');
}

async function deleteCustomer(id) {
    if (confirm('Delete this customer? This cannot be undone.')) {
        try {
            await apiCall(`customers/${id}`, 'DELETE');
            showToast('Customer deleted.', 'success');
            await fetchData();
            renderAll();
        } catch (error) {
            showToast('Error deleting customer.', 'danger');
        }
    }
}

// --- Stock Management ---
function handleStockMove(e, type) {
    e.preventDefault();
    
    const productId = document.getElementById(`stock-${type}-product`).value;
    const qty = parseInt(document.getElementById(`stock-${type}-qty`).value);
    const ref = document.getElementById(`stock-${type}-ref`).value;
    
    const product = products.find(p => p.id == productId);
    
    if (type === 'out') {
        if (product && qty > product.stock) {
            const err = document.getElementById('stock-out-qty-error');
            if (err) {
                err.textContent = `Only ${product.stock} in stock!`;
                err.style.display = 'inline';
            }
            document.getElementById('stock-out-qty').style.borderColor = 'var(--danger)';
            return;
        }
    }
    
    const actionWord = type === 'in' ? 'add' : 'remove';
    document.getElementById('confirm-modal-title').textContent = 'Confirm Action';
    document.getElementById('confirm-modal-message').textContent = `Are you sure you want to ${actionWord} ${qty} ${product ? product.name : 'items'}? This action cannot be undone.`;
    
    const confirmBtn = document.getElementById('confirm-modal-btn');
    confirmBtn.onclick = () => {
        closeModal('confirm-modal');
        executeStockMove(type, productId, qty, ref, product);
    };
    
    openModal('confirm-modal');
}

async function executeStockMove(type, productId, qty, ref, product) {
    try {
        const res = await apiCall(`stock-movements`, 'POST', {
            type: type,
            product_id: productId,
            qty: qty,
            ref: ref
        });
        
        document.getElementById(`form-stock-${type}`).reset();
        
        const actionWord = type === 'in' ? 'added' : 'removed';
        const productName = product ? product.name : 'items';
        document.getElementById('success-modal-message').textContent = `${qty} ${productName} ${actionWord}`;
        openModal('success-modal');
        
        if (type === 'out' && product) {
            generateInvoicePreview(product, qty, ref, res);
        }
        
        await fetchData();
        renderAll();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function exportToCSV() {
    if (products.length === 0) {
        showToast('No products to export.', 'danger');
        return;
    }
    
    let csv = 'ID,Name,SKU,Category,Purchase Price,Selling Price,Stock\n';
    
    products.forEach(p => {
        const category = categories.find(c => c.id == p.category_id) || { name: 'None' };
        // Escape quotes and commas in strings
        const name = `"${(p.name || '').replace(/"/g, '""')}"`;
        const sku = `"${(p.sku || '').replace(/"/g, '""')}"`;
        const catName = `"${(category.name || '').replace(/"/g, '""')}"`;
        csv += `${p.id},${name},${sku},${catName},${p.purchase_price},${p.selling_price},${p.stock}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'inventory_products.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Export successful!', 'success');
}

function generateInvoicePreview(product, qty, ref, movementRecord) {
    const invRef = ref || `INV-${movementRecord.id || Math.floor(Math.random() * 10000)}`;
    
    const singleItem = [{
        name: product.name,
        qty: qty,
        price: parseFloat(product.selling_price || 0)
    }];
    
    generateMultiItemInvoice(singleItem, invRef);
}

function printInvoice() {
    window.print();
}

function downloadInvoicePDF() {
    const element = document.getElementById('invoice-document');
    const opt = {
        margin:       0.5,
        filename:     `Invoice_${document.getElementById('inv-ref').textContent.replace('Ref: ', '')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        showToast('Invoice PDF downloaded successfully!', 'success');
    });
}

// --- Utility: Toast Notification ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// --- Settings & Profile Logic ---
function loadSettings() {
    const appName = localStorage.getItem('app_name') || 'Inventro';
    appCurrency = localStorage.getItem('app_currency') || '₹';
    const profileName = localStorage.getItem('profile_name') || 'Admin User';
    const profileColorHex = localStorage.getItem('profile_color') || '#6366f1';
    const profileColor = profileColorHex.replace('#', '');

    document.title = `${appName} - Inventory Management`;
    const brandLogo = document.querySelector('.sidebar-header h2');
    if (brandLogo) brandLogo.innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> ${appName}`;
    
    const profileImgs = document.querySelectorAll('.user-profile img');
    profileImgs.forEach(img => {
        img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=${profileColor}&color=fff`;
    });
    
    const profileNames = document.querySelectorAll('.user-profile span');
    profileNames.forEach(span => {
        span.textContent = profileName.split(' ')[0];
    });
    
    const dropdownProfileName = document.querySelector('#profile-dropdown .dropdown-header p:nth-child(2)');
    if (dropdownProfileName) dropdownProfileName.textContent = profileName;
    
    const nameInput = document.getElementById('setting-app-name');
    if (nameInput) nameInput.value = appName;
    
    const currencyInput = document.getElementById('setting-currency');
    if (currencyInput) currencyInput.value = appCurrency;
    
    const profileNameInput = document.getElementById('profile-name-input');
    if (profileNameInput) profileNameInput.value = profileName;
    
    const profileColorInput = document.getElementById('profile-color');
    if (profileColorInput) profileColorInput.value = profileColorHex;
}

function saveSettings(event) {
    event.preventDefault();
    const appName = document.getElementById('setting-app-name').value;
    const currency = document.getElementById('setting-currency').value;
    
    localStorage.setItem('app_name', appName);
    localStorage.setItem('app_currency', currency);
    
    loadSettings();
    closeModal('settings-modal');
    showToast('Settings saved successfully', 'success');
}

function saveProfile(event) {
    event.preventDefault();
    const profileName = document.getElementById('profile-name-input').value;
    const profileColor = document.getElementById('profile-color').value;
    
    localStorage.setItem('profile_name', profileName);
    localStorage.setItem('profile_color', profileColor);
    
    loadSettings();
    closeModal('profile-modal');
    showToast('Profile updated successfully', 'success');
}

// --- POS Logic ---
let posCart = [];

function renderPOSProducts() {
    const searchInput = document.getElementById('pos-search');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    let filtered = products.filter(p => p.name.toLowerCase().includes(search));
    
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s';
        card.onmouseover = () => card.style.transform = 'translateY(-2px)';
        card.onmouseout = () => card.style.transform = 'none';
        card.onclick = () => addToCart(product.id);
        
        card.innerHTML = `
            <div class="card-body" style="padding: 1rem; text-align: center;">
                <div style="width: 50px; height: 50px; background: var(--primary-light); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin: 0 auto 1rem auto;">
                    <i class="fa-solid fa-box"></i>
                </div>
                <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${product.name}">${product.name}</h4>
                <p style="color: var(--primary); font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">${appCurrency}${parseFloat(product.selling_price).toFixed(2)}</p>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Stock: <span class="${product.stock <= product.min_stock ? 'text-danger font-weight-bold' : ''}">${product.stock}</span></p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
        showToast('Product is out of stock!', 'error');
        return;
    }
    
    const existing = posCart.find(item => item.product_id === productId);
    if (existing) {
        if (existing.qty >= product.stock) {
            showToast('Cannot add more than available stock', 'warning');
            return;
        }
        existing.qty++;
    } else {
        posCart.push({
            product_id: product.id,
            name: product.name,
            price: parseFloat(product.selling_price),
            qty: 1
        });
    }
    
    renderCart();
}

window.updateCartQty = function(productId, change) {
    const itemIndex = posCart.findIndex(item => item.product_id === productId);
    if (itemIndex > -1) {
        const item = posCart[itemIndex];
        const product = products.find(p => p.id === productId);
        
        const newQty = item.qty + change;
        if (newQty <= 0) {
            posCart.splice(itemIndex, 1);
        } else if (newQty > product.stock) {
            showToast('Cannot exceed available stock', 'warning');
        } else {
            item.qty = newQty;
        }
        renderCart();
    }
}

function renderCart() {
    const cartContainer = document.getElementById('pos-cart-items');
    if (!cartContainer) return;
    
    cartContainer.innerHTML = '';
    
    if (posCart.length === 0) {
        cartContainer.innerHTML = '<p class="text-center" style="color: var(--text-muted); margin-top: 2rem;">Cart is empty</p>';
        document.getElementById('pos-subtotal').textContent = appCurrency + '0.00';
        document.getElementById('pos-tax').textContent = appCurrency + '0.00';
        document.getElementById('pos-total').textContent = appCurrency + '0.00';
        return;
    }
    
    let subtotal = 0;
    
    posCart.forEach(item => {
        const lineTotal = item.qty * item.price;
        subtotal += lineTotal;
        
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '0.75rem 0';
        row.style.borderBottom = '1px solid var(--border-color)';
        
        row.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <h5 style="margin-bottom: 0.25rem; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.name}">${item.name}</h5>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${appCurrency}${item.price.toFixed(2)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-main); border-radius: 4px; padding: 0.2rem; margin: 0 0.5rem;">
                <button class="btn-icon" style="width: 24px; height: 24px; padding: 0;" onclick="updateCartQty(${item.product_id}, -1)">
                    <i class="fa-solid fa-minus" style="font-size: 0.7rem;"></i>
                </button>
                <span style="font-weight: 600; font-size: 0.9rem; min-width: 20px; text-align: center;">${item.qty}</span>
                <button class="btn-icon" style="width: 24px; height: 24px; padding: 0;" onclick="updateCartQty(${item.product_id}, 1)">
                    <i class="fa-solid fa-plus" style="font-size: 0.7rem;"></i>
                </button>
            </div>
            <div style="min-width: 60px; text-align: right; font-weight: 600;">
                ${appCurrency}${lineTotal.toFixed(2)}
            </div>
        `;
        cartContainer.appendChild(row);
    });
    
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    document.getElementById('pos-subtotal').textContent = appCurrency + subtotal.toFixed(2);
    document.getElementById('pos-tax').textContent = appCurrency + tax.toFixed(2);
    document.getElementById('pos-total').textContent = appCurrency + total.toFixed(2);
}

function checkoutPOS() {
    if (posCart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }
    
    document.getElementById('confirm-modal-title').textContent = 'Confirm Sale';
    document.getElementById('confirm-modal-message').textContent = 'Are you sure you want to complete this sale? This action cannot be undone.';
    
    const confirmBtn = document.getElementById('confirm-modal-btn');
    confirmBtn.onclick = () => {
        closeModal('confirm-modal');
        executeCheckoutPOS();
    };
    
    openModal('confirm-modal');
}

async function executeCheckoutPOS() {
    const customerName = document.getElementById('pos-customer-name').value || 'Walk-in Customer';
    const customerPhone = document.getElementById('pos-customer-phone').value || '';
    
    // Find the checkout button to show loading state
    const btn = document.querySelector('button[onclick="checkoutPOS()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        const refNumber = 'POS-' + Math.floor(Date.now() / 1000);
        const promises = posCart.map(item => {
            return fetch(API_URL + '/stock-movements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    type: 'out',
                    product_id: item.product_id,
                    qty: item.qty,
                    ref: refNumber
                })
            });
        });
        
        const results = await Promise.all(promises);
        const hasErrors = results.some(r => !r.ok);
        
        if (hasErrors) {
            throw new Error('Some items failed to checkout.');
        }
        
        // Calculate total items sold for the success message
        const totalItems = posCart.reduce((sum, item) => sum + item.qty, 0);
        document.getElementById('success-modal-message').textContent = `${totalItems} items sold successfully!`;
        openModal('success-modal');
        
        // Generate Invoice (will open underneath the success modal)
        generateMultiItemInvoice(posCart, refNumber, customerName, customerPhone);
        
        // Clear Cart
        posCart = [];
        const customerInput = document.getElementById('pos-customer-name');
        if (customerInput) customerInput.value = '';
        const phoneInput = document.getElementById('pos-customer-phone');
        if (phoneInput) phoneInput.value = '';
        renderCart();
        
        // Refresh data
        await fetchData();
        renderAll();
        renderPOSProducts();
        
    } catch (error) {
        console.error(error);
        showToast('Error processing sale', 'error');
    } finally {
        const btn = document.querySelector('button[onclick="checkoutPOS()"]');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-cash-register"></i> Complete Sale';
        }
    }
}

// --- Bulk Purchase Orders Logic ---
let poCart = [];

function renderPOProducts() {
    const grid = document.getElementById('po-product-grid');
    if (!grid) return;
    
    const search = document.getElementById('po-search').value.toLowerCase();
    
    grid.innerHTML = '';
    products.filter(p => p.name.toLowerCase().includes(search)).forEach(p => {
        grid.innerHTML += `
            <div class="card" style="cursor: pointer; transition: transform 0.2s;" onclick="addToPOCart(${p.id})">
                <div class="card-body text-center" style="padding: 1.5rem;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: var(--secondary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                        <i class="fa-solid fa-box"></i>
                    </div>
                    <h4 style="margin-bottom: 0.5rem; font-size: 1rem;">${p.name}</h4>
                    <div style="color: var(--secondary); font-weight: bold; margin-bottom: 0.5rem;">${appCurrency}${parseFloat(p.purchase_price || 0).toFixed(2)}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">Stock: ${p.stock}</div>
                </div>
            </div>
        `;
    });
}

function addToPOCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    const existing = poCart.find(item => item.product_id == productId);
    if (existing) {
        existing.qty += 1;
    } else {
        poCart.push({
            product_id: product.id,
            name: product.name,
            price: parseFloat(product.purchase_price || 0),
            qty: 1
        });
    }
    renderPOCart();
}

function removeFromPOCart(index) {
    poCart.splice(index, 1);
    renderPOCart();
}

function updatePOQty(index, change) {
    poCart[index].qty += change;
    if (poCart[index].qty <= 0) {
        removeFromPOCart(index);
    } else {
        renderPOCart();
    }
}

function renderPOCart() {
    const container = document.getElementById('po-cart-items');
    if (!container) return;
    
    if (poCart.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-muted); margin-top: 2rem;">Order is empty</p>';
        document.getElementById('po-total').textContent = appCurrency + '0.00';
        return;
    }
    
    container.innerHTML = '';
    let total = 0;
    
    poCart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-main); border-radius: var(--border-radius); margin-bottom: 0.5rem;';
        
        row.innerHTML = `
            <div style="flex: 1;">
                <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem;">${item.name}</h4>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${appCurrency}${item.price.toFixed(2)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-card); padding: 0.25rem; border-radius: 4px; border: 1px solid var(--border-color);">
                <button class="btn-icon" style="width: 24px; height: 24px; padding: 0;" onclick="updatePOQty(${index}, -1)"><i class="fa-solid fa-minus" style="font-size: 0.75rem;"></i></button>
                <span style="min-width: 20px; text-align: center; font-weight: bold; font-size: 0.9rem;">${item.qty}</span>
                <button class="btn-icon" style="width: 24px; height: 24px; padding: 0;" onclick="updatePOQty(${index}, 1)"><i class="fa-solid fa-plus" style="font-size: 0.75rem;"></i></button>
            </div>
            <div style="font-weight: bold; width: 70px; text-align: right; font-size: 0.95rem;">
                ${appCurrency}${itemTotal.toFixed(2)}
            </div>
        `;
        container.appendChild(row);
    });
    
    document.getElementById('po-total').textContent = appCurrency + total.toFixed(2);
}

function checkoutPO() {
    if (poCart.length === 0) {
        showToast('Order is empty', 'error');
        return;
    }
    
    const supplierId = document.getElementById('po-supplier').value;
    if (!supplierId) {
        showToast('Please select a supplier', 'error');
        return;
    }
    
    document.getElementById('confirm-modal-title').textContent = 'Confirm Purchase Order';
    document.getElementById('confirm-modal-message').textContent = 'Are you sure you want to confirm this bulk intake?';
    
    const confirmBtn = document.getElementById('confirm-modal-btn');
    confirmBtn.onclick = () => {
        closeModal('confirm-modal');
        executeCheckoutPO();
    };
    
    openModal('confirm-modal');
}

async function executeCheckoutPO() {
    const ref = document.getElementById('po-ref').value;
    
    const btn = document.querySelector('button[onclick="checkoutPO()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        const refNumber = ref || 'PO-' + Math.floor(Date.now() / 1000);
        const promises = poCart.map(item => {
            return apiCall(`stock-movements`, 'POST', {
                type: 'in',
                product_id: item.product_id,
                qty: item.qty,
                ref: refNumber
            });
        });
        
        await Promise.all(promises);
        
        const totalItems = poCart.reduce((sum, item) => sum + item.qty, 0);
        document.getElementById('success-modal-message').textContent = `${totalItems} items received successfully!`;
        openModal('success-modal');
        
        poCart = [];
        document.getElementById('po-supplier').value = '';
        document.getElementById('po-ref').value = '';
        renderPOCart();
        
        await fetchData();
        renderAll();
        renderPOProducts();
        
    } catch (error) {
        console.error(error);
        showToast('Error processing order', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Confirm Purchase Order';
        }
    }
}

function generateMultiItemInvoice(cartItems, refNumber, customerName = 'Walk-in Customer', customerPhone = '') {
    document.getElementById('inv-date').textContent = 'Date: ' + new Date().toLocaleDateString();
    document.getElementById('inv-ref').textContent = 'Ref: ' + refNumber;
    
    const customerEl = document.getElementById('inv-customer-name');
    if (customerEl) customerEl.textContent = customerName;
    
    const phoneEl = document.getElementById('inv-customer-phone');
    if (phoneEl) {
        phoneEl.textContent = customerPhone ? 'Mob: ' + customerPhone : '';
    }
    
    const tbody = document.getElementById('inv-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let subtotal = 0;
    
    cartItems.forEach(item => {
        const lineTotal = item.qty * item.price;
        subtotal += lineTotal;
        
        tbody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">${appCurrency}${item.price.toFixed(2)}</td>
                <td style="text-align: right;">${appCurrency}${lineTotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    document.getElementById('inv-subtotal').textContent = appCurrency + subtotal.toFixed(2);
    document.getElementById('inv-gst').textContent = appCurrency + tax.toFixed(2);
    document.getElementById('inv-grand-total').textContent = appCurrency + total.toFixed(2);
    
    document.getElementById('invoice-modal').classList.add('active');
}

// --- Advanced Reports & Analytics ---

function generateReport(e) {
    if (e) e.preventDefault();
    
    const type = document.getElementById('report-type').value;
    const startDate = document.getElementById('report-start').value;
    const endDate = document.getElementById('report-end').value;
    
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    let results = [];
    let title = '';
    
    if (type === 'sales') {
        title = 'Sales History';
        results = stockMovements.filter(m => m.type === 'out' && new Date(m.created_at) >= start && new Date(m.created_at) <= end);
    } else if (type === 'intake') {
        title = 'Stock Intake History';
        results = stockMovements.filter(m => m.type === 'in' && new Date(m.created_at) >= start && new Date(m.created_at) <= end);
    } else if (type === 'low_stock') {
        title = 'Low Stock Alerts';
        // Date filter doesn't really apply to current low stock, but we will just return low stock products
        results = products.filter(p => p.stock <= p.min_stock);
    }
    
    document.getElementById('report-title').textContent = title;
    renderReportTable(results, type);
}

function renderReportTable(data, type) {
    const head = document.getElementById('report-table-head');
    const body = document.getElementById('report-table-body');
    const summary = document.getElementById('report-summary');
    const grandTotalEl = document.getElementById('report-grand-total');
    
    head.innerHTML = '';
    body.innerHTML = '';
    summary.style.display = 'none';
    
    if (data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="text-center">No data found for the selected parameters.</td></tr>';
        return;
    }
    
    if (type === 'sales' || type === 'intake') {
        head.innerHTML = `
            <tr>
                <th>Date</th>
                <th>Ref / Invoice</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Value</th>
            </tr>
        `;
        
        let grandTotal = 0;
        
        data.forEach(m => {
            const product = products.find(p => p.id == m.product_id) || { name: 'Unknown', selling_price: 0, purchase_price: 0 };
            const price = type === 'sales' ? product.selling_price : product.purchase_price;
            const value = parseFloat(price || 0) * m.qty;
            grandTotal += value;
            
            body.innerHTML += `
                <tr>
                    <td>${new Date(m.created_at).toLocaleDateString()}</td>
                    <td>${m.ref || '-'}</td>
                    <td>${product.name}</td>
                    <td>${m.qty}</td>
                    <td data-raw="${value.toFixed(2)}">${appCurrency}${value.toFixed(2)}</td>
                </tr>
            `;
        });
        
        grandTotalEl.textContent = `${appCurrency}${grandTotal.toFixed(2)}`;
        summary.style.display = 'block';
        
    } else if (type === 'low_stock') {
        head.innerHTML = `
            <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Min Stock Level</th>
            </tr>
        `;
        
        data.forEach(p => {
            body.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.sku || '-'}</td>
                    <td>${p.name}</td>
                    <td style="color: var(--danger); font-weight: bold;">${p.stock}</td>
                    <td>${p.min_stock}</td>
                </tr>
            `;
        });
    }
}

function exportReportCSV() {
    const title = document.getElementById('report-title').textContent;
    const body = document.getElementById('report-table-body');
    
    if (body.querySelectorAll('td').length <= 1) {
        showToast('No data to export', 'error');
        return;
    }
    
    let csv = '';
    
    // Headers
    const headCells = document.querySelectorAll('#report-table-head th');
    const headers = Array.from(headCells).map(th => `"${th.textContent}"`);
    csv += headers.join(',') + '\n';
    
    // Rows
    const rows = body.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(td => {
            const text = td.hasAttribute('data-raw') ? td.getAttribute('data-raw') : td.textContent;
            return `"${text.replace(/"/g, '""')}"`;
        });
        csv += rowData.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- Helper Functions ---
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Transport & Delivery Orders ---
function setDeliveryStatusFilter(status) {
    deliveryStatusFilter = status;
    const buttons = document.querySelectorAll('#delivery-status-filters .filter-tab');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-filter') === status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderDeliveryOrders();
}

function renderDeliveryOrders() {
    if (currentView !== 'transport') return;

    const tbody = document.getElementById('delivery-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchTerm = (document.getElementById('search-delivery-order')?.value || '').toLowerCase().trim();

    let filtered = [...deliveryOrders];

    // Status filter
    if (deliveryStatusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === deliveryStatusFilter);
    }

    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(o => {
            const idStr = `#do-${o.id} ${o.id}`.toLowerCase();
            const custName = (o.customer?.name || '').toLowerCase();
            const custPhone = (o.customer?.phone || '').toLowerCase();
            const courier = (o.courier_name || '').toLowerCase();
            const tracking = (o.tracking_number || '').toLowerCase();
            const addr = o.delivery_address ? `${o.delivery_address.label} ${o.delivery_address.street} ${o.delivery_address.city}`.toLowerCase() : '';
            return idStr.includes(searchTerm) ||
                   custName.includes(searchTerm) ||
                   custPhone.includes(searchTerm) ||
                   courier.includes(searchTerm) ||
                   tracking.includes(searchTerm) ||
                   addr.includes(searchTerm);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="color:var(--text-muted); padding: 3rem 1rem;">
                    <i class="fa-solid fa-truck" style="font-size: 2.5rem; color: var(--border-color); margin-bottom: 0.75rem; display:block;"></i>
                    No delivery orders found${deliveryStatusFilter !== 'all' ? ` matching status "${deliveryStatusFilter}"` : ''}.
                    <br>
                    <a href="#" onclick="openCreateDeliveryOrder(); return false;" style="margin-top: 0.5rem; display: inline-block;">Create a new delivery order</a>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(o => {
        const tr = document.createElement('tr');

        // Status Badge
        let statusBadge = '';
        if (o.status === 'pending') {
            statusBadge = `<span class="status-badge badge-pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
        } else if (o.status === 'dispatched') {
            statusBadge = `<span class="status-badge badge-dispatched"><i class="fa-solid fa-truck-fast"></i> Dispatched</span>`;
        } else if (o.status === 'delivered') {
            statusBadge = `<span class="status-badge badge-delivered"><i class="fa-solid fa-circle-check"></i> Delivered</span>`;
        } else {
            statusBadge = `<span class="status-badge">${escapeHtml(o.status)}</span>`;
        }

        // Method & Courier info
        const methodHtml = o.transport_method === 'own_rider'
            ? `<span style="font-weight: 500;"><i class="fa-solid fa-motorcycle" style="color:var(--primary); margin-right:4px;"></i> Own Rider</span>`
            : `<span style="font-weight: 500;"><i class="fa-solid fa-truck-fast" style="color:var(--info); margin-right:4px;"></i> Courier</span>`;

        const courierHtml = o.transport_method === 'courier'
            ? `<strong>${escapeHtml(o.courier_name || '-')}</strong><div style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-barcode"></i> ${escapeHtml(o.tracking_number || '-')}</div>`
            : `<span style="color:var(--text-muted); font-size: 0.85rem;">—</span>`;

        // Address info
        const addr = o.delivery_address;
        const addrHtml = addr
            ? `<div style="font-size: 0.875rem;"><strong>${escapeHtml(addr.label)}:</strong> ${escapeHtml(addr.street)}, ${escapeHtml(addr.city)}</div>`
            : `<span style="color:var(--text-muted);">No address recorded</span>`;

        // Customer info
        const custName = o.customer ? escapeHtml(o.customer.name) : 'Unknown Customer';
        const custPhone = o.customer?.phone ? `<div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(o.customer.phone)}</div>` : '';

        // Date
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

        tr.innerHTML = `
            <td><strong style="color: var(--primary);">#DO-${o.id}</strong></td>
            <td>
                <div style="font-weight: 600;">${custName}</div>
                ${custPhone}
            </td>
            <td>${addrHtml}</td>
            <td>${methodHtml}</td>
            <td>${courierHtml}</td>
            <td>${statusBadge}</td>
            <td><small style="color: var(--text-muted);">${dateStr}</small></td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="btn-icon" onclick="viewDeliveryOrderSummary(${o.id})" title="View Details">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteDeliveryOrder(${o.id})" title="Delete Order">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openCreateDeliveryOrder() {
    // Populate customer dropdown
    const custSelect = document.getElementById('do-customer');
    if (!custSelect) return;
    custSelect.innerHTML = '<option value="">Select Customer...</option>';
    if (customers.length === 0) {
        custSelect.innerHTML += '<option value="" disabled>No customers found. Please add a customer first.</option>';
    } else {
        customers.forEach(c => {
            custSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.phone)})</option>`;
        });
    }

    // Reset Address dropdown & hint
    const addrSelect = document.getElementById('do-address');
    addrSelect.innerHTML = '<option value="">Select Customer first...</option>';
    document.getElementById('do-no-address-hint').style.display = 'none';

    // Reset transport method
    const ownRiderRadio = document.querySelector('input[name="do_transport_method"][value="own_rider"]');
    if (ownRiderRadio) ownRiderRadio.checked = true;
    toggleTransportMethod('own_rider');

    // Reset items container and add 1 default row
    const itemsContainer = document.getElementById('do-items-container');
    itemsContainer.innerHTML = '';
    addDeliveryItemRow();

    // Reset notes
    document.getElementById('do-notes').value = '';

    openModal('delivery-order-modal');
}

async function onDeliveryCustomerChange() {
    const custId = document.getElementById('do-customer').value;
    const addrSelect = document.getElementById('do-address');
    const hint = document.getElementById('do-no-address-hint');

    if (!custId) {
        addrSelect.innerHTML = '<option value="">Select Customer first...</option>';
        hint.style.display = 'none';
        return;
    }

    addrSelect.innerHTML = '<option value="">Loading addresses...</option>';

    try {
        const res = await fetch(`${API_URL}/customer-addresses?customer_id=${custId}`);
        const addresses = await res.json();

        if (!addresses || addresses.length === 0) {
            addrSelect.innerHTML = '<option value="">No addresses found</option>';
            hint.style.display = 'block';
            return;
        }

        hint.style.display = 'none';
        addrSelect.innerHTML = '<option value="">Select Delivery Address...</option>';
        let defaultAddrId = null;

        addresses.forEach(a => {
            const isDef = !!a.is_default;
            if (isDef) defaultAddrId = a.id;
            addrSelect.innerHTML += `<option value="${a.id}">${escapeHtml(a.label)} — ${escapeHtml(a.street)}, ${escapeHtml(a.city)}${isDef ? ' (Default)' : ''}</option>`;
        });

        // Pre-select default address or first address
        if (defaultAddrId) {
            addrSelect.value = defaultAddrId;
        } else if (addresses.length > 0) {
            addrSelect.value = addresses[0].id;
        }
    } catch (err) {
        addrSelect.innerHTML = '<option value="">Error loading addresses</option>';
        showToast('Could not load customer addresses.', 'danger');
    }
}

function addDeliveryItemRow(desc = '', qty = 1) {
    const container = document.getElementById('do-items-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'delivery-item-row';
    row.innerHTML = `
        <input type="text" class="form-control do-item-desc" placeholder="Item description e.g. Wireless Mouse" value="${escapeHtml(desc)}" required>
        <input type="number" min="1" class="form-control do-item-qty" placeholder="Qty" value="${qty}" required>
        <button type="button" class="btn-icon delete" onclick="removeDeliveryItemRow(this)" title="Remove item">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    container.appendChild(row);
}

function removeDeliveryItemRow(btn) {
    const container = document.getElementById('do-items-container');
    const rows = container.querySelectorAll('.delivery-item-row');
    if (rows.length <= 1) {
        // If only 1 row left, don't remove, just clear
        const row = rows[0];
        row.querySelector('.do-item-desc').value = '';
        row.querySelector('.do-item-qty').value = 1;
        return;
    }
    btn.closest('.delivery-item-row').remove();
}

function toggleTransportMethod(method) {
    const courierFields = document.getElementById('do-courier-fields');
    const courierName = document.getElementById('do-courier-name');
    const trackingNum = document.getElementById('do-tracking-number');

    if (method === 'courier') {
        courierFields.style.display = 'grid';
        courierName.required = true;
        trackingNum.required = true;
    } else {
        courierFields.style.display = 'none';
        courierName.required = false;
        trackingNum.required = false;
        courierName.value = '';
        trackingNum.value = '';
    }
}

async function saveDeliveryOrder(e) {
    e.preventDefault();

    const customerId = document.getElementById('do-customer').value;
    const addressId = document.getElementById('do-address').value;
    const transportMethod = document.querySelector('input[name="do_transport_method"]:checked')?.value || 'own_rider';
    const courierName = document.getElementById('do-courier-name').value.trim();
    const trackingNumber = document.getElementById('do-tracking-number').value.trim();
    const notes = document.getElementById('do-notes').value.trim();

    if (!addressId) {
        showToast('Please select a valid delivery address.', 'danger');
        return;
    }

    // Collect items
    const rows = document.querySelectorAll('#do-items-container .delivery-item-row');
    const items = [];
    rows.forEach(r => {
        const desc = r.querySelector('.do-item-desc').value.trim();
        const qty = parseInt(r.querySelector('.do-item-qty').value) || 0;
        if (desc && qty > 0) {
            items.push({ description: desc, quantity: qty });
        }
    });

    if (items.length === 0) {
        showToast('Please add at least one valid item with a quantity greater than 0.', 'danger');
        return;
    }

    const payload = {
        customer_id: parseInt(customerId),
        delivery_address_id: parseInt(addressId),
        transport_method: transportMethod,
        items: items,
        notes: notes || null
    };

    if (transportMethod === 'courier') {
        if (!courierName || !trackingNumber) {
            showToast('Courier Name and Tracking Number are required for courier transport.', 'danger');
            return;
        }
        payload.courier_name = courierName;
        payload.tracking_number = trackingNumber;
    }

    try {
        await apiCall('delivery-orders', 'POST', payload);
        showToast('Delivery order created successfully!', 'success');
        closeModal('delivery-order-modal');
        await fetchData();
        renderAll();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

async function viewDeliveryOrderSummary(orderId) {
    const order = deliveryOrders.find(o => o.id == orderId);
    if (!order) return;

    document.getElementById('dos-order-title').textContent = `Delivery Order #DO-${order.id}`;

    let statusBadge = '';
    if (order.status === 'pending') {
        statusBadge = `<span class="status-badge badge-pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
    } else if (order.status === 'dispatched') {
        statusBadge = `<span class="status-badge badge-dispatched"><i class="fa-solid fa-truck-fast"></i> Dispatched</span>`;
    } else if (order.status === 'delivered') {
        statusBadge = `<span class="status-badge badge-delivered"><i class="fa-solid fa-circle-check"></i> Delivered</span>`;
    } else {
        statusBadge = `<span class="status-badge">${escapeHtml(order.status)}</span>`;
    }

    const cust = order.customer;
    const addr = order.delivery_address;
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleString() : '-';

    let itemsRowsHtml = '';
    if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((it, idx) => {
            itemsRowsHtml += `
                <tr>
                    <td style="padding: 0.5rem; text-align: center; color: var(--text-muted);">${idx + 1}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(it.description)}</td>
                    <td style="padding: 0.5rem; text-align: center;"><strong>${escapeHtml(String(it.quantity))}</strong></td>
                </tr>
            `;
        });
    } else {
        itemsRowsHtml = '<tr><td colspan="3" class="text-center" style="padding: 1rem; color: var(--text-muted);">No items recorded</td></tr>';
    }

    const methodDisplay = order.transport_method === 'own_rider'
        ? '<i class="fa-solid fa-motorcycle" style="color:var(--primary);"></i> Own Rider'
        : `<i class="fa-solid fa-truck-fast" style="color:var(--info);"></i> Courier: <strong>${escapeHtml(order.courier_name || '')}</strong> (Tracking: <code>${escapeHtml(order.tracking_number || '')}</code>)`;

    const content = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1rem;">
            <div>
                <span style="font-size: 0.85rem; color: var(--text-muted);">Created on ${dateStr}</span>
            </div>
            <div>${statusBadge}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div style="background: var(--bg-main); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-bottom: 0.25rem;">
                    <i class="fa-solid fa-user"></i> Customer
                </div>
                <strong>${cust ? escapeHtml(cust.name) : 'Unknown'}</strong>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                    ${cust?.phone ? `<div><i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${escapeHtml(cust.phone)}</div>` : ''}
                    ${cust?.email ? `<div><i class="fa-solid fa-envelope" style="font-size: 0.75rem;"></i> ${escapeHtml(cust.email)}</div>` : ''}
                </div>
            </div>

            <div style="background: var(--bg-main); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-bottom: 0.25rem;">
                    <i class="fa-solid fa-location-dot"></i> Delivery Address
                </div>
                ${addr ? `
                    <strong>${escapeHtml(addr.label)}</strong>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                        ${escapeHtml(addr.street)}<br>
                        ${escapeHtml(addr.city)}
                    </div>
                ` : '<div style="color:var(--text-muted); font-size: 0.85rem;">No address recorded</div>'}
            </div>
        </div>

        <div style="background: var(--bg-main); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-bottom: 0.25rem;">
                <i class="fa-solid fa-truck"></i> Transport Method
            </div>
            <div>${methodDisplay}</div>
        </div>

        <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">Items (${Array.isArray(order.items) ? order.items.length : 0})</div>
            <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: var(--bg-main); border-bottom: 1px solid var(--border-color);">
                        <th style="width: 40px; padding: 0.5rem; text-align: center;">#</th>
                        <th style="padding: 0.5rem;">Description</th>
                        <th style="width: 80px; padding: 0.5rem; text-align: center;">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRowsHtml}
                </tbody>
            </table>
        </div>

        ${order.notes ? `
            <div style="background: var(--bg-main); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-bottom: 0.25rem;">
                    <i class="fa-solid fa-note-sticky"></i> Notes
                </div>
                <div style="font-size: 0.875rem;">${escapeHtml(order.notes)}</div>
            </div>
        ` : ''}
    `;

    document.getElementById('dos-content').innerHTML = content;
    openModal('delivery-summary-modal');
}

async function deleteDeliveryOrder(orderId) {
    if (confirm('Are you sure you want to delete this delivery order?')) {
        try {
            await apiCall(`delivery-orders/${orderId}`, 'DELETE');
            showToast('Delivery order deleted.', 'success');
            await fetchData();
            renderAll();
        } catch (err) {
            showToast(err.message || 'Error deleting delivery order.', 'danger');
        }
    }
}

