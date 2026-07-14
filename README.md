# fundamentals.first

A static, fundamentals-first computer science roadmap for students who want to understand C, mathematics, Linux, systems, ML/AI, and an optional Java backend branch beneath the tools they use.

## Stack

- Vanilla TypeScript + Vite
- Tailwind CSS 4 + daisyUI 5
- Native HTML/SVG roadmap graph
- Public GitHub Issues for mutable progress and notes
- Local browser progress with right-click and keyboard shortcuts
- Vercel deployment

No application backend, database service, framework, or browser token is required.

Right-click a course to toggle **Completed ↔ Planned**. Hover or focus it and press `S` for **In progress**, `R` for **Planned/reset**, or `D` for **Completed**. Personal state is kept in `localStorage` and wins over public Issue status.

## Run locally

```bash
npm install
npm run dev
```

Checks and production build:

```bash
npm run check
npm run build
npm run preview
```

## Edit the roadmap

Course content and graph positions live in [`src/roadmap.ts`](src/roadmap.ts). Each prerequisite ID produces a directed edge. Official-resource links, pricing access, projects, topics, and exit checks are stored with the course.

## GitHub Issues as the progress database

The browser reads public issues from `chukynya/learning-guide` without authentication. The newest issue for each course wins.

```md
Title: [roadmap] c-foundations

### Course ID

c-foundations

### State

in-progress

### Note

Finished the vector and started the hash table.
```

Accepted states are `planned`, `in-progress`, `completed`, and `paused`. Course dialogs generate this body automatically. If GitHub is unavailable or rate-limited, the site keeps working with the versioned baseline.

## Deploy

Create a Vercel project with `./` as the root directory and **Vite** as the framework preset. Vercel builds the site into `dist/`.

Vite uses relative asset paths, so the build also works on other static hosts.
