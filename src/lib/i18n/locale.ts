import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./translations";
import { LOCALE_COOKIE } from "./cookie";

export { LOCALE_COOKIE } from "./cookie";

/** Server-only — reads the citizen's chosen language for Server Components. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return (LOCALES as string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}
