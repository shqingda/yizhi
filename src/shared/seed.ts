import sampleResumeJson from "../../public/sample-resume.json?raw";
import { DEFAULT_SLUG, normalizeResume } from "./schema";

/** Single template source for editor reset, public fallback, and first D1 write. */
export const SAMPLE_RESUME = normalizeResume(JSON.parse(sampleResumeJson));

export const SAMPLE_SLUG = DEFAULT_SLUG;
export const SAMPLE_ID = "default";
