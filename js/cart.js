/**
 * cart.js — Shopping Cart & In-Store Pickup Scheduler for Stiner Thrifting
 * Globals only, no ES modules. Follows existing codebase style (var, function declarations).
 */

// ─── State & Constants ────────────────────────────────────────────────────────

var _cartState = [];
var STORAGE_KEY = "stiner-cart";

var STORE_HOURS = {
  1: { open: [10, 0], close: [18, 0] }, // Monday
  2: { open: [10, 0], close: [18, 0] }, // Tuesday
  3: { open: [10, 0], close: [18, 0] }, // Wednesday
  4: { open: [10, 0], close: [18, 0] }, // Thursday
  5: { open: [10, 0], close: [18, 0] }, // Friday
  6: { open: [9, 0], close: [17, 0] }, // Saturday
  // Sunday (0) absent = closed
};

var _drawerOpen = false;

// ─── localStorage ─────────────────────────────────────────────────────────────

function _loadCart() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

function _saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_cartState));
}

// ─── Cart Operations ──────────────────────────────────────────────────────────

function addToCart(item) {
  if (
    !item ||
    !item.id ||
    !item.name ||
    item.price === undefined ||
    !item.image
  ) {
    return;
  }
  var found = false;
  for (var i = 0; i < _cartState.length; i++) {
    if (_cartState[i].id === item.id) {
      _cartState[i].quantity += 1;
      found = true;
      break;
    }
  }
  if (!found) {
    _cartState.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    });
  }
  _saveCart();
  _updateBadge();
  if (_drawerOpen) {
    _renderDrawer();
  }
}

function _getTotalCount() {
  var total = 0;
  for (var i = 0; i < _cartState.length; i++) {
    total += _cartState[i].quantity;
  }
  return total;
}

function _getOrderTotal() {
  var total = 0;
  for (var i = 0; i < _cartState.length; i++) {
    total += _cartState[i].price * _cartState[i].quantity;
  }
  return total;
}

function _incrementQty(id) {
  for (var i = 0; i < _cartState.length; i++) {
    if (_cartState[i].id === id) {
      _cartState[i].quantity += 1;
      break;
    }
  }
  _saveCart();
  _updateBadge();
  _renderDrawer();
}

function _decrementQty(id) {
  for (var i = 0; i < _cartState.length; i++) {
    if (_cartState[i].id === id) {
      _cartState[i].quantity -= 1;
      if (_cartState[i].quantity <= 0) {
        _removeItem(id);
        return;
      }
      break;
    }
  }
  _saveCart();
  _updateBadge();
  _renderDrawer();
}

function _removeItem(id) {
  _cartState = _cartState.filter(function (item) {
    return item.id !== id;
  });
  _saveCart();
  _updateBadge();
  _renderDrawer();
}

function _clearCart() {
  _cartState = [];
  _saveCart();
  _updateBadge();
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function _updateBadge() {
  var badge = document.getElementById("cart-badge");
  var btn = document.getElementById("cart-icon-btn");
  var count = _getTotalCount();
  if (badge) {
    badge.textContent = count;
    if (count === 0) {
      badge.setAttribute("hidden", "");
    } else {
      badge.removeAttribute("hidden");
    }
  }
  if (btn) {
    btn.setAttribute(
      "aria-label",
      "Open cart, " + count + " item" + (count === 1 ? "" : "s"),
    );
  }
}

// ─── Pickup Scheduler Logic ───────────────────────────────────────────────────

function _isValidPickupDate(dateStr) {
  if (!dateStr) return false;
  var parts = dateStr.split("-");
  if (parts.length !== 3) return false;
  var d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  if (isNaN(d.getTime())) return false;
  var day = d.getDay();
  if (day === 0 || !STORE_HOURS[day]) return false;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
}

function _getTimeSlots(dateStr) {
  var parts = dateStr.split("-");
  var d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  var day = d.getDay();
  var hours = STORE_HOURS[day];
  if (!hours) return [];

  var slots = [];
  var openH = hours.open[0];
  var openM = hours.open[1];
  var closeH = hours.close[0];
  var closeM = hours.close[1];

  // Last slot is 30 min before close
  var lastH = closeH;
  var lastM = closeM - 30;
  if (lastM < 0) {
    lastH -= 1;
    lastM += 60;
  }

  var curH = openH;
  var curM = openM;

  while (curH < lastH || (curH === lastH && curM <= lastM)) {
    var period = curH < 12 ? "AM" : "PM";
    var displayH = curH % 12;
    if (displayH === 0) displayH = 12;
    var displayM = curM < 10 ? "0" + curM : "" + curM;
    slots.push(displayH + ":" + displayM + " " + period);
    curM += 30;
    if (curM >= 60) {
      curM -= 60;
      curH += 1;
    }
  }
  return slots;
}

function _validateScheduler() {
  var dateInput = document.getElementById("pickup-date");
  var timeSelect = document.getElementById("pickup-time");
  var errors = {};
  var valid = true;

  if (!dateInput || !dateInput.value) {
    errors.date = "Please select a pickup date.";
    valid = false;
  }
  if (!timeSelect || !timeSelect.value) {
    errors.time = "Please select a pickup time.";
    valid = false;
  }
  return { valid: valid, errors: errors };
}

function _confirmPickup() {
  var result = _validateScheduler();
  if (!result.valid) {
    var dateErr = document.getElementById("pickup-date-error");
    var timeErr = document.getElementById("pickup-time-error");
    if (dateErr) dateErr.textContent = result.errors.date || "";
    if (timeErr) timeErr.textContent = result.errors.time || "";
    return;
  }
  var dateInput = document.getElementById("pickup-date");
  var timeSelect = document.getElementById("pickup-time");
  var date = dateInput.value;
  var time = timeSelect.value;
  var total = _getOrderTotal();
  _renderConfirmation(date, time, total);
  _clearCart();
}

// ─── Drawer Rendering ─────────────────────────────────────────────────────────

function _renderDrawer() {
  var body = document.getElementById("cart-drawer__body");
  if (!body) return;

  if (_cartState.length === 0) {
    body.innerHTML =
      '<div class="cart-empty">' + "<p>Your cart is empty</p>" + "</div>";
    return;
  }

  var html = '<ul class="cart-item-list">';
  for (var i = 0; i < _cartState.length; i++) {
    var item = _cartState[i];
    var lineTotal = (item.price * item.quantity).toFixed(2);
    html += '<li class="cart-item" data-id="' + item.id + '">';
    html +=
      '<img class="cart-item__img" src="' +
      item.image +
      '" alt="' +
      item.name +
      '" />';
    html += '<div class="cart-item__details">';
    html += '<span class="cart-item__name">' + item.name + "</span>";
    html +=
      '<span class="cart-item__price">$' + item.price.toFixed(2) + "</span>";
    html += '<div class="cart-item__qty-controls">';
    html +=
      '<button class="cart-item__decrement" data-id="' +
      item.id +
      '" aria-label="Decrease quantity of ' +
      item.name +
      '">&#8722;</button>';
    html += '<span class="cart-item__qty">' + item.quantity + "</span>";
    html +=
      '<button class="cart-item__increment" data-id="' +
      item.id +
      '" aria-label="Increase quantity of ' +
      item.name +
      '">+</button>';
    html += "</div>";
    html += '<span class="cart-item__line-total">$' + lineTotal + "</span>";
    html += "</div>";
    html +=
      '<button class="cart-item__remove" data-id="' +
      item.id +
      '" aria-label="Remove ' +
      item.name +
      ' from cart">&#215;</button>';
    html += "</li>";
  }
  html += "</ul>";

  var orderTotal = _getOrderTotal().toFixed(2);
  html += '<div class="cart-total">';
  html += '<span class="cart-total__label">Order Total</span>';
  html += '<span class="cart-total__amount">$' + orderTotal + "</span>";
  html += "</div>";

  html += '<div class="cart-scheduler">';
  html += "<h3>Schedule In-Store Pickup</h3>";
  html += '<div class="cart-scheduler__field">';
  html += '<label for="pickup-date">Pickup Date</label>';
  html += '<input type="date" id="pickup-date" name="pickup-date" />';
  html += '<span class="cart-scheduler__error" id="pickup-date-error"></span>';
  html += "</div>";
  html += '<div class="cart-scheduler__field">';
  html += '<label for="pickup-time">Pickup Time</label>';
  html += '<select id="pickup-time" name="pickup-time">';
  html += '<option value="">-- Select a time --</option>';
  html += "</select>";
  html += '<span class="cart-scheduler__error" id="pickup-time-error"></span>';
  html += "</div>";
  html +=
    '<button class="btn btn-primary cart-scheduler__submit" id="schedule-pickup-btn">Schedule Pickup</button>';
  html += "</div>";

  body.innerHTML = html;

  // Wire quantity and remove buttons via addEventListener
  var decrementBtns = body.querySelectorAll(".cart-item__decrement");
  for (var d = 0; d < decrementBtns.length; d++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        _decrementQty(btn.getAttribute("data-id"));
      });
    })(decrementBtns[d]);
  }

  var incrementBtns = body.querySelectorAll(".cart-item__increment");
  for (var inc = 0; inc < incrementBtns.length; inc++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        _incrementQty(btn.getAttribute("data-id"));
      });
    })(incrementBtns[inc]);
  }

  var removeBtns = body.querySelectorAll(".cart-item__remove");
  for (var r = 0; r < removeBtns.length; r++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        _removeItem(btn.getAttribute("data-id"));
      });
    })(removeBtns[r]);
  }

  // Wire date input change
  var dateInput = document.getElementById("pickup-date");
  if (dateInput) {
    dateInput.addEventListener("change", function () {
      var dateErr = document.getElementById("pickup-date-error");
      var timeSelect = document.getElementById("pickup-time");
      var timeErr = document.getElementById("pickup-time-error");
      if (dateErr) dateErr.textContent = "";
      if (timeErr) timeErr.textContent = "";
      if (!timeSelect) return;
      timeSelect.innerHTML = '<option value="">-- Select a time --</option>';
      if (_isValidPickupDate(dateInput.value)) {
        var slots = _getTimeSlots(dateInput.value);
        for (var s = 0; s < slots.length; s++) {
          var opt = document.createElement("option");
          opt.value = slots[s];
          opt.textContent = slots[s];
          timeSelect.appendChild(opt);
        }
      }
    });
  }

  // Wire time select change to clear error
  var timeSelect = document.getElementById("pickup-time");
  if (timeSelect) {
    timeSelect.addEventListener("change", function () {
      var timeErr = document.getElementById("pickup-time-error");
      if (timeErr) timeErr.textContent = "";
    });
  }

  // Wire schedule pickup button
  var scheduleBtn = document.getElementById("schedule-pickup-btn");
  if (scheduleBtn) {
    scheduleBtn.addEventListener("click", function () {
      _confirmPickup();
    });
  }
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

function _renderConfirmation(date, time, total) {
  var body = document.getElementById("cart-drawer__body");
  if (!body) return;

  // Format date for display
  var parts = date.split("-");
  var displayDate = parts[1] + "/" + parts[2] + "/" + parts[0];

  body.innerHTML =
    '<div class="cart-confirmation">' +
    '<div class="cart-confirmation__icon">&#10003;</div>' +
    '<h3 class="cart-confirmation__title">Pickup Scheduled!</h3>' +
    '<p class="cart-confirmation__detail"><strong>Date:</strong> ' +
    displayDate +
    "</p>" +
    '<p class="cart-confirmation__detail"><strong>Time:</strong> ' +
    time +
    "</p>" +
    '<p class="cart-confirmation__total"><strong>Order Total:</strong> $' +
    total.toFixed(2) +
    "</p>" +
    '<p class="cart-confirmation__note">Your items will be held for you. No payment is collected online — pay in store at pickup.</p>' +
    "</div>";
}

// ─── Init / Open / Close ──────────────────────────────────────────────────────

function initCart() {
  // Inject overlay and drawer into body
  var overlay = document.createElement("div");
  overlay.id = "cart-overlay";
  overlay.className = "cart-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);

  var drawer = document.createElement("aside");
  drawer.id = "cart-drawer";
  drawer.className = "cart-drawer";
  drawer.setAttribute("aria-label", "Shopping cart");
  drawer.setAttribute("aria-hidden", "true");
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.innerHTML =
    '<div class="cart-drawer__header">' +
    '<h2 class="cart-drawer__title">Your Cart</h2>' +
    '<button id="cart-close-btn" class="cart-drawer__close" aria-label="Close cart">&times;</button>' +
    "</div>" +
    '<div id="cart-drawer__body" class="cart-drawer__body"></div>';
  document.body.appendChild(drawer);

  // Inject cart icon button into .nav__inner inside #main-nav
  var navInner = document.querySelector("#main-nav .nav__inner");
  if (navInner) {
    var cartBtn = document.createElement("button");
    cartBtn.id = "cart-icon-btn";
    cartBtn.className = "nav__cart-btn";
    cartBtn.setAttribute("aria-label", "Open cart, 0 items");
    cartBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>' +
      '<line x1="3" y1="6" x2="21" y2="6"></line>' +
      '<path d="M16 10a4 4 0 0 1-8 0"></path>' +
      "</svg>" +
      '<span id="cart-badge" class="cart-badge" aria-hidden="true" hidden>0</span>';
    navInner.appendChild(cartBtn);
  }

  // Restore cart state from localStorage
  _cartState = _loadCart();
  _updateBadge();

  // Wire overlay click to close drawer
  overlay.addEventListener("click", function () {
    closeCartDrawer();
  });

  // Wire close button to close drawer
  var closeBtn = document.getElementById("cart-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      closeCartDrawer();
    });
  }

  // Wire cart icon to open drawer
  var cartIconBtn = document.getElementById("cart-icon-btn");
  if (cartIconBtn) {
    cartIconBtn.addEventListener("click", function () {
      openCartDrawer();
    });
  }
}

function openCartDrawer() {
  var drawer = document.getElementById("cart-drawer");
  var overlay = document.getElementById("cart-overlay");
  if (drawer) {
    drawer.classList.add("cart-drawer--open");
    drawer.setAttribute("aria-hidden", "false");
  }
  if (overlay) {
    overlay.classList.add("cart-overlay--open");
  }
  _drawerOpen = true;
  _renderDrawer();
  var closeBtn = document.getElementById("cart-close-btn");
  if (closeBtn) {
    closeBtn.focus();
  }
}

function closeCartDrawer() {
  var drawer = document.getElementById("cart-drawer");
  var overlay = document.getElementById("cart-overlay");
  if (drawer) {
    drawer.classList.remove("cart-drawer--open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (overlay) {
    overlay.classList.remove("cart-overlay--open");
  }
  _drawerOpen = false;
  var cartIconBtn = document.getElementById("cart-icon-btn");
  if (cartIconBtn) {
    cartIconBtn.focus();
  }
}
