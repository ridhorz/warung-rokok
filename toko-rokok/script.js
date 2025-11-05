// Data dan Konfigurasi
const LOW_STOCK_THRESHOLD = 20;
const TOAST_DURATION = 2000;
const TOAST_ANIMATION_DURATION = 250;

const products = [
  {
    name: "Djarum Black",
    pricePerBatang: 2500,
    pricePerBungkus: 25000,
    image: "./images/djarum_black.png",
    nikotin: "1.1 mg",
    kandungan:
      "Campuran tembakau pilihan dan cengkeh berkualitas tinggi. Rasa khas kuat.",
    deskripsi: "Sensasi merokok khas dan berani.",
    stok: 120,
    expired: "12/2025",
    isiPerBungkus: 12,
  },
  {
    name: "Gudang Garam Surya",
    pricePerBatang: 2700,
    pricePerBungkus: 27000,
    image: "./images/gudang_garam_surya.png",
    nikotin: "1.3 mg",
    kandungan:
      "Tembakau khas Indonesia dengan racikan cengkeh alami dan rempah lokal.",
    deskripsi: "Rasa dalam yang otentik dan mantap.",
    stok: 85,
    expired: "08/2025",
    isiPerBungkus: 12,
  },
  {
    name: "Sampoerna Mild",
    pricePerBatang: 2800,
    pricePerBungkus: 28000,
    image: "./images/sampoerna_mild.png",
    nikotin: "1.0 mg",
    kandungan:
      "Perpaduan tembakau halus dan aroma ringan. Lapisan kertas berkualitas.",
    deskripsi: "Rasa ringan dan lembut, kenikmatan halus.",
    stok: 65,
    expired: "03/2026",
    isiPerBungkus: 16,
  },
];
const cart = [];
const history = [];
const DISCOUNT = 10;
let _lastAddedItemName = null;
let filterTimeoutId;
let toastIdCounter = 0;
let editingProductIndex = null;
let appliedCoupon = null;

const COUPONS = {
  HEMAT10: { discount: 10, description: 'Diskon 10%' },
  DISKON20: { discount: 20, description: 'Diskon 20%' },
  GILA50: { discount: 50, description: 'Diskon 50%' },
  PROMO15: { discount: 15, description: 'Diskon 15%' }
};

// === TOAST NOTIFICATION SYSTEM ===
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  },

  show(type, title, message, duration = TOAST_DURATION) {
    if (!this.container) this.init();

    const toastId = ++toastIdCounter;
    const toast = this.createToast(toastId, type, title, message);
    
    this.container.appendChild(toast);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    const autoHideTimeout = setTimeout(() => {
      this.hide(toastId);
    }, duration);

    toast.dataset.timeoutId = autoHideTimeout;
    toast.addEventListener('click', () => this.hide(toastId));

    return toastId;
  },

  createToast(id, type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.dataset.toastId = id;
    toast.setAttribute('role', 'alert');

    const icons = {
      success: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
      error: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>`,
      warning: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>`,
      info: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>`
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <div class="toast-close">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div class="toast-progress"></div>
    `;

    return toast;
  },

  hide(toastId) {
    const toast = this.container?.querySelector(`[data-toast-id="${toastId}"]`);
    if (!toast) return;

    const timeoutId = toast.dataset.timeoutId;
    if (timeoutId) clearTimeout(Number(timeoutId));

    toast.classList.add('hiding');
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
    }, TOAST_ANIMATION_DURATION);
  },

  success(title, message) {
    return this.show('success', title, message);
  },

  error(title, message) {
    return this.show('error', title, message);
  },

  warning(title, message) {
    return this.show('warning', title, message);
  },

  info(title, message) {
    return this.show('info', title, message);
  }
};

// === PRODUCT MANAGER ===
const ProductManager = {
  openAddModal() {
    editingProductIndex = null;
    document.getElementById('modalTitle').textContent = 'Tambah Produk';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('imagePlaceholder').classList.remove('hidden');
    this.showModal();
  },

  openEditModal(index) {
    editingProductIndex = index;
    const product = products[index];
    
    document.getElementById('modalTitle').textContent = 'Edit Produk';
    document.getElementById('productName').value = product.name;
    document.getElementById('pricePerBatang').value = product.pricePerBatang;
    document.getElementById('pricePerBungkus').value = product.pricePerBungkus;
    document.getElementById('stok').value = product.stok;
    document.getElementById('isiPerBungkus').value = product.isiPerBungkus;
    document.getElementById('nikotin').value = product.nikotin;
    document.getElementById('expired').value = product.expired;
    document.getElementById('kandungan').value = product.kandungan;
    document.getElementById('deskripsi').value = product.deskripsi;
    
    if (product.image) {
      document.getElementById('imagePreview').src = product.image;
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('imagePlaceholder').classList.add('hidden');
    }
    
    this.showModal();
  },

  showModal() {
    const modal = document.getElementById('productModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    editingProductIndex = null;
  },

  previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Toast.warning('File Terlalu Besar', 'Ukuran gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('imagePreview').src = e.target.result;
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('imagePlaceholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
  },

  save(event) {
    event.preventDefault();

    const productData = {
      name: document.getElementById('productName').value,
      pricePerBatang: parseInt(document.getElementById('pricePerBatang').value),
      pricePerBungkus: parseInt(document.getElementById('pricePerBungkus').value),
      stok: parseInt(document.getElementById('stok').value),
      isiPerBungkus: parseInt(document.getElementById('isiPerBungkus').value),
      nikotin: document.getElementById('nikotin').value,
      expired: document.getElementById('expired').value,
      kandungan: document.getElementById('kandungan').value,
      deskripsi: document.getElementById('deskripsi').value,
      image: document.getElementById('imagePreview').src || './images/default-product.png'
    };

    if (editingProductIndex !== null) {
      products[editingProductIndex] = productData;
      Toast.success('Produk Diupdate!', `${productData.name} berhasil diperbarui.`);
    } else {
      products.push(productData);
      Toast.success('Produk Ditambahkan!', `${productData.name} berhasil ditambahkan.`);
    }

    this.saveToLocalStorage();
    renderProducts();
    this.closeModal();
  },

  delete(index) {
    if (!confirm(`Yakin ingin menghapus ${products[index].name}?`)) return;
    
    const productName = products[index].name;
    products.splice(index, 1);
    this.saveToLocalStorage();
    renderProducts();
    Toast.info('Produk Dihapus', `${productName} telah dihapus dari katalog.`);
  },

  saveToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(products));
  },

  loadFromLocalStorage() {
    const saved = localStorage.getItem('products');
    if (saved) {
      const loaded = JSON.parse(saved);
      products.length = 0;
      products.push(...loaded);
    }
  }
};

// === COUPON SYSTEM ===
const Coupon = {
  apply() {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const statusDiv = document.getElementById('couponStatus');
    
    if (!code) {
      statusDiv.innerHTML = `<p class="coupon-error">Masukkan kode kupon terlebih dahulu</p>`;
      Toast.error('Kode Kupon Kosong', 'Silakan masukkan kode kupon yang valid.');
      return;
    }

    const coupon = COUPONS[code];
    if (!coupon) {
      statusDiv.innerHTML = `<p class="coupon-error">Kode kupon tidak valid</p>`;
      appliedCoupon = null;
      updateCartSummary();
      Toast.error('Kupon Tidak Valid', `Kode "${code}" tidak ditemukan.`);
      return;
    }

    appliedCoupon = { code, ...coupon };
    statusDiv.innerHTML = `<p class="coupon-success">${coupon.description} berhasil diterapkan</p>`;
    updateCartSummary();
    Toast.success('Kupon Diterapkan!', `${coupon.description} berhasil dipakai.`);
  },

  remove() {
    appliedCoupon = null;
    document.getElementById('couponCode').value = '';
    document.getElementById('couponStatus').innerHTML = '';
    updateCartSummary();
  },

  // Clear status saat user mulai ketik
  clearStatus() {
    const statusDiv = document.getElementById('couponStatus');
    if (statusDiv) {
      statusDiv.innerHTML = '';
    }
  }
};

// === DASHBOARD ANALYTICS ===
const Dashboard = {
  render() {
    const today = new Date().toDateString();
    const todayHistory = history.filter(h => new Date(h.date).toDateString() === today);
    
    const totalSales = todayHistory.reduce((sum, h) => sum + h.total, 0);
    const totalTransactions = todayHistory.length;
    const totalItems = todayHistory.reduce((sum, h) => 
      sum + h.items.reduce((s, i) => s + i.quantity, 0), 0
    );

    const productSales = {};
    todayHistory.forEach(h => {
      h.items.forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });
    });
    
    const bestSeller = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
    const bestSellerName = bestSeller ? bestSeller[0] : '-';
    const bestSellerQty = bestSeller ? bestSeller[1] : 0;

    const dashboardEl = document.getElementById('dashboard');
    
    dashboardEl.innerHTML = `
      <h2 class="text-xl sm:text-2xl font-semibold mb-5">Dashboard Analytics</h2>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
        ${this.createCard('Total Penjualan', `Rp${totalSales.toLocaleString()}`)}
        ${this.createCard('Transaksi', totalTransactions)}
        ${this.createCard('Item Terjual', totalItems)}
        ${this.createCard('Produk Terlaris', bestSellerQty > 0 ? `${bestSellerName} (${bestSellerQty})` : bestSellerName)}
      </div>
      
      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales Chart -->
        <div class="card-base p-5">
          <h3 class="text-base font-semibold mb-4">Penjualan Produk</h3>
          <div class="chart-container">
            <canvas id="salesChart"></canvas>
          </div>
        </div>
        
        <!-- Revenue Trend -->
        <div class="card-base p-5">
          <h3 class="text-base font-semibold mb-4">Tren Penjualan Hari Ini</h3>
          <div class="chart-container">
            <canvas id="revenueTrendChart"></canvas>
          </div>
        </div>
      </div>
    `;
    
    // Render charts after DOM update
    setTimeout(() => {
      this.renderSalesChart(productSales);
      this.renderRevenueTrendChart(todayHistory);
    }, 100);
  },

  createCard(label, value) {
    return `
      <div class="card-base p-4 sm:p-5">
        <p class="text-xs text-muted mb-2">${label}</p>
        <p class="text-lg sm:text-xl font-semibold">${value}</p>
      </div>
    `;
  },

  renderSalesChart(productSales) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const isDark = document.body.classList.contains('dark');
    
    // Data - Top 5
    const data = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Setup canvas
    canvas.width = canvas.offsetWidth * 2; // Retina display
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    if (data.length === 0) {
      // Show empty state, hide canvas
      canvas.style.display = 'none';
      const emptyState = document.getElementById('salesChartEmpty');
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }
    
    // Show canvas, hide empty state
    canvas.style.display = 'block';
    const emptyState = document.getElementById('salesChartEmpty');
    if (emptyState) emptyState.style.display = 'none';
    
    const maxValue = Math.max(...data.map(d => d[1]));
    const colors = [
      { main: '#3b82f6', light: '#93c5fd' },
      { main: '#10b981', light: '#6ee7b7' },
      { main: '#f59e0b', light: '#fcd34d' },
      { main: '#ef4444', light: '#fca5a5' },
      { main: '#8b5cf6', light: '#c4b5fd' }
    ];
    
    const padding = 40;
    const chartHeight = height - padding - 50;
    const chartWidth = width - padding * 2;
    const barWidth = (chartWidth / data.length) * 0.7;
    const spacing = chartWidth / data.length;
    
    // Draw grid lines
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = Math.round(maxValue * (1 - i / 5));
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value, padding - 8, y + 4);
    }
    
    // Draw bars with gradient
    data.forEach((item, index) => {
      const [name, value] = item;
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + spacing * index + (spacing - barWidth) / 2;
      const y = height - padding - 30 - barHeight;
      
      // Gradient bar
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, colors[index].light);
      gradient.addColorStop(1, colors[index].main);
      ctx.fillStyle = gradient;
      
      // Rounded rectangle
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
      
      // Value on top
      ctx.fillStyle = isDark ? '#f3f4f6' : '#111827';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value, x + barWidth / 2, y - 8);
      
      // Product name
      ctx.font = '12px sans-serif';
      ctx.fillStyle = isDark ? '#d1d5db' : '#4b5563';
      const shortName = name.length > 10 ? name.substring(0, 10) + '...' : name;
      ctx.fillText(shortName, x + barWidth / 2, height - padding - 10);
    });
  },

  renderRevenueTrendChart(todayHistory) {
    const canvas = document.getElementById('revenueTrendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const isDark = document.body.classList.contains('dark');
    
    // Setup canvas for retina
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    if (todayHistory.length === 0) {
      // Show empty state, hide canvas
      canvas.style.display = 'none';
      const emptyState = document.getElementById('revenueTrendChartEmpty');
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }
    
    // Show canvas, hide empty state
    canvas.style.display = 'block';
    const emptyState = document.getElementById('revenueTrendChartEmpty');
    if (emptyState) emptyState.style.display = 'none';
    
    // Prepare data
    const sortedHistory = todayHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulative = 0;
    const dataPoints = sortedHistory.map(h => {
      cumulative += h.total;
      return { value: cumulative, time: new Date(h.date) };
    });
    
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const padding = { top: 30, right: 30, bottom: 40, left: 60 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    // Draw grid
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (graphHeight / 5) * i;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Y-axis labels
      const value = Math.round(maxValue * (1 - i / 5));
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Rp${(value / 1000).toFixed(0)}k`, padding.left - 8, y + 4);
    }
    
    // Draw gradient fill area
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    dataPoints.forEach((point, index) => {
      const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
      const y = padding.top + (1 - point.value / maxValue) * graphHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fill();
    
    // Draw main line with shadow
    ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    dataPoints.forEach((point, index) => {
      const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
      const y = padding.top + (1 - point.value / maxValue) * graphHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw points with white center
    dataPoints.forEach((point, index) => {
      const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
      const y = padding.top + (1 - point.value / maxValue) * graphHeight;
      
      // Outer circle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner circle
      ctx.fillStyle = isDark ? '#1f2937' : 'white';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // X-axis labels (time)
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const step = Math.ceil(dataPoints.length / 5);
    dataPoints.forEach((point, index) => {
      if (index % step === 0 || index === dataPoints.length - 1) {
        const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
        const timeStr = point.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        ctx.fillText(timeStr, x, height - padding.bottom + 20);
      }
    });
    
    // Title
    ctx.fillStyle = isDark ? '#d1d5db' : '#374151';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Total: Rp${maxValue.toLocaleString()}`, padding.left, padding.top - 10);
  }
};

// === FUNGSI HELPER ===
function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.style.display = "flex";
    overlay.getBoundingClientRect();
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
  }
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.pointerEvents = "none";
      overlay.style.display = "none";
    }, 300);
  }
}

function sanitizeForId(name) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
}

// === FUNGSI RENDER UTAMA ===
function renderProducts(filteredList = products) {
  const menu = document.getElementById("menu");
  if (!menu) return;

  const fragment = document.createDocumentFragment();
  menu.innerHTML = "";

  const isDark = document.body.classList.contains("dark");
  const borderColor = isDark ? "var(--border-dark)" : "var(--border-light)";

  filteredList.forEach((product, index) => {
    const priceWithDiscount = product.pricePerBungkus * (1 - DISCOUNT / 100);
    const animationDelay = `${index * 50}ms`;

    const cardDiv = document.createElement("div");
    cardDiv.className = "product-card animate-slide-fade-in";
    cardDiv.style.animationDelay = animationDelay;

    const sanitizedNameId = sanitizeForId(product.name);
    
    // Hitung total item produk ini di cart
    const cartItem = cart.find(item => item.name === product.name);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const hasInCart = cartQuantity > 0;

    cardDiv.innerHTML = `
        <div class="product-image-wrapper">
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            ${DISCOUNT > 0 ? `
            <div class="discount-label">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:0.8rem; height:0.8rem;"> 
                    <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <span>${DISCOUNT}% OFF</span>
            </div>` : ""}
            ${product.stok <= 5 ? `
            <div class="low-stock-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:0.75rem; height:0.75rem;">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span>Stok: ${product.stok}</span>
            </div>` : ""}
            ${hasInCart ? `
            <div class="cart-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:0.75rem; height:0.75rem;">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <span>${cartQuantity}</span>
            </div>` : ""}
        </div>
        <div class="content-wrapper p-4 sm:p-5 flex flex-col justify-between flex-grow space-y-3">
            <div class="flex-grow">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-base sm:text-lg font-semibold leading-tight">${
                      product.name
                    }</h3>
                    <div class="text-right flex-shrink-0 ml-2">
                        <p class="text-xs text-muted">Per Bungkus</p>
                        <p class="text-lg font-bold text-primary-accent">Rp${priceWithDiscount.toLocaleString()}</p>
                    </div>
                </div>
                ${
                  DISCOUNT > 0
                    ? `<p class="text-xs text-danger-accent line-through mb-2">Normal: Rp${product.pricePerBungkus.toLocaleString()}</p>`
                    : ""
                }
                <p class="text-xs text-muted mb-2">Satuan: Rp${product.pricePerBatang.toLocaleString()}/btg</p>
                
                <div class="details-box text-xs">
                    <div class="detail-item">
                        <span class="detail-item-label">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"> <!-- Ikon Nikotin -->
                                <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 000-2H4a1 1 0 00-1-1zm4 2a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clip-rule="evenodd" />
                            </svg>
                            Nikotin:
                        </span>
                        <span class="detail-item-value">${
                          product.nikotin
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-item-label">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"> <!-- Ikon Kandungan -->
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                            </svg>
                            Kandungan:
                        </span>
                        <span class="detail-item-value">${
                          product.kandungan
                        }</span> 
                    </div>
                    ${
                      product.deskripsi
                        ? `
                    <div class="detail-item">
                        <span class="detail-item-label">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"> <!-- Ikon Deskripsi -->
                                 <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                            Deskripsi:
                        </span>
                        <span class="detail-item-value">${product.deskripsi}</span>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
            <div class="mt-auto pt-3 space-y-3">
                <!-- Quick Add Button -->
                <div class="quick-add-section">
                    ${hasInCart ? `
                    <div class="quantity-stepper">
                        <button onclick="decreaseQuantity('${product.name}')" class="stepper-btn stepper-minus" title="Kurangi">
                            <span class="stepper-label">-</span>
                        </button>
                        <div class="stepper-display">
                            <span class="stepper-value">${cartQuantity}</span>
                            <span class="stepper-unit">bungkus</span>
                        </div>
                        <button onclick="increaseQuantity('${product.name}')" class="stepper-btn stepper-plus" title="Tambah">
                            <span class="stepper-label">+</span>
                        </button>
                    </div>
                    ` : `
                    <button onclick="quickAddToCart('${product.name}')" class="button-quick-add">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        </svg>
                        <span>Tambah ke Keranjang</span>
                    </button>
                    `}
                </div>
                
                <!-- Action Buttons -->
                <div class="flex gap-2 pt-2 border-t" style="border-color: ${borderColor}">
                    <button onclick="ProductManager.openEditModal(${index})" class="flex-1 button-secondary text-xs py-2">
                        Edit
                    </button>
                    <button onclick="ProductManager.delete(${index})" class="flex-1 button-danger-text text-xs py-2">
                        Hapus
                    </button>
                </div>
                
                <!-- Stock Info -->
                <p class="text-xs text-muted text-center pt-2 border-t" style="border-color: ${borderColor}">
                  <span class="${product.stok <= LOW_STOCK_THRESHOLD ? 'text-danger-accent font-semibold' : ''}">
                    Stok: ${product.stok}
                  </span> | Exp: ${product.expired}
                </p>
            </div>
        </div>
    `;
    fragment.appendChild(cardDiv);
  });
  menu.appendChild(fragment);
}

function filterProducts() {
  // Optimasi: Hapus loading overlay untuk performa lebih cepat
  clearTimeout(filterTimeoutId);
  filterTimeoutId = setTimeout(() => {
    const keywordInput = document.getElementById("searchInput");
    const nikotinSelect = document.getElementById("filterNikotin");
    const sortSelect = document.getElementById("sortSelect");

    const keyword = keywordInput.value.toLowerCase();
    const filterValue = nikotinSelect.value;
    const sort = sortSelect.value;

    let filtered = products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(keyword);
      const nikotinValue = parseFloat(p.nikotin);
      let nikotinMatch = true;
      if (filterValue === "rendah") nikotinMatch = nikotinValue <= 1.0;
      else if (filterValue === "sedang")
        nikotinMatch = nikotinValue > 1.0 && nikotinValue <= 1.2;
      else if (filterValue === "tinggi") nikotinMatch = nikotinValue >= 1.3;
      return nameMatch && nikotinMatch;
    });

    const getPriceForSort = (p) => p.pricePerBungkus * (1 - DISCOUNT / 100);
    if (sort === "harga-asc")
      filtered.sort((a, b) => getPriceForSort(a) - getPriceForSort(b));
    else if (sort === "harga-desc")
      filtered.sort((a, b) => getPriceForSort(b) - getPriceForSort(a));

    renderProducts(filtered);
    updateProductCount(filtered.length);
    toggleClearButton();
  }, 200); // Kurangi delay dari 400ms ke 200ms untuk respon lebih cepat
}

// Update product count badge
function updateProductCount(count) {
  const countText = document.getElementById('productCountText');
  if (countText) {
    countText.textContent = `${count} Produk`;
  }
}

// Toggle clear search button
function toggleClearButton() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (searchInput && clearBtn) {
    clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
  }
}

// Clear search input
function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    filterProducts();
  }
}

// === FUNGSI QUICK ADD (TAMBAH CEPAT) ===
function quickAddToCart(productName) {
  const product = products.find((p) => p.name === productName);
  if (!product) {
    console.error("Produk tidak ditemukan:", productName);
    return;
  }

  // Default: tambah 1 bungkus
  const quantity = 1;
  const type = "bungkus";
  const price = product.pricePerBungkus;
  const itemsPerPack = product.isiPerBungkus || 12;
  const stockNeeded = itemsPerPack;

  if (stockNeeded > product.stok) {
    Toast.error('Stok Tidak Cukup!', `${product.name} hanya tersisa ${product.stok} batang.`);
    return;
  }

  product.stok -= stockNeeded;

  if (product.stok <= LOW_STOCK_THRESHOLD && product.stok > 0) {
    Toast.warning('Stok Menipis!', `${product.name} tinggal ${product.stok} batang.`);
  }

  cart.push({
    name: productName,
    price,
    quantity,
    type,
    image: product.image,
  });

  _lastAddedItemName = productName;
  renderCart();
  renderProducts();
  updateCartSummary();

  Toast.success('Ditambahkan!', `${productName} berhasil ditambahkan.`);
}

// === FUNGSI INCREASE/DECREASE QUANTITY ===
function increaseQuantity(productName) {
  const product = products.find((p) => p.name === productName);
  if (!product) return;

  const cartItem = cart.find(item => item.name === productName);
  if (!cartItem) return;

  const itemsPerPack = product.isiPerBungkus || 12;
  const stockNeeded = itemsPerPack;

  if (stockNeeded > product.stok) {
    Toast.error('Stok Tidak Cukup!', `${product.name} hanya tersisa ${product.stok} batang.`);
    return;
  }

  product.stok -= stockNeeded;
  cartItem.quantity += 1;

  if (product.stok <= LOW_STOCK_THRESHOLD && product.stok > 0) {
    Toast.warning('Stok Menipis!', `${product.name} tinggal ${product.stok} batang.`);
  }

  renderCart();
  renderProducts();
  updateCartSummary();
}

function decreaseQuantity(productName) {
  const product = products.find((p) => p.name === productName);
  if (!product) return;

  const cartItemIndex = cart.findIndex(item => item.name === productName);
  if (cartItemIndex === -1) return;

  const cartItem = cart[cartItemIndex];
  const itemsPerPack = product.isiPerBungkus || 12;

  if (cartItem.quantity > 1) {
    cartItem.quantity -= 1;
    product.stok += itemsPerPack;
  } else {
    // Hapus dari cart jika quantity = 0
    cart.splice(cartItemIndex, 1);
    product.stok += itemsPerPack;
  }

  renderCart();
  renderProducts();
  updateCartSummary();
}

// === FUNGSI LAMA (BACKUP) - Bisa dihapus nanti ===
function addToCart(productName) {
  // Fungsi lama masih ada untuk compatibility
  // Tapi sekarang kita pakai quickAddToCart
  quickAddToCart(productName);
}

function renderCart() {
  const list = document.getElementById("cartItems");
  if (!list) return;

  const fragment = document.createDocumentFragment();
  list.innerHTML = "";

  if (cart.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "text-center py-12";
    emptyDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="text-muted text-sm">Keranjang masih kosong</p>
      <p class="text-muted text-xs mt-1">Tambahkan produk untuk mulai belanja</p>
    `;
    fragment.appendChild(emptyDiv);
  } else {
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item p-3 flex items-start gap-3";
      
      li.innerHTML = `
        <img src="${item.image}" alt="${
        item.name
      }" class="w-16 h-16 object-cover rounded-md flex-shrink-0">
        <div class="flex-1 min-w-0">
          <p class="font-medium mb-1">${item.name}</p>
          <p class="text-xs text-muted mb-2">${item.type} × ${item.quantity}</p>
          <div class="flex items-center justify-between">
            <p class="font-semibold">Rp${(
              item.price * item.quantity
            ).toLocaleString()}</p>
            <button onclick="handleRemoveFromCart(${index})" class="button-danger-text text-xs px-3 py-1.5" aria-label="Hapus ${
        item.name
      }">Hapus</button>
          </div>
        </div>
      `;
      if (_lastAddedItemName === item.name && index === cart.length - 1) {
        li.classList.add("item-highlight-enter");
        li.addEventListener(
          "animationend",
          () => li.classList.remove("item-highlight-enter"),
          { once: true }
        );
        _lastAddedItemName = null;
      }
      fragment.appendChild(li);
    });
  }
  list.appendChild(fragment);
  updateCartSummary(); // Panggil updateCartSummary setelah renderCart
}

function handleRemoveFromCart(index) {
  // Langsung hapus tanpa animasi untuk performa optimal
  proceedWithRemove(index);
}

function proceedWithRemove(index) {
  if (index < 0 || index >= cart.length) return;
  const itemRemoved = cart[index];
  const product = products.find((p) => p.name === itemRemoved.name);
  if (product) {
    const itemsPerPack = product.isiPerBungkus || 12;
    const stockToRestore =
      itemRemoved.type === "bungkus"
        ? itemRemoved.quantity * itemsPerPack
        : itemRemoved.quantity;
    product.stok += stockToRestore;
  }
  cart.splice(index, 1);
  renderCart();
  renderProducts();
  updateCartSummary();

  Toast.info('Dihapus dari Keranjang', `${itemRemoved.name} telah dihapus.`);
}

// === FUNGSI TAB SWITCHING ===
function switchTab(tabName) {
  // Remove active class dari semua tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Remove active class dari semua tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Add active class ke tab yang dipilih
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(`tab-${tabName}`);
  
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

function updateCartSummary() {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let totalAfterDiscount = total * (1 - DISCOUNT / 100);
  const discountAmount = total - totalAfterDiscount;
  
  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = totalAfterDiscount * (appliedCoupon.discount / 100);
    totalAfterDiscount -= couponDiscount;
  }

  // Update cart badge
  const cartBadge = document.getElementById("cartBadge");
  if (cartBadge) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
  }
  
  // Update checkout total
  const checkoutTotal = document.getElementById("checkoutTotal");
  if (checkoutTotal) {
    checkoutTotal.textContent = `Rp${totalAfterDiscount.toLocaleString()}`;
  }

  const cartTotalDisplay = document.getElementById("cartTotalDisplay");

  if (cartTotalDisplay) {
    const isDark = document.body.classList.contains("dark");
    const borderColor = isDark ? "var(--border-dark)" : "var(--border-light)";

    if (cart.length > 0) {
      cartTotalDisplay.innerHTML = `
        <div class="space-y-2.5 py-4 border-t-2" style="border-color: ${borderColor};">
          <div class="flex justify-between">
            <span class="text-muted">Subtotal</span>
            <span class="font-semibold">Rp${total.toLocaleString()}</span>
          </div>
          ${
            DISCOUNT > 0
              ? `<div class="flex justify-between">
                  <span class="text-muted">Diskon Toko (${DISCOUNT}%)</span>
                  <span class="text-danger-accent font-semibold">- Rp${discountAmount.toLocaleString()}</span>
                </div>`
              : ""
          }
          ${
            appliedCoupon
              ? `<div class="flex justify-between">
                  <div class="text-muted">
                    <div>Kupon ${appliedCoupon.code}</div>
                    <button onclick="Coupon.remove()" class="text-xs text-danger-accent hover:underline mt-0.5">Hapus kupon</button>
                  </div>
                  <span class="text-success-accent font-semibold">- Rp${couponDiscount.toLocaleString()}</span>
                </div>`
              : ""
          }
        </div>
        <div class="flex justify-between items-center pt-4 pb-2 border-t-2" style="border-color: ${borderColor};">
          <span class="font-bold text-lg">Total</span>
          <span class="text-2xl font-bold">Rp${totalAfterDiscount.toLocaleString()}</span>
        </div>`;
    } else {
      cartTotalDisplay.innerHTML = "";
    }
  }
}

function checkout() {
  const cashInput = document.getElementById("cash");
  const cash = parseFloat(cashInput.value) || 0;
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let totalAfterDiscount = total * (1 - DISCOUNT / 100);
  
  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = totalAfterDiscount * (appliedCoupon.discount / 100);
    totalAfterDiscount -= couponDiscount;
  }

  const receiptDiv = document.getElementById("receipt");
  if (!receiptDiv) return;

  receiptDiv.innerHTML = "";

  if (cart.length === 0) {
    Toast.warning('Keranjang Kosong', 'Silakan tambahkan produk terlebih dahulu.');
    return;
  }

  if (cash < totalAfterDiscount) {
    const kurang = totalAfterDiscount - cash;
    Toast.error(
      'Uang Tidak Cukup!', 
      `Kurang Rp${kurang.toLocaleString()}. Total: Rp${totalAfterDiscount.toLocaleString()}`
    );
    return;
  }

  const change = cash - totalAfterDiscount;

  const receiptItems = cart
    .map(
      (item) =>
        `<li class="flex justify-between py-0.5">
        <span>${item.name} (${item.type}) <span class="text-muted">×${
          item.quantity
        }</span></span>
        <span>Rp${(item.price * item.quantity).toLocaleString()}</span>
    </li>`
    )
    .join("");

  const isDark = document.body.classList.contains("dark");
  const borderColor = isDark ? "var(--border-dark)" : "var(--border-light)";

  const receiptContent = `
    <div class="card-base p-4 mt-4 bg-opacity-50 animate-slide-fade-in print-receipt">
      <div class="text-center mb-4 print-header">
        <h4 class='text-lg font-bold'>Warung Rokok</h4>
        <p class="text-xs text-muted">Jl. Contoh No. 123, Kota</p>
        <p class="text-xs text-muted">Telp: 0812-3456-7890</p>
        <div class="border-t mt-2 pt-2" style="border-color: ${borderColor};"></div>
      </div>
      
      <p class="text-xs text-muted mb-2">Tanggal: ${new Date().toLocaleString('id-ID')}</p>
      
      <ul class="space-y-0.5 text-xs mb-3">
        ${receiptItems}
      </ul>
      
      <div class="border-t pt-3 space-y-1 text-sm" style="border-color: ${borderColor};">
        <p class="flex justify-between text-muted"><span>Subtotal:</span> <span>Rp${total.toLocaleString()}</span></p>
        ${
          DISCOUNT > 0
            ? `<p class="flex justify-between text-danger-accent"><span>Diskon Toko (${DISCOUNT}%):</span> <span>- Rp${(total * (DISCOUNT / 100)).toLocaleString()}</span></p>`
            : ""
        }
        ${
          appliedCoupon
            ? `<p class="flex justify-between text-success-accent"><span>Kupon ${appliedCoupon.code} (${appliedCoupon.discount}%):</span> <span>- Rp${couponDiscount.toLocaleString()}</span></p>`
            : ""
        }
        <p class="flex justify-between font-semibold mt-1 pt-2 border-t" style="border-color: ${borderColor};">
            <span>Total:</span> <span class="text-base">Rp${totalAfterDiscount.toLocaleString()}</span>
        </p>
        <p class="flex justify-between text-muted"><span>Tunai:</span> <span>Rp${cash.toLocaleString()}</span></p>
        <p class="flex justify-between font-semibold"><span>Kembalian:</span> <span>Rp${change.toLocaleString()}</span></p>
      </div>
      
      <div class="text-center mt-4 pt-3 border-t" style="border-color: ${borderColor};">
        <p class="text-xs text-muted">Terima kasih atas kunjungan Anda!</p>
        <button onclick="printReceipt()" class="button-secondary text-xs py-1.5 px-4 mt-3 no-print">
          Print Struk
        </button>
      </div>
    </div>`;
  receiptDiv.innerHTML = receiptContent;

  history.push({
    items: [...cart],
    total: totalAfterDiscount,
    cash,
    change,
    date: new Date(),
    coupon: appliedCoupon ? appliedCoupon.code : null
  });
  
  renderHistory();
  Dashboard.render();
  
  cart.length = 0;
  renderCart();
  cashInput.value = "";
  updateCartSummary();
  
  Coupon.remove();

  Toast.success('Transaksi Berhasil!', `Kembalian: Rp${change.toLocaleString()}. Terima kasih!`);
}

function renderHistory() {
  const list = document.getElementById("history");
  if (!list) return;

  const isDark = document.body.classList.contains("dark");
  const borderColor = isDark ? "var(--border-dark)" : "var(--border-light)";

  if (history.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <p class="empty-state-title">Belum Ada Riwayat</p>
        <p class="empty-state-desc">Transaksi yang telah selesai akan muncul di sini</p>
      </div>
    `;
  } else {
    list.innerHTML = history
      .slice()
      .reverse()
      .map(
        (h, i) => `
      <li class='history-card animate-slide-fade-in' style="animation-delay: ${i * 40}ms">
        <!-- Header -->
        <div class="history-header">
          <div class="history-badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd" />
            </svg>
            <span>#${history.length - i}</span>
          </div>
          <div class="history-info">
            <p class="history-date">${new Date(h.date).toLocaleDateString("id-ID", { 
              day: "2-digit", 
              month: "short", 
              year: "numeric" 
            })}</p>
            <p class="history-time">${new Date(h.date).toLocaleTimeString("id-ID", { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}</p>
          </div>
          <div class="history-total">
            <p class="history-total-label">Total</p>
            <p class="history-total-value">Rp${h.total.toLocaleString()}</p>
          </div>
        </div>
        
        <!-- Items -->
        <div class="history-items">
          ${h.items.map(item => `
            <div class="history-item">
              <div class="history-item-info">
                <p class="history-item-name">${item.name}</p>
                <p class="history-item-detail">${item.type} × ${item.quantity}</p>
              </div>
              <p class="history-item-price">Rp${(item.price * item.quantity).toLocaleString()}</p>
            </div>
          `).join("")}
        </div>
        
        <!-- Footer -->
        <div class="history-footer">
          <div class="history-payment">
            <div class="history-payment-row">
              <span>Tunai</span>
              <span>Rp${h.cash.toLocaleString()}</span>
            </div>
            <div class="history-payment-row highlight">
              <span>Kembalian</span>
              <span>Rp${h.change.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </li>`
      )
      .join("");
  }
}

// === PENGATURAN TEMA ===
function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark");
  const isDark = body.classList.contains("dark");
  const themeBtn = document.getElementById("toggleTheme");
  if (themeBtn) {
    themeBtn.innerHTML = isDark
      ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> Light Mode`
      : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> Dark Mode`;
  }
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const body = document.body;
  const themeBtn = document.getElementById("toggleTheme");
  if (!themeBtn) return;
  if (savedTheme === "dark") {
    body.classList.add("dark");
    themeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> Light Mode`;
  } else {
    body.classList.remove("dark");
    themeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> Dark Mode`;
  }
}

// === PRINT RECEIPT ===
function printReceipt() {
  window.print();
}

// === INISIALISASI & EVENT LISTENERS ===
window.addEventListener("load", () => {
  initTheme();
  Toast.init();
  ProductManager.loadFromLocalStorage();
  showLoading();

  setTimeout(() => {
    Dashboard.render();
    renderProducts();
    renderCart();
    renderHistory();
    hideLoading();

    Toast.info('Selamat Datang!', 'Sistem kasir siap digunakan.');
  }, 200);

  const searchInput = document.getElementById("searchInput");
  const filterNikotin = document.getElementById("filterNikotin");
  const sortSelect = document.getElementById("sortSelect");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filterProducts();
      toggleClearButton();
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") clearSearch();
    });
  }
  if (filterNikotin) filterNikotin.addEventListener("change", filterProducts);
  if (sortSelect) sortSelect.addEventListener("change", filterProducts);

  if (searchInput) searchInput.value = "";
  if (filterNikotin) filterNikotin.value = "";
  if (sortSelect) sortSelect.value = "";
  
  // Initial product count
  updateProductCount(products.length);
});
