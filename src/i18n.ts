import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "./navigation";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(requested) ? requested : "id";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
