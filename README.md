# CredSkill — Student & Professional Role-Separated Build

This version keeps the existing CredSkill student/professional project and adds a professional-grade authentication layer.

## Authentication
- Separate Student and Professional sign-in pages.
- Sign in / Create account modes.
- Email + password authentication.
- Role-aware login: a Student account cannot enter the Professional workspace and vice versa.
- Passwords are stored as salted `scrypt` hashes, never plain text.
- Login, failed-login, registration and role-mismatch events are recorded.
- Seven-day server session tokens are stored server-side.
- SQLite database is created automatically as `credskill.db`.

## Run locally
Requires Python 3.10+.

```bash
python server.py
```

Then open:

`http://localhost:8000/`

Do not open the HTML files directly with `file://`; the authentication API is served by `server.py`.

## Database tables
- `users` — account identity, role, password hash, timestamps
- `login_events` — registration/login/security events
- `sessions` — server-side session tokens and expiry

The SQLite file is intentionally ignored by Git so real credentials are not committed to the repository.

## Deployment
This build is designed for a normal Python web-service host that can run `python server.py` and persist a SQLite volume. GitHub Pages can host the static UI, but it cannot run the Python authentication server or SQLite database. For a real public account system, deploy the project and backend together on a server with persistent storage, or later migrate the database to PostgreSQL.

## Existing CredSkill features
The student and professional folders retain the previously built dashboards, roadmaps, sessions, meeting workspace, compiler, AI demo, wallet and profile pages. Only authentication/role entry was upgraded here.
