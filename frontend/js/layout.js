// Injects the shared header/footer (see wireframe page "Shared Footer & Components")
// into every page. No templating engine — just template literals, since the
// site has no build step for HTML.

function headerHtml() {
  const user = window.auth ? window.auth.getUser() : null;
  const isTutor = user && user.role === "tutor";
  const isAdmin = user && user.role === "admin";

  const logoutButton = `<button id="logout-btn" class="btn-outline !py-2 !px-3">Logout</button>`;
  const rightLinks = !user
    ? `<a href="/login.html" class="btn-outline !py-2 !px-3">Login</a>`
    : isAdmin
      ? `<a href="/admin/index.html" class="nav-link">Admin Dashboard</a> ${logoutButton}`
      : isTutor
        ? `<a href="/dashboard.html" class="nav-link">Dashboard</a> ${logoutButton}`
        : `<a href="/account.html" class="nav-link">My Account</a> ${logoutButton}`;

  return `
  <header class="border-b border-gray-200 bg-white sticky top-0 z-40">
    <div class="container-page flex h-16 items-center justify-between gap-4">
      <a href="/index.html" class="flex items-center gap-2 font-extrabold text-brand-900 text-lg">
        <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 text-white text-sm">TH</span>
        TutorHub <span class="text-accent-600">UAE</span>
      </a>
      <nav class="hidden md:flex items-center gap-6">
        <a href="/index.html" class="nav-link">Home</a>
        <a href="/search.html" class="nav-link">Search Tutors</a>
        <a href="/register.html" class="nav-link">Become a Tutor</a>
        <a href="/how-it-works.html" class="nav-link">How It Works</a>
        <a href="/about.html" class="nav-link">About</a>
        <a href="/contact.html" class="nav-link">Contact</a>
      </nav>
      <div class="hidden md:flex items-center gap-3">${rightLinks}</div>
      <button id="mobile-menu-toggle" class="md:hidden inline-flex items-center justify-center rounded-md border border-gray-300 h-10 w-10" aria-label="Open menu">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 bg-white">
      <div class="container-page py-4 flex flex-col gap-3">
        <a href="/index.html" class="nav-link">Home</a>
        <a href="/search.html" class="nav-link">Search Tutors</a>
        <a href="/register.html" class="nav-link">Become a Tutor</a>
        <a href="/how-it-works.html" class="nav-link">How It Works</a>
        <a href="/about.html" class="nav-link">About</a>
        <a href="/contact.html" class="nav-link">Contact</a>
        <div class="pt-2 border-t border-gray-100 flex flex-col gap-2">${rightLinks}</div>
      </div>
    </div>
  </header>`;
}

function footerHtml() {
  const year = new Date().getFullYear();
  return `
  <footer class="bg-brand-900 text-brand-100 mt-16">
    <div class="container-page py-12 grid grid-cols-2 gap-8 md:grid-cols-5">
      <div class="col-span-2 md:col-span-1">
        <div class="flex items-center gap-2 font-extrabold text-white text-lg mb-3">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-brand-900 text-sm">TH</span>
          TutorHub UAE
        </div>
        <p class="text-sm text-brand-300">Connecting students and parents with qualified private tutors across the UAE.</p>
      </div>
      <div>
        <h4 class="text-white text-sm font-semibold mb-3">Platform</h4>
        <ul class="space-y-2 text-sm">
          <li><a href="/search.html" class="hover:text-white">Search Tutors</a></li>
          <li><a href="/register.html" class="hover:text-white">Become a Tutor</a></li>
          <li><a href="/how-it-works.html" class="hover:text-white">How It Works</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white text-sm font-semibold mb-3">Company</h4>
        <ul class="space-y-2 text-sm">
          <li><a href="/about.html" class="hover:text-white">About Us</a></li>
          <li><a href="/contact.html" class="hover:text-white">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white text-sm font-semibold mb-3">Legal</h4>
        <ul class="space-y-2 text-sm">
          <li><a href="/privacy.html" class="hover:text-white">Privacy Policy</a></li>
          <li><a href="/terms.html" class="hover:text-white">Terms &amp; Conditions</a></li>
          <li><a href="/faq.html" class="hover:text-white">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white text-sm font-semibold mb-3">Language</h4>
        <div class="flex gap-2 text-sm">
          <button class="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white" disabled>EN</button>
          <button class="rounded-md px-3 py-1.5 text-brand-300" disabled title="Arabic coming soon">AR</button>
        </div>
        <p class="text-xs text-brand-400 mt-2">Arabic (RTL) support is planned for a future release.</p>
      </div>
    </div>
    <div class="border-t border-white/10 py-4">
      <p class="container-page text-xs text-brand-400">&copy; ${year} TutorHub UAE. All rights reserved.</p>
    </div>
  </footer>`;
}

function renderLayout() {
  const headerEl = document.getElementById("app-header");
  const footerEl = document.getElementById("app-footer");
  if (headerEl) headerEl.innerHTML = headerHtml();
  if (footerEl) footerEl.innerHTML = footerHtml();

  const toggle = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("hidden"));
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => window.auth.logout());
  }
}

document.addEventListener("DOMContentLoaded", renderLayout);
