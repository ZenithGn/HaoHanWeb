import { getDictionary } from "../../../../dictionaries/get-dictionary";
import DiscordCallbackClient from "./DiscordCallbackClient";

export default async function DiscordCallbackPage({ params, searchParams }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  // In Next.js 15, searchParams is an async promise that needs to be awaited
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams?.code || "";
  const state = resolvedSearchParams?.state || "";

  return (
    <DiscordCallbackClient dict={dict} lang={lang} code={code} state={state} />
  );
}
