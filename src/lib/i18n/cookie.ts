// Just the cookie name — split out so both the server-only locale reader
// (src/lib/i18n/locale.ts, which imports next/headers) and the client
// LanguageProvider can share it without the client bundle pulling in a
// server-only API.
export const LOCALE_COOKIE = "drishti-locale";
