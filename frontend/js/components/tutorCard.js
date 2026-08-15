function formatMode(mode) {
  return { online: "Online", in_person: "In-person", both: "Online & In-person" }[mode] || "";
}

function tutorCardHtml(tutor) {
  const subjects = tutor.subjects.slice(0, 3).map((s) => s.name).join(", ") || "General tutoring";
  const location = tutor.locations && tutor.locations[0] ? `${tutor.locations[0].area}, ${tutor.locations[0].city}` : "UAE-wide";
  const rate = tutor.hourly_rate ? `AED ${Number(tutor.hourly_rate).toFixed(0)}/hr` : "Rate on request";
  const photo = tutor.profile_photo
    ? `<img src="${window.api.base}${tutor.profile_photo}" alt="${tutor.name}" class="h-16 w-16 rounded-full object-cover bg-gray-100" />`
    : `<div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-semibold text-lg">${tutor.name.charAt(0)}</div>`;

  return `
  <div class="card p-5 flex gap-4">
    ${photo}
    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-brand-900 truncate">${tutor.name}</h3>
      <p class="text-sm text-gray-600 truncate">${subjects}</p>
      <p class="text-xs text-gray-500 mt-1">${location} &middot; ${formatMode(tutor.teaching_mode)}</p>
      <p class="text-sm font-semibold text-accent-600 mt-1">${rate}</p>
      <a href="/tutor.html?id=${tutor.id}" class="btn-primary !py-2 !px-3 mt-3 text-xs">View Profile</a>
    </div>
  </div>`;
}

window.tutorCardHtml = tutorCardHtml;
