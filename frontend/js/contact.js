renderFaqAccordion("faq-list");

document.getElementById("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
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
