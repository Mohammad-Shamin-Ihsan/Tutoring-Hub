renderFaqAccordion("faq-list");

const contactUser = window.auth.getUser();
if (window.auth.isAuthenticated() && contactUser) {
  const identityEl = document.getElementById("contact-sender-identity");
  identityEl.querySelector("span").textContent = `${contactUser.name} (${contactUser.email})`;
  identityEl.classList.remove("hidden");
}

document.getElementById("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!window.auth.isAuthenticated() || !window.auth.getUser()) {
    window.showToast("Please log in to send a message.", "info");
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
    return;
  }

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";
  try {
    await window.api.post("/api/contact", data);
    window.showToast("Message sent — we'll get back to you soon.", "success");
    form.reset();
  } catch (err) {
    window.showToast(err.message || "Could not send message", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";
  }
});
