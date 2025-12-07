# Pathways (LectureAssistant)

Pathways is an AI-assisted Learning Management System (LMS) built as part of the LectureAssistant project.

This README is split into two clear parts:
- What the application does (user-facing / product features)
- How the application is implemented (technical components and local dev notes)

## What the application does (product features)

Pathways helps educators and organizations run classrooms, monitor learners, assign and grade work, and apply AI-assisted insights. Key capabilities:

- **Multi-tenant organization support:** Manage schools or organizations with isolated data and role-based access for admins, teachers, and students. Including email confirmation and whitelists.
 
- **Classroom & roster management:** Create classes, enroll students, assign teachers, and manage schedules.
- **Attendance tracking:** Record attendance and export attendance reports for classes and terms.
- **Assignments & homework:** Create assignments, attach resources, collect student submissions, and track due dates.
- **Quizzes & automated grading:** Deliver multiple-choice and auto-gradable quizzes; capture results and basic analytics.
- **Assignment grading & feedback:** Grade open responses using teacher workflows and provide feedback to students.
- **Student profiles & progress tracking:** View progress dashboards per student (grades, attendance, completed work).
- **AI-powered support and monitoring:** Agentic AI features for profile insights (e.g., learning recommendations, anomaly detection, content search using vector indices).

User workflows (examples):
- Teacher: create class → add assignments → grade submissions → review analytics
- Student: view class → complete assignment → take quiz → receive feedback

Notes about scope: some advanced AI features (agentic workflows, large-scale analytics) depend on configured services and vector data; they may need additional setup or cloud credentials to activate.

## How it's built (technical overview)

This section describes the pieces present in the repository and how to run them locally. It intentionally separates implementation details from the feature description above.

- `App/backend/` — Django project providing REST APIs, admin UI, media serving, and the business logic for classrooms, assignments, grading, and user management. Uses SQLite by default for local development.
- `App/pathways/` — Next.js frontend that provides the UI components, pages, and client integration with the backend APIs.
- `App/LectureCreator/` — Python utilities/scripts for preparing lecture materials (text generation or other assets). May reference cloud credentials; treat any service account files as secrets.
- `App/vector_data/` — Pre-built vector search artifacts (FAISS index + JSON store). Used for semantic search and content recommendations when enabled.
- CI/CD and hosting: there are GitHub Actions workflows under `.github/workflows/` and some Firebase config files in the frontend; review those workflows before enabling upstream deployments.

Important notes about repo contents
- If you see a service account JSON or other credential file (e.g., in `LectureCreator/`), remove it from version control and replace it with an example file; keep credentials in secure storage.
- Some scripts like `deletedb.sh` or `run.sh` are shell scripts intended for Unix environments — on Windows, use equivalent PowerShell commands as shown below.

## Quick start (development)

These commands assume you're on Windows using PowerShell. Run backend and frontend in separate terminals.

Backend (Django):

```powershell
cd App\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Frontend (Next.js):

```powershell
cd App\pathways
npm install
npm run dev
```

Connect the frontend to the backend by setting the API URL in `App/pathways/backendUrl.js` or `App/pathways/.env.local` to `http://localhost:8000`.

## Files & commands referenced in this repo
- `App/backend/requirements.txt` — Python deps for the backend
- `App/backend/manage.py` — Django management entrypoint
- `App/pathways/package.json` — frontend scripts (dev, build, start)
- `App/dockerfile` — single Dockerfile found at repo root (adapt as needed)
- `.github/workflows/` — CI workflows (examine before enabling deploys)

## Security & credentials

- Do NOT commit secrets or service account keys. If a service account file is present, it should be removed and replaced by a `.example` file. Add such sensitive paths to `.gitignore`.
- For local testing of AI or cloud integrations, provide credentials via environment variables or a secure local path that is excluded from Git.

## Contributing

- Branch from `main` for features/fixes. Open PRs with a clear description and tests if applicable.
- Backend tests: `python manage.py test` (run from `App/backend`).
- Frontend: follow the React/Next.js component patterns in `App/pathways/components/` and run `npm run lint` / `npm run test` if configured.

## Maintainer

- maintainer: Brad Gardea



