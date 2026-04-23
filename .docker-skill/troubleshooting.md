# Docker Troubleshooting — Production (Vite + nginx)

A structured reference for diagnosing the most common production Docker failures
in this repository (React/Vite SPA → nginx static-file server).

---

## 1. `npm ci` fails — missing or mismatched lockfile

**Symptom:**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```
or
```
npm error cipm can only install packages when your package.json and
package-lock.json are in sync.
```

**Root cause:**  
`package-lock.json` is missing from the build context, or `package.json` was edited
without re-running `npm install` to sync the lockfile.

**Fix:**
1. Ensure `package-lock.json` is committed to git and NOT listed in `.dockerignore`.
2. If they are out of sync, run `npm install` locally, commit the updated lockfile,
   then rebuild.

---

## 2. URL-tarball dependency fails during `npm ci`

**Symptom:**  
`npm ci` hangs or errors on a line like:
```
npm error network request to https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2.tgz failed
```

**Root cause:**  
The build host or Docker daemon has no outbound internet access to the custom CDN,
or the CDN is rate-limiting/blocking the request.

**Fix:**
1. If internet is unavailable during build, configure a corporate proxy:
   ```dockerfile
   ARG HTTP_PROXY
   ARG HTTPS_PROXY
   ENV HTTP_PROXY=$HTTP_PROXY HTTPS_PROXY=$HTTPS_PROXY
   ```
   and pass `--build-arg HTTP_PROXY=http://proxy:port` to `docker compose build`.
2. Alternatively, vendor the tarball locally and reference it by relative path in
   `package.json`.

---

## 3. Node version mismatch

**Symptom:**
```
error TS... : TypeScript target mismatch
```
or a runtime crash referencing ECMAScript features not present in the Node version.

**Root cause:**  
The Node version in the Dockerfile differs from the developer's local version, causing
compile or runtime failures.

**Fix:**  
Pin the exact Node version in the Dockerfile:
```dockerfile
FROM node:24.2.0-alpine AS deps
```
Check the project's expected version in `package.json` `engines` field (if present) or
`.nvmrc`.

---

## 4. Build output missing in runner stage (wrong `COPY` path)

**Symptom:**  
Container starts, but nginx returns a blank page or 404 for every route.

**Root cause:**  
`COPY --from=build /app/dist /var/www/html` copied an empty or non-existent directory
because `npm run build` failed silently or wrote output to a different path.

**Fix:**
1. Confirm Vite build output dir in `vite.config.ts`:
   ```ts
   build: { outDir: 'dist' }   // default
   ```
2. Add `RUN ls -la /app/dist` as a temporary debug line after `npm run build` to
   confirm output exists.
3. Ensure the `RUN npm run build` step did not exit 0 with zero output (check for
   TypeScript errors in the build log).

---

## 5. Permissions / non-root user issues

**Symptom:**  
```
nginx: [emerg] open() "/var/www/html/index.html" failed (13: Permission denied)
```

**Root cause:**  
Static files were `COPY`-ed without correct ownership for the nginx worker user.

**Fix:**  
Always use `--chown` on the final COPY:
```dockerfile
COPY --from=build --chown=nginx:nginx /app/dist /var/www/html
```
The nginx master process runs as root (to bind port 80), but workers run as `nginx`.
Files must be readable by the `nginx` user.

---

## 6. Wrong `CMD` / port not exposed

**Symptom:**  
Container exits immediately or does not respond on the mapped port.

**Root cause:**  
- Missing `CMD` (process forks to background and Docker stops the container), or  
- `EXPOSE` was omitted (non-blocking, but confusing), or  
- The nginx config listens on a port that does not match the `ports:` mapping.

**Fix:**
```dockerfile
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
Verify the nginx config has `listen 80;`.

---

## 7. Network / SSL / certificate errors during `npm ci`

**Symptom:**
```
npm error code UNABLE_TO_GET_ISSUER_CERT_LOCALLY
```

**Root cause:**  
Corporate firewall performs TLS inspection with a self-signed CA that Node does not trust.

**Fix:**
```dockerfile
# Mount the CA cert into the build stage only
COPY corporate-ca.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates
```
Do NOT disable SSL verification globally (`NODE_TLS_REJECT_UNAUTHORIZED=0`).

---

## 8. ARM vs AMD64 (Apple M-series / cross-platform builds)

**Symptom:**  
```
WARNING: The requested image's platform (linux/amd64) does not match
the detected host platform (linux/arm64/v8)
```
or a native dependency fails to compile.

**Fix (explicit platform in Dockerfile):**
```dockerfile
FROM --platform=linux/amd64 node:24-alpine AS deps
```
Or build for a specific platform:
```bash
docker buildx build --platform linux/amd64 -t referral-web:latest .
```
For CI/CD targeting production servers (amd64), always specify `--platform linux/amd64`
on Apple Silicon developer machines.

---

## 9. Image size is too large

**Checklist:**
- Ensure `node_modules` and `dist` are in `.dockerignore` (prevents accidental inclusion
  in the build context — they are rebuilt inside Docker anyway).
- Verify the runner stage is `FROM nginx:...-alpine`, not a full Debian image.
- Confirm only `/app/dist` is copied into the runner — not the entire `/app`.
- Run `docker image inspect referral-web:latest | grep Size` to measure.

---

## 10. Healthcheck reports `unhealthy`

**Symptom:**
```
docker ps → STATUS: unhealthy
```

**Diagnosis:**
```bash
docker inspect --format='{{json .State.Health}}' referral-web | python3 -m json.tool
```

**Common causes:**
- nginx config syntax error (container starts, but nginx fails to bind)
- Wrong healthcheck URL (the HEALTHCHECK CMD hits a path nginx does not serve)
- `start_period` too short for a slow startup

**Fix:**  
Increase `start_period` in the Dockerfile / docker-compose.yml, or exec into the
container and test manually:
```bash
docker exec referral-web wget -qO- http://localhost/
```
