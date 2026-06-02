import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const base = "https://djsoldier88.github.io/wc2026predictor";
const host = "djsoldier88.github.io";
const endpoint = "https://api.indexnow.org/indexnow";

function findKeyFile() {
  const match = fs.readdirSync(root).find((name) => /^[a-zA-Z0-9-]{8,128}\.txt$/.test(name));
  if (!match) throw new Error("IndexNow key file was not found in repository root.");
  const key = fs.readFileSync(path.join(root, match), "utf8").trim();
  return { key, keyFile: match };
}

function readUrls() {
  const generatedPath = path.join(root, ".seo-generated-urls.json");
  if (fs.existsSync(generatedPath)) {
    const parsed = JSON.parse(fs.readFileSync(generatedPath, "utf8"));
    if (Array.isArray(parsed.urls) && parsed.urls.length > 0) return parsed.urls;
  }
  return [`${base}/`, `${base}/sitemap.xml`, `${base}/en/`];
}

async function main() {
  const { key, keyFile } = findKeyFile();
  const urlList = [...new Set(readUrls())].filter((url) => url.startsWith(base));
  const body = {
    host,
    key,
    keyLocation: `${base}/${keyFile}`,
    urlList
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  });

  console.log(JSON.stringify({
    endpoint,
    status: response.status,
    submitted: urlList.length,
    urls: urlList
  }, null, 2));

  if (![200, 202].includes(response.status)) {
    const text = await response.text().catch(() => "");
    console.warn(`IndexNow submission was not accepted: ${response.status} ${text}`);
  }
}

main().catch((error) => {
  console.warn(`IndexNow submission skipped: ${error.message}`);
});
