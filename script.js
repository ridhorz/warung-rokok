// Loading Screen Handler
window.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loadingScreen');
  
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 1200);
});

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

// === CONFIRM MODAL SYSTEM ===
const ConfirmModal = {
  overlay: null,
  
  init() {
    if (this.overlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'confirm-modal-overlay';
    this.overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-modal-icon danger">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="confirm-modal-body">
          <h3 class="confirm-modal-title">Konfirmasi</h3>
          <p class="confirm-modal-message">Apakah Anda yakin?</p>
        </div>
        <div class="confirm-modal-actions">
          <button class="confirm-btn-cancel">Batal</button>
          <button class="confirm-btn-danger">Konfirmasi</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);
    
    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('show')) {
        this.hide();
      }
    });
  },
  
  show({ type = 'danger', title, message, confirmText = 'Konfirmasi', cancelText = 'Batal', onConfirm }) {
    this.init();
    
    const iconEl = this.overlay.querySelector('.confirm-modal-icon');
    const titleEl = this.overlay.querySelector('.confirm-modal-title');
    const messageEl = this.overlay.querySelector('.confirm-modal-message');
    const confirmBtn = this.overlay.querySelector('.confirm-btn-danger');
    const cancelBtn = this.overlay.querySelector('.confirm-btn-cancel');
    
    // Update icon type
    iconEl.className = `confirm-modal-icon ${type}`;
    if (type === 'danger') {
      iconEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      `;
    } else if (type === 'warning') {
      iconEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    
    // Remove old listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Add new listeners
    newConfirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.hide();
    });
    
    newCancelBtn.addEventListener('click', () => this.hide());
    
    // Show modal
    this.overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  },
  
  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }
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

    const name = document.getElementById('productName').value.trim();
    const pricePerBatang = parseInt(document.getElementById('pricePerBatang').value);
    const pricePerBungkus = parseInt(document.getElementById('pricePerBungkus').value);
    const stok = parseInt(document.getElementById('stok').value);
    const isiPerBungkus = parseInt(document.getElementById('isiPerBungkus').value);
    
    if (!name || name.length < 3) {
      Toast.error('Nama Tidak Valid', 'Nama produk minimal 3 karakter.');
      return;
    }
    
    if (isNaN(pricePerBatang) || pricePerBatang < 0) {
      Toast.error('Harga Tidak Valid', 'Harga per batang harus angka positif.');
      return;
    }
    
    if (isNaN(pricePerBungkus) || pricePerBungkus < 0) {
      Toast.error('Harga Tidak Valid', 'Harga per bungkus harus angka positif.');
      return;
    }
    
    if (isNaN(stok) || stok < 0) {
      Toast.error('Stok Tidak Valid', 'Stok harus angka positif.');
      return;
    }
    
    if (isNaN(isiPerBungkus) || isiPerBungkus < 1) {
      Toast.error('Isi Tidak Valid', 'Isi per bungkus minimal 1.');
      return;
    }

    const productData = {
      name,
      pricePerBatang,
      pricePerBungkus,
      stok,
      isiPerBungkus,
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
    const product = products[index];
    if (!product) return;
    
    const self = this;
    ConfirmModal.show({
      type: 'danger',
      title: 'Hapus Produk?',
      message: `Produk "${product.name}" akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        const productName = products[index].name;
        products.splice(index, 1);
        self.saveToLocalStorage();
        renderProducts();
        Toast.info('Produk Dihapus', `${productName} telah dihapus dari katalog.`);
      }
    });
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
    const couponInput = document.getElementById('couponCode');
    const applyBtn = document.querySelector('button[onclick="Coupon.apply()"]');
    
    if (appliedCoupon) {
      Toast.warning('Kupon Sudah Aktif', `Kupon ${appliedCoupon.code} sedang digunakan. Hapus dulu untuk ganti kupon.`);
      return;
    }
    
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
    
    if (couponInput) couponInput.disabled = true;
    if (applyBtn) applyBtn.disabled = true;
    
    updateCartSummary();
    Toast.success('Kupon Diterapkan!', `${coupon.description} berhasil dipakai.`);
  },

  remove() {
    appliedCoupon = null;
    const couponInput = document.getElementById('couponCode');
    const applyBtn = document.querySelector('button[onclick="Coupon.apply()"]');
    
    if (couponInput) {
      couponInput.value = '';
      couponInput.disabled = false;
    }
    if (applyBtn) applyBtn.disabled = false;
    
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
    
    const data = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    if (data.length === 0) {
      canvas.style.display = 'none';
      const emptyState = document.getElementById('salesChartEmpty');
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }
    
    canvas.style.display = 'block';
    const emptyState = document.getElementById('salesChartEmpty');
    if (emptyState) emptyState.style.display = 'none';
    
    const totalSales = data.reduce((sum, item) => sum + item[1], 0);
    const maxValue = Math.max(...data.map(d => d[1]));
    
    const colors = [
      { main: '#d97706', light: '#fbbf24', shadow: 'rgba(217, 119, 6, 0.4)' },
      { main: '#b45309', light: '#f59e0b', shadow: 'rgba(180, 83, 9, 0.4)' },
      { main: '#92400e', light: '#d97706', shadow: 'rgba(146, 64, 14, 0.4)' },
      { main: '#78350f', light: '#b45309', shadow: 'rgba(120, 53, 15, 0.4)' },
      { main: '#451a03', light: '#92400e', shadow: 'rgba(69, 26, 3, 0.4)' }
    ];
    
    const padding = { left: 45, right: 20, top: 35, bottom: 60 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;
    const barWidth = Math.min((chartWidth / data.length) * 0.65, 60);
    const spacing = chartWidth / data.length;
    
    ctx.strokeStyle = isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      const value = Math.round(maxValue * (1 - i / 4));
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
      ctx.font = '600 11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(value, padding.left - 10, y + 4);
    }
    ctx.setLineDash([]);
    
    data.forEach((item, index) => {
      const [name, value] = item;
      const percentage = ((value / totalSales) * 100).toFixed(1);
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding.left + spacing * index + (spacing - barWidth) / 2;
      const y = padding.top + chartHeight - barHeight;
      
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, colors[index].light);
      gradient.addColorStop(1, colors[index].main);
      ctx.fillStyle = gradient;
      ctx.shadowColor = colors[index].shadow;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0]);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.fillStyle = isDark ? '#ffffff' : '#111827';
      ctx.font = '600 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(value, x + barWidth / 2, y - 16);
      
      ctx.fillStyle = colors[index].main;
      ctx.font = '500 10px system-ui';
      ctx.fillText(`${percentage}%`, x + barWidth / 2, y - 4);
      
      ctx.save();
      ctx.translate(x + barWidth / 2, padding.top + chartHeight + 15);
      ctx.fillStyle = isDark ? '#d1d5db' : '#4b5563';
      ctx.font = '500 11px system-ui';
      ctx.textAlign = 'center';
      const displayName = name.length > 12 ? name.substring(0, 12) + '...' : name;
      ctx.fillText(displayName, 0, 0);
      ctx.restore();
      
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
      ctx.font = '400 9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('bungkus', x + barWidth / 2, padding.top + chartHeight + 28);
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
    
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, isDark ? 'rgba(217, 119, 6, 0.35)' : 'rgba(217, 119, 6, 0.25)');
    gradient.addColorStop(0.5, isDark ? 'rgba(180, 83, 9, 0.25)' : 'rgba(180, 83, 9, 0.15)');
    gradient.addColorStop(1, 'rgba(146, 64, 14, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    
    dataPoints.forEach((point, index) => {
      const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
      const y = padding.top + (1 - point.value / maxValue) * graphHeight;
      if (index === 0) ctx.moveTo(x, y);
      else {
        const prevX = padding.left + ((index - 1) / (dataPoints.length - 1 || 1)) * graphWidth;
        const prevY = padding.top + (1 - dataPoints[index - 1].value / maxValue) * graphHeight;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
    });
    
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fill();
    
    const lineGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    lineGradient.addColorStop(0, '#d97706');
    lineGradient.addColorStop(0.5, '#b45309');
    lineGradient.addColorStop(1, '#92400e');
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.shadowColor = isDark ? 'rgba(217, 119, 6, 0.5)' : 'rgba(217, 119, 6, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
    
    ctx.beginPath();
    dataPoints.forEach((point, index) => {
      const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
      const y = padding.top + (1 - point.value / maxValue) * graphHeight;
      if (index === 0) ctx.moveTo(x, y);
      else {
        const prevX = padding.left + ((index - 1) / (dataPoints.length - 1 || 1)) * graphWidth;
        const prevY = padding.top + (1 - dataPoints[index - 1].value / maxValue) * graphHeight;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
    });
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    dataPoints.forEach((point, index) => {
      const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
      const y = padding.top + (1 - point.value / maxValue) * graphHeight;
      
      ctx.fillStyle = '#d97706';
      ctx.shadowColor = 'rgba(217, 119, 6, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = isDark ? '#1f2937' : 'white';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      if (index === dataPoints.length - 1) {
        ctx.fillStyle = isDark ? '#ffffff' : '#111827';
        ctx.font = '600 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Rp${(point.value / 1000).toFixed(0)}k`, x, y - 12);
      }
    });
    
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.font = '500 10px system-ui';
    ctx.textAlign = 'center';
    
    const maxLabels = 6;
    const step = Math.max(1, Math.ceil(dataPoints.length / maxLabels));
    
    dataPoints.forEach((point, index) => {
      if (index % step === 0 || index === dataPoints.length - 1) {
        const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
        const timeStr = point.time.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        ctx.fillText(timeStr, x, height - padding.bottom + 22);
      }
    });
    
    ctx.fillStyle = isDark ? '#f3f4f6' : '#111827';
    ctx.font = '600 11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`Total: Rp${maxValue.toLocaleString('id-ID')}`, width - padding.right, padding.top + 15);
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

  filteredList.forEach((product, filteredIndex) => {
    // Cari index asli dari products array
    const index = products.findIndex(p => p.name === product.name);
    const priceWithDiscount = product.pricePerBungkus * (1 - DISCOUNT / 100);
    const animationDelay = `${filteredIndex * 50}ms`;

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
                        <button onclick="decreaseQuantityByIndex(${index})" class="stepper-btn stepper-minus" title="Kurangi">
                            <span class="stepper-label">-</span>
                        </button>
                        <div class="stepper-display">
                            <span class="stepper-value">${cartQuantity}</span>
                            <span class="stepper-unit">bungkus</span>
                        </div>
                        <button onclick="increaseQuantityByIndex(${index})" class="stepper-btn stepper-plus" title="Tambah">
                            <span class="stepper-label">+</span>
                        </button>
                    </div>
                    ` : `
                    <button onclick="quickAddToCartByIndex(${index}, event)" class="button-quick-add">
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
function quickAddToCart(productName, event) {
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

  // Trigger fly animation if event exists
  if (event && event.target) {
    triggerFlyAnimation(event.target, product.image);
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
  
  // Pulse cart badge
  pulseCartBadge();

  Toast.success('Ditambahkan!', `${productName} berhasil ditambahkan.`);
}

// === FLY TO CART ANIMATION ===
function triggerFlyAnimation(buttonEl, imageSrc) {
  const cartBadge = document.getElementById('cartBadge');
  if (!cartBadge) return;
  
  const buttonRect = buttonEl.getBoundingClientRect();
  const cartRect = cartBadge.getBoundingClientRect();
  
  const flyEl = document.createElement('div');
  flyEl.className = 'fly-to-cart';
  flyEl.innerHTML = `<img src="${imageSrc}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">`;
  
  flyEl.style.left = `${buttonRect.left + buttonRect.width / 2 - 25}px`;
  flyEl.style.top = `${buttonRect.top}px`;
  
  document.body.appendChild(flyEl);
  
  setTimeout(() => {
    flyEl.remove();
  }, 600);
}

function pulseCartBadge() {
  const cartBadge = document.getElementById('cartBadge');
  if (cartBadge) {
    cartBadge.classList.remove('cart-badge-pulse');
    void cartBadge.offsetWidth; // Trigger reflow
    cartBadge.classList.add('cart-badge-pulse');
  }
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

// === FUNGSI BY INDEX (untuk menghindari masalah escape karakter) ===
function quickAddToCartByIndex(index, event) {
  const product = products[index];
  if (!product) {
    console.error("Produk tidak ditemukan di index:", index);
    return;
  }
  quickAddToCart(product.name, event);
}

function increaseQuantityByIndex(index) {
  const product = products[index];
  if (!product) return;
  increaseQuantity(product.name);
}

function decreaseQuantityByIndex(index) {
  const product = products[index];
  if (!product) return;
  decreaseQuantity(product.name);
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
    emptyDiv.className = "empty-state";
    emptyDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        <path d="M12 9v6M9 12h6" stroke-dasharray="2 2"/>
      </svg>
      <p class="empty-state-title">Keranjang Kosong</p>
      <p class="empty-state-desc">Pilih produk dari katalog untuk mulai berbelanja</p>
    `;
    fragment.appendChild(emptyDiv);
  } else {
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item p-3 flex items-start gap-3";
      
      // Add enter animation for new items
      if (_lastAddedItemName === item.name && index === cart.length - 1) {
        li.classList.add("cart-item-enter");
      }
      
      li.innerHTML = `
        <img src="${item.image}" alt="${
        item.name
      }" class="w-16 h-16 object-cover rounded-md flex-shrink-0 shadow-sm">
        <div class="flex-1 min-w-0">
          <p class="font-medium mb-1">${item.name}</p>
          <p class="text-xs text-muted mb-2">${item.type} × ${item.quantity}</p>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-primary-accent">Rp${(
              item.price * item.quantity
            ).toLocaleString()}</p>
            <button onclick="handleRemoveFromCart(${index})" class="button-danger-text text-xs px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" aria-label="Hapus ${
        item.name
      }">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              Hapus
            </button>
          </div>
        </div>
      `;
      
      if (_lastAddedItemName === item.name && index === cart.length - 1) {
        li.addEventListener(
          "animationend",
          () => li.classList.remove("cart-item-enter"),
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
  if (index < 0 || index >= cart.length) return;
  const item = cart[index];
  
  ConfirmModal.show({
    type: 'warning',
    title: 'Hapus dari Keranjang?',
    message: `"${item.name}" akan dihapus dari keranjang belanja Anda.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    onConfirm: () => proceedWithRemove(index)
  });
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
  
  // Update checkout items list (new professional design)
  const checkoutItemsList = document.getElementById("checkoutItemsList");
  if (checkoutItemsList) {
    if (cart.length > 0) {
      checkoutItemsList.innerHTML = cart.map(item => `
        <div class="summary-item">
          <div>
            <div class="summary-item-name">${item.name}</div>
            <div class="summary-item-qty">${item.quantity}x @ Rp${item.price.toLocaleString()}</div>
          </div>
          <div class="summary-item-price">Rp${(item.price * item.quantity).toLocaleString()}</div>
        </div>
      `).join('');
    } else {
      checkoutItemsList.innerHTML = `
        <div class="summary-empty">
          <svg class="summary-empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="summary-empty-text">Keranjang kosong</p>
        </div>
      `;
    }
  }
  
  // Update subtotal
  const checkoutSubtotal = document.getElementById("checkoutSubtotal");
  if (checkoutSubtotal) {
    checkoutSubtotal.textContent = `Rp${total.toLocaleString()}`;
  }
  
  // Update discount row
  const discountRow = document.getElementById("checkoutDiscountRow");
  const discountEl = document.getElementById("checkoutDiscount");
  if (discountRow && discountEl) {
    if (DISCOUNT > 0 && total > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-Rp${discountAmount.toLocaleString()}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  
  // Update coupon row
  const couponRow = document.getElementById("checkoutCouponRow");
  const couponLabel = document.getElementById("checkoutCouponLabel");
  const couponDiscountEl = document.getElementById("checkoutCouponDiscount");
  if (couponRow && couponLabel && couponDiscountEl) {
    if (appliedCoupon && total > 0) {
      couponRow.style.display = 'flex';
      couponLabel.innerHTML = `Kupon ${appliedCoupon.code} <button onclick="Coupon.remove()" class="coupon-remove-btn">×</button>`;
      couponDiscountEl.textContent = `-Rp${couponDiscount.toLocaleString()}`;
    } else {
      couponRow.style.display = 'none';
    }
  }
  
  // Update change calculation
  updateChangeCalculation(totalAfterDiscount);

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

// Update change calculation in real-time
function updateChangeCalculation(totalAfterDiscount) {
  const cashInput = document.getElementById("cash");
  const changeRow = document.getElementById("checkoutChangeRow");
  const changeEl = document.getElementById("checkoutChange");
  
  if (!cashInput || !changeRow || !changeEl) return;
  
  const cashValue = cashInput.value.replace(/\D/g, '');
  const cash = parseInt(cashValue) || 0;
  
  if (cash > 0 && cash >= totalAfterDiscount) {
    const change = cash - totalAfterDiscount;
    changeRow.style.display = 'flex';
    changeEl.textContent = `Rp${change.toLocaleString()}`;
  } else {
    changeRow.style.display = 'none';
  }
}

// Format cash input with thousand separator
function formatCashInput(input) {
  let value = input.value.replace(/\D/g, '');
  if (value) {
    input.value = parseInt(value).toLocaleString('id-ID');
  }
  
  // Recalculate change
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let totalAfterDiscount = total * (1 - DISCOUNT / 100);
  if (appliedCoupon) {
    totalAfterDiscount -= totalAfterDiscount * (appliedCoupon.discount / 100);
  }
  updateChangeCalculation(totalAfterDiscount);
}

// Set quick cash amount
function setQuickCash(amount) {
  const cashInput = document.getElementById("cash");
  if (!cashInput) return;
  
  if (amount === 'exact') {
    // Set exact amount
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let totalAfterDiscount = total * (1 - DISCOUNT / 100);
    if (appliedCoupon) {
      totalAfterDiscount -= totalAfterDiscount * (appliedCoupon.discount / 100);
    }
    cashInput.value = Math.ceil(totalAfterDiscount).toLocaleString('id-ID');
  } else {
    cashInput.value = amount.toLocaleString('id-ID');
  }
  
  // Trigger change calculation
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let totalAfterDiscount = total * (1 - DISCOUNT / 100);
  if (appliedCoupon) {
    totalAfterDiscount -= totalAfterDiscount * (appliedCoupon.discount / 100);
  }
  updateChangeCalculation(totalAfterDiscount);
}

function checkout() {
  const cashInput = document.getElementById("cash");
  const cashValue = cashInput.value.replace(/\D/g, ''); // Remove formatting
  const cash = parseInt(cashValue) || 0;
  
  if (!cashValue || cash <= 0) {
    Toast.error('Input Tidak Valid', 'Silakan masukkan jumlah uang tunai yang valid.');
    cashInput.focus();
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  if (total === 0 || cart.length === 0) {
    Toast.warning('Keranjang Kosong', 'Silakan tambahkan produk terlebih dahulu.');
    return;
  }
  
  let totalAfterDiscount = total * (1 - DISCOUNT / 100);
  
  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = totalAfterDiscount * (appliedCoupon.discount / 100);
    totalAfterDiscount -= couponDiscount;
  }

  const receiptDiv = document.getElementById("receipt");
  if (!receiptDiv) return;

  receiptDiv.innerHTML = "";

  if (cash < totalAfterDiscount) {
    const kurang = totalAfterDiscount - cash;
    Toast.error(
      'Uang Tidak Cukup!', 
      `Kurang Rp${kurang.toLocaleString()}. Total: Rp${totalAfterDiscount.toLocaleString()}`
    );
    cashInput.focus();
    return;
  }

  const change = cash - totalAfterDiscount;

  const receiptItems = cart
    .map(
      (item) =>
        `<li class="flex items-center gap-2 py-1.5 border-b" style="border-color: var(--border-light);">
        <img src="${item.image || './images/default-product.png'}" alt="${item.name}" class="w-10 h-10 object-cover rounded" />
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <span class="text-xs font-medium">${item.name} (${item.type})</span>
            <span class="text-xs font-semibold">Rp${(item.price * item.quantity).toLocaleString()}</span>
          </div>
          <span class="text-xs text-muted">×${item.quantity} @ Rp${item.price.toLocaleString()}</span>
        </div>
    </li>`
    )
    .join("");

  const isDark = document.body.classList.contains("dark");
  const borderColor = isDark ? "var(--border-dark)" : "var(--border-light)";

  const receiptContent = `
    <div class="card-base p-6 mt-4 animate-slide-fade-in print-receipt" style="background: ${isDark ? 'var(--surface-dark)' : 'var(--surface-light)'};">
      <div class="text-center mb-5 print-header">
        <div class="inline-block px-5 py-2.5 rounded-lg mb-2" style="background: linear-gradient(135deg, #292524 0%, #44403c 100%);">
          <h4 class='text-lg font-bold text-white'>Warung Rokok</h4>
        </div>
        <p class="text-xs text-muted mt-2">${new Date().toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      
      <div class="mb-4">
        <h5 class="text-xs font-semibold text-muted mb-3 uppercase tracking-wide">Detail Pembelian</h5>
        <ul class="space-y-2">
          ${receiptItems}
        </ul>
      </div>
      
      <div class="pt-4 space-y-2" style="border-top: 1px solid ${borderColor};">
        <div class="flex justify-between text-sm">
          <span class="text-muted">Subtotal</span>
          <span class="font-medium">Rp${total.toLocaleString()}</span>
        </div>
        ${
          DISCOUNT > 0
            ? `<div class="flex justify-between text-sm" style="color: #ef4444;">
                <span>Diskon Toko (${DISCOUNT}%)</span>
                <span class="font-medium">- Rp${(total * (DISCOUNT / 100)).toLocaleString()}</span>
              </div>`
            : ""
        }
        ${
          appliedCoupon
            ? `<div class="flex justify-between text-sm" style="color: #10b981;">
                <span>Kupon ${appliedCoupon.code} (${appliedCoupon.discount}%)</span>
                <span class="font-medium">- Rp${couponDiscount.toLocaleString()}</span>
              </div>`
            : ""
        }
        <div class="pt-3 mt-3" style="border-top: 1px solid ${borderColor};">
          <div class="flex justify-between items-center mb-3">
            <span class="text-base font-bold">Total Pembayaran</span>
            <span class="text-xl font-bold" style="color: #d97706;">Rp${totalAfterDiscount.toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-sm text-muted">
            <span>Tunai</span>
            <span>Rp${cash.toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-base font-semibold mt-2 pt-2" style="border-top: 1px dashed ${borderColor};">
            <span>Kembalian</span>
            <span style="color: #10b981;">Rp${change.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-5 pt-4" style="border-top: 1px solid ${borderColor};">
        <p class="text-sm font-medium mb-1">Terima kasih atas kunjungan Anda!</p>
        <p class="text-xs text-muted mb-3">Barang yang sudah dibeli tidak dapat dikembalikan</p>
        <button onclick="printReceipt()" class="button-primary text-sm py-2 px-6 no-print">
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
      <li class='card-base overflow-hidden animate-slide-fade-in' style="animation-delay: ${i * 40}ms;">
        <div class="p-3" style="background: linear-gradient(135deg, #292524 0%, #44403c 100%);">
          <div class="flex items-center justify-between text-white">
            <div class="flex items-center gap-2.5">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-white bg-opacity-15">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <p class="text-base font-bold">#${history.length - i}</p>
                <p class="text-xs opacity-80">${new Date(h.date).toLocaleString("id-ID", { 
                  day: "numeric", 
                  month: "short", 
                  year: "numeric",
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs opacity-70">Total</p>
              <p class="text-lg font-bold" style="color: #fbbf24;">Rp${h.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div class="p-3">
          <div class="space-y-2 mb-3">
            ${h.items.map(item => `
              <div class="flex items-center gap-2.5 p-2.5 rounded-lg" style="background: ${isDark ? 'rgba(55, 65, 81, 0.4)' : 'rgba(243, 244, 246, 0.6)'}; border: 1px solid ${borderColor};">
                <img src="${item.image || './images/default-product.png'}" alt="${item.name}" class="w-10 h-10 object-cover rounded-md" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold truncate">${item.name}</p>
                  <p class="text-xs text-muted">Rp${item.price.toLocaleString()} × ${item.quantity}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold whitespace-nowrap">Rp${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            `).join("")}
          </div>
          
          <div class="space-y-1.5 pt-2.5" style="border-top: 1px dashed ${borderColor};">
            <div class="flex justify-between items-center text-sm">
              <span class="text-muted">Tunai</span>
              <span class="font-medium">Rp${h.cash.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-semibold">Kembalian</span>
              <span class="font-bold" style="color: #10b981;">Rp${h.change.toLocaleString()}</span>
            </div>
            ${h.coupon ? `
            <div class="mt-2 p-2 rounded-md flex items-center gap-2" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2);">
              <svg class="w-4 h-4 flex-shrink-0" style="color: #10b981;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd" />
              </svg>
              <span class="text-xs font-medium" style="color: #10b981;">Kupon ${h.coupon}</span>
            </div>
            ` : ''}
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
  
  // Keyboard Shortcuts
  setupKeyboardShortcuts();
});

// Keyboard Shortcuts Handler
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    
    // Escape: Close modals and clear search
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal');
      let modalClosed = false;
      
      modals.forEach(modal => {
        if (modal.style.display === 'flex') {
          modal.style.display = 'none';
          modalClosed = true;
        }
      });
      
      if (!modalClosed) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
        }
      }
    }
    
    // Ctrl/Cmd + N: Open add product modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (typeof ProductManager !== 'undefined') {
        ProductManager.openAddModal();
      }
    }
    
    // Ctrl/Cmd + B: Focus checkout
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      const checkoutSection = document.getElementById('checkout');
      if (checkoutSection) {
        checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const cashInput = document.getElementById('cashInput');
        if (cashInput) {
          setTimeout(() => cashInput.focus(), 300);
        }
      }
    }
    
    // Ctrl/Cmd + H: Toggle history
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      const historySection = document.getElementById('history');
      if (historySection) {
        historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    
    // Ctrl/Cmd + D: Toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (typeof toggleTheme !== 'undefined') {
        toggleTheme();
      }
    }
  });
}
