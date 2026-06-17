"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LanguageSwitcher({ lang }) {
  const pathname = usePathname();
  
  const switchLang = (e, locale) => {
    e.preventDefault();
    if (!pathname) return;
    const segments = pathname.split('/');
    segments[1] = locale;
    const newPath = segments.join('/') + window.location.hash;
    window.location.href = newPath;
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '20px' }}>
      <i className="fas fa-globe" style={{ color: 'white', fontSize: '1.2rem', marginRight: '5px' }}></i>
      <a href="#" onClick={(e) => switchLang(e, 'vi')} style={{ color: lang === 'vi' ? 'orangered' : 'gray', textDecoration: 'none', fontWeight: lang === 'vi' ? 'bold' : 'normal' }}>
        VI
      </a>
      <span style={{ color: 'white' }}>|</span>
      <a href="#" onClick={(e) => switchLang(e, 'en')} style={{ color: lang === 'en' ? 'orangered' : 'gray', textDecoration: 'none', fontWeight: lang === 'en' ? 'bold' : 'normal' }}>
        EN
      </a>
    </div>
  );
}
