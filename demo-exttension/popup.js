// popup.js

document.addEventListener("DOMContentLoaded", async () => {
  const userStatus = document.getElementById("userStatus");
  const editBtn = document.getElementById("editProfileBtn");

  // 1. Read stored profile to display who is active
  const { appUser } = await chrome.storage.local.get(["appUser"]);

  if (appUser && appUser.full_name) {
    userStatus.innerHTML = `Active profile:<br><span class="user-name">${appUser.full_name}</span>`;
  } else {
    userStatus.textContent = "No profile configured yet.";
  }

  // 2. Dispatch message to background.js when button is clicked
  editBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "OPEN_ONBOARDING" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Failed to contact background:", chrome.runtime.lastError.message);
        return;
      }
      
      // Close the small popup window after launching the new tab
      window.close();
    });
  });
});