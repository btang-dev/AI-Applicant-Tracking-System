# RoleLume

**Illuminate your fit for every role.**

RoleLume is an AI-powered resume analyzer and applicant tracking companion. Upload
your resume as a PDF along with the job you're targeting, and RoleLume scores it
against applicant tracking system (ATS) criteria and gives you specific,
category-by-category feedback on what to fix before you apply.

**Live app:** [rolelume.vercel.app](https://rolelume.vercel.app/)

---

## What it does

- **Job-targeted resume analysis**: enter the company name, job title, and job
  description, then upload your resume. The feedback is tailored to that role,
  not generic resume advice.
- **ATS score and overall score**: every resume gets an overall score from 0 to 100
  plus a dedicated ATS suitability score with "good" and "improve" suggestions.
- **Category breakdowns**: separate scores and detailed tips for **Tone & Style**,
  **Content**, **Structure**, and **Skills**, each shown in an expandable
  accordion with a short title and a longer explanation.
- **Application dashboard**: a signed-in dashboard (`/home`) lists every resume
  you've analyzed, with its target company, role, preview, and score, so you can
  track versions across applications.
- **Side-by-side review**: the review page (`/resume/:id`) shows a high-resolution
  preview of your resume next to its feedback, and clicking the preview opens the
  original PDF.
- **Private, per-user storage**: resumes, previews, and results are stored in the
  user's own Puter cloud account. The app has no backend database of its own.
- **Data reset**: `/wipe` lists the user's stored files and clears all app data
  in one step.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [React Router v8](https://reactrouter.com/) (framework mode, SSR) with React 19 |
| Language | TypeScript |
| Build tooling | Vite 8 |
| Styling | Tailwind CSS v4, `tw-animate-css`, `clsx` + `tailwind-merge` |
| Animation | GSAP with ScrollTrigger (`@gsap/react`) on the landing page |
| State management | Zustand |
| Auth, storage, and AI | [Puter.js](https://docs.puter.com/): auth, cloud file system, key-value store, and AI chat |
| AI model | Anthropic Claude Sonnet 5 (`anthropic/claude-sonnet-5`), called through Puter |
| PDF rendering | PDF.js (`pdfjs-dist`) |
| File upload | `react-dropzone` (PDF only, up to 20 MB) |
| Hosting and monitoring | Vercel, Vercel Analytics, Vercel Speed Insights |
| Containerization | Multi-stage Docker image based on `node:24-alpine` |
| Testing | Node's built-in test runner (`node --test`) |

## How the AI feedback pipeline works

The whole pipeline runs in the browser. Puter.js handles authentication, storage,
and model access on the user's behalf, so the app needs no server-side API keys.

```
 PDF resume + job details
          │
          ▼
 1. Validate      ── PDF only (react-dropzone, ≤ 20 MB)
          │
          ▼
 2. Upload PDF    ── puter.fs.upload → user's Puter cloud storage
          │
          ▼
 3. Render preview ── PDF.js renders page 1 at 4× scale → PNG
          │
          ▼
 4. Upload PNG    ── puter.fs.upload
          │
          ▼
 5. Save draft    ── puter.kv.set("resume:<uuid>", {paths, job info, empty feedback})
          │
          ▼
 6. Analyze       ── puter.ai.chat with the PDF file + prompt
          │           model: anthropic/claude-sonnet-5
          ▼
 7. Extract text  ── pull text out of whichever response shape the provider returns
          │
          ▼
 8. Parse + normalize ── strip code fences, isolate the JSON object,
          │                clamp scores, fill missing categories
          ▼
 9. Save result   ── puter.kv.set("resume:<uuid>", {..., feedback})
          │
          ▼
10. Redirect      ── /resume/<uuid> renders Summary, ATS, and Details
```

### 1. Prompting

[`constants/index.ts`](constants/index.ts) builds the prompt with
`prepareInstructions()`. The prompt asks the model to act as an ATS and resume
expert, to be candid (including giving low scores when they're deserved), and to
use the supplied job title and description. It includes a TypeScript `Feedback`
interface (`AIResponseFormat`) as the exact response schema and tells the model
to return only raw JSON.

### 2. Model call

[`app/lib/puter.ts`](app/lib/puter.ts) exposes `ai.feedback(path, message)`. It
sends one user message containing two content blocks: a `file` block that points
to the uploaded PDF by its Puter path, and a `text` block with the prompt. Because
Claude reads the original PDF directly, the analysis isn't limited to text that
OCR could extract from an image.

### 3. Defensive parsing and normalization

LLM output isn't always perfectly shaped, so
[`app/lib/feedback.ts`](app/lib/feedback.ts) hardens the result before it's
saved:

- `parseFeedbackText` strips Markdown code fences, then slices from the first `{`
  to the last `}` so stray text around the JSON doesn't break parsing.
- `normalizeScore` coerces every score to an integer from 0 to 100. Non-numeric
  values become `0`.
- `normalizeFeedback` accepts common key variants (`overall_score`,
  `tone_and_style`, `ats`, and so on) and fills any missing category with
  `{ score: 0, tips: [] }`.
- Each tip falls back from `tip` to `title` and from `explanation` to `details`.
  Empty tips are dropped, and unknown tip types default to `"improve"`.

The upload page also tracks which stage is running (uploading, converting,
analyzing, parsing, saving) so a failure shows the user exactly which step went
wrong.

### Feedback schema

```ts
interface Feedback {
  overallScore: number;            // 0–100
  ATS:          { score: number; tips: { type: "good" | "improve"; tip: string }[] };
  toneAndStyle: { score: number; tips: { type: "good" | "improve"; tip: string; explanation: string }[] };
  content:      { /* same shape as toneAndStyle */ };
  structure:    { /* same shape as toneAndStyle */ };
  skills:       { /* same shape as toneAndStyle */ };
}
```

## Routes

| Path | Description |
| --- | --- |
| `/` | Landing page with Puter sign-in and GSAP scroll animations. Redirects to a safe `?next=` path after sign-in. |
| `/home` | Dashboard of analyzed resumes (requires sign-in) |
| `/upload` | Job details form, resume upload, and analysis (requires sign-in) |
| `/resume/:id` | Resume preview with score summary, ATS tips, and detailed feedback |
| `/wipe` | Lists stored files and clears all app data |
| `/auth` | Legacy route that redirects to `/` and keeps the query string |

## Project structure

```
app/
├── components/   # UI: ATS, Summary, Details, Accordion, ScoreCircle/Gauge/Badge,
│                 #     ResumeCard, FileUploader, Navbar, TopNotice
├── lib/
│   ├── puter.ts     # Zustand store wrapping Puter auth, fs, kv, and ai
│   ├── feedback.ts  # AI response parsing and normalization
│   ├── pdf2img.ts   # PDF.js first-page → PNG preview
│   ├── brand.ts     # Site name and description
│   └── utils.ts     # UUIDs, error messages, helpers
├── routes/       # landing, home, upload, resume, wipe, auth
├── root.tsx      # App shell, error boundary, Vercel Analytics and Speed Insights
└── routes.ts     # Route config
constants/        # AI prompt builder and response schema
types/            # Shared Resume/Feedback and Puter type declarations
tests/            # Node test suite for feedback normalization
```

## Deployment

The live app is deployed on **Vercel** at
[rolelume.vercel.app](https://rolelume.vercel.app/), with Vercel Analytics and
Speed Insights enabled in `app/root.tsx`.
