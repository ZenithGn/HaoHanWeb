import { getDictionary } from "../../../dictionaries/get-dictionary";
import DonateClient from "./DonateClient";

export default async function Donate({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <DonateClient dict={dict} lang={lang} />;
}
