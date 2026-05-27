import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const basePath = process.env.BASE_PATH ?? "/";
  const tempDir = ".pages-artifact";

  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });

  const srcDir = "dist/client";

  if (!(await exists(srcDir))) {
    throw new Error("Expected build output at dist/client, but it was not found");
  }

  await cp(srcDir, tempDir, { recursive: true });

  if (!(await exists(`${tempDir}/index.html`))) {
    if (await exists("dist/server/server.js")) {
      const mod = await import("../dist/server/server.js");
      const server = mod.default;
      if (!server || typeof server.fetch !== "function") {
        throw new Error("dist/server/server.js did not export a default server with fetch");
      }

      const response = await server.fetch(new Request("http://localhost/"));
      if (!response.ok) {
        throw new Error(`Could not render SSR index.html (status ${response.status})`);
      }

      const html = await response.text();
      if (!html || !html.includes("$_TSR")) {
        throw new Error("SSR HTML did not include TanStack Start bootstrap payload ($_TSR)");
      }

      await writeFile(`${tempDir}/index.html`, html);
    } else {
      throw new Error("index.html is missing and no SSR server build was found at dist/server/server.js");
    }
  }

  if (!(await exists(`${tempDir}/index.html`))) {
    throw new Error("index.html was not created");
  }

  await cp(`${tempDir}/index.html`, `${tempDir}/404.html`);
  await writeFile(`${tempDir}/.nojekyll`, "");

  // Replace dist with static pages artifact for upload.
  await rm("dist", { recursive: true, force: true });
  await mkdir("dist", { recursive: true });
  await cp(tempDir, "dist", { recursive: true });
  await rm(tempDir, { recursive: true, force: true });

  console.log(`Prepared dist from ${srcDir} with BASE_PATH=${basePath}`);
}

await main();
