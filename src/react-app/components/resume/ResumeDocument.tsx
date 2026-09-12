import {
	Briefcase,
	Calendar,
	Globe,
	Mail,
	MapPin,
	Phone,
} from "lucide-react";
import type { Resume, SectionKey } from "@shared/schema";

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

function SectionHeading({ title, accent }: { title: string; accent: string }) {
	return (
		<div className="resume-heading">
			<span className="resume-heading-bar" style={{ background: accent }} />
			<h2 className="resume-heading-title" style={{ color: accent }}>
				{title}
			</h2>
			<span className="resume-heading-line" style={{ background: accent }} />
		</div>
	);
}

function EntryHeader({
	left,
	middle,
	right,
}: {
	left: string;
	middle?: string;
	right?: string;
}) {
	if (!left && !middle && !right) return null;
	return (
		<div className="resume-entry-head">
			<div className="resume-entry-left">{left}</div>
			<div className="resume-entry-mid">{middle}</div>
			<div className="resume-entry-right">{right}</div>
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

function renderSection(key: SectionKey, resume: Resume, accent: string) {
	switch (key) {
		case "skills":
			if (!resume.skills.some((s) => s.name || s.keywords)) return null;
			return (
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.skills} accent={accent} />
					<ul className="resume-bullets">
						{resume.skills
							.filter((s) => s.name || s.keywords)
							.map((skill) => (
								<li key={skill.id}>
									{skill.name ? <strong>{skill.name}：</strong> : null}
									{skill.keywords}
								</li>
							))}
					</ul>
				</section>
			);
		case "experience":
			if (!resume.experience.some((e) => e.company || e.position)) return null;
			return (
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.experience} accent={accent} />
					{resume.experience.map((item) => (
						<div key={item.id} className="resume-entry">
							<EntryHeader
								left={item.company}
								middle={item.position}
								right={dateRange(item.startDate, item.endDate)}
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
					<SectionHeading title={SECTION_TITLES.projects} accent={accent} />
					{resume.projects.map((item) => (
						<div key={item.id} className="resume-entry">
							<EntryHeader
								left={item.name}
								middle={item.role}
								right={dateRange(item.startDate, item.endDate)}
							/>
							<Bullets
								items={[
									...(item.url ? [`链接：${item.url}`] : []),
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
					<SectionHeading title={SECTION_TITLES.education} accent={accent} />
					{resume.education.map((item) => (
						<div key={item.id} className="resume-entry">
							<EntryHeader
								left={item.institution}
								middle={[item.studyType, item.area, item.location].filter(Boolean).join(" · ")}
								right={dateRange(item.startDate, item.endDate)}
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
					<SectionHeading title={SECTION_TITLES.awards} accent={accent} />
					<ul className="resume-bullets">
						{resume.awards
							.filter((a) => a.title)
							.map((award) => (
								<li key={award.id}>
									{award.title}
									{award.awarder ? `，${award.awarder}` : ""}
									{award.date ? `，${award.date}` : ""}
									{award.summary ? `。${award.summary}` : ""}
								</li>
							))}
					</ul>
				</section>
			);
		case "publications":
			if (!resume.publications.some((p) => p.name)) return null;
			return (
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.publications} accent={accent} />
					<ul className="resume-bullets">
						{resume.publications
							.filter((p) => p.name)
							.map((pub) => (
								<li key={pub.id}>
									{pub.summary ? `${pub.summary}. ` : ""}
									<em>{pub.name}</em>
									{pub.publisher ? `. ${pub.publisher}` : ""}
									{pub.releaseDate ? `, ${pub.releaseDate}` : ""}
									{pub.url ? `. ${pub.url}` : ""}
								</li>
							))}
					</ul>
				</section>
			);
		case "languages":
			if (!resume.languages.some((l) => l.language || l.fluency)) return null;
			return (
				<section key={key} className="resume-section">
					<SectionHeading title={SECTION_TITLES.languages} accent={accent} />
					<ul className="resume-bullets">
						{resume.languages
							.filter((l) => l.language || l.fluency)
							.map((lang) => (
								<li key={lang.id}>
									{lang.language}
									{lang.fluency ? `：${lang.fluency}` : ""}
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
						<SectionHeading title={section.title || "自定义"} accent={accent} />
						{section.items.map((item) => (
							<div key={item.id} className="resume-entry">
								<EntryHeader left={item.title} middle={item.subtitle} right={item.date} />
								<Bullets items={item.highlights} />
							</div>
						))}
					</section>
				));
		default:
			return null;
	}
}

export function ResumeDocument({ resume }: { resume: Resume }) {
	const accent = resume.meta.accentColor || "#2563eb";
	const scale = resume.meta.fontScale || 1;
	const contacts = [
		resume.basics.status
			? { icon: Briefcase, text: resume.basics.status }
			: null,
		resume.basics.availableFrom
			? { icon: Calendar, text: resume.basics.availableFrom }
			: null,
		resume.basics.email ? { icon: Mail, text: resume.basics.email } : null,
		resume.basics.phone ? { icon: Phone, text: resume.basics.phone } : null,
		resume.basics.location ? { icon: MapPin, text: resume.basics.location } : null,
		resume.basics.url ? { icon: Globe, text: resume.basics.url } : null,
	].filter(Boolean) as { icon: typeof Mail; text: string }[];

	return (
		<article
			className="resume-sheet"
			style={{ ["--resume-accent" as string]: accent, fontSize: `${scale * 10.5}pt` }}
		>
			<header className="resume-header">
				{resume.meta.showPhoto && resume.basics.photo ? (
					<img className="resume-photo" src={resume.basics.photo} alt={resume.basics.name} />
				) : null}
				<h1 className="resume-name">{resume.basics.name || "姓名"}</h1>
				{resume.basics.label ? <p className="resume-title">{resume.basics.label}</p> : null}
				{contacts.length ? (
					<ul className="resume-contacts">
						{contacts.map((item) => (
							<li key={item.text}>
								<item.icon className="resume-contact-icon" strokeWidth={1.75} />
								<span>{item.text}</span>
							</li>
						))}
					</ul>
				) : null}
				{resume.basics.summary ? <p className="resume-summary">{resume.basics.summary}</p> : null}
			</header>
			{resume.meta.sectionOrder.map((key) => renderSection(key, resume, accent))}
		</article>
	);
}
