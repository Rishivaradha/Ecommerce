const cloneState = (state) => {
  if (typeof structuredClone === "function") {
    return structuredClone(state);
  }
  return JSON.parse(JSON.stringify(state));
};

const Store = {
  state: {
    categories: [],
    products: [],
    analytics: { monthlyOrders: [], monthlyRevenue: [], topCategories: [] },
    cart: [],
    orders: [],
    user: null,
    filters: {
      search: "",
      category: null,
      price: 15000000,
      rating: 0,
      sort: "featured"
    }
  },
  subscribers: [],
  setState(updater) {
    const next = cloneState(Store.state);
    updater(next);
    Store.state = next;
    Store.subscribers.forEach((fn) => fn(Store.state));
  },
  subscribe(fn) {
    Store.subscribers.push(fn);
    return () => {
      Store.subscribers = Store.subscribers.filter((cb) => cb !== fn);
    };
  },
  getState() {
    return Store.state;
  },
  persist() {}
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value / 100);

const getMonthLabel = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

const Actions = {
  async loadData() {
    const res = await fetch("data.json", { cache: "no-store" });
    const data = await res.json();
    Store.setState((state) => {
      state.categories = data.categories || [];
      state.products = data.products || [];
    });
  },
  setFilter(key, value) {
    Store.setState((state) => {
      state.filters[key] = value;
    });
  },
  addToCart(productId) {
    Store.setState((state) => {
      const existing = state.cart.find((item) => item.productId === productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.cart.push({ productId, quantity: 1 });
      }
    });
    showToast("Added to cart");
  },
  removeFromCart(productId) {
    Store.setState((state) => {
      state.cart = state.cart.filter((item) => item.productId !== productId);
    });
  },
  updateQuantity(productId, quantity) {
    Store.setState((state) => {
      const item = state.cart.find((c) => c.productId === productId);
      if (!item) return;
      if (quantity <= 0) {
        state.cart = state.cart.filter((c) => c.productId !== productId);
      } else {
        item.quantity = quantity;
      }
    });
  },
  clearCart() {
    Store.setState((state) => {
      state.cart = [];
    });
  },
  placeOrder(address) {
    const state = Store.getState();
    if (!state.cart.length) {
      throw new Error("Cart is empty");
    }
    const orderItems = state.cart.map((item) => {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error("Product not found");
      }
      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: item.quantity,
        price: product.price,
        totalAmount: product.price * item.quantity
      };
    });
    const total = orderItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const newOrder = {
      id: `ord_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      status: "processing",
      address,
      items: orderItems,
      total
    };
    Store.setState((draft) => {
      draft.orders.unshift(newOrder);
      draft.cart = [];
    });
    return newOrder.id;
  },
  login(email, password) {
    if (!email || !password) return false;
    const user = {
      id: `user_${email}`,
      name: email.split("@")[0],
      email
    };
    Store.setState((state) => {
      state.user = user;
    });
    return true;
  },
  logout() {
    Store.setState((state) => {
      state.user = null;
      state.cart = [];
    });
  }
};

let toastTimeout;
const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2400);
};

const requiresAuth = (page) => !["login", "signup"].includes(page);

const ensureAuth = (page) => {
  const { user } = Store.getState();
  if (requiresAuth(page) && !user) {
    window.location.href = "login.html";
    return false;
  }
  if ((page === "login" || page === "signup") && user) {
    window.location.href = "index.html";
    return false;
  }
  return true;
};

const headerRefs = {};
const initHeader = () => {
  headerRefs.cartCount = document.querySelector("[data-cart-count]");
  headerRefs.userInitial = document.querySelector("[data-user-initial]");
  headerRefs.userName = document.querySelector("[data-user-name]");
  headerRefs.userEmail = document.querySelector("[data-user-email]");
  headerRefs.logoutBtn = document.querySelector("[data-logout]");
  headerRefs.navLinks = document.querySelectorAll("[data-nav-link]");

  if (headerRefs.logoutBtn) {
    headerRefs.logoutBtn.addEventListener("click", () => {
      Actions.logout();
      window.location.href = "login.html";
    });
  }
};

const updateHeader = () => {
  const state = Store.getState();
  if (headerRefs.cartCount) {
    const total = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    headerRefs.cartCount.textContent = total > 0 ? total : "";
    headerRefs.cartCount.parentElement?.classList.toggle("has-items", total > 0);
  }
  if (headerRefs.userInitial) {
    const initial = state.user?.name?.charAt(0)?.toUpperCase() || "E";
    headerRefs.userInitial.textContent = initial;
  }
  if (headerRefs.userName) {
    headerRefs.userName.textContent = state.user?.name || "Guest";
  }
  if (headerRefs.userEmail) {
    headerRefs.userEmail.textContent = state.user?.email || "user@example.com";
  }
  if (headerRefs.navLinks) {
    const current = document.body.dataset.page;
    headerRefs.navLinks.forEach((link) => {
      const target = link.getAttribute("data-nav-link");
      link.classList.toggle("active", target === current);
    });
  }
};

const renderHome = () => {
  const grid = document.querySelector("[data-category-grid]");
  if (!grid) return;
  const { categories } = Store.getState();
  grid.innerHTML = categories
    .map(
      (category) => `
        <a class="category-card hover-lift fade-in" href="products.html?category=${encodeURIComponent(
          category.slug
        )}">
          <div class="media">
            <img src="${category.image}" alt="${category.name}" loading="lazy" />
          </div>
          <div>
            <h3 class="dot-title">${category.name}</h3>
            <p>${category.description}</p>
          </div>
          <span class="btn btn-primary">Browse ${category.name}</span>
        </a>
      `
    )
    .join("");
};

const productFilterSort = (products) => {
  const { filters } = Store.getState();
  let output = products.filter((product) => {
    const matchesCategory = filters.category ? product.category === filters.category : true;
    const matchesSearch =
      filters.search.trim() === "" ||
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.description.toLowerCase().includes(filters.search.toLowerCase());
    const withinPrice = product.price <= filters.price;
    const meetsRating = product.rating >= filters.rating;
    return matchesCategory && matchesSearch && withinPrice && meetsRating;
  });
  switch (filters.sort) {
    case "price-asc":
      output = output.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      output = output.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      output = output.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }
  return output;
};

const bindProductFilters = () => {
  const searchInput = document.querySelector("#product-search");
  const priceInput = document.querySelector("#price-range");
  const priceValue = document.querySelector("[data-price-value]");
  const ratingSelect = document.querySelector("#rating-select");
  const sortSelect = document.querySelector("#sort-select");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      Actions.setFilter("search", e.target.value);
      renderProductGrid();
    });
  }

  if (priceInput && priceValue) {
    priceInput.addEventListener("input", (e) => {
      const value = Number(e.target.value);
      Actions.setFilter("price", value);
      priceValue.textContent = formatCurrency(value);
      renderProductGrid();
    });
  }

  if (ratingSelect) {
    ratingSelect.addEventListener("change", (e) => {
      Actions.setFilter("rating", Number(e.target.value));
      renderProductGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      Actions.setFilter("sort", e.target.value);
      renderProductGrid();
    });
  }
};

const renderProductGrid = () => {
  const grid = document.querySelector("[data-product-grid]");
  if (!grid) return;
  const { products } = Store.getState();
  const filtered = productFilterSort(products);
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Adjust filters or clear search to explore more items.</p>
      </div>
    `;
    return;
  }
  grid.innerHTML = filtered
    .map(
      (product) => `
        <article class="card product-card fade-in" data-product-card="${product.id}">
          <div class="media">
            <img src="${product.imageUrl}" alt="${product.name}" loading="lazy" />
          </div>
          <div class="body">
            <div class="product-meta">
              <span>${product.category}</span>
              <span class="rating">⭐ ${product.rating.toFixed(1)}</span>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">${formatCurrency(product.price)}</div>
            <div class="actions">
              <button class="btn btn-primary" data-add-cart="${product.id}">Add to Cart</button>
              <button class="btn btn-muted" data-buy-now="${product.id}">Buy Now</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  grid.querySelectorAll("[data-add-cart]").forEach((btn) => {
    btn.addEventListener("click", () => Actions.addToCart(btn.dataset.addCart));
  });

  grid.querySelectorAll("[data-buy-now]").forEach((btn) => {
    btn.addEventListener("click", () => {
      Actions.addToCart(btn.dataset.buyNow);
      window.location.href = "cart.html";
    });
  });
};

const renderCartPage = () => {
  const cartContainer = document.querySelector("[data-cart-items]");
  const summaryContainer = document.querySelector("[data-order-summary]");
  if (!cartContainer || !summaryContainer) return;

  const state = Store.getState();
  if (state.cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Add items from the catalog to view them here.</p>
        <a class="btn btn-primary" href="index.html">Browse Categories</a>
      </div>
    `;
    summaryContainer.innerHTML = "";
    return;
  }

  const cartMarkup = state.cart
    .map((item) => {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) return "";
      return `
        <div class="card cart-row" data-cart-row="${product.id}">
          <div class="cart-thumb">
            <img src="${product.imageUrl}" alt="${product.name}" loading="lazy" />
          </div>
          <div class="cart-details">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="subtitle">${product.category}</p>
            <p class="price">${formatCurrency(product.price)}</p>
            <div class="cart-quantity">
              <button class="quantity-btn" data-decrement="${product.id}">-</button>
              <input class="input" style="width:70px;text-align:center" type="number" min="1" value="${item.quantity}" data-quantity-input="${product.id}" />
              <button class="quantity-btn" data-increment="${product.id}">+</button>
              <button class="btn btn-muted" data-remove="${product.id}">Remove</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  cartContainer.innerHTML = cartMarkup;

  const subtotal = state.cart.reduce((sum, item) => {
    const product = state.products.find((p) => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  summaryContainer.innerHTML = `
    <div class="order-summary fade-in">
      <h3>Order Summary</h3>
      <div class="summary-row">
        <span>Items (${state.cart.length})</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>Free</span>
      </div>
      <div class="summary-total">
        <span>Total</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      <a class="btn btn-primary btn-block" href="checkout.html">Proceed to Checkout</a>
    </div>
  `;

  cartContainer.querySelectorAll("[data-decrement]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.decrement;
      const item = state.cart.find((c) => c.productId === id);
      if (!item) return;
      Actions.updateQuantity(id, item.quantity - 1);
    });
  });

  cartContainer.querySelectorAll("[data-increment]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.increment;
      const item = state.cart.find((c) => c.productId === id);
      if (!item) return;
      Actions.updateQuantity(id, item.quantity + 1);
    });
  });

  cartContainer.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => Actions.removeFromCart(btn.dataset.remove));
  });

  cartContainer.querySelectorAll("[data-quantity-input]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const id = input.dataset.quantityInput;
      const value = Number(e.target.value);
      if (!Number.isNaN(value)) {
        Actions.updateQuantity(id, value);
      }
    });
  });
};

const renderCheckoutSummary = () => {
  const summary = document.querySelector("[data-checkout-summary]");
  const submitBtn = document.querySelector("[data-checkout-submit]");
  if (!summary) return;
  const state = Store.getState();
  if (!state.cart.length) {
    summary.innerHTML = `
      <div class="status-banner warn">
        Cart empty. Add items before completing checkout.
      </div>
    `;
    if (submitBtn) {
      submitBtn.textContent = "Cart empty";
      submitBtn.disabled = true;
    }
    return;
  }
  const items = state.cart
    .map((item) => {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) return "";
      return `<div class="list-item"><span>${product.name} × ${item.quantity}</span><span>${formatCurrency(
        product.price * item.quantity
      )}</span></div>`;
    })
    .join("");
  const total = state.cart.reduce((sum, item) => {
    const product = state.products.find((p) => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  summary.innerHTML = `
    <h2>Order summary</h2>
    <div class="list">${items}</div>
    <div class="order-footer" style="margin-top:1rem">
      <span>Total</span>
      <span>${formatCurrency(total)}</span>
    </div>
  `;
  if (submitBtn) {
    submitBtn.textContent = `Place order (${formatCurrency(total)})`;
    submitBtn.disabled = false;
  }
};

const checkoutHandler = () => {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;
  const paymentRadios = form.querySelectorAll("input[name='payment']");
  const cardFields = form.querySelector("[data-payment-card]");
  const upiFields = form.querySelector("[data-payment-upi]");

  const togglePaymentUI = () => {
    const selected = form.querySelector("input[name='payment']:checked")?.value || "card";
    if (cardFields && upiFields) {
      if (selected === "card") {
        cardFields.hidden = false;
        upiFields.hidden = true;
      } else {
        cardFields.hidden = true;
        upiFields.hidden = false;
      }
    }
  };

  paymentRadios.forEach((radio) => radio.addEventListener("change", togglePaymentUI));
  togglePaymentUI();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const address = {
      fullName: formData.get("fullName"),
      street: formData.get("street"),
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country")
    };

    if (Object.values(address).some((value) => !value)) {
      showToast("Fill all shipping fields");
      return;
    }

    const paymentMethod = formData.get("payment");
    if (paymentMethod === "card") {
      const cardNumber = (formData.get("cardNumber") || "").replace(/\s+/g, "");
      const expiry = formData.get("expiry");
      const cvv = formData.get("cvv");
      if (cardNumber.length !== 16 || !/^\d{16}$/.test(cardNumber)) {
        showToast("Invalid card number");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        showToast("Invalid expiry (MM/YY)");
        return;
      }
      if (!/^\d{3}$/.test(cvv)) {
        showToast("Invalid CVV");
        return;
      }
    } else {
      const upi = formData.get("upi");
      if (!upi || !upi.includes("@")) {
        showToast("Invalid UPI ID");
        return;
      }
    }

    try {
      const orderId = Actions.placeOrder(address);
      window.location.href = `orders.html?placed=${orderId}`;
    } catch (err) {
      showToast(err.message || "Checkout failed");
    }
  });
};

const statusBadgeClass = (status) => {
  switch (status) {
    case "delivered":
      return "badge green";
    case "out_for_delivery":
      return "badge yellow";
    case "shipped":
      return "badge blue";
    case "processing":
      return "badge gray";
    default:
      return "badge red";
  }
};

const timelineSteps = ["processing", "shipped", "out_for_delivery", "delivered"];

const renderOrders = () => {
  const list = document.querySelector("[data-orders]");
  const statusBanner = document.querySelector("[data-order-alert]");
  if (!list) return;

  const params = new URLSearchParams(window.location.search);
  const placed = params.get("placed");
  if (statusBanner) {
    statusBanner.innerHTML = placed
      ? `<div class="status-banner success">✅ Order placed successfully! ID: ${placed}</div>`
      : "";
  }

  const { orders } = Store.getState();
  if (!orders.length) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No orders yet</h3>
        <p>Complete a purchase to track your deliveries.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = orders
    .map((order) => {
      const stepIndex = timelineSteps.indexOf(order.status);
      const progress = stepIndex <= 0 ? 0 : (stepIndex / (timelineSteps.length - 1)) * 100;
      const items = order.items
        .map(
          (item) =>
            `<div class="list-item"><span>${item.productName} × ${item.quantity}</span><span>${formatCurrency(
              item.totalAmount
            )}</span></div>`
        )
        .join("");
      const timeline = timelineSteps
        .map((step, idx) => {
          const completed = idx <= stepIndex;
          const active = idx === stepIndex;
          return `
            <div class="timeline-step ${completed ? "completed" : ""} ${active ? "active" : ""}">
              <div class="dot">${completed ? "✓" : idx + 1}</div>
              <div class="timeline-label">${step.replace(/_/g, " ")}</div>
            </div>
          `;
        })
        .join("");
      return `
        <article class="order-card fade-in">
          <header>
            <div>
              <h3>Order #${order.id.slice(-8)}</h3>
              <p class="order-meta">${new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span class="${statusBadgeClass(order.status)}">${order.status.replace(/_/g, " ")}</span>
          </header>
          <div class="timeline">
            <div class="timeline-line">
              <div class="timeline-progress" style="width:${progress}%"></div>
            </div>
            <div class="timeline-steps">${timeline}</div>
          </div>
          <div class="order-items">${items}</div>
          <div class="order-footer">
            <span>Total</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </article>
      `;
    })
    .join("");
};

let chartInstances = { line: null, bar: null, pie: null };

const destroyCharts = () => {
  Object.values(chartInstances).forEach((instance) => {
    if (instance) instance.destroy();
  });
  chartInstances = { line: null, bar: null, pie: null };
};

const computeAnalytics = () => {
  const { orders } = Store.getState();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const revenueInr = revenue / 100;
  const avgOrderValue = orders.length ? revenueInr / orders.length : 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const revenueFor = (month, year) =>
    orders
      .filter((o) => {
        const date = new Date(o.createdAt);
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .reduce((sum, order) => sum + order.total, 0) / 100;

  const currentRevenue = revenueFor(currentMonth, currentYear);
  const previousRevenue = revenueFor(prevMonth, prevYear);
  let growth = 0;
  if (previousRevenue === 0) {
    growth = currentRevenue > 0 ? 100 : 0;
  } else {
    growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }

  return {
    totalRevenue: revenueInr,
    totalOrders: orders.length,
    avgOrderValue,
    revenueGrowth: growth
  };
};

const buildMonthlyData = () => {
  const { orders } = Store.getState();
  const map = new Map();
  orders.forEach((order) => {
    const label = getMonthLabel(order.createdAt);
    const entry = map.get(label) || { orders: 0, revenue: 0 };
    entry.orders += 1;
    entry.revenue += order.total / 100;
    map.set(label, entry);
  });
  return Array.from(map.entries()).sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );
};

const buildCategoryData = () => {
  const { orders } = Store.getState();
  const map = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.category || "Other";
      map.set(key, (map.get(key) || 0) + item.totalAmount / 100);
    });
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
};

const renderAnalytics = () => {
  const metricsContainer = document.querySelector("[data-metrics]");
  const ordersCanvas = document.querySelector("#orders-chart");
  const revenueCanvas = document.querySelector("#revenue-chart");
  const pieCanvas = document.querySelector("#category-chart");
  if (!metricsContainer || !window.Chart) return;

  const { orders } = Store.getState();
  if (!orders.length) {
    destroyCharts();
    metricsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No analytics yet</h3>
        <p>Place an order in this session to see charts and metrics.</p>
      </div>
    `;
    return;
  }

  const metrics = computeAnalytics();
  metricsContainer.innerHTML = `
    <div class="metric-card">
      <div class="metric-value">${formatCurrency(metrics.totalRevenue * 100)}</div>
      <p class="subtitle">Total Revenue</p>
    </div>
    <div class="metric-card">
      <div class="metric-value">${metrics.totalOrders}</div>
      <p class="subtitle">Total Orders</p>
    </div>
    <div class="metric-card">
      <div class="metric-value">${formatCurrency(metrics.avgOrderValue * 100)}</div>
      <p class="subtitle">Avg Order Value</p>
    </div>
    <div class="metric-card">
      <div class="metric-value">${metrics.revenueGrowth >= 0 ? "+" : ""}${metrics.revenueGrowth.toFixed(
        1
      )}%</div>
      <p class="subtitle">Revenue Growth</p>
    </div>
  `;

  const monthlyEntries = buildMonthlyData();
  if (!monthlyEntries.length) {
    destroyCharts();
    return;
  }
  const labels = monthlyEntries.map(([label]) => label);
  const ordersData = monthlyEntries.map(([, value]) => value.orders);
  const revenueData = monthlyEntries.map(([, value]) => value.revenue);
  const categoryEntries = buildCategoryData();

  destroyCharts();
  chartInstances.line = new Chart(ordersCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Orders",
          data: ordersData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  chartInstances.bar = new Chart(revenueCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: revenueData,
          backgroundColor: "#10b981",
          borderRadius: 6
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  chartInstances.pie = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: categoryEntries.map(([label]) => label),
      datasets: [
        {
          data: categoryEntries.map(([, value]) => value),
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
};

const loginHandler = () => {
  const form = document.querySelector("[data-login-form]");
  const errorBox = document.querySelector("[data-login-error]");
  const notice = document.querySelector("[data-login-notice]");
  const params = new URLSearchParams(window.location.search);
  const message = params.get("message");
  if (message && notice) {
    notice.innerHTML = `<div class="status-banner info">${decodeURIComponent(message)}</div>`;
  }
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");
    form.querySelector("button[type='submit']").disabled = true;
    await new Promise((resolve) => setTimeout(resolve, 800));
    const success = Actions.login(email, password);
    if (success) {
      window.location.href = "index.html";
    } else if (errorBox) {
      errorBox.textContent = "Invalid email or password";
      errorBox.hidden = false;
    }
    form.querySelector("button[type='submit']").disabled = false;
  });
};

const signupHandler = () => {
  const form = document.querySelector("[data-signup-form]");
  const errorBox = document.querySelector("[data-signup-error]");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const fullName = formData.get("fullName").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    if (!fullName || fullName.length < 2) {
      errorBox.textContent = "Full name must be at least 2 characters";
      errorBox.hidden = false;
      return;
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      errorBox.textContent = "Enter a valid email address";
      errorBox.hidden = false;
      return;
    }
    if (password.length < 6) {
      errorBox.textContent = "Password must be 6+ characters";
      errorBox.hidden = false;
      return;
    }
    if (password !== confirmPassword) {
      errorBox.textContent = "Passwords do not match";
      errorBox.hidden = false;
      return;
    }
    errorBox.hidden = true;
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.dataset.loading = "true";
    await new Promise((resolve) => setTimeout(resolve, 1200));
    window.location.href = "login.html?message=Account%20created%2C%20please%20log%20in";
  });
};

const applyQueryFilters = () => {
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get("category");
  if (categoryParam) {
    const formatted =
      Store.getState().categories.find((c) => c.slug === categoryParam)?.name || categoryParam;
    Actions.setFilter("category", formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }
};

const youAreHere = document.body.dataset.page;

const pageInit = () => {
  switch (youAreHere) {
    case "home":
      renderHome();
      break;
    case "products":
      applyQueryFilters();
      bindProductFilters();
      renderProductGrid();
      break;
    case "cart":
      renderCartPage();
      break;
    case "checkout":
      renderCheckoutSummary();
      checkoutHandler();
      break;
    case "orders":
      renderOrders();
      break;
    case "analytics":
      renderAnalytics();
      break;
    case "login":
      loginHandler();
      break;
    case "signup":
      signupHandler();
      break;
    default:
      break;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page || "home";
  if (!ensureAuth(page)) return;
  initHeader();
  updateHeader();

  await Actions.loadData();
  updateHeader();
  pageInit();
  Store.subscribe(() => {
    updateHeader();
    if (page === "cart") renderCartPage();
    if (page === "checkout") renderCheckoutSummary();
    if (page === "orders") renderOrders();
    if (page === "analytics") renderAnalytics();
  });
});

