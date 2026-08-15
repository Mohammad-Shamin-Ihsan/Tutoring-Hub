document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const { email, password } = Object.fromEntries(new FormData(form).entries());

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in…";
  try {
    const user = await window.auth.login(email, password);
    window.location.href = user.role === "admin" ? "/admin/index.html" : "/dashboard.html";
  } catch (err) {
    window.showToast(err.message || "Login failed", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});
