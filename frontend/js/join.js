document.getElementById("join-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());
  if (!payload.phone) delete payload.phone;

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account…";
  try {
    await window.auth.registerStudent(payload);
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    window.showToast("Account created! You can now contact tutors.", "success");
    window.location.href = redirect || "/search.html";
  } catch (err) {
    window.showToast(err.message || "Could not create account", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});
