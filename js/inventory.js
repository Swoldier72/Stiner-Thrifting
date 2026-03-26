// inventory.js — Item card rendering, category filter, and modal logic

function renderInventory(items) {
  var grid = document.getElementById("inventory-grid");
  if (!grid) return;

  var html = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    html +=
      '<article class="item-card" data-id="' +
      item.id +
      '" data-category="' +
      item.category +
      '">';
    html +=
      '<img src="' + item.image + '" alt="' + item.name + '" loading="lazy" />';
    html += '<div class="item-card__body">';
    html += '<h3 class="item-card__name">' + item.name + "</h3>";
    html += '<p class="item-card__price">$' + item.price.toFixed(2) + "</p>";
    html += '<p class="item-card__desc">' + item.description + "</p>";
    html +=
      '<button class="btn btn-primary item-card__add-btn" data-id="' +
      item.id +
      '">Add to Cart</button>';
    html += "</div></article>";
  }
  grid.innerHTML = html;

  // Wire Add to Cart buttons (stop propagation so modal doesn't open)
  grid.querySelectorAll(".item-card__add-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var id = btn.getAttribute("data-id");
      var item = INVENTORY_ITEMS.find(function (it) {
        return it.id === id;
      });
      if (item) {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
        });
      }
    });
  });

  // Wire card click to open modal
  grid.querySelectorAll(".item-card").forEach(function (card) {
    card.addEventListener("click", function () {
      openItemModal(card.getAttribute("data-id"));
    });
  });
}

function filterByCategory(category) {
  var grid = document.getElementById("inventory-grid");
  if (grid) {
    grid.setAttribute("data-active-category", category);
  }
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    if (btn.getAttribute("data-category") === category) {
      btn.classList.add("filter-btn--active");
    } else {
      btn.classList.remove("filter-btn--active");
    }
  });
}

function openItemModal(itemId) {
  var item = INVENTORY_ITEMS.find(function (i) {
    return i.id === itemId;
  });
  if (!item) return;

  var modal = document.getElementById("item-modal");
  if (!modal) return;

  var img = document.getElementById("modal-item-image");
  var name = document.getElementById("modal-item-name");
  var price = modal.querySelector(".modal__price");
  var desc = modal.querySelector(".modal__description");

  if (img) {
    img.src = item.image;
    img.alt = item.name;
  }
  if (name) {
    name.textContent = item.name;
  }
  if (price) {
    price.textContent = "$" + item.price.toFixed(2);
  }
  if (desc) {
    desc.textContent = item.fullDescription;
  }

  modal.showModal();
}

function closeItemModal() {
  var modal = document.getElementById("item-modal");
  if (modal) modal.close();
}

// Wire filter buttons
document.querySelectorAll(".filter-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    filterByCategory(btn.getAttribute("data-category"));
  });
});

// Wire modal close button
var modalCloseBtn = document.querySelector("#item-modal .modal__close");
if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeItemModal);
}

// Wire backdrop click to close modal
var itemModal = document.getElementById("item-modal");
if (itemModal) {
  itemModal.addEventListener("click", function (e) {
    if (e.target === itemModal) closeItemModal();
  });
}
