import { getDictionary } from "../../../dictionaries/get-dictionary";
import RulesClient from "./RulesClient";

export default async function RulesPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <RulesClient dict={dict} lang={lang} />;
}
