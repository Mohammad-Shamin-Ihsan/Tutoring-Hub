const params = new URLSearchParams(window.location.search);
let currentPage = parseInt(params.get("page") || "1", 10);

function currentFilters() {
  return {
    subject_id: document.getElementById("f-subject").value || undefined,
    level_id: document.getElementById("f-level").value || undefined,
    location_id: document.getElementById("f-location").value || undefined,
    language_id: document.getElementById("f-language").value || undefined,
    mode: document.querySelector('input[name="mode"]:checked')?.value || undefined,
    price_min: document.getElementById("f-price-min").value || undefined,
    price_max: document.getElementById("f-price-max").value || undefined,
    sort: document.getElementById("sort-select").value,
    page: currentPage,
    page_size: 9,
  };
}

function applyFiltersFromUrl() {
  const setIfPresent = (id, key) => {
    const val = params.get(key);
    if (val) document.getElementById(id).value = val;
  };
  setIfPresent("f-subject", "subject_id");
  setIfPresent("f-level", "level_id");
  setIfPresent("f-location", "location_id");
  setIfPresent("f-language", "language_id");
  const mode = params.get("mode");
  if (mode) {
    const radio = document.querySelector(`input[name="mode"][value="${mode}"]`);
    if (radio) radio.checked = true;
  }
  const priceMin = params.get("price_min");
  const priceMax = params.get("price_max");
  if (priceMin) document.getElementById("f-price-min").value = priceMin;
  if (priceMax) document.getElementById("f-price-max").value = priceMax;
  const sort = params.get("sort");
  if (sort) {
    document.getElementById("sort-select").value = sort;
    document.getElementById("sort-select-mobile").value = sort;
  }
}

async function loadFilterOptions() {
  const [subjects, locations, levels, languages] = await Promise.all([
    window.api.get("/api/subjects"),
    window.api.get("/api/locations"),
    window.api.get("/api/teaching-levels"),
    window.api.get("/api/languages"),
  ]);
  const fill = (id, items, valueKey, labelFn) => {
    const el = document.getElementById(id);
    items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item[valueKey];
      opt.textContent = labelFn(item);
      el.appendChild(opt);
    });
  };
  fill("f-subject", subjects, "id", (s) => s.name);
  fill("f-location", locations, "id", (l) => `${l.area}, ${l.city}`);
  fill("f-level", levels, "id", (l) => l.level_name);
  fill("f-language", languages, "id", (l) => l.name);

  applyFiltersFromUrl();
}

async function runSearch() {
  const grid = document.getElementById("results-grid");
  grid.innerHTML = `<p class="text-gray-500 text-sm">Loading tutors…</p>`;
  try {
    const data = await window.api.get("/api/tutors", currentFilters());
    document.getElementById("results-count").textContent = `${data.total} tutor${data.total === 1 ? "" : "s"} found`;
    document.getElementById("results-count-mobile").textContent = `${data.total} tutor${data.total === 1 ? "" : "s"} found`;

    grid.innerHTML = data.items.length
      ? data.items.map(window.tutorCardHtml).join("")
      : `<p class="text-gray-500 text-sm col-span-full">No tutors match these filters yet. Try broadening your search.</p>`;

    renderPagination(document.getElementById("pagination"), data.page, data.pages, (page) => {
      currentPage = page;
      window.scrollTo({ top: 0, behavior: "smooth" });
      runSearch();
    });
  } catch (err) {
    grid.innerHTML = `<p class="text-red-600 text-sm">Could not load tutors. Is the API running?</p>`;
  }
}

document.getElementById("apply-filters").addEventListener("click", () => {
  currentPage = 1;
  runSearch();
});
document.getElementById("clear-filters").addEventListener("click", () => {
  document.querySelectorAll("#filters-panel select").forEach((s) => (s.value = ""));
  document.querySelector('input[name="mode"][value=""]').checked = true;
  document.getElementById("f-price-min").value = "";
  document.getElementById("f-price-max").value = "";
  currentPage = 1;
  runSearch();
});
document.getElementById("sort-select").addEventListener("change", (e) => {
  document.getElementById("sort-select-mobile").value = e.target.value;
  runSearch();
});
document.getElementById("sort-select-mobile").addEventListener("change", (e) => {
  document.getElementById("sort-select").value = e.target.value;
  runSearch();
});
document.getElementById("filters-toggle").addEventListener("click", () => {
  document.getElementById("filters-panel").classList.toggle("hidden");
});

loadFilterOptions().then(runSearch);
