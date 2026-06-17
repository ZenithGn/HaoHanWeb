import "../globals.css";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getDictionary } from "../../dictionaries/get-dictionary";

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
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css?family=M+PLUS+1p" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond&family=Fira+Sans&family=Merriweather&family=Noto+Sans&family=Source+Sans+Pro&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </head>
      <body suppressHydrationWarning>
        <nav className="navbar">
          <div className="navbar__container">
            <a href={`/${lang}`} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textDecoration: 'none', fontSize: '1.5rem', fontFamily: 'M-Plus-1' }}>
              <span style={{ color: 'orangered', fontSize: '30px' }}>HaoHan</span>
              <span style={{ color: 'brown', paddingBottom: '15px', fontSize: '20px' }}>SMP</span>
            </a>

            <div className="navbar__toggle" id="mobile-menu">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>

            <ul className="navbar__menu" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <li className="navbar__item">
                <a href={`/${lang}#home`} className="navbar__links" id="home-page">{dict.nav.home}</a>
              </li>
              <li className="navbar__item">
                <a href={`/${lang}#about`} className="navbar__links" id="about-page">{dict.nav.about}</a>
              </li>
              <li className="navbar__item">
                <a href={`/${lang}#faq`} className="navbar__links" id="faq-page">{dict.nav.faq}</a>
              </li>
              <li className="navbar__item">
                <a href={`/${lang}#media`} className="navbar__links" id="media-page">{dict.nav.media}</a>
              </li>
              <li className="navbar__item">
                <a href={`/${lang}/donate`} className="navbar__links" id="donate-page">{dict.nav.donate}</a>
              </li>
            </ul>
            
            {/* Language Switcher */}
            <LanguageSwitcher lang={lang} />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
