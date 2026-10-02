import { isResumeLike, normalizeResume, type Resume } from "@shared/schema";

let pending: Promise<Resume> | undefined;

/** Keep the self-contained template out of JavaScript and reuse successful loads. */
export function loadSampleResume(): Promise<Resume> {
	if (!pending) {
		pending = fetch(`${import.meta.env.BASE_URL}sample-resume.json`, {
			signal: AbortSignal.timeout(10_000),
		})
			.then(async (response) => {
				if (!response.ok) throw new Error("示例加载失败，请检查网络后重试。");
				const value: unknown = await response.json();
				if (!isResumeLike(value)) throw new Error("示例文件格式无效，请重试。");
				return normalizeResume(value);
			})
			.catch((error) => {
				pending = undefined;
				throw error;
			});
	}
	return pending.then((data) => structuredClone(data));
}
