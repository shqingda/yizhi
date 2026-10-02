import type { Resume } from "@shared/schema";

export function downloadJson(resume: Resume, filename = "resume.json") {
	const blob = new Blob([JSON.stringify(resume, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				resolve(JSON.parse(String(reader.result)));
			} catch (error) {
				reject(error);
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}

export function pdfFilename(resume: Resume) {
	return `${[resume.basics.name.trim(), resume.basics.label.trim(), "简历"].filter(Boolean).join("-")}.pdf`;
}
export function cleanFilename(value: string) {
	return (
		(value
			.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
			.replace(/\.pdf$/i, "")
			.trim()
			.slice(0, 100) || "简历") + ".pdf"
	);
}
