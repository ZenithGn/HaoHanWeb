import { getDictionary } from "../../../dictionaries/get-dictionary";
import RegisterClient from "./RegisterClient";

export default async function RegisterPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <RegisterClient dict={dict} lang={lang} />;
}
