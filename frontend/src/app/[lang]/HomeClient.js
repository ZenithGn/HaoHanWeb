"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const serverIp = "haohansmp.io.vn";

const serverCards = [
  {
    title: "Survival",
    address: "haohansmp.hopto.org",
    body: "Java 1.17.1 va Bedrock 1.17.x cho nguoi choi yeu sinh ton, xay dung va roleplay lau dai.",
    block: "block--grass",
  },
  {
    title: "Bedrock",
    address: "haohansmp.ga:19132",
    body: "Cong dong chung cho Java va Bedrock, de ket noi voi ban be va cung tao nen can cu rieng.",
    block: "block--wood",
  },
  {
    title: "Community",
    address: "Discord HaoHan SMP",
    body: "Dang ky, hoi dap, bao loi va cap nhat thong tin may chu thong qua Discord chinh thuc.",
    block: "block--chest",
    oneIcon: true,
  },
];

const features = [
  ["/assets/img/bg.png", "Kham pha the gioi"],
  ["/assets/img/bg1.png", "Sinh ton va phat trien"],
  ["/assets/img/bg3.png", "Dong vat hoang da"],
  ["/assets/img/bg2.png", "Co che tuy chinh"],
  ["/assets/img/bg4.png", "Nhan Modpack"],
  ["/assets/img/bg-checking-status.jpg", "Tim hieu them"],
];

const musicTracks = [
  "/assets/music/music.mp3",
  "/assets/music/music1.mp3",
];

export default function HomeClient({ dict, lang }) {
  const [currentLang, setCurrentLang] = useState(lang);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.45);
  const [copiedIp, setCopiedIp] = useState(false);
  const audioRef = useRef(null);
  const haohanNavRef = useRef(null);
  const topbarNavRef = useRef(null);
  const haohanIndicatorRef = useRef(null);
  const topbarIndicatorRef = useRef(null);

  const labels = useMemo(() => {
    const isVi = currentLang === "vi";
    return {
      navHome: isVi ? "Trang chu" : "Home",
      navGallery: isVi ? "Tinh nang" : "Features",
      navRules: isVi ? "May chu" : "Servers",
      navWiki: "Wiki",
      signup: isVi ? "Dang ky" : "Sign up",
      musicTitle: isVi ? "Nhac nen" : "BGM",
      musicSub: isMusicPlaying
        ? (isVi ? `Dang phat ${currentTrack + 1}/2` : `Playing ${currentTrack + 1}/2`)
        : (isVi ? "Sanh cho" : "Lobby"),
      haohanTitle: isVi ? "Chao mung den voi HaoHan SMP" : "Welcome to HaoHan SMP",
      haohanDesc: isVi
        ? "Cong dong Minecraft sinh ton do nguoi choi van hanh, mang den trai nghiem sinh ton cot loi, roleplay va phat trien lau dai."
        : "A community-run Minecraft survival server offering a focused co-op, roleplay and long-term survival experience.",
      discord: isVi ? "Tham gia Discord" : "Join Discord",
      donate: isVi ? "Giup do chung toi" : "Support us",
      serversTitle: isVi ? "May chu" : "Our Servers",
      featuresTitle: isVi ? "Tinh nang" : "Features",
      faqTitle: "FAQ",
      moreTitle: isVi ? "Thong tin them" : "More info",
      supportTitle: isVi ? "Ung ho chung toi" : "Support us",
      serverIpLabel: isVi ? "IP may chu:" : "Server IP:",
      copied: isVi ? "Da copy" : "Copied",
    };
  }, [currentLang, currentTrack, isMusicPlaying]);

  useEffect(() => {
    const moveIndicator = (indicator, linkEl, containerEl) => {
      if (!indicator || !linkEl || !containerEl) return;
      const containerRect = containerEl.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();
      indicator.style.left = `${linkRect.left - containerRect.left}px`;
      indicator.style.width = `${linkRect.width}px`;
    };

    const haohanNav = haohanNavRef.current;
    const topbarNav = topbarNavRef.current;
    const topbar = document.getElementById("topbar");
    const haohan = document.getElementById("home");
    const haohanLinks = haohanNav ? Array.from(haohanNav.querySelectorAll("a[href^='#']")) : [];
    const topLinks = topbarNav ? Array.from(topbarNav.querySelectorAll("a[href^='#']")) : [];

    const setActive = (href) => {
      haohanLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === href));
      topLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === href));
      requestAnimationFrame(() => {
        const haohanActive = haohanLinks.find((link) => link.classList.contains("active")) || haohanLinks[0];
        const topActive = topLinks.find((link) => link.classList.contains("active")) || topLinks[0];
        moveIndicator(haohanIndicatorRef.current, haohanActive, haohanNav);
        moveIndicator(topbarIndicatorRef.current, topActive, topbarNav);
      });
    };

    setActive("#home");

    [...haohanLinks, ...topLinks].forEach((link) => {
      link.addEventListener("mouseenter", () => {
        const nav = link.closest("nav");
        moveIndicator(nav === haohanNav ? haohanIndicatorRef.current : topbarIndicatorRef.current, link, nav);
      });
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        setActive(href);
        const offset = topbar?.classList.contains("topbar--visible") ? 62 : 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
      });
    });

    haohanNav?.addEventListener("mouseleave", () => {
      const active = haohanLinks.find((link) => link.classList.contains("active")) || haohanLinks[0];
      moveIndicator(haohanIndicatorRef.current, active, haohanNav);
    });
    topbarNav?.addEventListener("mouseleave", () => {
      const active = topLinks.find((link) => link.classList.contains("active")) || topLinks[0];
      moveIndicator(topbarIndicatorRef.current, active, topbarNav);
    });

    const haohanObserver = new IntersectionObserver(([entry]) => {
      const gone = !entry.isIntersecting;
      topbar?.classList.toggle("topbar--visible", gone);
      topbar?.setAttribute("aria-hidden", String(!gone));
    }, { threshold: 0.15 });

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      });
    }, { rootMargin: "-25% 0px -65% 0px" });

    if (haohan) haohanObserver.observe(haohan);
    document.querySelectorAll("section[id], header[id]").forEach((section) => sectionObserver.observe(section));

    const onResize = () => setActive(window.location.hash || "#home");
    window.addEventListener("resize", onResize);

    return () => {
      haohanObserver.disconnect();
      sectionObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [currentLang]);

  const toggleLang = () => {
    const next = currentLang === "vi" ? "en" : "vi";
    setCurrentLang(next);
    window.history.replaceState(null, "", `/${next}`);
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsMusicPlaying(true);
    } catch (error) {
      setIsMusicPlaying(false);
      console.warn("Audio playback was blocked by the browser.", error);
    }
  };

  const handleTrackEnded = () => {
    setCurrentTrack((track) => (track + 1) % musicTracks.length);
    setIsMusicPlaying(true);
  };

  const copyServerIp = async () => {
    try {
      await navigator.clipboard.writeText(serverIp);
      setCopiedIp(true);
      window.setTimeout(() => setCopiedIp(false), 1400);
    } catch (error) {
      console.warn("Could not copy server IP.", error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isMusicPlaying) return;

    audio.load();
    audio.play().catch((error) => {
      setIsMusicPlaying(false);
      console.warn("Audio playback was blocked by the browser.", error);
    });
  }, [currentTrack, isMusicPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  const renderTools = (topbar = false) => (
    <div className={`topbar-tools${topbar ? " topbar__actions" : ""}`}>
      <button className="tool-pill tool-lang" type="button" aria-label="Switch language" onClick={toggleLang}>
        <span className={`lang-opt${currentLang === "vi" ? " active" : ""}`}>VI</span>
        <span className={`lang-opt${currentLang === "en" ? " active" : ""}`}>EN</span>
      </button>
      <button
        className={`tool-pill tool-music${isMusicPlaying ? " tool-music--playing" : ""}`}
        type="button"
        aria-label={labels.musicTitle}
        aria-pressed={isMusicPlaying}
        onClick={toggleMusic}
      >
        <span className="music-icon">{isMusicPlaying ? "||" : ">"}</span>
        <span className="music-text"><strong>{labels.musicTitle}</strong><span>{labels.musicSub}</span></span>
        <span className="music-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span className="volume-control" onClick={(event) => event.stopPropagation()}>
          <span className="volume-control__icon" aria-hidden="true">Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={musicVolume}
            aria-label="Music volume"
            onChange={(event) => setMusicVolume(Number(event.target.value))}
          />
        </span>
      </button>
      <a href={`/${currentLang}/signup`} className="tool-pill tool-auth btn-signup">
        <span className="tool-text">{labels.signup}</span>
      </a>
    </div>
  );

  const navLinks = [
    ["#home", labels.navHome],
    ["#gallery", labels.navGallery],
    ["#rules", labels.navRules],
    ["#wiki", labels.navWiki],
  ];

  return (
    <>
      <audio ref={audioRef} src={musicTracks[currentTrack]} preload="auto" onEnded={handleTrackEnded} />
      <div className="topbar" id="topbar" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="topbar__logo" src="/assets/img/logo.png" alt="HaoHan" />
        <nav className="topbar__nav" ref={topbarNavRef} aria-label="Quick navigation">
          <span className="topbar__nav__indicator" ref={topbarIndicatorRef}></span>
          {navLinks.map(([href, text]) => <a key={href} href={href}>{text}</a>)}
        </nav>
        {renderTools(true)}
      </div>

      <header className="haohan" id="home">
        <div className="haohan__top-tools wrap">{renderTools()}</div>
        <div className="haohan__shade"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="haohan__logo" src="/assets/img/logo.png" alt="HaoHan SMP" />
        <nav className="nav" ref={haohanNavRef} aria-label="Main navigation">
          <span className="nav__indicator" ref={haohanIndicatorRef}></span>
          {navLinks.map(([href, text], index) => <a key={href} className={index === 0 ? "active" : ""} href={href}>{text}</a>)}
        </nav>
      </header>

      <main>
        <section className="intro section section--tight reveal visible">
          <div className="wrap">
            <h1>{labels.haohanTitle}</h1>
            <p>{labels.haohanDesc}</p>
            <div className="actions intro-actions">
              <a className="button button--discord" href="https://discord.com/invite/znHfuc6hCR">{labels.discord}</a>
              <a className="button button--orange" href={`/${currentLang}/donate`}>{labels.donate}</a>
              <div className="server-ip intro-server-ip">
                <span>{labels.serverIpLabel}</span>
                <strong>{serverIp}</strong>
                <button type="button" aria-label="Copy server IP" onClick={copyServerIp}>
                  {copiedIp ? labels.copied : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--panel reveal visible" id="rules">
          <div className="wrap">
            <h2>{labels.serversTitle}</h2>
            <div className="server-grid">
              {serverCards.map((server) => (
                <article className="server-card" key={server.title}>
                  <div className={`block ${server.block}`} aria-hidden="true"></div>
                  <div>
                    <h3>{server.title}</h3>
                    <span>{server.address}</span>
                    <p>{server.body}</p>
                    <div className={`server-icons${server.oneIcon ? " server-icons--one" : ""}`} aria-hidden="true">
                      <span></span><span></span>{!server.oneIcon && <span></span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section reveal visible" id="gallery">
          <div className="wrap">
            <h2>{labels.featuresTitle}</h2>
            <div className="feature-grid">
              {features.map(([src, title]) => <a className="feature" href="#wiki" key={title}><img src={src} alt="" /><strong>{title}</strong></a>)}
            </div>
          </div>
        </section>

        <section className="section section--panel faq reveal visible">
          <div className="wrap faq__wrap">
            <div className="faq__content">
              <h2>{labels.faqTitle}</h2>
              {[1, 2, 3, 4, 5].map((item) => (
                <details key={item}>
                  <summary>{dict.faq[`q${item}`]}</summary>
                  <p>{dict.faq[`a${item}`]}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section more reveal visible" id="wiki">
          <div className="wrap">
            <h2>{labels.moreTitle}</h2>
            <div className="info-grid">
              <article className="info-card"><span className="info-card__icon info-card__icon--discord"></span><h3>Discord</h3><p>Dang ky, trao doi voi quan tri vien va theo doi thong bao cong dong.</p></article>
              <article className="info-card"><span className="info-card__icon info-card__icon--social"></span><h3>Social</h3><p>Theo doi cap nhat ve may chu, su kien va nhung thay doi moi.</p></article>
              <article className="info-card"><span className="info-card__icon info-card__icon--feedback"></span><h3>Feedback</h3><p>Gui gop y de server tot hon qua tung mua choi.</p></article>
            </div>
            <div className="support">
              <h2>{labels.supportTitle}</h2>
              <div className="actions">
                <a className="button button--patreon" href={`/${currentLang}/donate`}><span></span>Donate</a>
                <a className="button button--kofi" href="https://discord.com/invite/znHfuc6hCR"><span></span>Discord</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
