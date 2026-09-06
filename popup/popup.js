document.addEventListener("DOMContentLoaded", () => {

    const currentPage =
        document.getElementById("currentPage");

    const scanButton =
        document.getElementById("scanButton");

    const clearButton =
        document.getElementById("clearButton");

    const documentsChecked =
        document.getElementById("documentsChecked");

    const passed =
        document.getElementById("passed");

    const errors =
        document.getElementById("errors");

    const readyTitle =
        document.getElementById("readyTitle");

    const readyMessage =
        document.getElementById("readyMessage");

    const readyIcon =
        document.getElementById("readyIcon");


    /*
     * Get current tab
     */

    chrome.tabs.query(
        {
            active: true,
            currentWindow: true
        },

        (tabs) => {

            if (tabs.length === 0) {
                currentPage.textContent =
                    "No active page";
                return;
            }

            const url = tabs[0].url;

            currentPage.textContent =
                url || "Unknown page";

        }
    );


    /*
     * Scan button
     */

    scanButton.addEventListener(
        "click",
        async () => {

            readyTitle.textContent =
                "Scanning...";

            readyMessage.textContent =
                "Checking the current page.";

            readyIcon.textContent = "🔍";


            chrome.tabs.query(
                {
                    active: true,
                    currentWindow: true
                },

                (tabs) => {

                    if (!tabs.length) {
                        return;
                    }

                    chrome.tabs.sendMessage(
                        tabs[0].id,

                        {
                            type: "SCAN_PAGE"
                        },

                        (response) => {

                            if (
                                chrome.runtime.lastError
                            ) {

                                console.log(
                                    chrome.runtime
                                        .lastError
                                        .message
                                );

                                readyTitle.textContent =
                                    "Page cannot be scanned";

                                readyMessage.textContent =
                                    "Open a normal webpage and try again.";

                                readyIcon.textContent =
                                    "⚠️";

                                return;
                            }


                            if (!response) {
                                return;
                            }


                            /*
                             * Update results
                             */

                            documentsChecked.textContent =
                                response.documents || 0;

                            passed.textContent =
                                response.passed || 0;

                            errors.textContent =
                                response.errors || 0;


                            if (response.errors > 0) {

                                readyTitle.textContent =
                                    "Errors Found";

                                readyMessage.textContent =
                                    "Please fix the highlighted errors.";

                                readyIcon.textContent =
                                    "❌";

                            }

                            else {

                                readyTitle.textContent =
                                    "Ready to Submit";

                                readyMessage.textContent =
                                    "All current checks passed.";

                                readyIcon.textContent =
                                    "✅";

                            }

                        }
                    );

                }
            );

        }
    );


    /*
     * Clear button
     */

    clearButton.addEventListener(
        "click",
        () => {

            documentsChecked.textContent = "0";

            passed.textContent = "0";

            errors.textContent = "0";


            readyTitle.textContent =
                "Ready to Check";

            readyMessage.textContent =
                "Fill the form and upload your document.";

            readyIcon.textContent =
                "✓";

        }
    );

});