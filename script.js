// ============================================================
// SCHOLARSHIP APPLICATION - script.js
// ============================================================

const form = document.getElementById("scholarshipForm");
const submitButton = document.getElementById("submitButton");


// ============================================================
// 1. GET USER FORM DATA DIRECTLY FROM THE FORM
// ============================================================

function getUserData() {

    const formData = new FormData(form);

    const data = {};

    formData.forEach((value, key) => {

        // Files are handled separately
        if (value instanceof File) {
            return;
        }

        data[key] = value;
    });

    return data;
}


// ============================================================
// 2. GET UPLOADED DOCUMENTS DIRECTLY FROM THE FORM
// ============================================================

function getUploadedDocuments() {

    const fileInputs =
        form.querySelectorAll('input[type="file"]');

    const documents = [];

    fileInputs.forEach(input => {

        const file = input.files[0];

        if (file) {

            documents.push({

                fieldName: input.name,

                fileName: file.name,

                fileType: file.type,

                fileSize: file.size,

                file: file

            });
        }
    });

    return documents;
}


// ============================================================
// 3. DISPLAY USER DATA IN CONSOLE
// ============================================================

function displayUserData() {

    const userData = getUserData();

    console.log("=================================");
    console.log("USER FORM DATA");
    console.log("=================================");

    console.log(userData);


    const documents =
        getUploadedDocuments();

    console.log("=================================");
    console.log("UPLOADED DOCUMENTS");
    console.log("=================================");

    documents.forEach(document => {

        console.log({
            fieldName: document.fieldName,
            fileName: document.fileName,
            fileType: document.fileType,
            fileSize: document.fileSize
        });

    });
}


// ============================================================
// 4. BASIC FORM VALIDATION
// ============================================================

function validateForm() {

    const errors = [];

    const userData = getUserData();


    // --------------------------------------------------------
    // PERSONAL DETAILS
    // --------------------------------------------------------

    if (!userData.fullName?.trim()) {
        errors.push("Full Name is required.");
    }

    if (!userData.dob) {
        errors.push("Date of Birth is required.");
    }

    if (!userData.gender) {
        errors.push("Gender is required.");
    }

    if (!userData.category) {
        errors.push("Category is required.");
    }

    if (!userData.nationality?.trim()) {
        errors.push("Nationality is required.");
    }

    if (!userData.studentId?.trim()) {
        errors.push("Student ID is required.");
    }


    // --------------------------------------------------------
    // CONTACT DETAILS
    // --------------------------------------------------------

    if (!userData.email?.trim()) {
        errors.push("Email Address is required.");
    }

    if (!userData.phone?.trim()) {
        errors.push("Mobile Number is required.");
    }


    // --------------------------------------------------------
    // ACADEMIC DETAILS
    // --------------------------------------------------------

    if (!userData.college?.trim()) {
        errors.push("College / University is required.");
    }

    if (!userData.course) {
        errors.push("Course is required.");
    }

    if (!userData.branch?.trim()) {
        errors.push("Branch is required.");
    }

    if (!userData.year) {
        errors.push("Current Year is required.");
    }

    if (!userData.semester) {
        errors.push("Current Semester is required.");
    }

    if (!userData.rollNumber?.trim()) {
        errors.push("Roll Number is required.");
    }

    if (!userData.registrationNumber?.trim()) {
        errors.push("Registration Number is required.");
    }


    // --------------------------------------------------------
    // FAMILY DETAILS
    // --------------------------------------------------------

    if (!userData.fatherName?.trim()) {
        errors.push("Father / Guardian Name is required.");
    }

    if (!userData.occupation?.trim()) {
        errors.push("Parent / Guardian Occupation is required.");
    }

    if (!userData.annualIncome) {
        errors.push("Annual Family Income is required.");
    }

    if (!userData.familyMembers) {
        errors.push("Number of Family Members is required.");
    }


    // --------------------------------------------------------
    // ADDRESS DETAILS
    // --------------------------------------------------------

    if (!userData.address?.trim()) {
        errors.push("Address is required.");
    }

    if (!userData.city?.trim()) {
        errors.push("Village / Town / City is required.");
    }

    if (!userData.district?.trim()) {
        errors.push("District is required.");
    }

    if (!userData.state) {
        errors.push("State is required.");
    }

    if (!userData.pincode?.trim()) {
        errors.push("PIN Code is required.");
    }


    // --------------------------------------------------------
    // BANK DETAILS
    // --------------------------------------------------------

    if (!userData.accountHolder?.trim()) {
        errors.push("Account Holder Name is required.");
    }

    if (!userData.bankName?.trim()) {
        errors.push("Bank Name is required.");
    }

    if (!userData.accountNumber?.trim()) {
        errors.push("Account Number is required.");
    }

    if (!userData.ifsc?.trim()) {
        errors.push("IFSC Code is required.");
    }


    // --------------------------------------------------------
    // SCHOLARSHIP DETAILS
    // --------------------------------------------------------

    if (!userData.scholarshipType) {
        errors.push("Scholarship Type is required.");
    }

    if (!userData.applicationYear) {
        errors.push("Application Year is required.");
    }

    if (!userData.reason?.trim()) {
        errors.push("Reason for Applying is required.");
    }


    return errors;
}

//
// ============================================================
// 5. VALIDATE UPLOADED FILES
// ============================================================

function validateDocuments() {

    const errors = [];

    const fileInputs =
        form.querySelectorAll('input[type="file"]');


    fileInputs.forEach(input => {

        const file = input.files[0];


        // ----------------------------------------------------
        // REQUIRED FILE
        // ----------------------------------------------------

        if (input.required && !file) {

            errors.push(
                `${getLabel(input)} is required.`
            );

            return;
        }


        // Optional file
        if (!file) {
            return;
        }


        // ----------------------------------------------------
        // FILE TYPE
        // ----------------------------------------------------

        const allowedTypes = [

            "application/pdf",

            "image/jpeg",

            "image/png"

        ];


        if (!allowedTypes.includes(file.type)) {

            errors.push(
                `${file.name}: Invalid file format.`
            );
        }


        // ----------------------------------------------------
        // FILE SIZE
        // ----------------------------------------------------

        let maxSize =
            2 * 1024 * 1024; // 2 MB


        // Signature has 1 MB limit
        if (input.id === "signature") {

            maxSize =
                1 * 1024 * 1024;
        }


        if (file.size > maxSize) {

            const maxMB =
                maxSize / (1024 * 1024);

            errors.push(
                `${file.name}: File size must be below ${maxMB} MB.`
            );
        }

    });


    return errors;
}//


// ============================================================
// 6. GET LABEL OF INPUT
// ============================================================

function getLabel(input) {

    const label =
        document.querySelector(
            `label[for="${input.id}"]`
        );


    if (!label) {

        return input.name;
    }


    return label.innerText
        .replace("*", "")
        .trim();
}


// ============================================================
// 7. SHOW ERRORS
// ============================================================

function showErrors(errors) {

    let errorBox =
        document.getElementById("formErrors");


    // Create error box if it doesn't exist
    if (!errorBox) {

        errorBox =
            document.createElement("div");

        errorBox.id =
            "formErrors";

        errorBox.style.padding =
            "15px";

        errorBox.style.margin =
            "20px 0";

        errorBox.style.border =
            "1px solid #dc3545";

        errorBox.style.borderRadius =
            "8px";

        errorBox.style.background =
            "#fff5f5";

        errorBox.style.color =
            "#b02a37";


        form.insertBefore(
            errorBox,
            submitButton
        );
    }


    if (errors.length === 0) {

        errorBox.innerHTML = "";

        errorBox.style.display =
            "none";

        return;
    }


    errorBox.style.display =
        "block";


    errorBox.innerHTML = `

        <h3>⚠️ Please fix the following:</h3>

        <ul>

            ${errors.map(error =>

                `<li>${error}</li>`

            ).join("")}

        </ul>

    `;
}


// ============================================================
// 8. FORM SUBMISSION
// ============================================================

form.addEventListener(
    "submit",
    function(event) {

        // Prevent actual submission for now
        event.preventDefault();


        console.log(
            "Form submission started..."
        );


        // ----------------------------------------------------
        // GET DATA DIRECTLY FROM USER
        // ----------------------------------------------------

        const userData =
            getUserData();


        // ----------------------------------------------------
        // GET FILES DIRECTLY FROM USER
        // ----------------------------------------------------

        const documents =
            getUploadedDocuments();


        // ----------------------------------------------------
        // VALIDATE FORM
        // ----------------------------------------------------

        const formErrors =
            validateForm();


        // ----------------------------------------------------
        // VALIDATE DOCUMENTS
        // ----------------------------------------------------

        const documentErrors =
            validateDocuments();


        // Combine errors
        const errors = [

            ...formErrors,

            ...documentErrors

        ];


        // ----------------------------------------------------
        // SHOW ERRORS
        // ----------------------------------------------------

        if (errors.length > 0) {

            showErrors(errors);

            console.log(
                "❌ Form contains errors"
            );

            console.log(errors);

            return;
        }


        // ----------------------------------------------------
        // EVERYTHING IS VALID
        // ----------------------------------------------------

        showErrors([]);


        console.log(
            "================================="
        );

        console.log(
            "✅ FORM DATA"
        );

        console.log(
            "================================="
        );

        console.log(userData);


        console.log(
            "================================="
        );

        console.log(
            "✅ DOCUMENTS"
        );

        console.log(
            "================================="
        );

        console.log(documents);


        // ----------------------------------------------------
        // FOR NOW
        // DON'T SEND TO DATABASE
        // ----------------------------------------------------

        alert(
            "Application data has been collected successfully."
        );


        /*
        ========================================================
        IMPORTANT:

        DO NOT SEND TO DATABASE HERE YET.

        Later your Error Guard extension will access:

            getUserData()

        and:

            getUploadedDocuments()

        directly from the webpage.

        Only AFTER Error Guard verification passes,
        you will send the data to your backend.

        Example later:

        fetch("/api/submit", {
            method: "POST",
            body: ...
        });

        ========================================================
        */

    }
);


// ============================================================
// 9. MONITOR FORM CHANGES
// ============================================================

// This allows you to see data changing in real time
// while the student fills the form.

form.addEventListener(
    "input",
    function() {

        console.log(
            "Current user data:",
            getUserData()
        );

    }
);


// ============================================================
// 10. MONITOR FILE UPLOADS
// ============================================================

const fileInputs =
    form.querySelectorAll(
        'input[type="file"]'
    );


fileInputs.forEach(input => {

    input.addEventListener(
        "change",
        function() {

            const file =
                input.files[0];


            if (!file) {
                return;
            }


            console.log(
                "File uploaded:"
            );


            console.log({

                field:
                    input.name,

                fileName:
                    file.name,

                type:
                    file.type,

                size:
                    file.size

            });

        }
    );

});


// ============================================================
// 11. INITIAL MESSAGE
// ============================================================

console.log(
    "🎓 Scholarship Application Portal loaded."
);

console.log(
    "🛡️ Form data is currently kept in the browser."
);

console.log(
    "🛡️ No database storage is being performed."
);