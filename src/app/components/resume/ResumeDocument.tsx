import { memo, useLayoutEffect, useRef } from "react";
import { Cake, Globe2, Mail, MapPin, Phone, UserRound, type LucideIcon } from "lucide-react";
import type { BasicsFieldKey, ContactFieldKey, Resume, SectionKey } from "@shared/schema";
import { useResumeFit, type ResumeLayoutInfo } from "@/hooks/useResumeFit";

const CONTACT_ICONS: Record<ContactFieldKey, LucideIcon> = {
	email: Mail,
	phone: Phone,
	location: MapPin,
	url: Globe2,
	birthday: Cake,
	status: UserRound,
};

const SECTION_TITLES: Record<SectionKey, string> = {
	skills: "专业技能",
	experience: "工作经验",
	projects: "项目经历",
	education: "教育经历",
	awards: "获奖",
	publications: "论文",
	languages: "语言",
	custom: "",
};

function blockProps(id: string, kind: "unit" | "keep" = "unit") {
	return {
		"data-block-id": id,
		"data-block-kind": kind,
	} as const;
}

function dateRange(start?: string, end?: string) {
	const a = start?.trim();
	const b = end?.trim();
	if (a && b && a === b) return a;
	if (a && b) return `${a} – ${b}`;
	return a || b || "";
}

function SectionHeading({ title, blockId }: { title: string; blockId: string }) {
	return (
		<div className="resume-heading" {...blockProps(blockId, "keep")}>
			<h2 className="resume-heading-title">{title}</h2>
		</div>
	);
}

function EntryHeader({ title, meta, date }: { title: string; meta?: string; date?: string }) {
	if (!title && !meta && !date) return null;
	return (
		<div className="resume-entry-head">
			<div className="resume-entry-copy">
				<div className="resume-entry-title">{title}</div>
				{meta ? <div className="resume-entry-meta">{meta}</div> : null}
			</div>
			{date ? <div className="resume-entry-date">{date}</div> : null}
		</div>
	);
}

function Bullets({ items }: { items?: string[] }) {
	const lines = (items ?? []).map((item) => item.trim()).filter(Boolean);
	if (!lines.length) return null;
	return (
		<ul className="resume-bullets">
			{lines.map((line, index) => (
				<li key={`${index}-${line.slice(0, 12)}`}>{line}</li>
			))}
		</ul>
	);
}

function renderSection(key: SectionKey, resume: Resume) {
	if (resume.meta.hiddenSections.includes(key)) return null;
	switch (key) {
		case "skills":
			if (!resume.skills.some((s) => s.name || s.keywords)) return null;
			return (
				<section key={key} className="resume-section" data-section={key}>
					<SectionHeading title={SECTION_TITLES.skills} blockId="heading-skills" />
					<dl className="resume-skills">
						{resume.skills
							.filter((s) => s.name || s.keywords)
							.map((skill) => (
								<div key={skill.id} className="resume-skill" {...blockProps(skill.id)}>
									<dt>{skill.name}</dt>
									<dd>{skill.keywords}</dd>
								</div>
							))}
					</dl>
				</section>
			);
		case "experience":
			if (!resume.experience.some((e) => e.company || e.position)) return null;
			return (
				<section key={key} className="resume-section" data-section={key}>
					<SectionHeading title={SECTION_TITLES.experience} blockId="heading-experience" />
					{resume.experience.map((item) => (
						<div key={item.id} className="resume-entry" {...blockProps(item.id)}>
							<EntryHeader
								title={item.company}
								meta={item.position}
								date={dateRange(item.startDate, item.endDate)}
							/>
							<Bullets items={item.highlights} />
						</div>
					))}
				</section>
			);
		case "projects":
			if (!resume.projects.some((p) => p.name)) return null;
			return (
				<section key={key} className="resume-section" data-section={key}>
					<SectionHeading title={SECTION_TITLES.projects} blockId="heading-projects" />
					{resume.projects.map((item) => (
						<div key={item.id} className="resume-entry" {...blockProps(item.id)}>
							<EntryHeader
								title={item.name}
								meta={[item.role, item.url].filter(Boolean).join(" · ")}
								date={dateRange(item.startDate, item.endDate)}
							/>
							<Bullets items={item.highlights} />
						</div>
					))}
				</section>
			);
		case "education":
			if (!resume.education.some((e) => e.institution)) return null;
			return (
				<section key={key} className="resume-section" data-section={key}>
					<SectionHeading title={SECTION_TITLES.education} blockId="heading-education" />
					{resume.education.map((item) => (
						<div key={item.id} className="resume-entry" {...blockProps(item.id)}>
							<EntryHeader
								title={item.institution}
								meta={[item.studyType, item.area, item.location].filter(Boolean).join(" · ")}
								date={dateRange(item.startDate, item.endDate)}
							/>
							<Bullets items={item.highlights} />
						</div>
					))}
				</section>
			);
		case "awards":
			if (!resume.awards.some((a) => a.title)) return null;
			return (
				<section key={key} className="resume-section" data-section={key}>
					<SectionHeading title={SECTION_TITLES.awards} blockId="heading-awards" />
					{resume.awards
						.filter((a) => a.title)
						.map((award) => (
							<div key={award.id} className="resume-entry" {...blockProps(award.id)}>
								<EntryHeader title={award.title} meta={award.awarder} date={award.date} />
								{award.summary ? <p className="resume-note">{award.summary}</p> : null}
							</div>
						))}
				</section>
			);
		case "publications":
			if (!resume.publications.some((p) => p.name)) return null;
			return (
				<section key={key} className="resume-section" data-section={key}>
					<SectionHeading title={SECTION_TITLES.publications} blockId="heading-publications" />
					{resume.publications
						.filter((p) => p.name)
						.map((pub) => (
							<div key={pub.id} className="resume-entry" {...blockProps(pub.id)}>
								<EntryHeader title={pub.name} date={pub.releaseDate} />
								<p className="resume-note">
									{[pub.summary, pub.publisher, pub.url].filter(Boolean).join("  ·  ")}
								</p>
							</div>
						))}
				</section>
			);
		case "languages":
			if (!resume.languages.some((l) => l.language || l.fluency)) return null;
			return (
				<section key={key} className="resume-section" data-section={key}>
					<SectionHeading title={SECTION_TITLES.languages} blockId="heading-languages" />
					<ul className="resume-languages" {...blockProps("languages")}>
						{resume.languages
							.filter((l) => l.language || l.fluency)
							.map((lang) => (
								<li key={lang.id}>
									<span>{lang.language}</span>
									{lang.fluency ? <span>{lang.fluency}</span> : null}
								</li>
							))}
					</ul>
				</section>
			);
		case "custom":
			return resume.customSections
				.filter((section) => section.title || section.items.length)
				.map((section) => (
					<section key={section.id} className="resume-section">
						<SectionHeading title={section.title || "其他"} blockId={`heading-${section.id}`} />
						{section.items.map((item) => (
							<div key={item.id} className="resume-entry" {...blockProps(item.id)}>
								<EntryHeader title={item.title} meta={item.subtitle} date={item.date} />
								<Bullets items={item.highlights} />
							</div>
						))}
					</section>
				));
		default:
			return null;
	}
}

export const ResumeDocument = memo(function ResumeDocument({
	resume,
	onLayout,
}: {
	resume: Resume;
	onLayout?: (info: ResumeLayoutInfo) => void;
}) {
	const sheetRef = useRef<HTMLElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const layoutMode = resume.meta.layoutMode === "multi" ? "multi" : "single";
	const layout = useResumeFit(sheetRef, innerRef, layoutMode, resume);
	const pageCount = layout.pageCount;

	useLayoutEffect(() => {
		onLayout?.(layout);
	}, [layout, onLayout]);

	const hiddenBasics = new Set(resume.meta.hiddenBasics);
	const visibleField = (key: BasicsFieldKey, value?: string) =>
		!hiddenBasics.has(key) && Boolean(value?.trim());
	const contacts = resume.meta.basicsOrder.flatMap((key) => {
		const value = resume.basics[key];
		return visibleField(key, value) ? [{ key, value: value as string }] : [];
	});
	const showPhoto = resume.meta.showPhoto && Boolean(resume.basics.photo);
	const align = resume.meta.headerAlign;
	const scale = resume.meta.fontScale || 1;

	return (
		<article
			ref={sheetRef}
			className="resume-sheet resume-print-root"
			data-layout={layoutMode}
			data-pages={pageCount}
			style={{ ["--resume-font-scale" as string]: String(scale) }}
		>
			<div ref={innerRef} className="resume-inner">
				<header
					className="resume-header"
					data-align={align}
					data-photo={showPhoto ? "on" : "off"}
					{...blockProps("basics")}
				>
					{showPhoto ? (
						<img className="resume-photo" src={resume.basics.photo} alt={resume.basics.name} />
					) : null}
					<div className="resume-identity">
						{!hiddenBasics.has("name") ? (
							<h1 className="resume-name">{resume.basics.name || "姓名"}</h1>
						) : null}
						{visibleField("label", resume.basics.label) ? (
							<p className="resume-title">{resume.basics.label}</p>
						) : null}
					</div>
					{contacts.length ? (
						<ul className="resume-contacts">
							{contacts.map((item) => {
								const Icon = CONTACT_ICONS[item.key];
								return (
									<li key={item.key}>
										<Icon className="resume-contact-icon" aria-hidden="true" strokeWidth={1.8} />
										{item.key === "email" ? (
											<a className="resume-contact-text" href={`mailto:${item.value}`}>
												{item.value}
											</a>
										) : (
											<span className="resume-contact-text">{item.value}</span>
										)}
									</li>
								);
							})}
						</ul>
					) : null}
					{resume.basics.summary ? <p className="resume-summary">{resume.basics.summary}</p> : null}
				</header>
				{resume.meta.sectionOrder.map((key) => renderSection(key, resume))}
			</div>
		</article>
	);
});
