import { createNavigation } from "next-intl/navigation";

export const locales = ["id", "en", "ms", "ar", "jp", "kr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation({ locales, defaultLocale });

export const hasLocale = (locale: string | undefined): locale is Locale =>
  locale !== undefined && (locales as readonly string[]).includes(locale);

export const RTL_LOCALES: Locale[] = ["ar"];
export const isRTL = (locale: Locale) => RTL_LOCALES.includes(locale);
