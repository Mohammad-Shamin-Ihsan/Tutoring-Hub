// Minimal toast notifications, no dependencies.

function ensureToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = "info") {
  const container = ensureToastContainer();
  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-brand-800",
  };
  const toast = document.createElement("div");
  toast.className = `${colors[type] || colors.info} text-white text-sm font-medium px-4 py-3 rounded-md shadow-lg animate-[fadeIn_.15s_ease-out]`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity .3s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.showToast = showToast;
