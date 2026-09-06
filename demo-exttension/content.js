// content.js - Complete Error Guard Engine with Real-Time Indicator & OCR Verification

(() => {
  let userProfile = null;
  let uploadedDocumentText = "";
  const flaggedFields = new Set();
  let isSubmitting = false;
  let observer = null;

  function shouldExtensionRun() {
    if (window.location.protocol === "chrome-extension:") return false;

    const ignoredDomains = ["google.com", "bing.com", "youtube.com", "duckduckgo.com", "wikipedia.org"];
    const host = window.location.hostname.toLowerCase();
    if (ignoredDomains.some((d) => host.includes(d))) return false;

    if (document.querySelector('input[type="password"], input[type="file"]')) return true;

    const actionable = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="search"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select'
    );
    const pageMeta = `${window.location.href} ${document.title}`.toLowerCase();
    const keywords = ["scholarship", "application", "checkout", "register", "signup", "login", "profile", "account", "apply", "admission"];

    return (keywords.some((kw) => pageMeta.includes(kw)) && actionable.length >= 1) || actionable.length >= 2;
  }

  // =========================================================================
  // DYNAMIC "READY TO SUBMIT" INDICATOR BANNER
  // =========================================================================
  function updateReadyToSubmitIndicator(form) {
    if (!form) form = document.querySelector("form");
    if (!form) return;

    let indicator = form.querySelector("#shield-ready-indicator");
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!submitBtn) return;

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "shield-ready-indicator";
      indicator.style.cssText = `
        padding: 12px 16px;
        margin: 15px 0;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: Arial, sans-serif;
      `;
      submitBtn.insertAdjacentElement("beforebegin", indicator);
    }

    const requiredInputs = form.querySelectorAll("input[required], select[required], textarea[required]");
    let emptyRequiredCount = 0;
    requiredInputs.forEach((input) => {
      if (input.type === "file") {
        if (!input.files || input.files.length === 0) emptyRequiredCount++;
      } else if (input.type === "checkbox") {
        if (!input.checked) emptyRequiredCount++;
      } else if (!input.value.trim()) {
        emptyRequiredCount++;
      }
    });

    if (flaggedFields.size > 0) {
      indicator.style.background = "#fef2f2";
      indicator.style.border = "1px solid #ef4444";
      indicator.style.color = "#b91c1c";
      indicator.innerHTML = `⚠️ <b>Error Guard:</b> ${flaggedFields.size} issue(s) detected. Please fix flagged items.`;
    } else if (emptyRequiredCount > 0) {
      indicator.style.background = "#fffbeb";
      indicator.style.border = "1px solid #f59e0b";
      indicator.style.color = "#b45309";
      indicator.innerHTML = `⏳ <b>Error Guard:</b> Application in progress (${emptyRequiredCount} required field${emptyRequiredCount > 1 ? "s" : ""} remaining).`;
    } else {
      indicator.style.background = "#f0fdf4";
      indicator.style.border = "1px solid #22c55e";
      indicator.style.color = "#15803d";
      indicator.innerHTML = `🛡️ <b>Error Guard:</b> All format and document checks passed. Ready to submit!`;
    }
  }

  // =========================================================================
  // DOCUMENT OCR CROSS-CHECK
  // =========================================================================
  function verifyAgainstUploadedDocument(fieldKey, value) {
    if (!uploadedDocumentText) return null;
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanValue.length < 3) return null;

    const cleanOcr = uploadedDocumentText.replace(/[^a-z0-9]/g, "");

    if (fieldKey.includes("studentid") || fieldKey.includes("roll") || fieldKey.includes("registration")) {
      if (!cleanOcr.includes(cleanValue)) {
        return `ID "${value}" not detected in your uploaded document scan.`;
      }
    }

    const isPersonalName = fieldKey === "fullname" || fieldKey === "name" || fieldKey.includes("studentname");
    if (isPersonalName) {
      const parts = value.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
      const matches = parts.filter((p) => uploadedDocumentText.includes(p));
      if (parts.length > 0 && matches.length === 0) {
        return `Name "${value}" does not match the text found on your document scan.`;
      }
    }

    return null;
  }

  // =========================================================================
  // LOCAL FIELD VALIDATION
  // =========================================================================
  function validateLocalField(input) {
    const val = input.value.trim();
    const name = (input.name || input.id || input.placeholder || "").toLowerCase();
    const type = (input.type || "text").toLowerCase();

    if (!val) {
      clearInputFeedback(input);
      flaggedFields.delete(input);
      updateReadyToSubmitIndicator(input.form);
      return;
    }

    let error = null;

    // Pattern Rules
    if (type === "email" || name.includes("email")) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(val)) {
        error = "Invalid email format.";
      } else if (val.endsWith(".con") || val.endsWith(".cmo") || val.includes("@gmial")) {
        error = "Typo in email domain (.con / @gmial).";
      }
    } else if (type === "tel" || name.includes("phone") || name.includes("mobile")) {
      const phoneDigits = val.replace(/\D/g, "");
      if (phoneDigits.length !== 10) error = "Phone number must be exactly 10 digits.";
    } else if (name.includes("pincode") || name.includes("zip") || name.includes("postal")) {
      const pinDigits = val.replace(/\D/g, "");
      if (pinDigits.length !== 6) error = "PIN Code must be a 6-digit number.";
    } else if (name.includes("ifsc")) {
      const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
      if (!ifscPattern.test(val)) error = "Invalid IFSC Code format (e.g., SBIN0001234).";
    } else if (name.includes("cgpa") || name.includes("percentage")) {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 100) error = "Score must be between 0 and 100.";
    }

    // Profile Cross-Check
    if (!error && userProfile) {
      if ((type === "email" || name.includes("email")) && userProfile.email) {
        if (val.toLowerCase() !== userProfile.email.toLowerCase()) {
          const valDomain = val.split("@")[1];
          const profDomain = userProfile.email.split("@")[1];
          if (valDomain === profDomain) error = `Differs from saved profile (${userProfile.email})`;
        }
      }
      if ((type === "tel" || name.includes("phone")) && userProfile.phone) {
        if (val.replace(/\D/g, "") !== userProfile.phone.replace(/\D/g, "")) {
          error = `Differs from profile phone (${userProfile.phone})`;
        }
      }
      const isPersonalName = name === "fullname" || name === "name" || name.includes("studentname");
      if (isPersonalName && (userProfile.fullName || userProfile.full_name)) {
        const storedName = userProfile.fullName || userProfile.full_name;
        if (val.toLowerCase() !== storedName.toLowerCase()) error = `Differs from profile name: ${storedName}`;
      }
    }

    // OCR Document Cross-Check
    if (!error) {
      const docError = verifyAgainstUploadedDocument(name, val);
      if (docError) error = docError;
    }

    if (error) {
      flaggedFields.add(input);
      setInputFeedback(input, "error", error);
    } else {
      flaggedFields.delete(input);
      setInputFeedback(input, "valid");
    }

    updateReadyToSubmitIndicator(input.form);
  }

  // =========================================================================
  // FILE UPLOAD AND BLUR CHECK
  // =========================================================================
  function setupImageInputs() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((fileInput) => {
      if (fileInput.dataset.shieldBound) return;
      fileInput.dataset.shieldBound = "true";

      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) {
          updateReadyToSubmitIndicator(fileInput.form);
          return;
        }

        if (!file.type.startsWith("image/")) {
          setInputFeedback(fileInput, "error", "Invalid file format. Please upload an image (JPG/PNG).");
          flaggedFields.add(fileInput);
          updateReadyToSubmitIndicator(fileInput.form);
          return;
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 2.0) {
          setInputFeedback(fileInput, "error", `File size (${sizeMB.toFixed(2)} MB) exceeds portal limit of 2 MB.`);
          flaggedFields.add(fileInput);
          updateReadyToSubmitIndicator(fileInput.form);
          return;
        }

        setInputFeedback(fileInput, "loading", "Analyzing sharpness, crop, and OCR text...");

        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result.split(",")[1];
          chrome.runtime.sendMessage(
            {
              action: "EVALUATE_IMAGE_BLUR",
              payload: {
                image_base64: base64Data,
                field_name: fileInput.name || fileInput.id || "document_upload"
              }
            },
            (response) => {
              if (chrome.runtime.lastError || !response || !response.success) {
                setInputFeedback(fileInput, "error", "Document inspection server unreachable.");
                return;
              }

              const { is_clear, reason, extracted_text } = response.data;
              if (is_clear) {
                setInputFeedback(fileInput, "valid", reason);
                flaggedFields.delete(fileInput);
                uploadedDocumentText = (extracted_text || "").toLowerCase();

                // Re-verify existing input values against newly processed document
                document
                  .querySelectorAll('input[name*="id"], input[id*="id"], input[name*="roll"], input[id*="roll"], input[name*="name"], input[id*="name"]')
                  .forEach((f) => {
                    if (f.value.trim()) validateLocalField(f);
                  });
              } else {
                uploadedDocumentText = "";
                setInputFeedback(fileInput, "error", reason);
                flaggedFields.add(fileInput);
              }
              updateReadyToSubmitIndicator(fileInput.form);
            }
          );
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // =========================================================================
  // PRE-SUBMIT FORM INTERCEPTION
  // =========================================================================
  function setupFormInterception() {
    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (isSubmitting) return;

      const formControls = form.querySelectorAll(
        "input:not([type='hidden']):not([type='file']):not([type='submit']):not([type='checkbox']):not([type='radio']), textarea, select"
      );

      formControls.forEach((input) => {
        if (input.required && !input.value.trim()) {
          flaggedFields.add(input);
          setInputFeedback(input, "error", "This field is required.");
        } else {
          validateLocalField(input);
        }
      });

      const fileInputs = form.querySelectorAll("input[type='file'][required]");
      fileInputs.forEach((fileInput) => {
        if (!fileInput.files || fileInput.files.length === 0) {
          flaggedFields.add(fileInput);
          setInputFeedback(fileInput, "error", "Please upload the required document.");
        }
      });

      updateReadyToSubmitIndicator(form);

      if (flaggedFields.size > 0) {
        e.preventDefault();
        const firstError = flaggedFields.values().next().value;
        if (firstError && typeof firstError.scrollIntoView === "function") {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          firstError.focus();
        }
        alert("Form Shield: Please resolve all flagged issues before submitting.");
        return;
      }

      console.log("Form Shield: All validations and document checks passed!");
      isSubmitting = true;
    });
  }

  // =========================================================================
  // VISUAL TOOLTIPS & BADGES
  // =========================================================================
  function setInputFeedback(input, status, message = "") {
    clearInputFeedback(input);
    const inputKey = input.name || input.id;
    let badge = input.parentElement.querySelector(`.shield-feedback-msg[data-for="${inputKey}"]`);
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "shield-feedback-msg";
      badge.dataset.for = inputKey;
      input.insertAdjacentElement("afterend", badge);
    }

    if (status === "error") {
      input.style.border = "2px solid #ef4444";
      badge.textContent = `⚠️ ${message}`;
      badge.style.cssText = "color: #dc2626; font-size: 11px; font-weight: 600; margin-top: 4px; font-family: sans-serif;";
    } else if (status === "loading") {
      badge.textContent = `⏳ ${message}`;
      badge.style.cssText = "color: #d97706; font-size: 11px; font-weight: 600; margin-top: 4px; font-family: sans-serif;";
    } else if (status === "valid") {
      input.style.border = "2px solid #16a34a";
      if (message) {
        badge.textContent = `✅ ${message}`;
        badge.style.cssText = "color: #16a34a; font-size: 11px; font-weight: 600; margin-top: 4px; font-family: sans-serif;";
      } else {
        badge.remove();
      }
    }
  }

  function clearInputFeedback(input) {
    input.style.border = "";
    const inputKey = input.name || input.id;
    const badge = input.parentElement?.querySelector(`.shield-feedback-msg[data-for="${inputKey}"]`);
    if (badge) badge.remove();
  }

  // =========================================================================
  // INITIALIZATION & OBSERVER
  // =========================================================================
  function attachFieldListeners() {
    document
      .querySelectorAll("input:not([type='hidden']):not([type='file']):not([type='submit']):not([type='checkbox']), textarea, select")
      .forEach((input) => {
        if (input.dataset.shieldBound) return;
        input.dataset.shieldBound = "true";
        input.addEventListener("blur", () => validateLocalField(input));
        input.addEventListener("input", () => {
          if (flaggedFields.has(input)) {
            clearInputFeedback(input);
            flaggedFields.delete(input);
          }
          updateReadyToSubmitIndicator(input.form);
        });
      });

    document.querySelectorAll("input[type='checkbox']").forEach((cb) => {
      if (cb.dataset.shieldBound) return;
      cb.dataset.shieldBound = "true";
      cb.addEventListener("change", () => updateReadyToSubmitIndicator(cb.form));
    });

    setupImageInputs();
  }

  function safeAttachFieldListeners() {
    if (observer) observer.disconnect();

    attachFieldListeners();

    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  async function initializeEngine() {
    if (!shouldExtensionRun()) return;

    chrome.runtime.sendMessage({ action: "SET_STATUS_BADGE", text: "ON", color: "#2563eb" });
    const stored = await chrome.storage.local.get(["appUser"]);
    userProfile = stored.appUser || null;

    setupFormInterception();
    safeAttachFieldListeners();
    updateReadyToSubmitIndicator();

    observer = new MutationObserver(() => {
      safeAttachFieldListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeEngine);
  } else {
    initializeEngine();
  }
})();