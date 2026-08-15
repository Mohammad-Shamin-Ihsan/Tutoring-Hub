async function populateDropdown(selectEl, items, valueKey, labelKey) {
  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    selectEl.appendChild(opt);
  });
}

async function loadFilters() {
  try {
    const [subjects, locations, levels] = await Promise.all([
      window.api.get("/api/subjects"),
      window.api.get("/api/locations"),
      window.api.get("/api/teaching-levels"),
    ]);

    populateDropdown(document.getElementById("hero-subject"), subjects, "id", "name");
    populateDropdown(
      document.getElementById("hero-location"),
      locations.map((l) => ({ id: l.id, label: `${l.area}, ${l.city}` })),
      "id",
      "label"
    );
    populateDropdown(document.getElementById("hero-level"), levels, "id", "level_name");

    const popularContainer = document.getElementById("popular-subjects");
    popularContainer.innerHTML = "";
    subjects.slice(0, 8).forEach((s) => {
      const pill = document.createElement("a");
      pill.href = `/search.html?subject_id=${s.id}`;
      pill.className = "rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-brand-500 hover:text-brand-700";
      pill.textContent = s.name;
      popularContainer.appendChild(pill);
    });
  } catch (err) {
    window.showToast("Could not load filters. Is the API running?", "error");
  }
}

async function loadFeaturedTutors() {
  const container = document.getElementById("featured-tutors");
  try {
    const data = await window.api.get("/api/tutors", { page_size: 3, sort: "newest" });
    if (data.items.length === 0) {
      container.innerHTML = `<p class="text-gray-500 text-sm">No approved tutors yet — check back soon.</p>`;
      return;
    }
    container.innerHTML = data.items.map(window.tutorCardHtml).join("");
  } catch (err) {
    container.innerHTML = `<p class="text-red-600 text-sm">Could not load tutors.</p>`;
  }
}

document.getElementById("hero-search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  const subject = document.getElementById("hero-subject").value;
  const location = document.getElementById("hero-location").value;
  const level = document.getElementById("hero-level").value;
  const mode = document.getElementById("hero-mode").value;
  if (subject) params.set("subject_id", subject);
  if (location) params.set("location_id", location);
  if (level) params.set("level_id", level);
  if (mode) params.set("mode", mode);
  window.location.href = `/search.html?${params.toString()}`;
});

loadFilters();
loadFeaturedTutors();
