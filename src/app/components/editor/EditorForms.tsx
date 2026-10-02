import type { SectionKey } from "@shared/schema";
import type { FormProps } from "./forms/shared";
import { BasicsForm } from "./forms/BasicsForm";
import { SkillsForm } from "./forms/SkillsForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { ProjectsForm } from "./forms/ProjectsForm";
import { EducationForm } from "./forms/EducationForm";
import { AwardsForm } from "./forms/AwardsForm";
import { PublicationsForm } from "./forms/PublicationsForm";
import { LanguagesForm } from "./forms/LanguagesForm";
import { CustomSectionsForm } from "./forms/CustomSectionsForm";
import { ThemeForm } from "./forms/ThemeForm";

export type EditorTab = "basics" | SectionKey | "theme";

const FORMS = {
	basics: BasicsForm,
	education: EducationForm,
	experience: ExperienceForm,
	projects: ProjectsForm,
	skills: SkillsForm,
	awards: AwardsForm,
	publications: PublicationsForm,
	languages: LanguagesForm,
	custom: CustomSectionsForm,
	theme: ThemeForm,
} satisfies Record<EditorTab, React.ComponentType<FormProps>>;

export function EditorForm({ tab, ...props }: FormProps & { tab: EditorTab }) {
	const Form = FORMS[tab];
	return <Form {...props} />;
}
