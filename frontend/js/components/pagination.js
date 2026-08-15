// Renders page-number buttons into `container` and calls onPageChange(page) on click.
function renderPagination(container, currentPage, totalPages, onPageChange) {
  container.innerHTML = "";
  if (totalPages <= 1) return;

  const makeBtn = (label, page, opts = {}) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = opts.active
      ? "h-9 min-w-9 px-2 rounded-md bg-brand-900 text-white text-sm font-medium"
      : "h-9 min-w-9 px-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed";
    if (opts.disabled) btn.disabled = true;
    btn.addEventListener("click", () => onPageChange(page));
    return btn;
  };

  const wrap = document.createElement("div");
  wrap.className = "flex items-center gap-1.5";

  wrap.appendChild(makeBtn("‹", currentPage - 1, { disabled: currentPage <= 1 }));

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);

  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) {
      const dots = document.createElement("span");
      dots.textContent = "…";
      dots.className = "px-1 text-gray-400 text-sm";
      wrap.appendChild(dots);
    }
    wrap.appendChild(makeBtn(String(p), p, { active: p === currentPage }));
    prev = p;
  }

  wrap.appendChild(makeBtn("›", currentPage + 1, { disabled: currentPage >= totalPages }));
  container.appendChild(wrap);
}

window.renderPagination = renderPagination;
