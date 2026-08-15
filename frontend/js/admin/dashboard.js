const adminUser = window.auth.requireRole("admin");
renderAdminLayout("dashboard");

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function actionLabel(log) {
  const labels = {
    approve_tutor: "Tutor approved",
    reject_tutor: "Tutor rejected",
    suspend_tutor: "Tutor suspended",
    edit_tutor: "Tutor profile edited",
    create_subject: "Subject added",
    delete_subject: "Subject removed",
    create_location: "Location added",
    delete_location: "Location removed",
    create_language: "Language added",
    delete_language: "Language removed",
    create_teaching_level: "Teaching level added",
    delete_teaching_level: "Teaching level removed",
  };
  return labels[log.action] || log.action;
}

async function loadStats() {
  try {
    const stats = await window.api.get("/api/admin/stats");
    document.getElementById("stat-total-tutors").textContent = stats.total_tutors;
    document.getElementById("stat-pending").textContent = stats.pending_approvals;
    document.getElementById("stat-inquiries").textContent = stats.total_inquiries;
    document.getElementById("stat-active").textContent = stats.active_tutors;

    const chart = document.getElementById("signup-chart");
    const max = Math.max(1, ...stats.monthly_signups.map((m) => m.count));
    chart.innerHTML = stats.monthly_signups.length
      ? stats.monthly_signups
          .map((m) => {
            const heightPct = Math.max(4, Math.round((m.count / max) * 100));
            const label = new Date(`${m.month}-01`).toLocaleDateString(undefined, { month: "short" });
            return `
          <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span class="text-xs text-gray-500">${m.count}</span>
            <div class="w-full bg-brand-900 rounded-t-md" style="height:${heightPct}%"></div>
            <span class="text-xs text-gray-500">${label}</span>
          </div>`;
          })
          .join("")
      : `<p class="text-sm text-gray-500">No signups yet.</p>`;
  } catch (err) {
    window.showToast(err.message || "Could not load stats", "error");
  }
}

async function loadActivity() {
  const feed = document.getElementById("activity-feed");
  try {
    const logs = await window.api.get("/api/admin/logs", { limit: 8 });
    feed.innerHTML = logs.length
      ? logs
          .map(
            (log) => `
        <li class="flex items-start gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-accent-500 mt-2 shrink-0"></span>
          <span>
            <span class="font-medium text-gray-800">${actionLabel(log)}</span>
            <span class="text-gray-500"> — ${log.admin_name}</span>
            <br /><span class="text-xs text-gray-400">${relativeTime(log.created_at)}</span>
          </span>
        </li>`
          )
          .join("")
      : `<li class="text-gray-500">No activity yet.</li>`;
  } catch (err) {
    feed.innerHTML = `<li class="text-red-600">Could not load activity.</li>`;
  }
}

if (adminUser) {
  loadStats();
  loadActivity();
}
