const adminUser = window.auth.requireRole("admin");
renderAdminLayout("lookups");

const CONFIGS = {
  subjects: {
    label: "Subject",
    listPath: "/api/subjects",
    createPath: "/api/admin/subjects",
    deletePath: (id) => `/api/admin/subjects/${id}`,
    display: (item) => item.name,
    fields: [{ name: "name", label: "Subject Name", type: "text" }],
    buildPayload: (form) => ({ name: form.name.value }),
  },
  locations: {
    label: "Location",
    listPath: "/api/locations",
    createPath: "/api/admin/locations",
    deletePath: (id) => `/api/admin/locations/${id}`,
    display: (item) => `${item.area}, ${item.city}`,
    fields: [
      { name: "city", label: "City", type: "text" },
      { name: "area", label: "Area", type: "text" },
    ],
    buildPayload: (form) => ({ city: form.city.value, area: form.area.value }),
  },
  languages: {
    label: "Language",
    listPath: "/api/languages",
    createPath: "/api/admin/languages",
    deletePath: (id) => `/api/admin/languages/${id}`,
    display: (item) => item.name,
    fields: [{ name: "name", label: "Language Name", type: "text" }],
    buildPayload: (form) => ({ name: form.name.value }),
  },
  levels: {
    label: "Teaching Level",
    listPath: "/api/teaching-levels",
    createPath: "/api/admin/teaching-levels",
    deletePath: (id) => `/api/admin/teaching-levels/${id}`,
    display: (item) => item.level_name,
    fields: [{ name: "level_name", label: "Level Name", type: "text" }],
    buildPayload: (form) => ({ level_name: form.level_name.value }),
  },
};

let activeTab = "subjects";

function renderForm() {
  const cfg = CONFIGS[activeTab];
  document.getElementById("lookup-form-title").textContent = `Add ${cfg.label}`;
  document.getElementById("lookup-col-header").textContent = cfg.label;
  document.getElementById("lookup-form-fields").innerHTML = cfg.fields
    .map(
      (f) => `
    <div>
      <label class="form-label">${f.label}</label>
      <input required name="${f.name}" type="${f.type}" class="form-input" />
    </div>`
    )
    .join("");
}

async function loadList() {
  const cfg = CONFIGS[activeTab];
  const tbody = document.getElementById("lookup-body");
  tbody.innerHTML = `<tr><td colspan="2" class="py-6 px-4 text-gray-500">Loading…</td></tr>`;
  try {
    const items = await window.api.get(cfg.listPath);
    tbody.innerHTML = items.length
      ? items
          .map(
            (item) => `
        <tr class="border-b border-gray-100">
          <td class="py-3 px-4">${cfg.display(item)}</td>
          <td class="py-3 px-4"><button data-id="${item.id}" class="delete-btn text-red-600 text-xs font-medium hover:underline">Delete</button></td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="2" class="py-6 px-4 text-gray-500">Nothing here yet.</td></tr>`;

    tbody.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm(`Delete this ${cfg.label.toLowerCase()}? Tutors using it will lose that tag.`)) return;
        try {
          await window.api.del(cfg.deletePath(btn.dataset.id));
          window.showToast(`${cfg.label} deleted.`, "success");
          loadList();
        } catch (err) {
          window.showToast(err.message || "Could not delete", "error");
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="2" class="py-6 px-4 text-red-600">Could not load.</td></tr>`;
  }
}

document.querySelectorAll(".lookup-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll(".lookup-tab").forEach((b) => b.classList.toggle("btn-primary", b === btn));
    document.querySelectorAll(".lookup-tab").forEach((b) => b.classList.toggle("btn-outline", b !== btn));
    renderForm();
    loadList();
  });
});

document.getElementById("lookup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cfg = CONFIGS[activeTab];
  try {
    await window.api.post(cfg.createPath, cfg.buildPayload(e.target));
    window.showToast(`${cfg.label} added.`, "success");
    e.target.reset();
    loadList();
  } catch (err) {
    window.showToast(err.message || "Could not add", "error");
  }
});

if (adminUser) {
  document.querySelector('.lookup-tab[data-tab="subjects"]').classList.add("btn-primary");
  document.querySelector('.lookup-tab[data-tab="subjects"]').classList.remove("btn-outline");
  renderForm();
  loadList();
}
