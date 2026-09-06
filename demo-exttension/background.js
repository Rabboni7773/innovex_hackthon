// background.js - Manifest V3 Background Service Worker

const BACKEND_BASE_URL = "http://127.0.0.1:8000";

// =========================================================================
// 1. LIFECYCLE: FIRST-TIME INSTALL & ONBOARDING TRIGGER
// =========================================================================
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("[Background] First-time install detected. Opening onboarding...");

    const { appUser } = await chrome.storage.local.get(["appUser"]);
    if (!appUser) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("onboarding.html")
      });
    }
  } else if (details.reason === "update") {
    console.log("[Background] Extension updated.");
  }
});

// =========================================================================
// 2. MESSAGE ROUTER: DISPATCHING CONTENT & POPUP REQUESTS
// =========================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // A. Trigger onboarding manually (from popup.js "Edit Profile" button)
  if (message.action === "OPEN_ONBOARDING") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("onboarding.html")
    });
    sendResponse({ success: true });
    return false;
  }

  // B. Update extension icon badge
  if (message.action === "SET_STATUS_BADGE") {
    if (sender.tab?.id) {
      chrome.action.setBadgeText({ tabId: sender.tab.id, text: message.text || "" });
      chrome.action.setBadgeBackgroundColor({
        tabId: sender.tab.id,
        color: message.color || "#2563eb"
      });
    }
    sendResponse({ success: true });
    return false;
  }

  // C. Route Image Blur Check to OpenCV backend (/check-blur)
  if (message.action === "EVALUATE_IMAGE_BLUR") {
    forwardToBackend("/check-blur", message.payload, sendResponse);
    return true; // Crucial: Keeps port open for asynchronous fetch
  }

  // D. Route Pre-Submit Batch Check to LLM backend (/final_review)
  if (message.action === "RUN_FINAL_REVIEW") {
    forwardToBackend("/final_review", message.payload, sendResponse);
    return true; // Crucial: Keeps port open for asynchronous fetch
  }

  return false;
});

// =========================================================================
// 3. NETWORK HELPER: POST TO FASTAPI BACKEND
// =========================================================================
async function forwardToBackend(endpoint, bodyData, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    sendResponse({ success: true, data });
  } catch (error) {
    console.error(`[Background] Error forwarding to ${endpoint}:`, error);
    sendResponse({
      success: false,
      error: error.message || "Failed to communicate with FastAPI backend"
    });
  }
}