
// =====================================
// PAGE LOAD (SLIDERS + SUMMARY)
// =====================================
document.addEventListener("DOMContentLoaded", function () {

    // ===== SLIDER DISPLAY =====
    const amount = document.getElementById("amount");
    const duration = document.getElementById("duration");

    const amountVal = document.getElementById("amountVal");
    const durationVal = document.getElementById("durationVal");

    // ✅ ONLY RUN IF ELEMENTS EXIST
    if (amount !== null && amountVal !== null) {

        amountVal.innerText = "GHS " + amount.value;

        amount.addEventListener("input", function () {
            amountVal.innerText = "GHS " + this.value;
            updateLoan();
        });
    }

    if (duration !== null && durationVal !== null) {

        durationVal.innerText = duration.value + " days";

        duration.addEventListener("input", function () {
            durationVal.innerText = this.value + " days";
        });
    }

    // ===== LOAN CALCULATOR (10%) =====
    function updateLoan() {
        const repayment = document.getElementById("repayment");
        if (!amount || !repayment) return;

        const amt = parseFloat(amount.value);
        const total = amt + (amt * 0.10);

        repayment.innerText = "Total repayment: GHS" + total.toFixed(2);
    }

    updateLoan();

    // =====================================
    // STEP 1 → STEP 2
    // =====================================
    function nextStep1() {
        const amount = document.getElementById("amount").value;
        const duration = document.getElementById("duration").value;
        const reason = document.getElementById("reason").value.trim();

        if (!reason) {
            showError("Please fill all required fields");
            return;
        }

        localStorage.setItem("amount", amount);
        localStorage.setItem("duration", duration);
        localStorage.setItem("reason", reason);

        showLoaderAndGo("step1.html");
    }

    // =====================================
    // STEP 2 → STEP 3
    // =====================================
    function nextStep2() {
        const fname = document.getElementById("fname").value.trim();
        const lname = document.getElementById("lname").value.trim();
        const phone = document.getElementById("phone").value.trim();

        if (!fname || !lname || !phone) {
            showError("Please fill all required fields");
            return;
        }

        if (!phone.startsWith("+233") || phone.length < 10 || phone.length > 13) {
            showError("Enter valid Ghana phone number");
            return;
        }

        localStorage.setItem("fname", fname);
        localStorage.setItem("lname", lname);
        localStorage.setItem("phone", phone);

        showLoaderAndGo("step3.html");
    }

    // =====================================
    // STEP 3 → STEP 4
    // =====================================
    function nextStep3() {
        const kfname = document.getElementById("kfname").value.trim();
        const klname = document.getElementById("klname").value.trim();
        const kphone = document.getElementById("kphone").value.trim();

        
        localStorage.setItem("kfname", kfname);
        localStorage.setItem("klname", klname);
        localStorage.setItem("kphone", kphone);

        localStorage.setItem("kinName", kfname + " " + klname);

        showLoaderAndGo("step4.html");
    }

    // =====================================
    // STEP 4 → STEP 5
    // =====================================
    function nextStep4() {
        document.getElementById("pageLoader").style.display = "block";

        setTimeout(() => {
            window.location.href = "step5.html";
        }, 800);
    }


    // =====================================
    // ERROR HANDLER
    // =====================================
    function showError(msg) {
        let box = document.getElementById("errorBox");

        if (!box) {
            box = document.createElement("div");
            box.id = "errorBox";
            box.style.color = "red";
            box.style.marginTop = "10px";
            box.style.textAlign = "center";
            document.querySelector(".container").appendChild(box);
        }

        box.innerText = msg;
        box.style.display = "block";   // 👈 ADD THIS LINE HERE
    }


    // =====================================
    // GLOBAL LOADER NAVIGATION
    // =====================================
    function showLoaderAndGo(url) {
        const loader = document.getElementById("pageLoader");
        if (loader) loader.style.display = "block";

        setTimeout(() => {
            window.location.href = url;
        }, 800);
    }

    window.nextStep1 = nextStep1;
    window.nextStep2 = nextStep2;
    window.nextStep3 = nextStep3;
    window.nextStep4 = nextStep4;

    document.body.classList.add("loaded");

});