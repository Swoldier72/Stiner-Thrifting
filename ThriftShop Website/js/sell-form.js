// sell-form.js — Sell Form validation, image preview, and confirmation

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Validate all 7 required sell-form fields.
 * @param {Object} formData - { imageFile, itemName, itemDescription, askingPrice, sellerName, sellerEmail, sellerPhone }
 * @returns {{ valid: boolean, errors: Object.<string, string> }}
 */
function validateSellForm(formData) {
  const errors = {};

  if (!formData.imageFile) {
    errors.imageFile = "Please upload a photo of your item.";
  } else if (!ACCEPTED_MIME_TYPES.includes(formData.imageFile.type)) {
    errors.imageFile = "Please upload a JPG, PNG, or WEBP image.";
  }

  if (!formData.itemName || !formData.itemName.trim()) {
    errors.itemName = "Item name is required.";
  }

  if (!formData.itemDescription || !formData.itemDescription.trim()) {
    errors.itemDescription = "Item description is required.";
  }

  if (!formData.askingPrice || !formData.askingPrice.trim()) {
    errors.askingPrice = "Asking price is required.";
  }

  if (!formData.sellerName || !formData.sellerName.trim()) {
    errors.sellerName = "Your name is required.";
  }

  if (!formData.sellerEmail || !formData.sellerEmail.trim()) {
    errors.sellerEmail = "Email address is required.";
  } else if (!EMAIL_REGEX.test(formData.sellerEmail.trim())) {
    errors.sellerEmail = "Please enter a valid email address.";
  }

  if (!formData.sellerPhone || !formData.sellerPhone.trim()) {
    errors.sellerPhone = "Phone number is required.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Render an image preview inside #sell-image-preview using FileReader.
 * @param {File} file
 */
function previewImage(file) {
  const previewEl = document.getElementById("sell-image-preview");
  if (!previewEl) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    previewEl.innerHTML = "";
    const img = document.createElement("img");
    img.src = e.target.result;
    img.alt = "Preview of uploaded item photo";
    previewEl.appendChild(img);
  };

  reader.onerror = function () {
    previewEl.innerHTML = "<p>Preview unavailable.</p>";
  };

  reader.readAsDataURL(file);
}

/**
 * Hide #sell-form and show #sell-confirmation.
 */
function showConfirmation() {
  const form = document.getElementById("sell-form");
  const confirmation = document.getElementById("sell-confirmation");
  if (form) form.hidden = true;
  if (confirmation) confirmation.removeAttribute("hidden");
}

/**
 * Show an inline error for a field.
 * @param {string} fieldName - e.g. "imageFile", "itemName"
 * @param {string} message
 */
function showFieldError(fieldName, message) {
  const errorId = fieldNameToErrorId(fieldName);
  const span = document.getElementById(errorId);
  if (span) span.textContent = message;
}

/**
 * Clear an inline error for a field.
 * @param {string} fieldName
 */
function clearFieldError(fieldName) {
  const errorId = fieldNameToErrorId(fieldName);
  const span = document.getElementById(errorId);
  if (span) span.textContent = "";
}

/**
 * Map a formData field name to its error span id.
 * @param {string} fieldName
 * @returns {string}
 */
function fieldNameToErrorId(fieldName) {
  const map = {
    imageFile: "sell-image-error",
    itemName: "sell-item-name-error",
    itemDescription: "sell-item-desc-error",
    askingPrice: "sell-price-error",
    sellerName: "sell-seller-name-error",
    sellerEmail: "sell-email-error",
    sellerPhone: "sell-phone-error",
  };
  return map[fieldName] || fieldName + "-error";
}

/**
 * Attach submit and file-change listeners to the sell form.
 */
function initSellForm() {
  const form = document.getElementById("sell-form");
  const imageInput = document.getElementById("sell-image");
  if (!form || !imageInput) return;

  // --- File input: preview + validate type on change ---
  imageInput.addEventListener("change", function () {
    clearFieldError("imageFile");
    const file = this.files && this.files[0];
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      showFieldError("imageFile", "Please upload a JPG, PNG, or WEBP image.");
      // Clear preview
      const previewEl = document.getElementById("sell-image-preview");
      if (previewEl) previewEl.innerHTML = "";
      return;
    }

    previewImage(file);
  });

  // --- Clear errors on input/change for text fields ---
  const fieldMap = [
    { inputId: "sell-item-name", fieldName: "itemName", event: "input" },
    { inputId: "sell-item-desc", fieldName: "itemDescription", event: "input" },
    { inputId: "sell-price", fieldName: "askingPrice", event: "input" },
    { inputId: "sell-seller-name", fieldName: "sellerName", event: "input" },
    { inputId: "sell-email", fieldName: "sellerEmail", event: "input" },
    { inputId: "sell-phone", fieldName: "sellerPhone", event: "input" },
  ];

  fieldMap.forEach(({ inputId, fieldName, event }) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener(event, () => clearFieldError(fieldName));
  });

  // --- Email: also validate on blur ---
  const emailInput = document.getElementById("sell-email");
  if (emailInput) {
    emailInput.addEventListener("blur", function () {
      const val = this.value.trim();
      if (val && !EMAIL_REGEX.test(val)) {
        showFieldError("sellerEmail", "Please enter a valid email address.");
      }
    });
  }

  // --- Submit ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const imageFile = imageInput.files && imageInput.files[0];
    const formData = {
      imageFile: imageFile || null,
      itemName: form.elements["itemName"].value,
      itemDescription: form.elements["itemDescription"].value,
      askingPrice: form.elements["askingPrice"].value,
      sellerName: form.elements["sellerName"].value,
      sellerEmail: form.elements["sellerEmail"].value,
      sellerPhone: form.elements["sellerPhone"].value,
    };

    const { valid, errors } = validateSellForm(formData);

    // Clear all errors first
    [
      "imageFile",
      "itemName",
      "itemDescription",
      "askingPrice",
      "sellerName",
      "sellerEmail",
      "sellerPhone",
    ].forEach((field) => clearFieldError(field));

    // Show new errors
    Object.entries(errors).forEach(([field, message]) => {
      showFieldError(field, message);
    });

    if (valid) {
      showConfirmation();
    }
  });
}
