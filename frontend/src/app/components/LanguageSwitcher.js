"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function LanguageSwitcher({ lang }) {
  const pathname = usePathname();

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('scrollPosition');
    if (savedScroll) {
      const scrollPos = parseInt(savedScroll, 10);
      window.scrollTo(0, scrollPos);
      
      // Secondary check to ensure scroll is restored after layout render
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPos);
        sessionStorage.removeItem('scrollPosition');
      }, 50);

      return () => clearTimeout(timer);
    }
  }, []);
  
  const switchLang = (e, locale) => {
    e.preventDefault();
    if (!pathname) return;
    
    // Save current scroll position before redirection
    sessionStorage.setItem('scrollPosition', window.scrollY);
    
    const segments = pathname.split('/');
    segments[1] = locale;
    
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const newPath = segments.join('/') + hash;
    window.location.href = newPath;
  };

  return (
    <div className="floating-lang-switcher" aria-label="Language Selector">
      <i className="fas fa-globe" />
      <button
        onClick={(e) => switchLang(e, 'vi')}
        className={`floating-lang-btn ${lang === 'vi' ? 'floating-lang-btn--active' : ''}`}
        aria-current={lang === 'vi' ? 'page' : undefined}
      >
        VI
      </button>
      <span className="floating-lang-divider">|</span>
      <button
        onClick={(e) => switchLang(e, 'en')}
        className={`floating-lang-btn ${lang === 'en' ? 'floating-lang-btn--active' : ''}`}
        aria-current={lang === 'en' ? 'page' : undefined}
      >
        EN
      </button>
    </div>
  );
}
