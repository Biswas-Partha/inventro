// Global Data State
let categories = [];
let suppliers = [];
let products = [];
let stockMovements = [];
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
        const [catRes, supRes, prodRes, moveRes] = await Promise.all([
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/suppliers`),
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/stock-movements`)
        ]);
        
        categories = await catRes.json();
        suppliers = await supRes.json();
        products = await prodRes.json();
        stockMovements = await moveRes.json();
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
        'supplier-modal': 'form-supplier'
    };
    if (formMap[modalId]) {
        document.getElementById(formMap[modalId]).reset();
        document.getElementById(formMap[modalId]).querySelector('input[type="hidden"]').value = '';
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
