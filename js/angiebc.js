// angiebc.js — Angie B Designs item rendering and custom request form

var EMAIL_REGEX_ANGIEBC = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function renderAngiebcItems(items) {
  var grid = document.getElementById("angiebc-grid");
  if (!grid) return;

  var html = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    html +=
      '<article class="item-card" data-id="' +
      item.id +
      '" data-type="' +
      item.type +
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

  // Wire Add to Cart buttons
  grid.querySelectorAll(".item-card__add-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var id = btn.getAttribute("data-id");
      var item = ANGIEBC_ITEMS.find(function (it) {
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

  // Wire type filter buttons
  document
    .querySelectorAll("#angiebc-shop .filter-btn")
    .forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.getAttribute("data-type");
        grid.setAttribute("data-active-type", type);
        document
          .querySelectorAll("#angiebc-shop .filter-btn")
          .forEach(function (b) {
            b.classList.toggle(
              "filter-btn--active",
              b.getAttribute("data-type") === type,
            );
          });
      });
    });
}

function validateCustomRequestForm(data) {
  var errors = {};
  if (!data.requesterName || !data.requesterName.trim()) {
    errors.requesterName = "Your name is required.";
  }
  if (!data.contactEmail || !data.contactEmail.trim()) {
    errors.contactEmail = "Email address is required.";
  } else if (!EMAIL_REGEX_ANGIEBC.test(data.contactEmail.trim())) {
    errors.contactEmail = "Please enter a valid email address.";
  }
  if (!data.itemType || !data.itemType.trim()) {
    errors.itemType = "Please select an item type.";
  }
  if (!data.sizeOrDimensions || !data.sizeOrDimensions.trim()) {
    errors.sizeOrDimensions = "Size or dimensions are required.";
  }
  if (!data.colorPreferences || !data.colorPreferences.trim()) {
    errors.colorPreferences = "Color preferences are required.";
  }
  if (
    data.referenceImage &&
    !ACCEPTED_IMAGE_TYPES.includes(data.referenceImage.type)
  ) {
    errors.referenceImage = "Please upload a JPG, PNG, or WEBP image.";
  }
  return { valid: Object.keys(errors).length === 0, errors: errors };
}

function angiebcFieldToErrorId(fieldName) {
  var map = {
    requesterName: "req-name-error",
    contactEmail: "req-email-error",
    itemType: "req-type-error",
    sizeOrDimensions: "req-size-error",
    colorPreferences: "req-colors-error",
    referenceImage: "req-image-error",
  };
  return map[fieldName] || fieldName + "-error";
}

function showAngiebcFieldError(fieldName, message) {
  var span = document.getElementById(angiebcFieldToErrorId(fieldName));
  if (span) span.textContent = message;
}

function clearAngiebcFieldError(fieldName) {
  var span = document.getElementById(angiebcFieldToErrorId(fieldName));
  if (span) span.textContent = "";
}

function initCustomRequestForm() {
  var form = document.getElementById("custom-request-form");
  if (!form) return;

  var fieldListeners = [
    { id: "req-name", field: "requesterName", event: "input" },
    { id: "req-email", field: "contactEmail", event: "input" },
    { id: "req-type", field: "itemType", event: "change" },
    { id: "req-size", field: "sizeOrDimensions", event: "input" },
    { id: "req-colors", field: "colorPreferences", event: "input" },
    { id: "req-image", field: "referenceImage", event: "change" },
  ];

  fieldListeners.forEach(function (entry) {
    var el = document.getElementById(entry.id);
    if (el) {
      el.addEventListener(entry.event, function () {
        clearAngiebcFieldError(entry.field);
      });
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var imageInput = document.getElementById("req-image");
    var imageFile = imageInput && imageInput.files && imageInput.files[0];
    var data = {
      requesterName: form.elements["requesterName"].value,
      contactEmail: form.elements["contactEmail"].value,
      itemType: form.elements["itemType"].value,
      sizeOrDimensions: form.elements["sizeOrDimensions"].value,
      colorPreferences: form.elements["colorPreferences"].value,
      referenceImage: imageFile || null,
    };
    var result = validateCustomRequestForm(data);
    [
      "requesterName",
      "contactEmail",
      "itemType",
      "sizeOrDimensions",
      "colorPreferences",
      "referenceImage",
    ].forEach(function (field) {
      clearAngiebcFieldError(field);
    });
    Object.keys(result.errors).forEach(function (field) {
      showAngiebcFieldError(field, result.errors[field]);
    });
    if (result.valid) {
      form.hidden = true;
      var confirmation = document.getElementById("custom-request-confirmation");
      if (confirmation) confirmation.removeAttribute("hidden");
    }
  });
}
