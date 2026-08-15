const adminUser = window.auth.requireRole("admin");
renderAdminLayout("logs");

async function loadLogs() {
  const tbody = document.getElementById("logs-body");
  try {
    const logs = await window.api.get("/api/admin/logs", { limit: 100 });
    tbody.innerHTML = logs.length
      ? logs
          .map(
            (log) => `
        <tr class="border-b border-gray-100">
          <td class="py-3 px-4">${log.admin_name}</td>
          <td class="py-3 px-4">${log.action}</td>
          <td class="py-3 px-4 text-gray-500">${log.target_table}${log.target_id ? ` · ${log.target_id.slice(0, 8)}…` : ""}</td>
          <td class="py-3 px-4">${new Date(log.created_at).toLocaleString()}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="py-6 px-4 text-gray-500">No activity yet.</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-6 px-4 text-red-600">Could not load activity log.</td></tr>`;
  }
}

if (adminUser) loadLogs();
