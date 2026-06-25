import "../globals.css";
import { getDictionary } from "@/dictionaries/get-dictionary";

export const viewport = {
  themeColor: "#FF4500",
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.home.title,
    description: dict.about.title, // Simplified for brevity
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />
        <title></title>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
