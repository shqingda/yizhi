import { useLayoutEffect, useRef } from "react";
import type { Resume, SectionKey } from "@shared/schema";
import { useResumeFit, type ResumeLayoutInfo } from "@/hooks/useResumeFit";

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

function dateRange(start?: string, end?: string) {
	const a = start?.trim();
	const b = end?.trim();
	if (a && b && a === b) return a;
	if (a && b) return `${a} – ${b}`;
	return a || b || "";
}

function SectionHeading({ title }: { title: string }) {
	return (
		<div className="resume-heading">
			<h2 className="resume-heading-title">{title}</h2>
		</div>
	);
}

function EntryHeader({
	title,
	meta,
	date,
}: {
	title: string;
	meta?: string;
	date?: string;
}) {
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
	switch (key) {
		case "skills":
			if (!resume.skills.some((s) => s.name || s.keywords)) return null;
			return (
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.skills} />
					<dl className="resume-skills">
						{resume.skills
							.filter((s) => s.name || s.keywords)
							.map((skill) => (
								<div key={skill.id} className="resume-skill">
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
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.experience} />
					{resume.experience.map((item) => (
						<div key={item.id} className="resume-entry">
							<EntryHeader
								title={item.company}
								meta={[item.position, item.location].filter(Boolean).join(" · ")}
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
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.projects} />
					{resume.projects.map((item) => (
						<div key={item.id} className="resume-entry">
							<EntryHeader
								title={item.name}
								meta={item.role}
								date={dateRange(item.startDate, item.endDate)}
							/>
							<Bullets
								items={[
									...(item.url ? [`${item.url}`] : []),
									...item.highlights,
								]}
							/>
						</div>
					))}
				</section>
			);
		case "education":
			if (!resume.education.some((e) => e.institution)) return null;
			return (
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.education} />
					{resume.education.map((item) => (
						<div key={item.id} className="resume-entry">
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
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.awards} />
					{resume.awards
						.filter((a) => a.title)
						.map((award) => (
							<div key={award.id} className="resume-entry">
								<EntryHeader
									title={award.title}
									meta={award.awarder}
									date={award.date}
								/>
								{award.summary ? <p className="resume-note">{award.summary}</p> : null}
							</div>
						))}
				</section>
			);
		case "publications":
			if (!resume.publications.some((p) => p.name)) return null;
			return (
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.publications} />
					{resume.publications
						.filter((p) => p.name)
						.map((pub) => (
							<div key={pub.id} className="resume-entry">
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
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.languages} />
					<ul className="resume-languages">
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
						<SectionHeading title={section.title || "其他"} />
						{section.items.map((item) => (
							<div key={item.id} className="resume-entry">
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

export function ResumeDocument({
	resume,
	onLayout,
}: {
	resume: Resume;
	onLayout?: (info: ResumeLayoutInfo) => void;
}) {
	const sheetRef = useRef<HTMLElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const layoutMode = resume.meta.layoutMode === "multi" ? "multi" : "single";
	const revision = JSON.stringify({
		basics: resume.basics,
		skills: resume.skills,
		experience: resume.experience,
		projects: resume.projects,
		education: resume.education,
		awards: resume.awards,
		publications: resume.publications,
		languages: resume.languages,
		customSections: resume.customSections,
		fontScale: resume.meta.fontScale,
		showPhoto: resume.meta.showPhoto,
		sectionOrder: resume.meta.sectionOrder,
		layoutMode,
	});
	const layout = useResumeFit(sheetRef, innerRef, layoutMode, revision);
	const pageCount = layout.pageCount;

	useLayoutEffect(() => {
		onLayout?.(layout);
	}, [layout, onLayout]);

	const contacts = [
		resume.basics.email,
		resume.basics.phone,
		resume.basics.location,
		resume.basics.url,
	].filter((item): item is string => Boolean(item?.trim()));

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
				<header className="resume-header">
					{resume.meta.showPhoto && resume.basics.photo ? (
						<img className="resume-photo" src={resume.basics.photo} alt={resume.basics.name} />
					) : null}
					<div className="resume-identity">
						<h1 className="resume-name">{resume.basics.name || "姓名"}</h1>
						{resume.basics.label ? <p className="resume-title">{resume.basics.label}</p> : null}
					</div>
					{contacts.length ? (
						<p className="resume-contacts">{contacts.join("  ·  ")}</p>
					) : null}
					{resume.basics.summary ? <p className="resume-summary">{resume.basics.summary}</p> : null}
				</header>
				{resume.meta.sectionOrder.map((key) => renderSection(key, resume))}
			</div>
		</article>
	);
}
