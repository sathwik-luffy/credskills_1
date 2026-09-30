#!/usr/bin/env python3
import hashlib, hmac, json, os, secrets, sqlite3, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'credskill.db'
PORT = int(os.environ.get('PORT', '8000'))
HOST = os.environ.get('HOST', '0.0.0.0')


def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    con = db()
    con.executescript('''
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('learner','teacher')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TEXT
    );
    CREATE TABLE IF NOT EXISTS login_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email TEXT NOT NULL,
        role TEXT,
        event TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    ''')
    con.commit(); con.close()


def password_hash(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return 'scrypt$16384$8$1$' + salt.hex() + '$' + digest.hex()


def password_ok(password, encoded):
    try:
        _, n, r, p, salt_hex, digest_hex = encoded.split('$')
        salt = bytes.fromhex(salt_hex)
        digest = hashlib.scrypt(password.encode(), salt=salt, n=int(n), r=int(r), p=int(p))
        return hmac.compare_digest(digest.hex(), digest_hex)
    except Exception:
        return False


def clean_user(row):
    return {'id': row['id'], 'name': row['name'], 'email': row['email'], 'role': row['role']}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print('%s - %s' % (self.address_string(), fmt % args))

    def send_json(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers(); self.wfile.write(data)

    def body(self):
        length = int(self.headers.get('Content-Length', 0))
        try: return json.loads(self.rfile.read(length) or b'{}')
        except Exception: return {}

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/api/auth/register': return self.register()
        if path == '/api/auth/login': return self.login()
        if path == '/api/auth/logout': return self.logout()
        if path == '/api/auth/me': return self.me()
        self.send_json(404, {'error':'Not found'})

    def register(self):
        x = self.body(); name = str(x.get('name','')).strip(); email = str(x.get('email','')).strip().lower(); password = str(x.get('password','')); role = x.get('role')
        if len(name) < 2: return self.send_json(400, {'error':'Please enter your full name.'})
        if '@' not in email or '.' not in email.split('@')[-1]: return self.send_json(400, {'error':'Enter a valid email address.'})
        if len(password) < 8: return self.send_json(400, {'error':'Password must be at least 8 characters.'})
        if role not in ('learner','teacher'): return self.send_json(400, {'error':'Invalid account role.'})
        con = db()
        try:
            cur = con.execute('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)', (name,email,password_hash(password),role))
            uid = cur.lastrowid
            con.execute('INSERT INTO login_events(user_id,email,role,event) VALUES(?,?,?,?)',(uid,email,role,'REGISTER'))
            con.commit(); row = con.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone()
            return self.send_json(201, {'user':clean_user(row), 'message':'Account created successfully.'})
        except sqlite3.IntegrityError:
            return self.send_json(409, {'error':'An account with this email already exists.'})
        finally: con.close()

    def login(self):
        x = self.body(); email = str(x.get('email','')).strip().lower(); password = str(x.get('password','')); role = x.get('role')
        con = db(); row = con.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
        if not row or not password_ok(password,row['password_hash']):
            con.execute('INSERT INTO login_events(email,role,event) VALUES(?,?,?)',(email,role,'LOGIN_FAILED')); con.commit(); con.close()
            return self.send_json(401, {'error':'Email or password is incorrect.'})
        if role and row['role'] != role:
            con.execute('INSERT INTO login_events(user_id,email,role,event) VALUES(?,?,?,?)',(row['id'],email,row['role'],'ROLE_MISMATCH')); con.commit(); con.close()
            return self.send_json(403, {'error':'This account belongs to the other CredSkill workspace.'})
        token = secrets.token_urlsafe(32); expiry = int(time.time()) + 60*60*24*7
        con.execute('UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?',(row['id'],))
        con.execute('INSERT INTO login_events(user_id,email,role,event) VALUES(?,?,?,?)',(row['id'],email,row['role'],'LOGIN'))
        con.execute('INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)',(token,row['id'],expiry)); con.commit(); con.close()
        return self.send_json(200, {'token':token,'user':clean_user(row)})

    def logout(self):
        token = self.headers.get('Authorization','').replace('Bearer ','').strip()
        con=db(); con.execute('DELETE FROM sessions WHERE token=?',(token,)); con.commit(); con.close(); self.send_json(200,{'ok':True})

    def me(self):
        token = self.headers.get('Authorization','').replace('Bearer ','').strip(); con=db()
        row = con.execute('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?',(token,int(time.time()))).fetchone(); con.close()
        if not row: return self.send_json(401, {'error':'Authentication required.'})
        self.send_json(200, {'user':clean_user(row)})


def main():
    init_db()
    print(f'CredSkill server running at http://localhost:{PORT}')
    print(f'Database: {DB_PATH}')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()

if __name__ == '__main__': main()
