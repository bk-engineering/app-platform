import type { DefaultTheme } from "vitepress";
import { structure, primaryNavKeys, guideNavKeys, type DocSection } from "./structure";

type Locale = "th" | "en";

/** "start/quickstart" -> "/start/quickstart" (th) หรือ "/en/start/quickstart" (en) */
export function link(path: string, locale: Locale): string {
  return locale === "th" ? `/${path}` : `/en/${path}`;
}

function label(section: DocSection, locale: Locale) {
  return locale === "th" ? section.th : section.en;
}

export function sidebar(locale: Locale): DefaultTheme.SidebarItem[] {
  return structure.map((section) => ({
    text: label(section, locale),
    collapsed: section.collapsed ?? false,
    items: section.items.map((page) => ({
      text: locale === "th" ? page.th : page.en,
      link: link(page.path, locale),
    })),
  }));
}

export function nav(locale: Locale): DefaultTheme.NavItem[] {
  const byKey = new Map(structure.map((s) => [s.key, s]));
  const pick = (key: string) => byKey.get(key)!;

  const primary = primaryNavKeys.map((key) => {
    const section = pick(key);
    return { text: label(section, locale), link: link(section.items[0].path, locale) };
  });

  const guides = {
    text: locale === "th" ? "คู่มือ" : "Guides",
    items: guideNavKeys.map((key) => {
      const section = pick(key);
      return { text: label(section, locale), link: link(section.items[0].path, locale) };
    }),
  };

  // แทรก dropdown คู่มือหลัง "สถาปัตยกรรม"
  return [primary[0], primary[1], guides, primary[2], primary[3]];
}
