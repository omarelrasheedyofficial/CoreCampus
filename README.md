# CampusCore LMS

University Learning Management System. Each user role has its own portal folder. Every
portal follows the same three-tier layout, and **all portals share one Supabase project**:
one Auth user pool and one PostgreSQL database.

```
CampusCore/
├── student-portal/       (frontend :5173 / API :5001) dashboard, my courses
├── lecturer-portal/      (frontend :5174 / API :5002) dashboard, my lecture sections, students, lecture materials
├── lab-teacher-portal/   (frontend :5175 / API :5003) dashboard, my lab sections, students, lab materials
└── admin-portal/         (frontend :5176 / API :5004) dashboard, users & roles, semesters, courses,
                                                       lecture/lab sections + teacher assignment, enrollments

Each portal:
├── src/        Tier 1 – React (Vite): api/ components/ config/ context/ hooks/ layouts/ pages/ routes/ utils/
├── public/
├── backend/    Tier 2 – Express: src/config, src/middleware, src/modules/<module>/{routes,controller,service,repository}
└── database/   Tier 3 – migrations/ (schema), seeds/, migrate.js, setup-storage.js
```

## Shared-code and shared-database rules

- Every portal's `database/` folder (migrations, seed, `migrate.js`, `setup-storage.js`) must be **identical**.
  Migrations are recorded by filename in `schema_migrations`, so the first portal to run a
  migration applies it and the others skip it. When the schema changes, add the new numbered
  file to **all four** portals.
- These files are also kept identical in every portal. Change them everywhere at once:
  - backend: `src/config/{env,db,supabase,storage}.js`, `src/middleware/{auth,role,error}.middleware.js`, `src/modules/auth/*`,
    and `findByAuthUserId` in `src/modules/users/users.repository.js` (the admin portal's copy adds management queries)
  - `upload.middleware.js` is shared by the portals that accept uploads (lecturer, lab teacher); it needs `multer`
  - admin-only: `src/config/identity.js` (Supabase Auth account create/delete/block) and `src/utils/validation.js`
  - frontend: `src/index.css`, `src/api/client.js`, `src/api/supabaseClient.js`, `src/context/AuthContext.jsx`,
    `src/routes/ProtectedRoute.jsx`, `src/pages/{LoginPage,NoAccessPage,NotFoundPage}.jsx`, and the generic
    components (`Alert`, `Loader`, `EmptyState`, `PageHeader`, `StatCard`, `Sidebar`, `Topbar`)
- What differs per portal: `src/config/portals.js` (`THIS_PORTAL_ROLE`/`NAME`), the layout, the pages,
  the backend role modules, the ports, and `index.html`'s title.

## First-time setup

For an already configured local installation, run `node start-all.mjs` from the
workspace root to start all four websites and APIs in one terminal. Keep that
terminal open; Ctrl+C stops the servers started by the launcher. Existing running
servers are reused. Startup logs are saved in `.runtime/`.

1. Create a free Supabase project at supabase.com.
2. For **each portal** you run (e.g. `student-portal`, `lecturer-portal`), fill in `backend/.env` from
   `backend/.env.example`. All portals use the same values except `PORT`/`CLIENT_URL`:
   - `DATABASE_URL`: Dashboard → **Connect** → *Session pooler* connection string
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API
   - `SEED_DEFAULT_PASSWORD`: any password with at least 10 characters, used for the fictional test accounts
3. Fill in the portal's frontend `.env` from `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, other portal URLs).
4. Create the schema, seed data and private storage bucket **once**, from any one portal:
   ```bash
   cd student-portal/backend
   npm install
   npm run db:migrate
   npm run db:seed
   npm run storage:setup
   ```
   `storage:setup` creates the private `course-materials` bucket (PDF only, `MAX_UPLOAD_MB`). Files are
   never public: the backend checks permissions, then reads/writes them with the service-role key.
5. Run each portal's API and frontend, each in its own terminal. For example, the lecturer portal:
   ```bash
   cd lecturer-portal/backend && npm install && npm run dev
   ```
   ```bash
   cd lecturer-portal && npm install && npm run dev
   ```
6. Sign in with any seeded account and your `SEED_DEFAULT_PASSWORD`:
   - student portal (http://localhost:5173): `student1@campuscore.test`
   - lecturer portal (http://localhost:5174): `k.mostafa@campuscore.test`
   - lab teacher portal (http://localhost:5175): `o.fathy@campuscore.test`
   - administrator portal (http://localhost:5176): `admin@campuscore.test`

`npm run build` in a portal folder fails on purpose if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing,
because a bundle built without them cannot start.

Seeded accounts (all fictional): `student1..6@campuscore.test` (student3 has no courses),
`k.mostafa@` (lecturer), `l.nabil@` (lecturer + admin), `o.fathy@` and `n.adel@` (lab teachers),
`admin@campuscore.test`.

## Deploying online over HTTPS (Render)

`render.yaml` is a Render Blueprint that creates four free Web Services, one per portal
(doc §3.6, §5.6, §6.5). Each service builds its React app and serves it from its Express API, so
each portal gets one address, e.g. `https://campuscore-student.onrender.com`. Render issues and
renews the TLS certificate and redirects `http://` to `https://`; the app adds HSTS and the other
Helmet headers. The database and file storage stay on Supabase.

1. Put the project in a **private** GitHub repository (install Git first). `.gitignore` already
   keeps every `.env` file, `node_modules/`, `dist/` and `.runtime/` out of it — check before pushing.
2. Render dashboard → **New → Blueprint** → choose the repository. Render reads `render.yaml` and
   asks for the secret values of each service; copy them from that portal's `.env` (VITE_ keys)
   and `backend/.env` (DATABASE_URL, SUPABASE_*). The portals' links to each other are filled in
   automatically.
3. Supabase → Authentication → URL Configuration:
   - **Site URL**: the student portal's `https://…onrender.com` address.
   - **Redirect URLs**: add `https://<each service>.onrender.com/reset-password` (keep the
     `http://localhost:517x/reset-password` entries for local development).
4. Open each `https://…onrender.com/api/health`, then sign in to each portal.

Free services sleep after ~15 minutes without visitors; the first request afterwards takes up to a
minute. Pushing to the repository's main branch redeploys automatically.
