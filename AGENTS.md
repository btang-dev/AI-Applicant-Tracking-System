# Codex Project Guidance

This file defines the working agreements for Codex in this repository. It applies
to the entire repository unless a more deeply nested `AGENTS.md` overrides it.

## Accuracy, recency, and sourcing (required)

When a request depends on recency (for example, "latest", "current", "today",
or "as of now"):

1. Establish the current date and time and state it explicitly in ISO 8601
   format. Use an appropriate system command such as `Get-Date -Format o` in
   PowerShell or `date -Is` in a POSIX shell.
2. Prefer official, primary sources, including upstream vendor documentation for
   runtimes, frameworks, libraries, and cloud providers.
3. Prefer the newest authoritative versioned documentation, release notes, or
   changelog.
4. Cross-check at least two reputable sources when details are sensitive for
   safety or compatibility.

### Context7 MCP

- Use Context7 when library or API documentation is needed.
- When known, pin the library with slash syntax (for example,
  `use library /supabase/supabase`).
- State the target version.
- Retrieve only the minimal, targeted documentation needed and summarize it
  instead of copying large sections.

### Web search policy

- Use web search only when it materially improves correctness, such as for
  current APIs, recent advisories, or release notes.
- Prefer official documentation and primary sources. Otherwise, use Context7 or
  reputable, widely cited references.
- Record relevant publication or release dates.

## Default autonomy and safety

- Begin with read-only exploration and analysis.
- Keep necessary edits workspace-scoped and inside this repository.
- Use read-only operations when interacting with remote APIs unless the user
  explicitly requests a write.
- Before a user-requested remote API write, perform a dry run when the API
  supports one. If no dry-run facility exists, explain that limitation before
  making the write.
- Never make destructive calls to remote APIs or production data sources.

### Editing files

- Make the smallest safe change that solves the issue.
- Preserve existing style and conventions.
- Prefer small, reviewable patch-style edits over full-file rewrites.
- After changes, run the project's standard checks when feasible: build,
  typecheck, tests, and formatting or linting when configured.
- Preserve unrelated user changes in the working tree.

### Reading project documents

For PDFs, uploads, long-form text, CSV files, and similar source documents:

1. Read the complete source before drafting.
2. Draft the requested output.
3. Re-read the original before finalizing to verify factual accuracy, ensure no
   details were invented, and preserve wording and style unless rewriting was
   requested.
4. Label required paraphrases explicitly as paraphrases.

### Container-first policy (required)

- Never install system packages on the host unless the user explicitly asks.
- Prefer container images to provide project tooling.
- Use containers by default for project code and dependencies.
- Follow the repository's existing container workflow.
- If a repository has no container workflow, create a minimal one when tooling
  is required.
- Keep repository-specific container instructions in this file.

This repository already provides a multi-stage `Dockerfile` based on
`node:24-alpine`. Use it as the default dependency, build, and runtime
environment:

```powershell
docker build -t ai-applicant-tracking-system .
docker run --rm -p 3000:3000 ai-applicant-tracking-system
```

For targeted validation in the existing development-dependency stage:

```powershell
docker build --target development-dependencies-env -t ai-ats-dev .
docker run --rm ai-ats-dev npm test
docker run --rm ai-ats-dev npm run typecheck
docker run --rm ai-ats-dev npm run build
```

Do not add a second container workflow unless the task requires it.

### Secrets and sensitive data

- Never print tokens, private keys, credentials, or other secrets in terminal
  output.
- Do not ask users to paste secrets.
- Avoid commands that broadly expose sensitive data, such as dumping all
  environment variables or reading SSH key directories.
- Prefer existing authenticated command-line tools.
- Redact sensitive strings from displayed output.

## Baseline workflow

At the start of every task, determine:

1. The goal and acceptance criteria.
2. Constraints involving time, safety, and scope.
3. Which files, commands, tests, and documentation must be inspected.
4. Whether the request depends on recency; if it does, apply the accuracy,
   recency, and sourcing rules above.
5. Whether ambiguity remains. Ask targeted questions before irreversible
   changes when a safe, reasonable assumption cannot resolve it.

## Continuity file (required)

Maintain one canonical workspace briefing at `.agent/CONTINUITY.md`.

- Read `.agent/CONTINUITY.md` at the start of each assistant turn before acting.
- Do not rely on earlier chat or tool output unless meaningful task state is
  reflected there.
- Update it only when there is a meaningful change in plans, decisions,
  progress, discoveries, or outcomes.

Use these sections:

- `[PLANS]`: concise plans and useful next-contributor checklists.
- `[DECISIONS]`: decisions made and their relevant rationale.
- `[PROGRESS]`: material course changes during implementation, including why
  they happened and their implications.
- `[DISCOVERIES]`: optimizer behavior, performance tradeoffs, unexpected bugs,
  inverse or unapply semantics, and other findings that shaped the approach.
  Include short evidence snippets such as test results when useful.
- `[OUTCOMES]`: major-task or final results, remaining work, and lessons learned.

### Continuity anti-drift and anti-bloat rules

- Record facts only; do not include transcripts or raw logs.
- Every entry must include an ISO 8601 timestamp and one provenance tag:
  `[USER]`, `[CODE]`, `[TOOL]`, or `[ASSUMPTION]`.
- Write `UNCONFIRMED` for unknown details rather than guessing.
- Supersede changed facts explicitly instead of silently rewriting history.
- Keep the file short and high-signal.
- Compress older entries into `[MILESTONE]` bullets when sections become
  bloated.

## Project validation

The scripts currently defined in `package.json` are:

- `npm test` for the Node test suite.
- `npm run typecheck` for React Router type generation and TypeScript checking.
- `npm run build` for the production React Router build.
- `npm run dev` for the local development server.
- `npm run start` for serving the production build.

No lint or formatting script is currently configured. Do not claim those checks
were run unless a task adds the relevant tooling.

## Definition of done

A task is complete when:

- The requested change is implemented or the question is answered.
- Verification is provided:
  - a build was attempted when source code changed;
  - configured tests and typechecks were run as applicable;
  - linting and formatting were run when configured;
  - errors and warnings were fixed or clearly reported as out of scope.
- Documentation is updated for all impacted areas.
- The final response explains what changed, where, and why.
- Follow-up work is listed when anything was intentionally left incomplete.
- `.agent/CONTINUITY.md` is updated when the task materially changes goals,
  state, plans, decisions, discoveries, progress, or outcomes.
