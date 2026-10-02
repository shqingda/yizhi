import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "../dist/client");
const manifest = JSON.parse(readFileSync(resolve(root, ".vite/manifest.json"), "utf8"));

function scriptsFor(...entries) {
	const files = new Set();
	const visited = new Set();
	function visit(key) {
		if (visited.has(key)) return;
		visited.add(key);
		const chunk = manifest[key];
		if (!chunk) throw new Error(`Missing build entry: ${key}`);
		if (chunk.file.endsWith(".js")) files.add(chunk.file);
		for (const dependency of chunk.imports ?? []) visit(dependency);
	}
	entries.forEach(visit);
	return [...files];
}

function measure(files) {
	return files.reduce(
		(total, file) => {
			const source = readFileSync(resolve(root, file));
			return { raw: total.raw + source.length, gzip: total.gzip + gzipSync(source).length };
		},
		{ raw: 0, gzip: 0 },
	);
}

const editor = measure(scriptsFor("index.html", "src/app/pages/EditorPage.tsx"));
const sample = measure(["sample-resume.json"]);
console.log(
	`Editor JavaScript (including shared imports): ${(editor.raw / 1000).toFixed(2)} kB / gzip ${(editor.gzip / 1000).toFixed(2)} kB`,
);
console.log(
	`Sample JSON (only first use/reset): ${(sample.raw / 1000).toFixed(2)} kB / gzip ${(sample.gzip / 1000).toFixed(2)} kB`,
);

// Include all static dependencies: moving bytes between chunks must not hide regressions.
if (editor.raw > 600_000 || editor.gzip > 200_000)
	throw new Error("Editor JavaScript exceeded its 600 kB / gzip 200 kB budget");
for (const { file } of Object.values(manifest)) {
	if (file.endsWith(".js") && readFileSync(resolve(root, file)).length > 500_000) {
		throw new Error(`JavaScript chunk exceeded 500 kB: ${file}`);
	}
}
