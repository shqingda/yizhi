import sample from "../../public/sample-resume.json";
import { normalizeResume } from "@shared/schema";

// Only tests embed the template; the app loads the static JSON on demand.
export const SAMPLE_RESUME = normalizeResume(sample);
