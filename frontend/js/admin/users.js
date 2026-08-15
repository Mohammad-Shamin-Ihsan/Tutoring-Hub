const adminUser = window.auth.requireRole("admin");
renderAdminLayout("users");

async function loadUsers() {
  const tbody = document.getElementById("users-body");
  try {
    const users = await window.api.get("/api/admin/users", { role: document.getElementById("role-filter").value || undefined });
    tbody.innerHTML = users.length
      ? users
          .map(
            (u) => `
        <tr class="border-b border-gray-100">
          <td class="py-3 px-4 font-medium text-gray-800">${u.name}</td>
          <td class="py-3 px-4">${u.email}</td>
          <td class="py-3 px-4 capitalize">${u.role}</td>
          <td class="py-3 px-4">${u.phone || "—"}</td>
          <td class="py-3 px-4">${new Date(u.created_at).toLocaleDateString()}</td>
          <td class="py-3 px-4"><span class="badge ${u.status === "active" ? "badge-approved" : "badge-suspended"}">${u.status}</span></td>
          <td class="py-3 px-4">
            <button data-id="${u.id}" data-status="${u.status === "active" ? "suspended" : "active"}" class="toggle-status-btn btn-outline !py-1 !px-2 text-xs" ${u.id === adminUser.id ? "disabled" : ""}>
              ${u.status === "active" ? "Suspend" : "Activate"}
            </button>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="7" class="py-6 px-4 text-gray-500">No users found.</td></tr>`;

    tbody.querySelectorAll(".toggle-status-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await window.api.patch(`/api/admin/users/${btn.dataset.id}/status`, undefined, { new_status: btn.dataset.status });
          window.showToast("User status updated.", "success");
          loadUsers();
        } catch (err) {
          window.showToast(err.message || "Could not update user", "error");
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 px-4 text-red-600">Could not load users.</td></tr>`;
  }
}

document.getElementById("role-filter").addEventListener("change", loadUsers);

if (adminUser) loadUsers();
