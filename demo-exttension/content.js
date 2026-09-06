// content.js - End-to-End AI-Assisted Form Shield Engine

(() => {
  let userProfile = null;
  const flaggedFields = new Set();
  let isSubmitting = false;

  // =========================================================================
  // 1. PAGE RELEVANCE GATEKEEPER
  // =========================================================================
  function shouldExtensionRun() {
    const ignoredDomains = ["google.com", "bing.com", "youtube.com", "duckduckgo.com", "wikipedia.org"];
    const host = window.location.hostname.toLowerCase();
    if (ignoredDomains.some((domain) => host.includes(domain))) return false;

    // High-priority triggers: password fields or file uploaders
    if (document.querySelector('input[type="password"], input[type="file"]')) {
      return true;
    }

    // Actionable interactive form controls
    const actionableInputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="search"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select'
    );

    const intentKeywords = ["checkout", "register", "signup", "login", "profile", "account", "apply", "contact", "shipping"];
    const pageMeta = `${window.location.href} ${document.title}`.toLowerCase();
    const hasIntentKeyword = intentKeywords.some((kw) => pageMeta.includes(kw));

    if (hasIntentKeyword && actionableInputs.length >= 1) return true;
    if (actionableInputs.length >= 2) return true;

    return false;
  }

  // =========================================================================
  // 2. TIER 1: DETERMINISTIC REGEX & USER PROFILE PATTERN CHECKING
  // =========================================================================
  function validateLocalField(input) {
    const val = input.value.trim();
    const name = (input.name || input.id || input.placeholder || "").toLowerCase();
    const type = (input.type || "text").toLowerCase();

    // Skip unedited empty fields (caught at pre-submit if required)
    if (!val) {
      clearInputFeedback(input);
      flaggedFields.delete(input);
      return;
    }

    let error = null;

    // --- Pattern / Regex Rules ---
    if (type === "email" || name.includes("email")) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(val)) {
        error = "Invalid email format.";
      } else if (val.endsWith(".con") || val.endsWith(".cmo") || val.includes("@gmial")) {
        error = "Likely typo in email domain (.con / @gmial).";
      }
    } else if (type === "tel" || name.includes("phone") || name.includes("mobile")) {
      const phoneDigits = val.replace(/\D/g, "");
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        error = "Phone number must have 7 to 15 digits.";
      }
    } else if (name.includes("zip") || name.includes("postal")) {
      if (val.length < 3 || val.length > 10) {
        error = "Invalid ZIP / Postal code length.";
      }
    }

    // --- Cross-Check Against Verified User Data (chrome.storage) ---
    if (!error && userProfile) {
      // Email mismatch check
      if ((type === "email" || name.includes("email")) && userProfile.email) {
        if (val.toLowerCase() !== userProfile.email.toLowerCase()) {
          const typedDomain = val.split("@")[1];
          const profileDomain = userProfile.email.split("@")[1];
          if (typedDomain === profileDomain) {
            error = `Differs from verified profile (${userProfile.email})`;
          }
        }
      }

      // Phone mismatch check
      if ((type === "tel" || name.includes("phone")) && userProfile.phone) {
        const enteredClean = val.replace(/\D/g, "");
        const profileClean = userProfile.phone.replace(/\D/g, "");
        if (enteredClean && profileClean && enteredClean !== profileClean) {
          error = `Differs from saved profile (${userProfile.phone})`;
        }
      }

      // Name mismatch check
      if ((name.includes("fname") || name.includes("first")) && userProfile.first_name) {
        if (val.toLowerCase() !== userProfile.first_name.toLowerCase()) {
          error = `Expected first name: ${userProfile.first_name}`;
        }
      }
      if ((name.includes("lname") || name.includes("last")) && userProfile.last_name) {
        if (val.toLowerCase() !== userProfile.last_name.toLowerCase()) {
          error = `Expected last name: ${userProfile.last_name}`;
        }
      }

      // State mismatch check
      if ((name.includes("state") || name.includes("region")) && userProfile.address?.state) {
        if (val.toUpperCase() !== userProfile.address.state.toUpperCase()) {
          error = `Expected state: ${userProfile.address.state}`;
        }
      }

      // ZIP code mismatch check
      if ((name.includes("zip") || name.includes("postal")) && userProfile.address?.zip) {
        if (val !== userProfile.address.zip) {
          error = `Expected ZIP code: ${userProfile.address.zip}`;
        }
      }
    }

    // Render Inline Visual Feedback
    if (error) {
      flaggedFields.add(input);
      setInputFeedback(input, "error", error);
    } else {
      flaggedFields.delete(input);
      setInputFeedback(input, "valid");
    }
  }

  // =========================================================================
  // 3. IMAGE QUALITY & BLUR CHECK VIA OPENCV BACKEND (/check-blur)
  // =========================================================================
  function setupImageInputs() {
    const fileInputs = document.querySelectorAll('input[type="file"]');

    fileInputs.forEach((fileInput) => {
      if (fileInput.dataset.shieldBound) return;
      fileInput.dataset.shieldBound = "true";

      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file || !file.type.startsWith("image/")) return;

        setInputFeedback(fileInput, "loading", "Analyzing image sharpness...");

        const reader = new FileReader();
        reader.onload = () => {
          // Extract clean Base64 data without URI prefix
          const base64Data = reader.result.split(",")[1];

          chrome.runtime.sendMessage(
            {
              action: "EVALUATE_IMAGE_BLUR",
              payload: {
                image_base64: base64Data,
                field_name: fileInput.name || fileInput.id || "file_upload"
              }
            },
            (response) => {
              if (chrome.runtime.lastError || !response || !response.success) {
                setInputFeedback(fileInput, "error", "Blur detection server unreachable.");
                return;
              }

              // Server response: { is_clear, score, reason }
              const { is_clear, reason } = response.data;

              if (is_clear) {
                setInputFeedback(fileInput, "valid", reason);
                flaggedFields.delete(fileInput);
              } else {
                setInputFeedback(fileInput, "error", reason);
                flaggedFields.add(fileInput);
              }
            }
          );
        };

        reader.readAsDataURL(file);
      });
    });
  }

  // =========================================================================
  // 4. DATA EXTRACTION & TIER 3 FINAL PRE-SUBMIT CHECK (/final_review)
  // =========================================================================
  function setupFormInterception() {
    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (isSubmitting) return; // Allow programmatic submission to execute

      // 1. Block instantly if known local regex or image blur errors exist
      if (flaggedFields.size > 0) {
        e.preventDefault();
        alert("Form Shield: Please fix the flagged errors before submitting.");
        return;
      }

      // 2. Pause default submission for the holistic LLM review
      e.preventDefault();

      // Extract all form values paired with label context
      const formData = {};
      const formInputs = form.querySelectorAll("input:not([type='hidden']), textarea, select");

      formInputs.forEach((input) => {
        const key = input.name || input.id;
        if (!key) return;

        let labelText = "";
        if (input.id) {
          const labelEl = document.querySelector(`label[for="${input.id}"]`);
          if (labelEl) labelText = labelEl.innerText.trim();
        }

        formData[key] = {
          value: input.value.trim(),
          type: input.type || "text",
          label: labelText
        };
      });

      // Update button text to inform user
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText || submitBtn.value : "Submit";
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.innerText) submitBtn.innerText = "Running AI Review...";
      }

      // Dispatch payload to background.js -> FastAPI /final_review
      chrome.runtime.sendMessage(
        {
          action: "RUN_FINAL_REVIEW",
          payload: {
            user_profile: userProfile || {},
            form_data: formData
          }
        },
        (response) => {
          if (submitBtn) {
            submitBtn.disabled = false;
            if (submitBtn.innerText) submitBtn.innerText = originalText;
          }

          if (chrome.runtime.lastError || !response || !response.success) {
            console.warn("Backend unavailable. Bypassing shield review.");
            isSubmitting = true;
            form.submit();
            return;
          }

          const { is_valid, errors } = response.data;

          if (is_valid) {
            console.log("LLM Approved Form Data. Submitting...");
            isSubmitting = true;
            form.submit();
          } else {
            // Highlight faulty fields identified by LLM
            Object.entries(errors).forEach(([fieldKey, reason]) => {
              const targetInput = form.querySelector(`[name="${fieldKey}"], #${fieldKey}`);
              if (targetInput) {
                setInputFeedback(targetInput, "error", reason);
                flaggedFields.add(targetInput);
              }
            });
            alert("Form Shield: Inconsistencies detected. Please check the highlighted inputs.");
          }
        }
      );
    });
  }

  // =========================================================================
  // 5. VISUAL FEEDBACK INJECTION
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
  // 6. INITIALIZATION & DYNAMIC OBSERVER
  // =========================================================================
  function attachFieldListeners() {
    // Attach Tier 1 blur listeners
    document
      .querySelectorAll("input:not([type='hidden']):not([type='file']):not([type='submit']), textarea, select")
      .forEach((input) => {
        if (input.dataset.shieldBound) return;
        input.dataset.shieldBound = "true";
        input.addEventListener("blur", () => validateLocalField(input));
      });

    // Attach Tier 2 file upload watchers
    setupImageInputs();

    // Attach Tier 3 pre-submit handler
    setupFormInterception();
  }

  async function initializeEngine() {
    if (!shouldExtensionRun()) return;

    // Set extension badge to ON in toolbar
    chrome.runtime.sendMessage({
      action: "SET_STATUS_BADGE",
      text: "ON",
      color: "#2563eb"
    });

    // Retrieve verified install profile
    const stored = await chrome.storage.local.get(["appUser"]);
    userProfile = stored.appUser || null;

    attachFieldListeners();

    // Observe SPA DOM changes (for dynamic forms and modals)
    const observer = new MutationObserver(() => attachFieldListeners());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeEngine);
  } else {
    initializeEngine();
  }
})();