function togglePassword() {
    var x = document.getElementById("password-input");
    if (x.type === "password") {
        x.type = "text";
        document.querySelector(".input-icon-right-toggle").style.visibility = 'visible';
    } else {
        x.type = "password";
        document.querySelector(".input-icon-right-toggle").style.visibility = 'hidden';
    }
}

document.querySelector("#log-in-switch").onclick = (e) => {
    document.querySelector(".sign-up").style.display = 'none';
    document.querySelector(".log-in").style.display = 'block';
    e.preventDefault();
}

document.querySelector("#register-switch").onclick = (e) => {
    document.querySelector(".log-in").style.display = 'none';
    document.querySelector(".sign-up").style.display = 'block';
    e.preventDefault();
}