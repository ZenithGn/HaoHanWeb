import "../globals.css";
import { getDictionary } from "../../dictionaries/get-dictionary";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { AuthProvider } from "../components/AuthContext";

export const viewport = {
  themeColor: "#1a1a2e",
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.home.title,
    description: dict.about.title,
    openGraph: {
      title: dict.home.title,
      description: dict.about.title,
      url: "https://discord.gg/bSrCndkHnS",
      images: [
        {
          url: "https://cdn.discordapp.com/icons/884993985968484422/a_e9bea086d6cb6077469c33fe342db9f7.gif?size=1024",
        },
      ],
    },
    verification: {
      google: "WPkG_fTM0yGvdv48CEDCQ01OLj-ttNxPoTTJ-dbgozQ",
    },
  };
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
