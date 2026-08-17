const accountUser = window.auth.requireRole("student");

if (accountUser) {
  document.getElementById("settings-name").value = accountUser.name;
  document.getElementById("settings-email").value = accountUser.email;
  document.getElementById("settings-phone").value = accountUser.phone || "";
}

document.getElementById("account-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const updated = await window.api.patch("/api/auth/me", {
      name: document.getElementById("settings-name").value,
      phone: document.getElementById("settings-phone").value,
    });
    const u = window.auth.getUser();
    window.auth.saveSession(window.auth.getToken(), { ...u, ...updated });
    window.showToast("Account updated.", "success");
  } catch (err) {
    window.showToast(err.message || "Could not update account", "error");
  }
});

document.getElementById("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await window.api.post("/api/auth/change-password", {
      current_password: document.getElementById("current-password").value,
      new_password: document.getElementById("new-password").value,
    });
    window.showToast("Password updated.", "success");
    e.target.reset();
  } catch (err) {
    window.showToast(err.message || "Could not update password", "error");
  }
});

document.getElementById("delete-account-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("delete-password").value;
  if (!confirm("This permanently deletes your account. This cannot be undone. Continue?")) {
    return;
  }
  try {
    await window.auth.deleteAccount(password);
    window.showToast("Account deleted.", "success");
    window.location.href = "/index.html";
  } catch (err) {
    window.showToast(err.message || "Could not delete account", "error");
  }
});
