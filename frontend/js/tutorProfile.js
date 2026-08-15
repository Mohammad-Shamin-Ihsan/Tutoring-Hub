function formatMode(mode) {
  return { online: "Online", in_person: "In-person", both: "Online & In-person" }[mode] || "Not specified";
}

function pillList(items, labelKey) {
  if (!items.length) return `<p class="text-sm text-gray-500">Not specified</p>`;
  return `<div class="flex flex-wrap gap-2">${items
    .map((i) => `<span class="badge bg-brand-50 text-brand-800">${i[labelKey]}</span>`)
    .join("")}</div>`;
}

async function loadSimilarTutors(tutor) {
  const container = document.getElementById("similar-tutors");
  if (!tutor.subjects.length) {
    container.innerHTML = `<p class="text-sm text-gray-500">No suggestions available.</p>`;
    return;
  }
  try {
    const data = await window.api.get("/api/tutors", { subject_id: tutor.subjects[0].id, page_size: 4 });
    const others = data.items.filter((t) => t.id !== tutor.id).slice(0, 3);
    container.innerHTML = others.length
      ? others.map(window.tutorCardHtml).join("")
      : `<p class="text-sm text-gray-500">No similar tutors yet.</p>`;
  } catch (_) {
    container.innerHTML = "";
  }
}

async function loadTutorProfile() {
  const id = new URLSearchParams(window.location.search).get("id");
  const content = document.getElementById("tutor-content");
  if (!id) {
    content.innerHTML = `<p class="text-red-600">No tutor specified.</p>`;
    return;
  }

  try {
    const tutor = await window.api.get(`/api/tutors/${id}`);
    document.title = `${tutor.name} — TutorHub UAE`;

    const photo = tutor.profile_photo
      ? `<img src="${window.api.base}${tutor.profile_photo}" alt="${tutor.name}" class="h-28 w-28 rounded-lg object-cover bg-gray-100" />`
      : `<div class="h-28 w-28 rounded-lg bg-gray-100 flex items-center justify-center text-3xl font-semibold text-gray-400">${tutor.name.charAt(0)}</div>`;

    content.innerHTML = `
      <div class="card bg-brand-50/50 p-6 md:p-8 mb-8">
        <div class="flex flex-col md:flex-row gap-6">
          ${photo}
          <div class="flex-1">
            <h1 class="text-2xl mb-1">${tutor.name}</h1>
            <p class="text-gray-600 mb-2">${tutor.subjects.map((s) => s.name).join(" · ") || "General tutoring"}</p>
            <p class="text-lg font-semibold text-accent-600 mb-3">${tutor.hourly_rate ? `AED ${Number(tutor.hourly_rate).toFixed(0)} / hour` : "Rate on request"}</p>
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="badge bg-white border border-gray-200">${formatMode(tutor.teaching_mode)}</span>
              <span class="badge bg-white border border-gray-200">${tutor.experience_years} yrs experience</span>
              ${tutor.languages.map((l) => `<span class="badge bg-white border border-gray-200">${l.name}</span>`).join("")}
            </div>
            <div class="flex gap-3">
              <button id="contact-tutor-btn" class="btn-primary">Contact Tutor</button>
              <button class="btn-outline">Save ♡</button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-[1fr_320px] gap-8">
        <div class="space-y-8">
          <section>
            <h2 class="text-lg font-semibold text-brand-900 mb-2">Biography</h2>
            <p class="text-gray-700 leading-relaxed">${tutor.biography || "This tutor hasn't added a biography yet."}</p>
          </section>
          <section>
            <h2 class="text-lg font-semibold text-brand-900 mb-2">Qualifications</h2>
            <p class="text-gray-700">${tutor.qualification || "Not specified"}</p>
          </section>
          <section>
            <h2 class="text-lg font-semibold text-brand-900 mb-2">Experience</h2>
            <p class="text-gray-700">${tutor.experience_years} years of teaching experience.</p>
          </section>
          <section>
            <h2 class="text-lg font-semibold text-brand-900 mb-2">Subjects</h2>
            ${pillList(tutor.subjects, "name")}
          </section>
          <section>
            <h2 class="text-lg font-semibold text-brand-900 mb-2">Teaching Levels</h2>
            ${pillList(tutor.teaching_levels, "level_name")}
          </section>
        </div>
        <aside>
          <h2 class="text-lg font-semibold text-brand-900 mb-3">Similar Tutors</h2>
          <div id="similar-tutors" class="space-y-4">
            <p class="text-sm text-gray-500">Loading…</p>
          </div>
        </aside>
      </div>
    `;

    document.getElementById("contact-tutor-btn").addEventListener("click", () => {
      window.openInquiryModal(tutor.id, tutor.name);
    });

    loadSimilarTutors(tutor);
  } catch (err) {
    content.innerHTML = `<p class="text-red-600">Tutor not found or not currently available.</p>`;
  }
}

loadTutorProfile();
