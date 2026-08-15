const adminUser = window.auth.requireRole("admin");
renderAdminLayout("inquiries");

async function loadInquiries() {
  const tbody = document.getElementById("inquiries-body");
  try {
    const inquiries = await window.api.get("/api/admin/inquiries");
    tbody.innerHTML = inquiries.length
      ? inquiries
          .map(
            (i) => `
        <tr class="border-b border-gray-100">
          <td class="py-3 px-4">
            <p class="font-medium text-gray-800">${i.student_name}</p>
            <p class="text-xs text-gray-500">${i.student_email}</p>
          </td>
          <td class="py-3 px-4">${i.tutor_name}</td>
          <td class="py-3 px-4">${i.subject || "—"}</td>
          <td class="py-3 px-4">${new Date(i.created_at).toLocaleDateString()}</td>
          <td class="py-3 px-4"><span class="badge ${i.status === "new" ? "badge-pending" : i.status === "replied" ? "badge-approved" : "badge-suspended"}">${i.status}</span></td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="py-6 px-4 text-gray-500">No inquiries yet.</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 px-4 text-red-600">Could not load inquiries.</td></tr>`;
  }
}

if (adminUser) loadInquiries();
