const express = require("express");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { rateLimit } = require("express-rate-limit");

const execFileAsync = promisify(execFile);
const app = express();

const PORT = process.env.PORT || 4000;
const MAX_CODE_BYTES = 20_000;
const OUTPUT_LIMIT = 8_000;
const TIMEOUT_MS = 3_000;

app.use(express.json({ limit: "64kb" }));

const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many requests" },
});

function truncate(value = "") {
  if (value.length <= OUTPUT_LIMIT) return value;
  return `${value.slice(0, OUTPUT_LIMIT)}
...<truncated>`;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/run", runLimiter, async (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";

  if (!code.trim()) {
    return res.status(400).json({ error: "code is required" });
  }

  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return res.status(400).json({ error: "code too large" });
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pyq-"));
  const filePath = path.join(tempDir, "main.py");

  try {
    await fs.writeFile(filePath, code, "utf8");

    const args = [
      "run",
      "--rm",
      "--network=none",
      "--memory=128m",
      "--cpus=0.5",
      "--pids-limit=64",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=64k",
      "-e",
      "PYTHONDONTWRITEBYTECODE=1",
      "-v",
      `${tempDir}:/workspace:ro`,
      "-w",
      "/workspace",
      "python:3.11-alpine",
      "python",
      "main.py",
    ];

    let stdout = "";
    let stderr = "";
    let exitCode = 0;
    let timedOut = false;

    try {
      const result = await execFileAsync("docker", args, {
        timeout: TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
      });
      stdout = result.stdout ?? "";
      stderr = result.stderr ?? "";
    } catch (error) {
      stdout = error.stdout ?? "";
      stderr = error.stderr ?? error.message;
      exitCode = Number.isInteger(error.code) ? error.code : 1;
      timedOut = Boolean(error.killed || error.signal === "SIGTERM" || error.signal === "SIGKILL");
    }

    return res.json({
      stdout: truncate(stdout),
      stderr: truncate(stderr),
      exitCode,
      timedOut,
      passed: exitCode === 0 && !timedOut,
    });
  } catch (error) {
    return res.status(500).json({ error: "runner failure", detail: String(error?.message ?? error) });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

app.listen(PORT, () => {
  console.log(`python-quest runner listening on ${PORT}`);
});
