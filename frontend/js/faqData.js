const FAQ_ITEMS = [
  { q: "How do I find a tutor?", a: "Use the search bar on the homepage or the Search Tutors page to filter by subject, teaching level, location, mode, language, and price range." },
  { q: "Are tutors verified?", a: "Every tutor profile is reviewed and approved by our admin team before it becomes publicly visible, based on the qualifications and experience they submit." },
  { q: "How much do lessons cost?", a: "Each tutor sets their own hourly rate, shown on their profile. Rates vary by subject, level, and experience." },
  { q: "Can I take online lessons?", a: "Yes — many tutors offer online lessons, in-person lessons, or both. Use the Mode filter on the search page to find the right fit." },
  { q: "How do I contact a tutor?", a: "Open a tutor's profile and click \"Contact Tutor\" to send them an inquiry with your details and requirements. They'll follow up directly." },
  { q: "What is the payment process?", a: "TutorHub UAE currently connects you with tutors for free — lesson fees are arranged directly between you and the tutor. Online payments through the platform are planned for a future release." },
];

function renderFaqAccordion(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = FAQ_ITEMS.map(
    (item, i) => `
    <div class="card overflow-hidden">
      <button class="faq-toggle w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800" data-index="${i}">
        ${item.q}
        <span class="faq-icon text-gray-400 transition-transform">▾</span>
      </button>
      <div class="faq-answer hidden px-4 pb-4 text-sm text-gray-600">${item.a}</div>
    </div>`
  ).join("");

  container.querySelectorAll(".faq-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const answer = btn.nextElementSibling;
      const icon = btn.querySelector(".faq-icon");
      answer.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });
  });
}

window.FAQ_ITEMS = FAQ_ITEMS;
window.renderFaqAccordion = renderFaqAccordion;
