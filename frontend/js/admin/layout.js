function adminSidebarHtml(active) {
  const items = [
    { key: "dashboard", label: "Dashboard", href: "/admin/index.html" },
    { key: "tutors", label: "Tutors", href: "/admin/tutors.html" },
    { key: "inquiries", label: "Inquiries", href: "/admin/inquiries.html" },
    { key: "users", label: "Users", href: "/admin/users.html" },
    { key: "lookups", label: "Subjects & Locations", href: "/admin/lookups.html" },
    { key: "logs", label: "Activity Log", href: "/admin/logs.html" },
  ];

  return `
  <div class="bg-brand-900 text-white h-full flex flex-col">
    <a href="/admin/index.html" class="flex items-center gap-2 font-extrabold text-lg px-4 py-5 border-b border-white/10">
      <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-brand-900 text-sm">TH</span>
      Admin
    </a>
    <nav class="flex-1 p-3 space-y-1">
      ${items
        .map(
          (item) => `
        <a href="${item.href}" class="block rounded-md px-3 py-2.5 text-sm font-medium ${
            item.key === active ? "bg-white/15 text-white" : "text-brand-200 hover:bg-white/10 hover:text-white"
          }">${item.label}</a>`
        )
        .join("")}
    </nav>
    <div class="p-3 border-t border-white/10">
      <button id="admin-logout" class="w-full text-left rounded-md px-3 py-2.5 text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white">Logout</button>
    </div>
  </div>`;
}

function renderAdminLayout(active) {
  const sidebar = document.getElementById("admin-sidebar");
  if (sidebar) sidebar.innerHTML = adminSidebarHtml(active);
  const logoutBtn = document.getElementById("admin-logout");
  if (logoutBtn) logoutBtn.addEventListener("click", () => window.auth.logout());
}

window.renderAdminLayout = renderAdminLayout;
