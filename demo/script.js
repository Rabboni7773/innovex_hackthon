const form = document.getElementById("personalForm");


// ==========================================
// GET USER DATA FROM YOUR FORM DOM
// ==========================================

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

        // File input
        if (field.type === "file") {

            if (field.files.length > 0) {

                const file = field.files[0];

                data[field.name] = {
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size
                };

            } else {

                data[field.name] = "No file selected";

            }

        }

        // Normal fields
        else {

            data[field.name] = field.value;

        }

    });


    console.log("================================");
    console.log("📋 MY FORM DATA");
    console.log("================================");

    console.table(data);

    return data;
}


// ==========================================
// MAKE getUserData() AVAILABLE IN CONSOLE
// ==========================================

window.getUserData = getUserData;


// ==========================================
// SUBMIT
// ==========================================

form.addEventListener("submit", function (event) {

    event.preventDefault();

    console.log("✅ Form submitted");

    getUserData();

});


// ==========================================
// SHOW CURRENT DATA WHEN FIELD CHANGES
// ==========================================

form.addEventListener("input", function (event) {

    console.log(
        "Changed:",
        event.target.name,
        "→",
        event.target.value
    );

});


// ==========================================
// FILE CHANGE
// ==========================================

form.addEventListener("change", function (event) {

    if (event.target.type === "file") {

        console.log(
            "📄 File selected:",
            event.target.files[0]
        );

    }

});