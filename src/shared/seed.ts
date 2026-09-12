import { DEFAULT_META, DEFAULT_SLUG, type Resume } from "./schema";

/** Seeded sample: 商庆达 — used by editor reset, public fallback, and first D1 write. */
export const SAMPLE_RESUME: Resume = {
	basics: {
		name: "商庆达",
		label: "前端 / 全栈工程师",
		email: "shqingda@gmail.com",
		phone: "13820138117",
		status: "求职中",
	},
	skills: [
		{
			id: "skill_lang",
			name: "编程语言",
			keywords: "TypeScript / JavaScript、Python、Java",
		},
		{
			id: "skill_fe",
			name: "前端",
			keywords: "React、Next.js 基础、HTML/CSS、Tailwind；了解 Vue",
		},
		{
			id: "skill_be",
			name: "后端 / 全栈",
			keywords: "Node.js、Hono；了解 Serverless / Cloudflare Workers",
		},
		{
			id: "skill_eng",
			name: "工程化",
			keywords: "Vite / Webpack、Git、Linux / macOS；Drizzle 基础",
		},
	],
	experience: [
		{
			id: "exp_crdc",
			company: "中国铁路设计集团信息化院",
			position: "实习",
			startDate: "2022/04",
			endDate: "2022/04",
			location: "中国",
			highlights: [
				"参与云应用客户端的设计与开发，完成界面与业务模块落地。",
				"使用 Vue 与 Element Plus 构建桌面端交互与可复用组件。",
			],
		},
		{
			id: "exp_hit",
			company: "哈尔滨工业大学海量数据计算研究中心",
			position: "实习",
			startDate: "2018/09",
			endDate: "2019/07",
			location: "哈尔滨",
			highlights: [
				"导师王宏志，开展 MOOC 大数据分析与研究。",
				"参与学生学习行为分析与流失预警相关数据工作。",
				"合作完成 ACM TUR-C 论文一篇。",
			],
		},
		{
			id: "exp_ict",
			company: "中国科学院计算技术研究所",
			position: "实习",
			startDate: "2017/10",
			endDate: "2017/10",
			location: "北京",
			highlights: [
				"导师刘兴武，参与实时道路交通异常检测相关研究。",
				"协助完成检测算法实验与数据验证。",
			],
		},
		{
			id: "exp_neusoft",
			company: "东软集团",
			position: "软件工程实习",
			startDate: "2017/07",
			endDate: "2017/08",
			location: "中国",
			highlights: [
				"参与手持医疗系统相关开发与联调。",
				"协助完成业务模块实现与测试。",
			],
		},
	],
	projects: [
		{
			id: "proj_cloud",
			name: "云应用客户端",
			role: "前端开发",
			highlights: [
				"基于 Vue 与 Element Plus 构建云应用桌面客户端。",
				"完成核心页面、组件封装与业务联调。",
			],
		},
		{
			id: "proj_music",
			name: "Vue 在线音乐",
			role: "独立开发",
			highlights: [
				"使用 Vue、Vuex 与 Firebase 实现在线音乐播放与数据同步。",
			],
		},
		{
			id: "proj_blog",
			name: "Vue 简易博客",
			role: "独立开发",
			highlights: ["基于 Vue 实现文章列表、详情与基础内容管理。"],
		},
		{
			id: "proj_mooc",
			name: "MOOC 数据可视化",
			role: "开发",
			highlights: [
				"使用 ECharts 对 MOOC 学习数据进行可视化分析。",
				"支撑流失预警研究中的图表展示。",
			],
		},
		{
			id: "proj_bot",
			name: "Telegram 智能 Bot",
			role: "独立开发",
			highlights: ["使用 Python 开发 Telegram 智能机器人，处理会话与自定义指令。"],
		},
	],
	education: [
		{
			id: "edu_gwu",
			institution: "美国乔治华盛顿大学",
			area: "计算机科学",
			studyType: "硕士",
			startDate: "2019/09",
			endDate: "2021/06",
			location: "哥伦比亚特区，美国",
			highlights: [],
		},
		{
			id: "edu_hit",
			institution: "哈尔滨工业大学",
			area: "软件工程",
			studyType: "学士",
			startDate: "2015/09",
			endDate: "2019/06",
			location: "哈尔滨，中国",
			highlights: [],
		},
	],
	awards: [
		{
			id: "award_scholarship",
			title: "人民奖学金二等奖",
			date: "2016",
			awarder: "哈尔滨工业大学",
		},
		{
			id: "award_project",
			title: "大一年度项目计划优秀项目二等奖",
			date: "2016",
			awarder: "哈尔滨工业大学",
		},
	],
	publications: [
		{
			id: "pub_turc",
			name: "The analysis and early warning of student loss in MOOC course",
			publisher: "ACM TUR-C",
			releaseDate: "2019",
			summary: "Yin, S., Shang, Q., Wang, H., & Che, B.",
		},
	],
	languages: [
		{ id: "lang_toefl", language: "英语", fluency: "托福 90" },
		{ id: "lang_cet6", language: "英语", fluency: "CET-6 518" },
	],
	customSections: [],
	meta: {
		...DEFAULT_META,
		sectionOrder: [
			"skills",
			"experience",
			"projects",
			"education",
			"awards",
			"publications",
			"languages",
			"custom",
		],
	},
};

export const SAMPLE_SLUG = DEFAULT_SLUG;
export const SAMPLE_ID = "default";
