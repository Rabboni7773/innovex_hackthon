// content.js - Bilingual Form Shield Engine (English Default + Preferred Sub-text)

(() => {
  let userProfile = null;
  let uploadedDocumentText = "";
  const flaggedFields = new Set();
  let isSubmitting = false;
  let observer = null;

  // =========================================================================
  // 1. MULTILINGUAL DICTIONARY
  // =========================================================================
  const I18N_MESSAGES = {
    en: {
      fix: "Fix",
      emailInvalid: "Invalid email format.",
      emailTypo: "Common domain typo detected.",
      phonePrefix: "Country code prefix (+91) not needed.",
      phoneLeadingZero: "Leading zero not needed.",
      phoneDigits: "Phone number must be exactly 10 digits.",
      pinDigits: "PIN Code must be a 6-digit number.",
      ifscZero: "IFSC 5th character must be '0' (zero), not 'O'.",
      ifscCase: "IFSC codes should be uppercase.",
      ifscInvalid: "Invalid IFSC Code format (e.g., SBIN0001234).",
      scoreRange: "Score must be between 0 and 100.",
      differsEmail: "Differs from profile",
      differsPhone: "Differs from profile phone",
      differsName: "Differs from profile name:",
      differsPin: "Differs from profile PIN",
      requiredField: "This field is required.",
      docScanMissingId: "ID not detected in your uploaded document scan.",
      docScanMissingName: "Name does not match the text found on your document scan.",
      uploadRequired: "Please upload the required document.",
      unsupportedFormat: "Invalid file format. Please upload an image (JPG/PNG).",
      fileTooLarge: "File size exceeds portal limit of 2 MB.",
      analyzingDoc: "Analyzing sharpness, crop, and document text...",
      serverUnreachable: "Document inspection server unreachable.",
      issuesDetected: "issue(s) detected. Please fix flagged items.",
      inProgress: "Application in progress",
      remaining: "remaining",
      readyToSubmit: "All format and document checks passed. Ready to submit!",
      resolveAlert: "Form Shield: Please resolve all flagged issues before submitting."
    },
    te: {
      fix: "సరిదిద్దు",
      emailInvalid: "చెల్లని ఈమెయిల్ ఫార్మాట్.",
      emailTypo: "ఈమెయిల్ డొమైన్‌లో అక్షర దోషం ఉంది.",
      phonePrefix: "+91 దేశం కోడ్ అవసరం లేదు.",
      phoneLeadingZero: "మొదటి సున్నా (0) అవసరం లేదు.",
      phoneDigits: "ఫోన్ నంబర్ ఖచ్చితంగా 10 అంకెలు ఉండాలి.",
      pinDigits: "పిన్ కోడ్ 6 అంకెల సంఖ్య అయి ఉండాలి.",
      ifscZero: "IFSC లో 5వ అక్షరం '0' (సున్నా) ఉండాలి, 'O' కాదు.",
      ifscCase: "IFSC కోడ్ క్యాపిటల్ లెటర్లలో ఉండాలి.",
      ifscInvalid: "చెల్లని IFSC కోడ్ ఫార్మాట్ (ఉదా. SBIN0001234).",
      scoreRange: "స్కోర్ 0 మరియు 100 మధ్య ఉండాలి.",
      differsEmail: "సేవ్ చేసిన ప్రొఫైల్ ఈమెయిల్‌తో సరిపోలడం లేదు",
      differsPhone: "ప్రొఫైల్ ఫోన్ నంబర్‌తో సరిపోలడం లేదు",
      differsName: "ప్రొఫైల్ పేరుతో సరిపోలడం లేదు:",
      differsPin: "ప్రొఫైల్ పిన్ కోడ్‌తో సరిపోలడం లేదు",
      requiredField: "ఈ వివరాలు నమోదు చేయడం తప్పనిసరి.",
      docScanMissingId: "అప్‌లోడ్ చేసిన సర్టిఫికెట్‌లో ఐడీ కనిపించలేదు.",
      docScanMissingName: "అప్‌లోడ్ చేసిన పత్రంలోని పేరుతో సరిపోలడం లేదు.",
      uploadRequired: "దయచేసి అవసరమైన పత్రాన్ని అప్‌లోడ్ చేయండి.",
      unsupportedFormat: "చెల్లని ఫైల్. దయచేసి ఇమేజ్ (JPG/PNG) అప్‌లోడ్ చేయండి.",
      fileTooLarge: "ఫైల్ పరిమాణం 2 MB కంటే ఎక్కువ ఉండకూడదు.",
      analyzingDoc: "నాణ్యత మరియు పత్ర వివరాలను తనిఖీ చేస్తోంది...",
      serverUnreachable: "డాక్యుమెంట్ వెరిఫికేషన్ సర్వర్ స్పందించడం లేదు.",
      issuesDetected: "సమస్యలు గుర్తించబడ్డాయి. దయచేసి సరిదిద్దండి.",
      inProgress: "దరఖాస్తు ప్రక్రియలో ఉంది",
      remaining: "మిగిలి ఉన్నాయి",
      readyToSubmit: "అన్ని వివరాలు సరైనవి. సబ్మిట్ చేయడానికి సిద్ధంగా ఉంది!",
      resolveAlert: "ఫారమ్ షీల్డ్: దయచేసి సబ్మిట్ చేయడానికి ముందు గుర్తించిన సమస్యలను సరిదిద్దండి."
    },
    hi: {
      fix: "सुधारें",
      emailInvalid: "अमान्य ईमेल प्रारूप।",
      emailTypo: "ईमेल डोमेन में त्रुटि है।",
      phonePrefix: "देश कोड (+91) की आवश्यकता नहीं है।",
      phoneLeadingZero: "शुरुआती शून्य (0) की आवश्यकता नहीं है।",
      phoneDigits: "फ़ोन नंबर ठीक 10 अंकों का होना चाहिए।",
      pinDigits: "पिन कोड 6 अंकों का होना चाहिए।",
      ifscZero: "IFSC में 5वां अक्षर '0' (शून्य) होना चाहिए, 'O' नहीं।",
      ifscCase: "IFSC कोड बड़े अक्षरों (Uppercase) में होना चाहिए।",
      ifscInvalid: "अमान्य IFSC कोड प्रारूप (उदा. SBIN0001234)।",
      scoreRange: "अंक 0 से 100 के बीच होने चाहिए।",
      differsEmail: "सहेजे गए प्रोफ़ाइल ईमेल से भिन्न है",
      differsPhone: "प्रोफ़ाइल फ़ोन नंबर से भिन्न है",
      differsName: "प्रोफ़ाइल नाम से भिन्न है:",
      differsPin: "प्रोफ़ाइल पिन कोड से भिन्न है",
      requiredField: "यह फ़ील्ड भरना अनिवार्य है।",
      docScanMissingId: "अपलोड किए गए दस्तावेज़ में आईडी नहीं मिली।",
      docScanMissingName: "अपलोड किए गए दस्तावेज़ के नाम से मेल नहीं खाता।",
      uploadRequired: "कृपया आवश्यक दस्तावेज़ अपलोड करें।",
      unsupportedFormat: "अमान्य फ़ाइल। कृपया इमेज (JPG/PNG) अपलोड करें।",
      fileTooLarge: "फ़ाइल का आकार 2 MB से अधिक है।",
      analyzingDoc: "दस्तावेज़ की स्पष्टता और पाठ की जाँच की जा रही है...",
      serverUnreachable: "दस्तावेज़ सत्यापन सर्वर अनुपलब्ध है।",
      issuesDetected: "त्रुटियाँ पाई गईं। कृपया सुधार करें।",
      inProgress: "आवेदन जारी है",
      remaining: "शेष हैं",
      readyToSubmit: "सभी जाँच सफल रहीं। सबमिट करने के लिए तैयार!",
      resolveAlert: "फॉर्म शील्ड: सबमिट करने से पहले कृपया सभी समस्याओं को हल करें।"
    }
  };

  // Helper: Returns { en: "...", pref: "..." }
  function getBilingualText(key) {
    const enText = I18N_MESSAGES["en"][key] || key;
    const prefLang = userProfile?.preferredLanguage || "en";
    const prefText = prefLang !== "en" && I18N_MESSAGES[prefLang]?.[key] ? I18N_MESSAGES[prefLang][key] : null;
    return { en: enText, pref: prefText };
  }

  function debounce(fn, delay = 400) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

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
  // 2. DYNAMIC BILINGUAL "READY TO SUBMIT" INDICATOR BANNER
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
        flex-direction: column;
        gap: 3px;
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

    const renderBannerText = (primaryHtml, secondaryText) => `
      <div>${primaryHtml}</div>
      ${secondaryText ? `<div style="font-size: 12px; font-weight: 400; opacity: 0.9; margin-left: 24px;">${secondaryText}</div>` : ""}
    `;

    if (flaggedFields.size > 0) {
      const msg = getBilingualText("issuesDetected");
      indicator.style.background = "#fef2f2";
      indicator.style.border = "1px solid #ef4444";
      indicator.style.color = "#b91c1c";
      indicator.innerHTML = renderBannerText(
        `⚠️ <b>Error Guard:</b> ${flaggedFields.size} ${msg.en}`,
        msg.pref ? `${flaggedFields.size} ${msg.pref}` : null
      );
    } else if (emptyRequiredCount > 0) {
      const prog = getBilingualText("inProgress");
      const rem = getBilingualText("remaining");
      indicator.style.background = "#fffbeb";
      indicator.style.border = "1px solid #f59e0b";
      indicator.style.color = "#b45309";
      indicator.innerHTML = renderBannerText(
        `⏳ <b>Error Guard:</b> ${prog.en} (${emptyRequiredCount} ${rem.en}).`,
        prog.pref ? `${prog.pref} (${emptyRequiredCount} ${rem.pref}).` : null
      );
    } else {
      const rdy = getBilingualText("readyToSubmit");
      indicator.style.background = "#f0fdf4";
      indicator.style.border = "1px solid #22c55e";
      indicator.style.color = "#15803d";
      indicator.innerHTML = renderBannerText(
        `🛡️ <b>Error Guard:</b> ${rdy.en}`,
        rdy.pref
      );
    }
  }

  // =========================================================================
  // 3. DOCUMENT OCR CROSS-CHECK
  // =========================================================================
  function verifyAgainstUploadedDocument(fieldKey, value) {
    if (!uploadedDocumentText) return null;
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanValue.length < 2) return null;

    const cleanOcr = uploadedDocumentText.replace(/[^a-z0-9]/g, "");

    if (
      fieldKey.includes("studentid") ||
      fieldKey.includes("roll") ||
      fieldKey.includes("registration") ||
      fieldKey.includes("reg")
    ) {
      if (!cleanOcr.includes(cleanValue)) {
        const msg = getBilingualText("docScanMissingId");
        return {
          en: `${msg.en} ("${value}")`,
          pref: msg.pref ? `${msg.pref} ("${value}")` : null
        };
      }
    }

    const isPersonalName = fieldKey === "fullname" || fieldKey === "name" || fieldKey.includes("studentname");
    if (isPersonalName) {
      const parts = value.toLowerCase().split(/\s+/).filter((p) => p.length >= 2);
      const matches = parts.filter((p) => uploadedDocumentText.includes(p));
      if (parts.length > 0 && matches.length === 0) {
        const msg = getBilingualText("docScanMissingName");
        return {
          en: `${msg.en} ("${value}")`,
          pref: msg.pref ? `${msg.pref} ("${value}")` : null
        };
      }
    }

    return null;
  }

  // =========================================================================
  // 4. DETERMINISTIC VALIDATION WITH BILINGUAL PACKAGES
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

    let errorObj = null; // format: { en: "...", pref: "..." }
    let suggestedFix = null;

    // --- A. Email Typos & Format ---
    if (type === "email" || name.includes("email")) {
      const domainCorrections = {
        "@gmial.com": "@gmail.com",
        "@gmai.com": "@gmail.com",
        "@gamil.com": "@gmail.com",
        "@yaho.com": "@yahoo.com",
        "@outlok.com": "@outlook.com",
        ".con": ".com",
        ".cmo": ".com"
      };

      let fixedVal = val;
      for (const [typo, fix] of Object.entries(domainCorrections)) {
        if (fixedVal.toLowerCase().includes(typo)) {
          fixedVal = fixedVal.replace(new RegExp(typo, "i"), fix);
          suggestedFix = fixedVal;
          errorObj = getBilingualText("emailTypo");
          break;
        }
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!errorObj && !emailPattern.test(val)) {
        errorObj = getBilingualText("emailInvalid");
      }
    }

    // --- B. Mobile Number Formatting ---
    else if (type === "tel" || name.includes("phone") || name.includes("mobile")) {
      const phoneDigits = val.replace(/\D/g, "");
      if (phoneDigits.length === 12 && phoneDigits.startsWith("91")) {
        suggestedFix = phoneDigits.slice(2);
        errorObj = getBilingualText("phonePrefix");
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith("0")) {
        suggestedFix = phoneDigits.slice(1);
        errorObj = getBilingualText("phoneLeadingZero");
      } else if (phoneDigits.length !== 10) {
        errorObj = getBilingualText("phoneDigits");
      }
    }

    // --- C. PIN Code (6 digits) ---
    else if (name.includes("pincode") || name.includes("zip") || name.includes("postal")) {
      const pinDigits = val.replace(/\D/g, "");
      if (pinDigits.length !== 6) {
        errorObj = getBilingualText("pinDigits");
      }
    }

    // --- D. IFSC Code Checks ---
    else if (name.includes("ifsc")) {
      let cleaned = val.toUpperCase().trim();
      if (cleaned.length === 11 && cleaned[4] === "O") {
        cleaned = cleaned.slice(0, 4) + "0" + cleaned.slice(5);
        suggestedFix = cleaned;
        errorObj = getBilingualText("ifscZero");
      } else if (val !== cleaned) {
        suggestedFix = cleaned;
        errorObj = getBilingualText("ifscCase");
      }

      const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!errorObj && !ifscPattern.test(cleaned)) {
        errorObj = getBilingualText("ifscInvalid");
      }
    }

    // --- E. Score / Percentage Checks ---
    else if (name.includes("cgpa") || name.includes("percentage")) {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 100) {
        errorObj = getBilingualText("scoreRange");
      }
    }

    // --- F. Profile Cross-Checks ---
    if (!errorObj && userProfile) {
      if ((type === "email" || name.includes("email")) && userProfile.email) {
        if (val.toLowerCase() !== userProfile.email.toLowerCase()) {
          const valDomain = val.split("@")[1];
          const profDomain = userProfile.email.split("@")[1];
          if (valDomain === profDomain) {
            const msg = getBilingualText("differsEmail");
            errorObj = {
              en: `${msg.en} (${userProfile.email})`,
              pref: msg.pref ? `${msg.pref} (${userProfile.email})` : null
            };
            suggestedFix = userProfile.email;
          }
        }
      }

      if ((type === "tel" || name.includes("phone")) && userProfile.phone) {
        const cleanEntered = val.replace(/\D/g, "");
        const cleanProfile = userProfile.phone.replace(/\D/g, "");
        if (cleanEntered && cleanProfile && cleanEntered !== cleanProfile) {
          const msg = getBilingualText("differsPhone");
          errorObj = {
            en: `${msg.en} (${userProfile.phone})`,
            pref: msg.pref ? `${msg.pref} (${userProfile.phone})` : null
          };
          suggestedFix = userProfile.phone;
        }
      }

      const isPersonalName = name === "fullname" || name === "name" || name.includes("studentname");
      const storedName = userProfile.fullName || userProfile.full_name;
      if (isPersonalName && storedName) {
        if (val.toLowerCase() !== storedName.toLowerCase()) {
          const msg = getBilingualText("differsName");
          errorObj = {
            en: `${msg.en} ${storedName}`,
            pref: msg.pref ? `${msg.pref} ${storedName}` : null
          };
          suggestedFix = storedName;
        }
      }

      if (name.includes("pincode") && (userProfile.pincode || userProfile.address?.zip)) {
        const storedPin = userProfile.pincode || userProfile.address.zip;
        if (val !== storedPin) {
          const msg = getBilingualText("differsPin");
          errorObj = {
            en: `${msg.en} (${storedPin})`,
            pref: msg.pref ? `${msg.pref} (${storedPin})` : null
          };
          suggestedFix = storedPin;
        }
      }
    }

    // --- G. Document OCR Cross-Verification ---
    if (!errorObj) {
      const docErr = verifyAgainstUploadedDocument(name, val);
      if (docErr) errorObj = docErr;
    }

    // Render Feedback
    if (errorObj) {
      flaggedFields.add(input);
      setInputFeedback(input, "error", errorObj, suggestedFix);
    } else {
      flaggedFields.delete(input);
      setInputFeedback(input, "valid");
    }

    updateReadyToSubmitIndicator(input.form);
  }

  // =========================================================================
  // 5. INLINE FEEDBACK: ENGLISH TOP, PREFERRED LANGUAGE BELOW
  // =========================================================================
  function setInputFeedback(input, status, messageObj = null, suggestedFix = null) {
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
      badge.style.cssText = "display: flex; flex-direction: column; gap: 4px; margin-top: 5px; font-family: sans-serif;";

      // Top row: English Error Message + Fix Button
      const topRow = document.createElement("div");
      topRow.style.cssText = "display: flex; align-items: center; flex-wrap: wrap; gap: 8px;";

      const textSpanEn = document.createElement("span");
      textSpanEn.style.cssText = "color: #dc2626; font-size: 11px; font-weight: 600;";
      textSpanEn.textContent = `⚠️ ${messageObj.en || messageObj}`;
      topRow.appendChild(textSpanEn);

      if (suggestedFix) {
        const fixLabels = getBilingualText("fix");
        const fixBtn = document.createElement("button");
        fixBtn.type = "button";
        fixBtn.className = "shield-fix-btn";
        // Shows English fix button label, with secondary language if selected
        fixBtn.textContent = fixLabels.pref
          ? `${fixLabels.en} / ${fixLabels.pref}: "${suggestedFix}"`
          : `${fixLabels.en}: "${suggestedFix}"`;

        fixBtn.style.cssText = `
          background-color: #eff6ff;
          color: #2563eb;
          border: 1px solid #93c5fd;
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        `;

        fixBtn.addEventListener("mouseover", () => (fixBtn.style.background = "#dbeafe"));
        fixBtn.addEventListener("mouseout", () => (fixBtn.style.background = "#eff6ff"));

        fixBtn.addEventListener("click", (e) => {
          e.preventDefault();
          input.value = suggestedFix;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          validateLocalField(input);
        });

        topRow.appendChild(fixBtn);
      }
      badge.appendChild(topRow);

      // Bottom row: Preferred Language translation rendered below English
      if (messageObj.pref) {
        const bottomRow = document.createElement("div");
        bottomRow.style.cssText = "color: #991b1b; font-size: 11px; font-weight: 500; margin-left: 18px;";
        bottomRow.textContent = messageObj.pref;
        badge.appendChild(bottomRow);
      }

    } else if (status === "loading") {
      badge.textContent = `⏳ ${messageObj.en || messageObj}`;
      badge.style.cssText = "color: #d97706; font-size: 11px; font-weight: 600; margin-top: 4px; font-family: sans-serif;";
    } else if (status === "valid") {
      input.style.border = "2px solid #16a34a";
      if (messageObj) {
        badge.textContent = `✅ ${messageObj.en || messageObj}`;
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
  // 6. FILE UPLOAD & BACKGROUND INSPECTION
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
          setInputFeedback(fileInput, "error", getBilingualText("unsupportedFormat"));
          flaggedFields.add(fileInput);
          updateReadyToSubmitIndicator(fileInput.form);
          return;
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 2.0) {
          const msg = getBilingualText("fileTooLarge");
          setInputFeedback(fileInput, "error", {
            en: `${msg.en} (${sizeMB.toFixed(2)} MB)`,
            pref: msg.pref ? `${msg.pref} (${sizeMB.toFixed(2)} MB)` : null
          });
          flaggedFields.add(fileInput);
          updateReadyToSubmitIndicator(fileInput.form);
          return;
        }

        setInputFeedback(fileInput, "loading", getBilingualText("analyzingDoc"));

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
                setInputFeedback(fileInput, "error", getBilingualText("serverUnreachable"));
                return;
              }

              const { is_clear, reason, extracted_text } = response.data;
              if (is_clear) {
                setInputFeedback(fileInput, "valid", { en: reason, pref: null });
                flaggedFields.delete(fileInput);
                uploadedDocumentText = (extracted_text || "").toLowerCase();

                const docTargetSelector = [
                  'input[name*="student" i]',
                  'input[name*="roll" i]',
                  'input[name*="reg" i]',
                  'input[name*="name" i]',
                  'input[id*="student" i]',
                  'input[id*="roll" i]',
                  'input[id*="reg" i]'
                ].join(", ");

                document.querySelectorAll(docTargetSelector).forEach((f) => {
                  if (f.value.trim()) validateLocalField(f);
                });
              } else {
                uploadedDocumentText = "";
                setInputFeedback(fileInput, "error", { en: reason, pref: null });
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
  // 7. PRE-SUBMIT INTERCEPTION
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
          setInputFeedback(input, "error", getBilingualText("requiredField"));
        } else {
          validateLocalField(input);
        }
      });

      const fileInputs = form.querySelectorAll("input[type='file'][required]");
      fileInputs.forEach((fileInput) => {
        if (!fileInput.files || fileInput.files.length === 0) {
          flaggedFields.add(fileInput);
          setInputFeedback(fileInput, "error", getBilingualText("uploadRequired"));
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
        const alertMsg = getBilingualText("resolveAlert");
        alert(alertMsg.pref ? `${alertMsg.en}\n${alertMsg.pref}` : alertMsg.en);
        return;
      }

      console.log("Form Shield: All validations and document checks passed!");
      isSubmitting = true;
    });
  }

  // =========================================================================
  // 8. INITIALIZATION & LIVE OBSERVER
  // =========================================================================
  function attachFieldListeners() {
    document
      .querySelectorAll(
        "input:not([type='hidden']):not([type='file']):not([type='submit']):not([type='checkbox']), textarea, select"
      )
      .forEach((input) => {
        if (input.dataset.shieldBound) return;
        input.dataset.shieldBound = "true";

        const debouncedValidate = debounce(() => {
          validateLocalField(input);
        }, 400);

        input.addEventListener("blur", () => {
          validateLocalField(input);
        });

        input.addEventListener("input", () => {
          const val = input.value.trim();
          const name = (input.name || input.id || "").toLowerCase();

          if (!val) {
            clearInputFeedback(input);
            flaggedFields.delete(input);
            updateReadyToSubmitIndicator(input.form);
            return;
          }

          if (flaggedFields.has(input)) {
            clearInputFeedback(input);
            flaggedFields.delete(input);
          }

          const isPhone = input.type === "tel" || name.includes("phone") || name.includes("mobile");
          const isPin = name.includes("pincode") || name.includes("zip") || name.includes("postal");
          const isIfsc = name.includes("ifsc");

          const cleanDigits = val.replace(/\D/g, "");
          if (
            (isPhone && cleanDigits.length === 10) ||
            (isPin && cleanDigits.length === 6) ||
            (isIfsc && val.length === 11)
          ) {
            validateLocalField(input);
            return;
          }

          debouncedValidate();
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