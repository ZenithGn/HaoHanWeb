import { getDictionary } from "../../../dictionaries/get-dictionary";
import LoginClient from "./LoginClient";

export default async function LoginPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <LoginClient dict={dict} lang={lang} />;
}
