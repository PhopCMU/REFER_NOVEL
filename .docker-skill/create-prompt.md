# Docker Debug Prompt — Copy & Paste into GitHub Copilot Chat

> **Instructions for the developer:**  
> Fill in every section below, then paste the entire block into Copilot Chat.  
> The more complete your paste, the more accurate the diagnosis will be.

---

## Role

You are a senior DevOps engineer specialising in Docker, Node.js/Vite front-end builds,
and nginx static-file serving.

## Task

Diagnose the Docker build/runtime failure described below and provide:

1. The **exact failing step** (stage name + RUN/COPY line, or container startup message).
2. The **root cause** — one concise sentence.
3. A **minimal fix** — show only the lines that change (unified diff or full replacement
   block). Do NOT rewrite unrelated parts of the file.
4. **Verification commands** I can run immediately to confirm the fix works.
5. If critical information is missing, ask **one targeted question** — do not guess.

---

## Context

### Dockerfile
```dockerfile
# ← paste full Dockerfile here
```

### docker-compose.yml
```yaml
# ← paste full docker-compose.yml here
```

### .dockerignore
```
# ← paste full .dockerignore here (or write "does not exist")
```

### package.json scripts block
```json
{
  "scripts": {
    // ← paste only the "scripts" block
  }
}
```

### Lockfile present?
- [ ] `package-lock.json`
- [ ] `yarn.lock`
- [ ] `pnpm-lock.yaml`
- [ ] None

### Build machine
- OS: <!-- e.g. Ubuntu 22.04 / macOS 14 / Windows 11 WSL2 -->
- CPU architecture: <!-- e.g. amd64 / arm64 (Apple M-series) -->
- Docker version: <!-- docker --version -->
- Docker Compose version: <!-- docker compose version -->

### Error logs

Paste the **full** output of the failing command (no truncation):

```
# docker compose build --no-cache  OR  docker compose up --build
# ← paste here
```

If the container starts but fails at runtime:

```
# docker compose logs -f web
# ← paste here
```

### Expected behaviour
- Expected port: <!-- e.g. 80 inside container, 3083 on host -->
- Expected start command / how the app is served: <!-- e.g. nginx serving /var/www/html -->

---

## What to diagnose

After reading the context above, please:

- Identify which Dockerfile **stage and line** failed, or which container startup error occurred.
- State the root cause plainly.
- Show a minimal patch (diff or replacement block) for the affected file(s).
- Give concrete commands to rebuild and verify:
  ```bash
  docker compose build --no-cache
  docker compose up -d
  docker compose ps          # check status
  curl -I http://localhost:3083/
  docker inspect --format='{{json .State.Health}}' referral-web
  ```
- Do NOT invent env-var values, port numbers, or file paths that were not provided.
