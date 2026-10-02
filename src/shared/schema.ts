export const SECTION_KEYS = [
	"education",
	"experience",
	"projects",
	"skills",
	"awards",
	"publications",
	"languages",
	"custom",
] as const;

/** Pre-redesign default order — migrate leftover drafts to the current template. */
const LEGACY_SECTION_ORDER = [
	"skills",
	"experience",
	"projects",
	"education",
	"awards",
	"publications",
	"languages",
	"custom",
] as const;

export type LayoutMode = "single" | "multi";
export type HeaderAlign = "left" | "center" | "right";

export type SectionKey = (typeof SECTION_KEYS)[number];

export const IDENTITY_FIELD_KEYS = ["name", "label"] as const;
export const CONTACT_FIELD_KEYS = [
	"email",
	"phone",
	"location",
	"url",
	"birthday",
	"status",
] as const;
export const BASICS_FIELD_KEYS = [...IDENTITY_FIELD_KEYS, ...CONTACT_FIELD_KEYS] as const;

export type IdentityFieldKey = (typeof IDENTITY_FIELD_KEYS)[number];
export type ContactFieldKey = (typeof CONTACT_FIELD_KEYS)[number];
export type BasicsFieldKey = (typeof BASICS_FIELD_KEYS)[number];

export interface ResumeBasics {
	name: string;
	label: string;
	email?: string;
	phone?: string;
	url?: string;
	location?: string;
	birthday?: string;
	status?: string;
	availableFrom?: string;
	summary?: string;
	photo?: string;
}

export interface SkillGroup {
	id: string;
	name: string;
	keywords: string;
}

export interface ExperienceItem {
	id: string;
	company: string;
	position: string;
	startDate: string;
	endDate: string;
	location?: string;
	highlights: string[];
}

export interface ProjectItem {
	id: string;
	name: string;
	role?: string;
	startDate?: string;
	endDate?: string;
	url?: string;
	highlights: string[];
}

export interface EducationItem {
	id: string;
	institution: string;
	area?: string;
	studyType?: string;
	startDate: string;
	endDate: string;
	location?: string;
	highlights: string[];
}

export interface AwardItem {
	id: string;
	title: string;
	date?: string;
	awarder?: string;
	summary?: string;
}

export interface PublicationItem {
	id: string;
	name: string;
	publisher?: string;
	releaseDate?: string;
	url?: string;
	summary?: string;
}

export interface LanguageItem {
	id: string;
	language: string;
	fluency?: string;
}

export interface CustomEntry {
	id: string;
	title: string;
	subtitle?: string;
	date?: string;
	highlights: string[];
}

export interface CustomSection {
	id: string;
	title: string;
	items: CustomEntry[];
}

export interface ResumeMeta {
	accentColor: string;
	fontScale: number;
	showPhoto: boolean;
	layoutMode: LayoutMode;
	headerAlign: HeaderAlign;
	sectionOrder: SectionKey[];
	hiddenSections: SectionKey[];
	basicsOrder: ContactFieldKey[];
	hiddenBasics: BasicsFieldKey[];
}

export interface Resume {
	basics: ResumeBasics;
	skills: SkillGroup[];
	experience: ExperienceItem[];
	projects: ProjectItem[];
	education: EducationItem[];
	awards: AwardItem[];
	publications: PublicationItem[];
	languages: LanguageItem[];
	customSections: CustomSection[];
	meta: ResumeMeta;
}

export const DEFAULT_META: ResumeMeta = {
	accentColor: "#111111",
	fontScale: 1,
	showPhoto: false,
	layoutMode: "multi",
	headerAlign: "center",
	sectionOrder: [...SECTION_KEYS],
	hiddenSections: [],
	basicsOrder: [...CONTACT_FIELD_KEYS],
	hiddenBasics: ["birthday", "status"],
};

function mergeKeyedOrder<T extends string>(incoming: unknown, allowed: readonly T[]): T[] {
	const picked = Array.isArray(incoming)
		? incoming.filter((key): key is T => allowed.includes(key as T))
		: [];
	return [...picked, ...allowed.filter((key) => !picked.includes(key))];
}

function normalizeHidden<T extends string>(incoming: unknown, allowed: readonly T[]): T[] {
	if (!Array.isArray(incoming)) return [];
	return incoming.filter((key): key is T => allowed.includes(key as T));
}

export function toggleHidden<T extends string>(list: readonly T[], key: T): T[] {
	return list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
}

function sameSectionOrder(
	left: readonly string[],
	right: readonly string[],
): boolean {
	return left.length === right.length && left.every((key, index) => key === right[index]);
}

const SAMPLE_PROJECT_DATES: Record<string, { startDate: string; endDate: string }> = {
	proj_studio: { startDate: "2026/08", endDate: "2026/09" },
	proj_cloud: { startDate: "2022/04", endDate: "2022/06" },
	proj_music: { startDate: "2020/09", endDate: "2021/01" },
	proj_blog: { startDate: "2020/03", endDate: "2020/06" },
	proj_mooc: { startDate: "2018/10", endDate: "2019/06" },
	proj_bot: { startDate: "2018/01", endDate: "2018/05" },
};

export function uid(prefix = "id"): string {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function emptyResume(): Resume {
	return {
		basics: { name: "", label: "" },
		skills: [],
		experience: [],
		projects: [],
		education: [],
		awards: [],
		publications: [],
		languages: [],
		customSections: [],
		meta: {
			...DEFAULT_META,
			sectionOrder: [...SECTION_KEYS],
			hiddenSections: [],
			basicsOrder: [...CONTACT_FIELD_KEYS],
			hiddenBasics: [...DEFAULT_META.hiddenBasics],
		},
	};
}

function asString(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === "string");
}

function asBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeResume(input: unknown): Resume {
	const raw =
		input && typeof input === "object" ? (input as Record<string, unknown>) : {};
	const basicsRaw =
		raw.basics && typeof raw.basics === "object"
			? (raw.basics as Record<string, unknown>)
			: {};
	const metaRaw =
		raw.meta && typeof raw.meta === "object"
			? (raw.meta as Record<string, unknown>)
			: {};

	const order = Array.isArray(metaRaw.sectionOrder)
		? (metaRaw.sectionOrder.filter((key): key is SectionKey =>
				SECTION_KEYS.includes(key as SectionKey),
			) as SectionKey[])
		: [];

	const mergedOrder = [
		...order,
		...SECTION_KEYS.filter((key) => !order.includes(key)),
	];
	const sectionOrder = sameSectionOrder(mergedOrder, LEGACY_SECTION_ORDER)
		? [...SECTION_KEYS]
		: mergedOrder;

	const rawAccent = asString(metaRaw.accentColor, DEFAULT_META.accentColor);
	const accentColor = rawAccent.toLowerCase() === "#2563eb" ? DEFAULT_META.accentColor : rawAccent;

	return {
		basics: {
			name: asString(basicsRaw.name),
			label: asString(basicsRaw.label),
			email: asString(basicsRaw.email) || undefined,
			phone: asString(basicsRaw.phone) || undefined,
			url: asString(basicsRaw.url) || undefined,
			location: asString(basicsRaw.location) || undefined,
			birthday: asString(basicsRaw.birthday) || undefined,
			status: asString(basicsRaw.status) || undefined,
			availableFrom: asString(basicsRaw.availableFrom) || undefined,
			summary: asString(basicsRaw.summary) || undefined,
			photo: asString(basicsRaw.photo) || undefined,
		},
		skills: Array.isArray(raw.skills)
			? raw.skills.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					return {
						id: asString(row.id, uid(`skill${index}`)),
						name: asString(row.name),
						keywords: asString(row.keywords),
					};
				})
			: [],
		experience: Array.isArray(raw.experience)
			? raw.experience.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					return {
						id: asString(row.id, uid(`exp${index}`)),
						company: asString(row.company),
						position: asString(row.position),
						startDate: asString(row.startDate),
						endDate: asString(row.endDate),
						location: asString(row.location) || undefined,
						highlights: asStringArray(row.highlights),
					};
				})
			: [],
		projects: Array.isArray(raw.projects)
			? raw.projects.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					const id = asString(row.id, uid(`proj${index}`));
					const sampled = SAMPLE_PROJECT_DATES[id];
					return {
						id,
						name: asString(row.name),
						role: asString(row.role) || undefined,
						startDate: typeof row.startDate === "string" ? row.startDate : sampled?.startDate,
						endDate: typeof row.endDate === "string" ? row.endDate : sampled?.endDate,
						url: asString(row.url) || undefined,
						highlights: asStringArray(row.highlights),
					};
				})
			: [],
		education: Array.isArray(raw.education)
			? raw.education.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					return {
						id: asString(row.id, uid(`edu${index}`)),
						institution: asString(row.institution),
						area: asString(row.area) || undefined,
						studyType: asString(row.studyType) || undefined,
						startDate: asString(row.startDate),
						endDate: asString(row.endDate),
						location: asString(row.location) || undefined,
						highlights: asStringArray(row.highlights),
					};
				})
			: [],
		awards: Array.isArray(raw.awards)
			? raw.awards.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					return {
						id: asString(row.id, uid(`award${index}`)),
						title: asString(row.title),
						date: asString(row.date) || undefined,
						awarder: asString(row.awarder) || undefined,
						summary: asString(row.summary) || undefined,
					};
				})
			: [],
		publications: Array.isArray(raw.publications)
			? raw.publications.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					return {
						id: asString(row.id, uid(`pub${index}`)),
						name: asString(row.name),
						publisher: asString(row.publisher) || undefined,
						releaseDate: asString(row.releaseDate) || undefined,
						url: asString(row.url) || undefined,
						summary: asString(row.summary) || undefined,
					};
				})
			: [],
		languages: Array.isArray(raw.languages)
			? raw.languages.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					return {
						id: asString(row.id, uid(`lang${index}`)),
						language: asString(row.language),
						fluency: asString(row.fluency) || undefined,
					};
				})
			: [],
		customSections: Array.isArray(raw.customSections)
			? raw.customSections.map((item, index) => {
					const row = (item ?? {}) as Record<string, unknown>;
					return {
						id: asString(row.id, uid(`sec${index}`)),
						title: asString(row.title),
						items: Array.isArray(row.items)
							? row.items.map((entry, entryIndex) => {
									const e = (entry ?? {}) as Record<string, unknown>;
									return {
										id: asString(e.id, uid(`centry${entryIndex}`)),
										title: asString(e.title),
										subtitle: asString(e.subtitle) || undefined,
										date: asString(e.date) || undefined,
										highlights: asStringArray(e.highlights),
									};
								})
							: [],
					};
				})
			: [],
		meta: {
			accentColor,
			fontScale: asNumber(metaRaw.fontScale, DEFAULT_META.fontScale),
			showPhoto: asBoolean(metaRaw.showPhoto, DEFAULT_META.showPhoto),
			layoutMode: metaRaw.layoutMode === "single" ? "single" : "multi",
			headerAlign:
				metaRaw.headerAlign === "left" || metaRaw.headerAlign === "right"
					? metaRaw.headerAlign
					: "center",
			sectionOrder,
			hiddenSections: normalizeHidden(metaRaw.hiddenSections, SECTION_KEYS),
			basicsOrder: mergeKeyedOrder(metaRaw.basicsOrder, CONTACT_FIELD_KEYS),
			hiddenBasics: Array.isArray(metaRaw.hiddenBasics)
				? normalizeHidden(metaRaw.hiddenBasics, BASICS_FIELD_KEYS)
				: [...DEFAULT_META.hiddenBasics],
		},
	};
}

export function isResumeLike(value: unknown): boolean {
	if (!value || typeof value !== "object") return false;
	const raw = value as Record<string, unknown>;
	return Boolean(raw.basics && typeof raw.basics === "object");
}
