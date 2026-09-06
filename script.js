// ============================================================
// 🛡️ ERROR GUARD - PERSONAL PROFILE script.js
// ============================================================

const form = document.getElementById("personalForm");


// ============================================================
// GET USER DATA FROM FORM
// ============================================================

function getUserData() {

    const data = {};

    const fields = form.querySelectorAll(
        "input, select, textarea"
    );

    fields.forEach(function (field) {

        // Ignore fields without name
        if (!field.name) {
            return;
        }


        // ====================================================
        // FILE INPUT
        // ====================================================

        if (field.type === "file") {

            if (field.files && field.files.length > 0) {

                const file = field.files[0];

                data[field.name] = {

                    fileName: file.name,

                    fileType: file.type,

                    fileSize: file.size,

                    lastModified: file.lastModified

                };

            } else {

                data[field.name] = null;

            }

        }


        // ====================================================
        // NORMAL INPUT
        // ====================================================

        else {

            data[field.name] = field.value.trim();

        }

    });


    // ========================================================
    // SHOW DATA
    // ========================================================

    console.log("================================");
    console.log("🛡️ ERROR GUARD - MY PROFILE");
    console.log("================================");

    console.table(data);


    return data;
}


// ============================================================
// MAKE getUserData() AVAILABLE
// ============================================================

window.getUserData = getUserData;


// ============================================================
// SAVE PROFILE TO CHROME STORAGE
// ============================================================

async function saveProfile() {

    const data = getUserData();


    // Separate normal profile data
    const profile = {};

    // Separate document information
    const documents = {};


    Object.keys(data).forEach(function (key) {

        if (
            typeof data[key] === "object" &&
            data[key] !== null
        ) {

            // File
            documents[key] = data[key];

        } else {

            // Normal field
            profile[key] = data[key];

        }

    });


    // ========================================================
    // SAVE
    // ========================================================

    try {

        await chrome.storage.local.set({

            personalProfile: profile,

            profileDocuments: documents

        });


        console.log(
            "✅ Personal profile saved"
        );

        console.log("👤 Profile:");

        console.table(profile);

        console.log("📄 Documents:");

        console.table(documents);

        alert(
            "✅ Personal Details Saved Successfully!"
        );

    }

    catch (error) {

        console.error(
            "❌ Error saving profile:",
            error
        );

        alert(
            "❌ Failed to save profile."
        );

    }

}


// ============================================================
// SUBMIT
// ============================================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        console.log(
            "🔍 Saving Personal Profile..."
        );


        await saveProfile();

    }
);


// ============================================================
// SHOW CURRENT DATA WHEN FIELD CHANGES
// ============================================================

form.addEventListener(
    "input",
    function (event) {

        console.log(
            "Changed:",
            event.target.name,
            "→",
            event.target.value
        );

    }
);


// ============================================================
// FILE CHANGE
// ============================================================

form.addEventListener(
    "change",
    function (event) {

        const field = event.target;


        if (field.type !== "file") {
            return;
        }


        if (
            !field.files ||
            field.files.length === 0
        ) {

            console.log(
                "⚠️ No file selected"
            );

            return;

        }


        const file = field.files[0];


        console.log(
            "================================"
        );

        console.log(
            "📄 DOCUMENT SELECTED"
        );

        console.log(
            "================================"
        );

        console.log(
            "Field:",
            field.name
        );

        console.log(
            "File name:",
            file.name
        );

        console.log(
            "File type:",
            file.type
        );

        console.log(
            "File size:",
            file.size,
            "bytes"
        );

        console.log(
            "Last modified:",
            new Date(file.lastModified)
        );


        // ====================================================
        // SHOW FILE NAME ON PAGE
        // ====================================================

        let message =
            field.parentElement.querySelector(
                ".file-selected-message"
            );


        if (!message) {

            message =
                document.createElement("small");

            message.className =
                "file-selected-message";

            message.style.display =
                "block";

            message.style.marginTop =
                "6px";

            message.style.color =
                "green";

            field.parentElement.appendChild(
                message
            );

        }


        message.textContent =
            "📄 Selected: " + file.name;

    }
);


// ============================================================
// LOAD SAVED PROFILE
// ============================================================

async function loadProfile() {

    try {

        const result =
            await chrome.storage.local.get([
                "personalProfile",
                "profileDocuments"
            ]);


        const profile =
            result.personalProfile;

        const documents =
            result.profileDocuments;


        // ====================================================
        // NO SAVED PROFILE
        // ====================================================

        if (!profile) {

            console.log(
                "ℹ️ No saved profile found."
            );

            return;

        }


        // ====================================================
        // LOAD NORMAL FIELDS
        // ====================================================

        Object.keys(profile).forEach(
            function (fieldName) {

                const field =
                    form.querySelector(
                        `[name="${CSS.escape(fieldName)}"]`
                    );


                if (!field) {
                    return;
                }


                field.value =
                    profile[fieldName] || "";

            }
        );


        // ====================================================
        // SHOW SAVED DOCUMENT INFORMATION
        // ====================================================

        if (documents) {

            Object.keys(documents).forEach(
                function (documentName) {

                    const documentInfo =
                        documents[documentName];


                    if (!documentInfo) {
                        return;
                    }


                    const fileInput =
                        form.querySelector(
                            `[name="${CSS.escape(documentName)}"]`
                        );


                    if (!fileInput) {
                        return;
                    }


                    let message =
                        fileInput.parentElement.querySelector(
                            ".saved-file-message"
                        );


                    if (!message) {

                        message =
                            document.createElement("small");

                        message.className =
                            "saved-file-message";

                        message.style.display =
                            "block";

                        message.style.marginTop =
                            "6px";

                        message.style.color =
                            "green";

                        fileInput.parentElement.appendChild(
                            message
                        );

                    }


                    message.textContent =
                        "📄 Previously selected: " +
                        documentInfo.fileName;

                }
            );

        }


        console.log(
            "================================"
        );

        console.log(
            "👤 SAVED PROFILE LOADED"
        );

        console.log(
            "================================"
        );

        console.table(profile);

        console.table(documents);

    }

    catch (error) {

        console.error(
            "❌ Error loading profile:",
            error
        );

    }

}


// ============================================================
// START
// ============================================================

loadProfile();


console.log(
    "🛡️ Error Guard Personal Profile ready"
);