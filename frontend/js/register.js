const selected = { subjects: new Set(), languages: new Set(), levels: new Set(), locations: new Set() };
let photoFile = null;

function showStep(n) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`step-${i}`).classList.toggle("hidden", i !== n);
  }
  document.querySelectorAll(".step-indicator").forEach((el) => {
    const step = parseInt(el.dataset.step, 10);
    const dot = el.querySelector(".step-dot");
    if (step < n) {
      dot.className = "step-dot h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-brand-900 border-brand-900 text-white";
    } else if (step === n) {
      dot.className = "step-dot h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-brand-900 text-brand-900";
    } else {
      dot.className = "step-dot h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-gray-300 text-gray-400";
    }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".step-back").forEach((btn) => {
  btn.addEventListener("click", () => {
    const current = [1, 2, 3, 4].find((n) => !document.getElementById(`step-${n}`).classList.contains("hidden"));
    showStep(Math.max(1, current - 1));
  });
});

// --- Step 1: Account -----------------------------------------------------

document.getElementById("step1-next").addEventListener("click", async () => {
  const name = document.getElementById("acc-name").value.trim();
  const email = document.getElementById("acc-email").value.trim();
  const phone = document.getElementById("acc-phone").value.trim();
  const password = document.getElementById("acc-password").value;

  if (!name || !email || password.length < 8) {
    window.showToast("Please fill in all required fields (password min. 8 characters).", "error");
    return;
  }

  const btn = document.getElementById("step1-next");
  btn.disabled = true;
  btn.textContent = "Creating account…";
  try {
    await window.auth.register({ name, email, password, phone: phone || null });
    showStep(2);
  } catch (err) {
    window.showToast(err.message || "Could not create account", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Next →";
  }
});

// --- Step 2: Profile -------------------------------------------------------

document.getElementById("prof-photo").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  photoFile = file;
  const preview = document.getElementById("photo-preview");
  preview.src = URL.createObjectURL(file);
  preview.classList.remove("hidden");
});

document.getElementById("step2-next").addEventListener("click", async () => {
  const biography = document.getElementById("prof-bio").value.trim();
  const qualification = document.getElementById("prof-qualification").value.trim();
  const experience_years = document.getElementById("prof-experience").value;

  const btn = document.getElementById("step2-next");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    await window.api.put("/api/tutors/me", {
      biography: biography || null,
      qualification: qualification || null,
      experience_years: experience_years ? parseInt(experience_years, 10) : undefined,
    });
    if (photoFile) {
      const formData = new FormData();
      formData.append("file", photoFile);
      await window.api.post("/api/tutors/me/photo", formData, { isForm: true });
    }
    showStep(3);
  } catch (err) {
    window.showToast(err.message || "Could not save profile", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Next →";
  }
});

// --- Step 3: Teaching -------------------------------------------------------

function renderPills(containerId, items, labelKey, set) {
  const container = document.getElementById(containerId);
  container.innerHTML = items
    .map(
      (item) => `
    <button type="button" data-id="${item.id}" class="pill rounded-full border border-gray-300 px-3 py-1.5 text-sm hover:border-brand-500">
      ${item[labelKey]}
    </button>`
    )
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

async function loadTeachingOptions() {
  const [subjects, languages, levels, locations] = await Promise.all([
    window.api.get("/api/subjects"),
    window.api.get("/api/languages"),
    window.api.get("/api/teaching-levels"),
    window.api.get("/api/locations"),
  ]);
  renderPills("teach-subjects", subjects, "name", selected.subjects);
  renderPills("teach-languages", languages, "name", selected.languages);
  renderPills("teach-levels", levels, "level_name", selected.levels);
  renderPills(
    "teach-locations",
    locations.map((l) => ({ id: l.id, label: `${l.area}, ${l.city}` })),
    "label",
    selected.locations
  );
}

document.getElementById("step3-next").addEventListener("click", async () => {
  const online = document.getElementById("mode-online").checked;
  const inPerson = document.getElementById("mode-in-person").checked;
  const rate = document.getElementById("teach-rate").value;

  let teaching_mode = null;
  if (online && inPerson) teaching_mode = "both";
  else if (online) teaching_mode = "online";
  else if (inPerson) teaching_mode = "in_person";

  if (selected.subjects.size === 0) {
    window.showToast("Select at least one subject you teach.", "error");
    return;
  }

  const btn = document.getElementById("step3-next");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    await window.api.put("/api/tutors/me", {
      subject_ids: [...selected.subjects],
      language_ids: [...selected.languages],
      teaching_level_ids: [...selected.levels],
      location_ids: [...selected.locations],
      teaching_mode,
      hourly_rate: rate || null,
    });
    renderReview();
    showStep(4);
  } catch (err) {
    window.showToast(err.message || "Could not save teaching details", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Next →";
  }
});

// --- Step 4: Review ----------------------------------------------------------

async function renderReview() {
  const me = await window.api.get("/api/tutors/me");
  const container = document.getElementById("review-summary");
  container.innerHTML = `
    <div class="rounded-md bg-gray-50 p-4">
      <p class="font-medium text-gray-800">Account</p>
      <p class="text-gray-600">${document.getElementById("acc-name").value || ""} &middot; ${document.getElementById("acc-email").value || ""}</p>
    </div>
    <div class="rounded-md bg-gray-50 p-4">
      <p class="font-medium text-gray-800">Profile</p>
      <p class="text-gray-600">${me.qualification || "No qualification listed"} &middot; ${me.experience_years} yrs experience</p>
    </div>
    <div class="rounded-md bg-gray-50 p-4">
      <p class="font-medium text-gray-800">Teaching</p>
      <p class="text-gray-600">Subjects: ${me.subjects.map((s) => s.name).join(", ") || "None"}</p>
      <p class="text-gray-600">Languages: ${me.languages.map((l) => l.name).join(", ") || "None"}</p>
      <p class="text-gray-600">Levels: ${me.teaching_levels.map((l) => l.level_name).join(", ") || "None"}</p>
      <p class="text-gray-600">Locations: ${me.locations.map((l) => `${l.area}, ${l.city}`).join(", ") || "None"}</p>
      <p class="text-gray-600">Rate: ${me.hourly_rate ? `AED ${me.hourly_rate}/hr` : "Not set"} &middot; Mode: ${me.teaching_mode || "Not set"}</p>
    </div>
  `;
}

document.getElementById("submit-approval").addEventListener("click", async () => {
  const btn = document.getElementById("submit-approval");
  btn.disabled = true;
  btn.textContent = "Submitting…";
  try {
    await window.api.post("/api/tutors/me/submit");
    window.showToast("Profile submitted for approval!", "success");
    window.location.href = "/dashboard.html";
  } catch (err) {
    window.showToast(err.message || "Could not submit for approval", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit for Approval";
  }
});

// --- Bootstrapping: resume mid-wizard on reload if already registered -------

(async function init() {
  const user = window.auth.getUser();
  if (user && user.role === "tutor") {
    document.getElementById("acc-name").value = user.name;
    document.getElementById("acc-email").value = user.email;
    await loadTeachingOptions();
    showStep(2);
  } else {
    await loadTeachingOptions();
    showStep(1);
  }
})();
