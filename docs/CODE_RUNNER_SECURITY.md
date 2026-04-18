# Code Runner Security

## Isolation Model
- Next.js never executes user code directly.
- A separate runner service handles execution requests.
- Runner launches short-lived Python Docker containers.

## Required Controls
- `--network=none`
- Read-only image runtime with ephemeral temp file mount
- CPU/memory/pids constraints
- Hard timeout termination (~3s)
- Stdout/stderr truncation

## Operational Notes
- Runner validates input size and rejects oversized submissions.
- Only Python source text is accepted.
- Service returns structured stdout/stderr/exit status and timeout flag.
