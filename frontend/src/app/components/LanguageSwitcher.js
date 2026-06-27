"use client";
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
export default function LanguageSwitcher({ lang }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('scrollPosition');
    if (savedScroll) {
      const scrollPos = parseInt(savedScroll, 10);
      window.scrollTo(0, scrollPos);

      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPos);
        sessionStorage.removeItem('scrollPosition');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);
  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const switchLang = (e, locale) => {
    e.preventDefault();
    if (!pathname) return;

    sessionStorage.setItem('scrollPosition', window.scrollY);

    const segments = pathname.split('/');
    segments[1] = locale;

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const newPath = segments.join('/') + hash;
    window.location.href = newPath;
  };
  const currentFlagSrc = lang === 'vi' ? '/assets/img/vie_flag.png' : '/assets/img/en_flag.png';
  return (
    <div className="floating-lang" ref={containerRef} aria-label="Language Selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="floating-lang__trigger"
        aria-expanded={isOpen}
        aria-label={`Change language (Current: ${lang === 'vi' ? 'Vietnamese' : 'English'})`}
        style={{ overflow: 'hidden' }}
      >
        <img
          src={currentFlagSrc}
          alt={lang === 'vi' ? 'Vietnamese' : 'English'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </button>
      {isOpen && (
        <div className="floating-lang__popover">
          <button
            onClick={(e) => { switchLang(e, 'vi'); setIsOpen(false); }}
            className={`floating-lang__option ${lang === 'vi' ? 'active' : ''}`}
          >
            <img
              src="/assets/img/vie_flag.png"
              alt="Tiếng Việt"
              style={{ width: '22px', height: '15px', objectFit: 'cover', borderRadius: '2px' }}
            />
            <span>Tiếng Việt</span>
          </button>
          <button
            onClick={(e) => { switchLang(e, 'en'); setIsOpen(false); }}
            className={`floating-lang__option ${lang === 'en' ? 'active' : ''}`}
          >
            <img
              src="/assets/img/en_flag.png"
              alt="English"
              style={{ width: '22px', height: '15px', objectFit: 'cover', borderRadius: '2px' }}
            />
            <span>English</span>
          </button>
        </div>
      )}
    </div>
  );
}
