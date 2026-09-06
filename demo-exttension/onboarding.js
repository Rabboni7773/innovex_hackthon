// onboarding.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  const statusMsg = document.getElementById("statusMessage");

  // 1. Pre-fill form if user has previously saved data
  chrome.storage.local.get(["appUser"], (result) => {
    if (result.appUser) {
      const u = result.appUser;
      document.getElementById("firstName").value = u.first_name || "";
      document.getElementById("middleName").value = u.middle_name || "";
      document.getElementById("lastName").value = u.last_name || "";
      document.getElementById("email").value = u.email || "";
      document.getElementById("phone").value = u.phone || "";
      document.getElementById("street").value = u.address?.street || "";
      document.getElementById("city").value = u.address?.city || "";
      document.getElementById("state").value = u.address?.state || "";
      document.getElementById("zip").value = u.address?.zip || "";
    }
  });

  // 2. Handle submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const middleName = document.getElementById("middleName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();

    // Assemble unified profile structure
    const userData = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      full_name: [firstName, middleName, lastName].filter(Boolean).join(" "),
      email: document.getElementById("email").value.trim().toLowerCase(),
      phone: document.getElementById("phone").value.trim(),
      address: {
        street: document.getElementById("street").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim().toUpperCase(),
        zip: document.getElementById("zip").value.trim()
      },
      updated_at: new Date().toISOString()
    };

    // 3. Save into non-volatile chrome.storage.local
    chrome.storage.local.set({ appUser: userData }, () => {
      if (chrome.runtime.lastError) {
        showStatus(`Failed to save: ${chrome.runtime.lastError.message}`, "error");
        return;
      }

      showStatus("Profile saved successfully! You can now close this tab.", "success");

      // Optional: Auto-close the tab after 1.5 seconds
      setTimeout(() => {
        window.close();
      }, 1500);
    });
  });

  function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = type === "success" ? "status-success" : "status-error";
    statusMsg.style.display = "block";
  }
});