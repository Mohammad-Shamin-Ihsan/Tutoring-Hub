document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const { email, password } = Object.fromEntries(new FormData(form).entries());

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in…";
  try {
    const user = await window.auth.login(email, password);
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    if (redirect) {
      window.location.href = redirect;
    } else if (user.role === "admin") {
      window.location.href = "/admin/index.html";
    } else if (user.role === "tutor") {
      window.location.href = "/dashboard.html";
    } else {
      window.location.href = "/search.html";
    }
  } catch (err) {
    window.showToast(err.message || "Login failed", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});
