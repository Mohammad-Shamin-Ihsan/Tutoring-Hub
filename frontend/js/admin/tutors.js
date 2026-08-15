const adminUser = window.auth.requireRole("admin");
renderAdminLayout("tutors");

function statusBadgeClass(status) {
  return { pending: "badge-pending", approved: "badge-approved", rejected: "badge-rejected", suspended: "badge-suspended" }[status] || "badge";
}

let debounceTimer = null;

async function loadTutors() {
  const tbody = document.getElementById("tutors-body");
  tbody.innerHTML = `<tr><td colspan="6" class="py-6 px-4 text-gray-500">Loading…</td></tr>`;
  try {
    const tutors = await window.api.get("/api/admin/tutors", {
      approval_status: document.getElementById("status-filter").value || undefined,
      search: document.getElementById("search-input").value || undefined,
    });

    tbody.innerHTML = tutors.length
      ? tutors
          .map(
            (t) => `
        <tr class="border-b border-gray-100">
          <td class="py-3 px-4">
            <p class="font-medium text-gray-800">${t.name}</p>
            <p class="text-xs text-gray-500">${t.email}</p>
          </td>
          <td class="py-3 px-4">${t.subjects.slice(0, 2).join(", ") || "—"}</td>
          <td class="py-3 px-4">${new Date(t.created_at).toLocaleDateString()}</td>
          <td class="py-3 px-4"><span class="${statusBadgeClass(t.approval_status)}">${t.approval_status}</span></td>
          <td class="py-3 px-4">${t.hourly_rate ? `AED ${t.hourly_rate}` : "—"}</td>
          <td class="py-3 px-4">
            <div class="flex flex-wrap gap-1.5">
              <button data-id="${t.id}" class="view-btn btn-outline !py-1 !px-2 text-xs">View</button>
              <button data-id="${t.id}" class="approve-btn btn-primary !py-1 !px-2 text-xs" ${t.approval_status === "approved" ? "disabled" : ""}>Approve</button>
              <button data-id="${t.id}" class="reject-btn btn-outline !py-1 !px-2 text-xs" ${t.approval_status === "rejected" ? "disabled" : ""}>Reject</button>
              <button data-id="${t.id}" class="suspend-btn btn-outline !py-1 !px-2 text-xs" ${t.approval_status === "suspended" ? "disabled" : ""}>Suspend</button>
            </div>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="py-6 px-4 text-gray-500">No tutors match this filter.</td></tr>`;

    wireRowActions();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 px-4 text-red-600">Could not load tutors.</td></tr>`;
  }
}

function wireRowActions() {
  document.querySelectorAll(".view-btn").forEach((btn) => btn.addEventListener("click", () => openTutorModal(btn.dataset.id)));
  document.querySelectorAll(".approve-btn").forEach((btn) =>
    btn.addEventListener("click", () => transitionTutor(btn.dataset.id, "approve"))
  );
  document.querySelectorAll(".reject-btn").forEach((btn) =>
    btn.addEventListener("click", () => transitionTutor(btn.dataset.id, "reject"))
  );
  document.querySelectorAll(".suspend-btn").forEach((btn) =>
    btn.addEventListener("click", () => transitionTutor(btn.dataset.id, "suspend"))
  );
}

async function transitionTutor(id, action) {
  try {
    await window.api.patch(`/api/admin/tutors/${id}/${action}`, {});
    window.showToast(`Tutor ${action}d.`, "success");
    loadTutors();
  } catch (err) {
    window.showToast(err.message || `Could not ${action} tutor`, "error");
  }
}

async function openTutorModal(id) {
  const modal = document.getElementById("tutor-modal");
  const body = document.getElementById("tutor-modal-body");
  body.innerHTML = `<p class="text-gray-500 text-sm">Loading…</p>`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const t = await window.api.get(`/api/admin/tutors/${id}`);
    body.innerHTML = `
      <h3 class="text-lg font-bold text-brand-900 mb-1">Tutor Profile</h3>
      <span class="${statusBadgeClass(t.approval_status)} mb-4 inline-block">${t.approval_status}</span>
      <dl class="space-y-3 text-sm mt-2">
        <div><dt class="font-medium text-gray-700">Biography</dt><dd class="text-gray-600">${t.biography || "—"}</dd></div>
        <div><dt class="font-medium text-gray-700">Qualification</dt><dd class="text-gray-600">${t.qualification || "—"}</dd></div>
        <div><dt class="font-medium text-gray-700">Experience</dt><dd class="text-gray-600">${t.experience_years} years</dd></div>
        <div><dt class="font-medium text-gray-700">Hourly Rate</dt><dd class="text-gray-600">${t.hourly_rate ? `AED ${t.hourly_rate}` : "—"}</dd></div>
        <div><dt class="font-medium text-gray-700">Teaching Mode</dt><dd class="text-gray-600">${t.teaching_mode || "—"}</dd></div>
        <div><dt class="font-medium text-gray-700">Subjects</dt><dd class="text-gray-600">${t.subjects.map((s) => s.name).join(", ") || "—"}</dd></div>
        <div><dt class="font-medium text-gray-700">Languages</dt><dd class="text-gray-600">${t.languages.map((l) => l.name).join(", ") || "—"}</dd></div>
        <div><dt class="font-medium text-gray-700">Teaching Levels</dt><dd class="text-gray-600">${t.teaching_levels.map((l) => l.level_name).join(", ") || "—"}</dd></div>
        <div><dt class="font-medium text-gray-700">Locations</dt><dd class="text-gray-600">${t.locations.map((l) => `${l.area}, ${l.city}`).join(", ") || "—"}</dd></div>
      </dl>`;
  } catch (err) {
    body.innerHTML = `<p class="text-red-600 text-sm">Could not load tutor.</p>`;
  }
}

document.getElementById("tutor-modal-close").addEventListener("click", () => {
  const modal = document.getElementById("tutor-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
});
document.getElementById("tutor-modal").addEventListener("click", (e) => {
  if (e.target.id === "tutor-modal") document.getElementById("tutor-modal-close").click();
});

document.getElementById("status-filter").addEventListener("change", loadTutors);
document.getElementById("search-input").addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadTutors, 300);
});

if (adminUser) loadTutors();
