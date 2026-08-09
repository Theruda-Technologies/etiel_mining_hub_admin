export const locales = ["en", "am"] as const;
export type AppLocale = (typeof locales)[number];

export const DEFAULT_LOCALE: AppLocale = "am";
export const LOCALE_COOKIE = "etiel-admin-locale";

export function isAppLocale(
  value: string | null | undefined,
): value is AppLocale {
  return value === "am" || value === "en";
}
