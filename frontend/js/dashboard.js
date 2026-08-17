const user = window.auth.requireRole("tutor");
const editSelected = { subjects: new Set(), languages: new Set(), levels: new Set(), locations: new Set() };
let editPhotoFile = null;
let allLookups = null;

if (user) {
  document.getElementById("welcome-heading").textContent = `Welcome back, ${user.name}`;
}

// --- Tabs --------------------------------------------------------------

function activateTab(tab) {
  document.querySelectorAll(".dash-panel").forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${tab}`));
  document.querySelectorAll(".dash-tab").forEach((b) => {
    const active = b.dataset.tab === tab;
    b.classList.toggle("bg-brand-900", active);
    b.classList.toggle("text-white", active);
    b.classList.toggle("text-gray-700", !active);
  });
  if (tab === "inquiries") loadAllInquiries();
  if (tab === "edit-profile") loadEditProfile();
  if (tab === "settings") loadSettings();
}

document.querySelectorAll(".dash-tab").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});
document.getElementById("dash-logout").addEventListener("click", () => window.auth.logout());

// --- Overview ------------------------------------------------------------

function statusBadgeClass(status) {
  return { pending: "badge-pending", approved: "badge-approved", rejected: "badge-rejected", suspended: "badge-suspended" }[status] || "badge";
}
function statusNote(status) {
  return {
    pending: "Your profile is being reviewed by our team. You'll receive an email once it's approved (typically 2–3 business days).",
    approved: "Your profile is live and visible to students.",
    rejected: "Your profile was not approved. Update it and resubmit from the Edit Profile tab.",
    suspended: "Your profile has been suspended by an administrator.",
  }[status] || "";
}

function computeCompletion(me) {
  const checks = [
    Boolean(me.profile_photo),
    Boolean(me.biography),
    Boolean(me.qualification),
    Boolean(me.hourly_rate),
    Boolean(me.teaching_mode),
    me.subjects.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

async function loadOverview() {
  try {
    const me = await window.api.get("/api/tutors/me");
    const badge = document.getElementById("status-badge");
    badge.textContent = me.approval_status.charAt(0).toUpperCase() + me.approval_status.slice(1);
    badge.className = statusBadgeClass(me.approval_status);
    document.getElementById("status-note").textContent = statusNote(me.approval_status);

    const pct = computeCompletion(me);
    document.getElementById("completion-pct").textContent = `${pct}%`;
    document.getElementById("completion-bar").style.width = `${pct}%`;

    const inquiries = await window.api.get("/api/inquiries/me");
    const tbody = document.getElementById("recent-inquiries-body");
    tbody.innerHTML = inquiries.slice(0, 5).length
      ? inquiries
          .slice(0, 5)
          .map(
            (i) => `
        <tr class="border-b border-gray-100">
          <td class="py-2 pr-4">${i.student_name}</td>
          <td class="py-2 pr-4">${i.subject || "—"}</td>
          <td class="py-2 pr-4">${new Date(i.created_at).toLocaleDateString()}</td>
          <td class="py-2 pr-4"><span class="badge ${i.status === "new" ? "badge-pending" : i.status === "replied" ? "badge-approved" : "badge-suspended"}">${i.status}</span></td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="py-4 text-gray-500">No inquiries yet.</td></tr>`;
  } catch (err) {
    window.showToast(err.message || "Could not load dashboard", "error");
  }
}

// --- Edit Profile ----------------------------------------------------------

function renderEditPills(containerId, items, labelKey, set, selectedIds) {
  const container = document.getElementById(containerId);
  set.clear();
  selectedIds.forEach((id) => set.add(id));
  container.innerHTML = items
    .map((item) => {
      const active = set.has(item.id);
      return `<button type="button" data-id="${item.id}" class="pill rounded-full border px-3 py-1.5 text-sm ${active ? "border-brand-900 bg-brand-900 text-white" : "border-gray-300 hover:border-brand-500"}">${item[labelKey]}</button>`;
    })
    .join("");

  container.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (set.has(id)) {
        set.delete(id);
        btn.className = "pill rounded-full border border-gray-300 px-3 py-1.5 text-sm hover:border-brand-500";
      } else {
        set.add(id);
        btn.className = "pill rounded-full border border-brand-900 bg-brand-900 text-white px-3 py-1.5 text-sm";
      }
    });
  });
}

async function loadEditProfile() {
  const me = await window.api.get("/api/tutors/me");
  if (!allLookups) {
    allLookups = await Promise.all([
      window.api.get("/api/subjects"),
      window.api.get("/api/languages"),
      window.api.get("/api/teaching-levels"),
      window.api.get("/api/locations"),
    ]);
  }
  const [subjects, languages, levels, locations] = allLookups;

  document.getElementById("edit-photo-preview").src = me.profile_photo ? `${window.api.base}${me.profile_photo}` : "";
  document.getElementById("edit-bio").value = me.biography || "";
  document.getElementById("edit-qualification").value = me.qualification || "";
  document.getElementById("edit-experience").value = me.experience_years || "";
  document.getElementById("edit-rate").value = me.hourly_rate || "";
  document.getElementById("edit-mode-online").checked = me.teaching_mode === "online" || me.teaching_mode === "both";
  document.getElementById("edit-mode-in-person").checked = me.teaching_mode === "in_person" || me.teaching_mode === "both";

  renderEditPills("edit-subjects", subjects, "name", editSelected.subjects, me.subjects.map((s) => s.id));
  renderEditPills("edit-languages", languages, "name", editSelected.languages, me.languages.map((l) => l.id));
  renderEditPills("edit-levels", levels, "level_name", editSelected.levels, me.teaching_levels.map((l) => l.id));
  renderEditPills(
    "edit-locations",
    locations.map((l) => ({ id: l.id, label: `${l.area}, ${l.city}` })),
    "label",
    editSelected.locations,
    me.locations.map((l) => l.id)
  );
}

document.getElementById("edit-photo-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  editPhotoFile = file;
  document.getElementById("edit-photo-preview").src = URL.createObjectURL(file);
});

document.getElementById("save-profile-btn").addEventListener("click", async () => {
  const online = document.getElementById("edit-mode-online").checked;
  const inPerson = document.getElementById("edit-mode-in-person").checked;
  let teaching_mode = null;
  if (online && inPerson) teaching_mode = "both";
  else if (online) teaching_mode = "online";
  else if (inPerson) teaching_mode = "in_person";

  const btn = document.getElementById("save-profile-btn");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    if (editPhotoFile) {
      const formData = new FormData();
      formData.append("file", editPhotoFile);
      await window.api.post("/api/tutors/me/photo", formData, { isForm: true });
    }
    await window.api.put("/api/tutors/me", {
      biography: document.getElementById("edit-bio").value || null,
      qualification: document.getElementById("edit-qualification").value || null,
      experience_years: document.getElementById("edit-experience").value ? parseInt(document.getElementById("edit-experience").value, 10) : null,
      hourly_rate: document.getElementById("edit-rate").value || null,
      teaching_mode,
      subject_ids: [...editSelected.subjects],
      language_ids: [...editSelected.languages],
      teaching_level_ids: [...editSelected.levels],
      location_ids: [...editSelected.locations],
    });
    window.showToast("Profile updated.", "success");
    editPhotoFile = null;
  } catch (err) {
    window.showToast(err.message || "Could not save profile", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
});

// --- Inquiries ----------------------------------------------------------

async function loadAllInquiries() {
  const tbody = document.getElementById("all-inquiries-body");
  tbody.innerHTML = `<tr><td colspan="6" class="py-4 px-4 text-gray-500">Loading…</td></tr>`;
  try {
    const inquiries = await window.api.get("/api/inquiries/me");
    tbody.innerHTML = inquiries.length
      ? inquiries
          .map(
            (i) => `
        <tr class="border-b border-gray-100">
          <td class="py-3 px-4">${i.student_name}<br /><span class="text-xs text-gray-500">${i.student_email}</span></td>
          <td class="py-3 px-4">${i.subject || "—"}</td>
          <td class="py-3 px-4 max-w-xs truncate" title="${i.message.replace(/"/g, "&quot;")}">${i.message}</td>
          <td class="py-3 px-4">${new Date(i.created_at).toLocaleDateString()}</td>
          <td class="py-3 px-4"><span class="badge ${i.status === "new" ? "badge-pending" : i.status === "replied" ? "badge-approved" : "badge-suspended"}">${i.status}</span></td>
          <td class="py-3 px-4">
            <select data-id="${i.id}" class="inquiry-status-select form-select text-xs !py-1">
              <option value="new" ${i.status === "new" ? "selected" : ""}>New</option>
              <option value="replied" ${i.status === "replied" ? "selected" : ""}>Replied</option>
              <option value="archived" ${i.status === "archived" ? "selected" : ""}>Archived</option>
            </select>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="py-4 px-4 text-gray-500">No inquiries yet.</td></tr>`;

    tbody.querySelectorAll(".inquiry-status-select").forEach((select) => {
      select.addEventListener("change", async () => {
        try {
          await window.api.patch(`/api/inquiries/${select.dataset.id}`, { status: select.value });
          window.showToast("Inquiry updated.", "success");
        } catch (err) {
          window.showToast(err.message || "Could not update inquiry", "error");
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 px-4 text-red-600">Could not load inquiries.</td></tr>`;
  }
}

// --- Settings ----------------------------------------------------------

function loadSettings() {
  const u = window.auth.getUser();
  document.getElementById("settings-name").value = u.name;
  document.getElementById("settings-email").value = u.email;
  document.getElementById("settings-phone").value = u.phone || "";
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
    document.getElementById("welcome-heading").textContent = `Welcome back, ${updated.name}`;
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
  if (!confirm("This permanently deletes your account, profile, and all inquiries you've received. This cannot be undone. Continue?")) {
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

if (user) {
  activateTab("overview");
  loadOverview();
}
