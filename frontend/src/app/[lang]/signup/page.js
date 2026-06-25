import { getDictionary } from "../../../dictionaries/get-dictionary";
import RegisterClient from "../register/RegisterClient";

export default async function SignupPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <RegisterClient dict={dict} lang={lang} />;
}
