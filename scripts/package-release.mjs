import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
const version = packageJson.version;
const extensionSlug = "arxiv-batch-downloader";
const releaseDir = join(projectRoot, "release");
const distDir = join(projectRoot, "dist");
const privateDir = join(releaseDir, "private");
const mode = process.argv[2] ?? "all";
const zipPath = join(releaseDir, `${extensionSlug}-webstore-v${version}.zip`);

mkdirSync(releaseDir, {
  recursive: true,
});

if (mode === "crx" || mode === "all") {
  mkdirSync(privateDir, {
    recursive: true,
  });
}

run("npm", ["run", "build"]);

if (!existsSync(join(distDir, "manifest.json"))) {
  throw new Error("Build output is missing dist/manifest.json");
}

const crx3Cli = resolve(projectRoot, "node_modules", ".bin", "crx3");

if (mode === "webstore" || mode === "all") {
  rmSync(zipPath, {
    force: true,
  });
  run("zip", ["-r", zipPath, ".", "-x", ".DS_Store", ".vite/*"], {
    cwd: distDir,
  });
}

if (mode === "crx" || mode === "all") {
  const crxPath = join(releaseDir, `${extensionSlug}-local-v${version}.crx`);
  const keyPath = join(privateDir, `${extensionSlug}.pem`);
  rmSync(crxPath, {
    force: true,
  });
  run(crx3Cli, ["-o", crxPath, "-p", keyPath, distDir]);
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    ...options,
  });
}
