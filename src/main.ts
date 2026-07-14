import "./style.css";
import {
  canvas,
  courses,
  githubRepo,
  phases,
  targetNode,
  type Course,
  type Progress,
} from "./roadmap";

interface GitHubIssue {
  title: string;
  body: string | null;
  html_url: string;
  updated_at: string;
  pull_request?: unknown;
}

interface IssueUpdate {
  progress: Progress;
  note: string;
  url: string;
  updatedAt: string;
}

const repoUrl = `https://github.com/${githubRepo}`;
const courseById = new Map(courses.map((course) => [course.id, course]));
const progress = new Map(courses.map((course) => [course.id, course.progress]));
const issueUpdates = new Map<string, IssueUpdate>();
const localProgress = new Map<string, Progress>();
const progressStorageKey = "fundamentals-first-progress-v1";
let accessFilter = "all";
let searchQuery = "";
let activeCourseId: string | null = null;

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!,
  );

const progressLabel: Record<Progress, string> = {
  planned: "Planned",
  "in-progress": "In progress",
  completed: "Completed",
  paused: "Paused",
};

try {
  const saved = JSON.parse(localStorage.getItem(progressStorageKey) ?? "{}") as Record<string, string>;
  for (const [id, state] of Object.entries(saved)) {
    if (courseById.has(id) && ["planned", "in-progress", "completed", "paused"].includes(state)) {
      localProgress.set(id, state as Progress);
      progress.set(id, state as Progress);
    }
  }
} catch {
  localStorage.removeItem(progressStorageKey);
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("Missing #app root.");

app.innerHTML = `
  <header class="site-header">
    <nav class="navbar mx-auto max-w-7xl px-4 sm:px-6" aria-label="Primary navigation">
      <a class="brand" href="#top" aria-label="Fundamentals First home">
        <span class="brand-mark" aria-hidden="true">ff</span>
        <span>fundamentals<span class="text-emerald-400">.first</span></span>
      </a>
      <div class="ml-auto flex items-center gap-2">
        <span id="sync-state" class="sync-state" title="Progress is read from public GitHub Issues">
          <span class="status status-info status-xs" aria-hidden="true"></span>
          Syncing Issues
        </span>
        <a class="btn btn-ghost btn-sm hidden sm:inline-flex" href="#method">Method</a>
        <a class="btn btn-neutral btn-sm" href="${repoUrl}" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
    </nav>
  </header>

  <main id="top">
    <section class="hero-section">
      <div class="hero-grid mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div class="hero-copy">
          <p class="kicker"><span></span> A fundamentals track for curious CS students</p>
          <h1>Learn the machine.<br /><em>Then improve it.</em></h1>
          <p class="hero-lede">
            A prerequisite-driven path through the foundations of computer science—built for understanding, not course collecting.
          </p>
          <div class="profile-strip" aria-label="Roadmap focus">
            <span>C + memory</span><span>Math</span><span>ML / AI</span><span>Linux</span><span>Java backend</span>
          </div>
          <div class="mt-8 flex flex-wrap gap-3">
            <a class="btn btn-primary" href="#roadmap">Explore the roadmap ↓</a>
            <a class="btn btn-ghost border border-white/10" href="#current-focus">See what to do now</a>
          </div>
        </div>
        <aside class="principle-card" aria-label="Roadmap principle">
          <div class="principle-index">01 / PRINCIPLE</div>
          <blockquote>“Do not learn tools as answers. Learn the constraints that made the tools necessary.”</blockquote>
          <div class="principle-rule"></div>
          <p>No genius mythology. No ten-course parallel sprint. One layer understood well enough to build the next.</p>
          <dl class="roadmap-stats">
            <div><dt>${courses.length}</dt><dd>courses</dd></div>
            <div><dt>2–3y</dt><dd>horizon</dd></div>
            <div><dt>10–12h</dt><dd>per week</dd></div>
          </dl>
        </aside>
      </div>
    </section>

    <section id="current-focus" class="focus-section">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p class="section-kicker">Suggested starting point</p>
          <h2>Finish before adding.</h2>
          <p class="mt-4 max-w-md text-base-content/65">Close courses already in progress before adding more. A strong default is one build-heavy course paired with one math or theory course.</p>
        </div>
        <ol class="focus-steps">
          <li>
            <span>01</span>
            <div><strong>Learn the missing tools</strong><p>Turn a Linux environment into something you can inspect, reproduce, and repair.</p></div>
            <button data-open-course="missing-semester" class="btn btn-ghost btn-sm" type="button">Open →</button>
          </li>
          <li>
            <span>02</span>
            <div><strong>Finish Composing Programs</strong><p>Complete the interpreter work; do not replace it with another Python course.</p></div>
            <button data-open-course="composing-programs" class="btn btn-ghost btn-sm" type="button">Open →</button>
          </li>
          <li>
            <span>03</span>
            <div><strong>Then pair C with one math course</strong><p>C & Memory plus Mathematics for CS is the recommended next six-to-eight week block.</p></div>
            <button data-open-course="c-foundations" class="btn btn-ghost btn-sm" type="button">Open →</button>
          </li>
        </ol>
      </div>
    </section>

    <section id="roadmap" class="roadmap-section" aria-labelledby="roadmap-title">
      <div class="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6">
        <div class="roadmap-heading">
          <div>
            <p class="section-kicker">Prerequisite map</p>
            <h2 id="roadmap-title">Every edge must earn its node.</h2>
            <p>Arrows mean “understand this first.” A dashed arrow marks a useful optional companion.</p>
          </div>
          <div class="roadmap-controls">
            <label class="input input-bordered flex items-center gap-2 bg-base-200/70">
              <span aria-hidden="true">⌕</span>
              <input id="course-search" type="search" class="grow" placeholder="Search courses or topics" autocomplete="off" />
            </label>
            <div class="filter-group" aria-label="Filter by access">
              <button type="button" data-access-filter="all" aria-pressed="true">All</button>
              <button type="button" data-access-filter="free" aria-pressed="false">Free</button>
              <button type="button" data-access-filter="mixed" aria-pressed="false">Paid / mixed</button>
            </div>
          </div>
        </div>
        <div class="legend-row">
          <div><span class="legend-line free"></span> Free primary material</div>
          <div><span class="legend-line mixed"></span> Paid labs / mixed access</div>
          <div><span class="legend-line edge"></span> Required prerequisite</div>
          <div><span class="legend-line optional"></span> Optional companion</div>
          <div class="shortcut-legend"><kbd>Right-click</kbd> Done ↔ Planned · hover + <kbd>P</kbd>/<kbd>R</kbd>/<kbd>D</kbd></div>
          <span id="result-count" class="ml-auto"></span>
        </div>
      </div>

      <div class="roadmap-viewport" tabindex="0" aria-label="Scrollable computer science course roadmap">
        <div id="roadmap-stage" class="roadmap-stage" style="width: ${canvas.width}px; height: ${canvas.height}px">
          ${phases
            .map(
              (phase) => `
                <div class="phase-marker" style="top: ${phase.top}px">
                  <span>${escapeHtml(phase.label)}</span>
                </div>`,
            )
            .join("")}
          <svg id="edge-layer" class="edge-layer" width="${canvas.width}" height="${canvas.height}" aria-hidden="true"></svg>
          <div id="course-layer"></div>
          <article class="target-node" data-target-id="${targetNode.id}" style="left: ${targetNode.position.x}px; top: ${targetNode.position.y}px">
            <span class="target-spark" aria-hidden="true">✦</span>
            <p>Long-term target</p>
            <h3>${escapeHtml(targetNode.title)}</h3>
            <div>${escapeHtml(targetNode.summary)}</div>
          </article>
        </div>
      </div>
      <p class="swipe-hint">← Drag or shift-scroll to explore the full map →</p>
    </section>

    <section id="method" class="method-section">
      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div class="method-heading">
          <div><p class="section-kicker">The operating system</p><h2>Study like an investigator.</h2></div>
          <p>The roadmap is long on purpose, but your active queue is not. Keep two courses at most: one build-heavy and one math/theory course.</p>
        </div>
        <div class="method-grid">
          <article><span>01</span><h3>Predict</h3><p>Before running code, write what you expect and why. A wrong prediction is valuable evidence.</p></article>
          <article><span>02</span><h3>Build</h3><p>Every node ends with an artifact from an empty directory—not another certificate screenshot.</p></article>
          <article><span>03</span><h3>Measure</h3><p>Use tests, profiles, proofs, and baselines. “It feels faster” is not a result.</p></article>
          <article><span>04</span><h3>Explain</h3><p>Write the trade-off and failure mode. If you cannot explain the layer below, follow the edge backward.</p></article>
        </div>
      </div>
    </section>

    <section class="issues-section">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div class="issues-card">
          <div>
            <p class="section-kicker">Static site · live progress</p>
            <h2>GitHub Issues are the update log.</h2>
            <p>The curriculum ships with the site. Your mutable status and notes come from public issues whose titles begin with <code>[roadmap]</code>. No token, server, or hidden database.</p>
          </div>
          <div class="flex flex-wrap gap-3 lg:justify-end">
            <a class="btn btn-primary" href="${repoUrl}/issues/new?title=%5Broadmap%5D%20course-id" target="_blank" rel="noreferrer">Update progress ↗</a>
            <a class="btn btn-ghost border border-white/10" href="${repoUrl}/issues/new?title=%5Bcontent%5D%20Suggested%20roadmap%20change" target="_blank" rel="noreferrer">Suggest a resource</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <span>Fundamentals First · built to be revised by evidence.</span>
      <span>TS · Tailwind · daisyUI · GitHub Pages</span>
    </div>
  </footer>

  <div id="progress-toast" class="progress-toast" role="status" aria-live="polite"></div>

  <dialog id="course-dialog" class="modal" aria-labelledby="dialog-title">
    <div class="modal-box course-dialog-panel max-w-3xl">
      <form method="dialog"><button class="btn btn-circle btn-ghost btn-sm dialog-close" aria-label="Close course details">✕</button></form>
      <div id="dialog-content"></div>
    </div>
    <form method="dialog" class="modal-backdrop"><button aria-label="Close course details">close</button></form>
  </dialog>
`;

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

const stage = requiredElement<HTMLElement>("#roadmap-stage");
const courseLayer = requiredElement<HTMLElement>("#course-layer");
const edgeLayer = requiredElement<SVGSVGElement>("#edge-layer");
const dialog = requiredElement<HTMLDialogElement>("#course-dialog");
const dialogContent = requiredElement<HTMLElement>("#dialog-content");

function isVisible(course: Course) {
  const matchesAccess = accessFilter === "all" || course.access === accessFilter;
  const haystack = [course.title, course.provider, course.summary, course.why, ...course.topics]
    .join(" ")
    .toLowerCase();
  return matchesAccess && haystack.includes(searchQuery);
}

function renderRoadmap() {
  const visible = courses.filter(isVisible);
  courseLayer.innerHTML = courses
    .map((course) => {
      const status = progress.get(course.id) ?? course.progress;
      const local = localProgress.has(course.id);
      const synced = !local && issueUpdates.has(course.id);
      return `
        <button
          type="button"
          class="course-node ${isVisible(course) ? "" : "hidden"}"
          data-course-id="${course.id}"
          data-access="${course.access}"
          data-progress="${status}"
          style="left: ${course.position.x}px; top: ${course.position.y}px"
          aria-haspopup="dialog"
          aria-label="Open ${escapeHtml(course.title)} details. Right-click toggles completed and planned."
        >
          <span class="node-topline">
            <span>${escapeHtml(course.number)} · ${escapeHtml(course.provider)}</span>
            <span class="access-pill">${course.access === "free" ? "Free" : "Mixed"}</span>
          </span>
          <strong>${escapeHtml(course.title)}</strong>
          <span class="node-summary">${escapeHtml(course.summary)}</span>
          <span class="node-footer">
            <span>${escapeHtml(course.duration)} · ${escapeHtml(course.effort)}</span>
            <span class="progress-pill">${local ? "● " : synced ? "☁ " : ""}${progressLabel[status]}</span>
          </span>
        </button>`;
    })
    .join("");

  const resultCount = document.querySelector<HTMLElement>("#result-count");
  if (resultCount) resultCount.textContent = `${visible.length} / ${courses.length} courses`;
  requestAnimationFrame(drawEdges);
}

function addEdge(fromId: string, toId: string, optional = false) {
  const from = stage.querySelector<HTMLElement>(`[data-course-id="${fromId}"]`);
  const to =
    stage.querySelector<HTMLElement>(`[data-course-id="${toId}"]`) ??
    stage.querySelector<HTMLElement>(`[data-target-id="${toId}"]`);

  if (!from || !to || from.classList.contains("hidden") || to.classList.contains("hidden")) return;

  const x1 = from.offsetLeft + from.offsetWidth / 2;
  const y1 = from.offsetTop + from.offsetHeight;
  const x2 = to.offsetLeft + to.offsetWidth / 2;
  const y2 = to.offsetTop;
  const bend = Math.max(54, (y2 - y1) * 0.42);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`);
  path.setAttribute("class", optional ? "roadmap-edge optional-edge" : "roadmap-edge");
  path.setAttribute("marker-end", optional ? "url(#arrow-optional)" : "url(#arrow)");
  path.dataset.from = fromId;
  path.dataset.to = toId;
  edgeLayer.append(path);
}

function drawEdges() {
  edgeLayer.innerHTML = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#58706a"></path>
      </marker>
      <marker id="arrow-optional" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#d69a45"></path>
      </marker>
    </defs>`;

  for (const course of courses) {
    for (const prerequisite of course.prerequisites) addEdge(prerequisite, course.id);
    for (const companion of course.optionalFrom ?? []) addEdge(companion, course.id, true);
  }

  for (const prerequisite of targetNode.prerequisites) addEdge(prerequisite, targetNode.id);
}

function issueUrl(course: Course) {
  const body = `### Course ID\n\n${course.id}\n\n### State\n\nin-progress\n\n### Note\n\nWhat changed?`;
  const query = new URLSearchParams({
    title: `[roadmap] ${course.id}`,
    labels: "roadmap-progress",
    body,
  });
  return `${repoUrl}/issues/new?${query}`;
}

function setCourseProgress(id: string, state: Progress) {
  const course = courseById.get(id);
  if (!course) return;

  localProgress.set(id, state);
  progress.set(id, state);
  localStorage.setItem(progressStorageKey, JSON.stringify(Object.fromEntries(localProgress)));
  renderRoadmap();

  const toast = document.querySelector<HTMLElement>("#progress-toast");
  if (toast) {
    toast.textContent = `${course.title} · ${progressLabel[state]}`;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1600);
  }

  if (dialog.open && dialog.dataset.courseId === id) openCourse(id);
}

function openCourse(id: string) {
  const course = courseById.get(id);
  if (!course) return;

  const prerequisites = course.prerequisites.map((prerequisite) => courseById.get(prerequisite)!);
  const next = courses.filter((candidate) => candidate.prerequisites.includes(course.id));
  const update = issueUpdates.get(course.id);
  const status = progress.get(course.id) ?? course.progress;
  dialog.dataset.courseId = id;

  dialogContent.innerHTML = `
    <div class="dialog-eyebrow">
      <span>${escapeHtml(course.number)} · ${escapeHtml(course.provider)}</span>
      <span class="dialog-access" data-access="${course.access}">${course.access === "free" ? "Free primary material" : "Free videos · paid labs"}</span>
    </div>
    <h2 id="dialog-title">${escapeHtml(course.title)}</h2>
    <p class="dialog-summary">${escapeHtml(course.summary)}</p>
    <div class="dialog-meta">
      <span>${escapeHtml(course.duration)}</span><span>${escapeHtml(course.effort)}</span><span>${progressLabel[status]}</span>
    </div>

    <section class="dialog-section"><h3>Why this is here</h3><p>${escapeHtml(course.why)}</p></section>
    <section class="dialog-section">
      <h3>What to learn</h3>
      <ol class="topic-list">${course.topics.map((topic, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(topic)}</li>`).join("")}</ol>
    </section>
    <section class="dialog-grid">
      <div><h3>Build to prove it</h3><p>${escapeHtml(course.project)}</p></div>
      <div><h3>Exit check</h3><p>${escapeHtml(course.mastery)}</p></div>
    </section>
    <section class="dialog-section">
      <h3>Official resources</h3>
      <div class="resource-list">
        ${course.resources
          .map(
            (resource) => `
              <a href="${resource.url}" target="_blank" rel="noreferrer">
                <span><strong>${escapeHtml(resource.name)}</strong><small>${escapeHtml(resource.kind)}</small></span>
                <p>${escapeHtml(resource.note)}</p><b aria-hidden="true">↗</b>
              </a>`,
          )
          .join("")}
      </div>
    </section>
    <section class="dialog-links">
      <div><h3>Requires</h3><div class="course-chips">${
        prerequisites.length
          ? prerequisites.map((item) => `<button type="button" data-open-course="${item.id}">${escapeHtml(item.title)}</button>`).join("")
          : "<span>Start here</span>"
      }</div></div>
      <div><h3>Unlocks</h3><div class="course-chips">${
        next.length
          ? next.slice(0, 5).map((item) => `<button type="button" data-open-course="${item.id}">${escapeHtml(item.title)}</button>`).join("")
          : "<span>The original work loop</span>"
      }</div></div>
    </section>
    ${
      update
        ? `<div class="issue-note"><span>Latest GitHub note · ${new Date(update.updatedAt).toLocaleDateString()}</span><p>${escapeHtml(update.note || "Status updated without a note.")}</p><a href="${update.url}" target="_blank" rel="noreferrer">View issue ↗</a></div>`
        : ""
    }
    <div class="dialog-actions">
      <a class="btn btn-primary" href="${issueUrl(course)}" target="_blank" rel="noreferrer">Update on GitHub ↗</a>
      <span>Use: planned · in-progress · completed · paused</span>
    </div>`;

  if (!dialog.open) dialog.showModal();
}

function readField(body: string, heading: string) {
  const match = body.match(new RegExp(`###\\s+${heading}\\s*\\n+([^\\n]+)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function normalizeProgress(value: string): Progress | null {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (normalized === "complete") return "completed";
  if (["planned", "in-progress", "completed", "paused"].includes(normalized)) return normalized as Progress;
  return null;
}

async function syncGitHubIssues() {
  const syncState = document.querySelector<HTMLElement>("#sync-state");
  try {
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/issues?state=all&sort=updated&direction=desc&per_page=100`,
      { headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } },
    );
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const issues = (await response.json()) as GitHubIssue[];
    for (const issue of issues) {
      if (issue.pull_request || !issue.title.toLowerCase().startsWith("[roadmap]")) continue;
      const body = issue.body ?? "";
      const id = readField(body, "Course ID") || issue.title.replace(/^\[roadmap\]\s*/i, "").trim();
      const state = normalizeProgress(readField(body, "State"));
      if (!courseById.has(id) || !state || issueUpdates.has(id)) continue;
      issueUpdates.set(id, {
        progress: state,
        note: readField(body, "Note"),
        url: issue.html_url,
        updatedAt: issue.updated_at,
      });
      if (!localProgress.has(id)) progress.set(id, state);
    }

    if (syncState) {
      syncState.innerHTML = `<span class="status status-success status-xs" aria-hidden="true"></span>${issueUpdates.size ? `${issueUpdates.size} Issue update${issueUpdates.size === 1 ? "" : "s"}` : "Issues connected"}`;
    }
    renderRoadmap();
  } catch (error) {
    if (syncState) {
      syncState.innerHTML = '<span class="status status-warning status-xs" aria-hidden="true"></span>Local baseline';
      syncState.title = error instanceof Error ? error.message : "GitHub sync unavailable";
    }
  }
}

app.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const courseButton = target.closest<HTMLElement>("[data-course-id], [data-open-course]");
  const id = courseButton?.dataset.courseId ?? courseButton?.dataset.openCourse;
  if (id) openCourse(id);

  const filter = target.closest<HTMLButtonElement>("[data-access-filter]");
  if (filter?.dataset.accessFilter) {
    accessFilter = filter.dataset.accessFilter;
    document.querySelectorAll<HTMLButtonElement>("[data-access-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === filter));
    });
    renderRoadmap();
  }
});

app.addEventListener("contextmenu", (event) => {
  const node = (event.target as HTMLElement).closest<HTMLElement>("[data-course-id]");
  const id = node?.dataset.courseId;
  if (!id) return;
  event.preventDefault();
  setCourseProgress(id, progress.get(id) === "completed" ? "planned" : "completed");
});

app.addEventListener("pointerover", (event) => {
  const node = (event.target as HTMLElement).closest<HTMLElement>("[data-course-id]");
  if (node?.dataset.courseId) activeCourseId = node.dataset.courseId;
});

app.addEventListener("pointerout", (event) => {
  const node = (event.target as HTMLElement).closest<HTMLElement>("[data-course-id]");
  if (node && !node.contains(event.relatedTarget as Node | null)) activeCourseId = null;
});

app.addEventListener("focusin", (event) => {
  const node = (event.target as HTMLElement).closest<HTMLElement>("[data-course-id]");
  if (node?.dataset.courseId) activeCourseId = node.dataset.courseId;
});

app.addEventListener("focusout", (event) => {
  const node = (event.target as HTMLElement).closest<HTMLElement>("[data-course-id]");
  if (node && !node.contains(event.relatedTarget as Node | null)) activeCourseId = null;
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    !activeCourseId ||
    dialog.open ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    (target instanceof Element && target.matches("input, textarea, select, [contenteditable='true']"))
  ) {
    return;
  }

  const shortcuts: Record<string, Progress> = { p: "in-progress", r: "planned", d: "completed" };
  const state = shortcuts[event.key.toLowerCase()];
  if (!state) return;
  event.preventDefault();
  setCourseProgress(activeCourseId, state);
});

document.querySelector<HTMLInputElement>("#course-search")?.addEventListener("input", (event) => {
  searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
  renderRoadmap();
});

window.addEventListener("resize", drawEdges);
renderRoadmap();
void syncGitHubIssues();
