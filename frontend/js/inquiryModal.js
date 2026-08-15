// Inquiry modal (wireframe page "Inquiry Modal — overlay from tutor profile").
// Injected once per page and opened via openInquiryModal(tutorId, tutorName).

function inquiryModalHtml() {
  return `
  <div id="inquiry-modal" class="hidden fixed inset-0 z-50 items-center justify-center p-4 bg-black/50">
    <div class="card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
      <button id="inquiry-modal-close" class="absolute top-4 right-4 h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50" aria-label="Close">&times;</button>
      <h3 class="text-lg font-bold text-brand-900">Contact Tutor</h3>
      <p class="text-sm text-gray-600 mb-4">Send a message to <span id="inquiry-tutor-name" class="font-medium"></span></p>
      <form id="inquiry-form" class="space-y-4">
        <input type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" />
        <div>
          <label class="form-label">Name</label>
          <input required name="student_name" type="text" class="form-input" />
        </div>
        <div>
          <label class="form-label">Email</label>
          <input required name="student_email" type="email" class="form-input" />
        </div>
        <div>
          <label class="form-label">Phone (optional)</label>
          <input name="student_phone" type="tel" class="form-input" />
        </div>
        <div>
          <label class="form-label">Subject Needed</label>
          <select name="subject" class="form-select" id="inquiry-subject-select">
            <option value="">Select…</option>
          </select>
        </div>
        <div>
          <label class="form-label">Message</label>
          <textarea required name="message" rows="4" class="form-textarea" placeholder="Tell the tutor about your needs..."></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" id="inquiry-cancel" class="btn-outline flex-1">Cancel</button>
          <button type="submit" class="btn-primary flex-1">Send Inquiry</button>
        </div>
        <p class="text-xs text-gray-500">By sending, you agree to our <a href="/privacy.html" class="underline">Privacy Policy</a>. Your details are only shared with this tutor.</p>
      </form>
    </div>
  </div>`;
}

let currentTutorId = null;

async function initInquiryModal() {
  if (document.getElementById("inquiry-modal")) return;
  document.body.insertAdjacentHTML("beforeend", inquiryModalHtml());

  const modal = document.getElementById("inquiry-modal");
  const closeModal = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  document.getElementById("inquiry-modal-close").addEventListener("click", closeModal);
  document.getElementById("inquiry-cancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  try {
    const subjects = await window.api.get("/api/subjects");
    const select = document.getElementById("inquiry-subject-select");
    subjects.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name;
      select.appendChild(opt);
    });
  } catch (_) {
    // subject dropdown is a nice-to-have; ignore failures
  }

  document.getElementById("inquiry-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());
    data.tutor_id = currentTutorId;

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    try {
      await window.api.post("/api/inquiries", data);
      window.showToast("Inquiry sent! The tutor will be in touch soon.", "success");
      form.reset();
      closeModal();
    } catch (err) {
      window.showToast(err.message || "Could not send inquiry", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Inquiry";
    }
  });
}

async function openInquiryModal(tutorId, tutorName) {
  await initInquiryModal();
  currentTutorId = tutorId;
  document.getElementById("inquiry-tutor-name").textContent = tutorName;
  const modal = document.getElementById("inquiry-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

window.openInquiryModal = openInquiryModal;
