# Production Docker Checklist — referral-web

Run through this list before every production deployment.

---

## Build

- [ ] `.env` file (or env vars) is populated with all required `VITE_*` values
- [ ] `package-lock.json` is present and committed
- [ ] `docker compose build --no-cache` completes with exit code 0
- [ ] No `npm warn` / `npm error` lines in the build output
- [ ] Build log shows `tsc -b && vite build` succeeded and `dist/` was produced

## Image

- [ ] Runner stage is `nginx:...-alpine` (not a Node image)
- [ ] Only `/app/dist` is copied into the runner — no source files, no `node_modules`
- [ ] `docker image ls referral-web` shows a reasonable size (typically < 50 MB for this stack)
- [ ] No secrets / `.env` content baked into the image:
  ```bash
  docker history referral-web:latest   # inspect layers
  ```

## Container start

- [ ] `docker compose up -d` starts with exit code 0
- [ ] `docker compose ps` shows `STATUS: Up` (not `Exited` or `Restarting`)
- [ ] HTTP response on the mapped port:
  ```bash
  curl -I http://localhost:3083/
  # Expected: HTTP/1.1 200 OK
  ```
- [ ] SPA routing works (deep-link returns 200, not 404):
  ```bash
  curl -I http://localhost:3083/some/deep/path
  # Expected: HTTP/1.1 200 OK  (nginx SPA fallback to index.html)
  ```

## Healthcheck

- [ ] `docker compose ps` shows `(healthy)` after the `start_period` (10 s)
- [ ] `docker inspect --format='{{json .State.Health}}' referral-web` shows `"Status":"healthy"`

## Restart policy

- [ ] `restart: unless-stopped` is set in `docker-compose.yml`
- [ ] After a deliberate `docker compose down`, the container does NOT auto-restart
- [ ] After a simulated crash (`docker kill referral-web`), the container restarts automatically

## Environment / secrets

- [ ] All required `VITE_*` build args are passed (no empty/undefined values)
- [ ] `.env` is listed in `.dockerignore` — it must never enter the image
- [ ] `.env.example` documents every variable without real values

## Rollback / recovery

- [ ] Previous working image is tagged and available:
  ```bash
  docker tag referral-web:latest referral-web:previous
  ```
- [ ] Rollback command is documented and tested:
  ```bash
  docker compose down
  docker tag referral-web:previous referral-web:latest
  docker compose up -d
  ```
