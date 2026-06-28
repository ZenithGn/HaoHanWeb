import { getDictionary } from "../../../dictionaries/get-dictionary";
import WikiClient from "./WikiClient";

export default async function WikiPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <WikiClient dict={dict} lang={lang} />;
}
