export const SITE = {
  website: "https://jtzcode.github.io/blog/",
  author: "jtzcode",
  profile: "https://github.com/jtzcode",
  desc: "软件工程与 AI 研究札记。",
  title: "概念的价值",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 8,
  scheduledPostMargin: 15 * 60 * 1000,
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "建议修改",
    url: "",
  },
  dynamicOgImage: false,
  dir: "ltr",
  lang: "zh-CN",
  timezone: "Asia/Shanghai",
} as const;

export const SECTIONS = [
  {
    code: "software-engineering",
    label: "软件工程",
    href: "/software-engineering/",
    description: "软件工程的地位不可撼动",
  },
  {
    code: "ai-research",
    label: "AI 研究",
    href: "/ai-research/",
    description: "关于 LLM、Agent、Memory 以及其他",
  },
] as const;

export type SiteSection = (typeof SECTIONS)[number]["code"];

export const POST_LANGUAGES = ["en", "zh"] as const;

export type PostLanguage = (typeof POST_LANGUAGES)[number];
