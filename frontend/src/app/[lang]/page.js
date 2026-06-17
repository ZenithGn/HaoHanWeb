import { getDictionary } from "../../dictionaries/get-dictionary";
import HomeClient from "./HomeClient";

export default async function Home({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <HomeClient dict={dict} lang={lang} />;
}
