# Code Runner Security

## Isolation Model
- Next.js never executes user code directly.
- Web server actions call a separate runner service over HTTP.
- Runner launches short-lived Python containers for each request.

## Container Controls
Execution uses `docker run` with:
- `--network=none`
- `--memory=128m`
- `--cpus=0.5`
- `--pids-limit=64`
- `--cap-drop=ALL`
- `--security-opt no-new-privileges`
- `--ipc=none`
- `--user=65534:65534`
- `--read-only`
- `--tmpfs /tmp:rw,noexec,nosuid,size=64k`
- bind-mounted ephemeral temp directory (read-only)

## Process Controls
- Max code payload size limit
- Hard timeout (~3s)
- Non-persistent temp file workspace
- Truncated stdout/stderr to fixed max length

## App Boundaries
- No direct `exec` of user code in Next.js runtime
- All code execution flows through `actions/run-code.ts` / `actions/submit-challenge.ts` to runner service
- Runner `/run` requires a shared token (`X-Runner-Token`) and rejects unauthenticated requests

## Operational Notes
- Runner requires Docker daemon access.
- For local dev, ensure Docker is running before using playground run/submit features.
- Keep `RUNNER_SHARED_TOKEN` set in both the web and runner environments.
