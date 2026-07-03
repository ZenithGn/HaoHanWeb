import { getDictionary } from "../../dictionaries/get-dictionary";
import HomeClient from "./HomeClient";

const routedTabs = new Set(["home", "gallery", "rules", "wiki", "donate", "profile"]);

export default async function Home({ params, searchParams }) {
  const { lang } = await params;
  const query = await searchParams;
  const requestedTab = query?.tab;
  const initialTab = routedTabs.has(requestedTab) ? requestedTab : "home";
  const dict = await getDictionary(lang);
  return <HomeClient dict={dict} lang={lang} initialTab={initialTab} />;
}
