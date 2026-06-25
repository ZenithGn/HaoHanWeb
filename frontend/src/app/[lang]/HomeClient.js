"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const serverIp = "haohansmp.io.vn";

export default function HomeClient({ dict, lang }) {
  const [currentLang, setCurrentLang] = useState(lang);
  const [copiedIp, setCopiedIp] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const haohanNavRef = useRef(null);
  const topbarNavRef = useRef(null);
  const haohanIndicatorRef = useRef(null);
  const topbarIndicatorRef = useRef(null);

  const isVi = currentLang === "vi";

  const labels = useMemo(() => {
    const hl = dict.home_labels || {};
    return {
      navHome: hl.nav_home || (isVi ? "Trang chủ" : "Home"),
      navGallery: dict.features_list?.title || hl.nav_gallery || (isVi ? "Tính năng" : "Features"),
      navRules: hl.nav_rules || (isVi ? "Luật" : "Rules"),
      navWiki: hl.nav_wiki || "Wiki",
      signup: hl.signup || (isVi ? "Đăng ký" : "Sign up"),
      login: hl.login || (isVi ? "Đăng nhập" : "Login"),
      haohanTitle: hl.title || (isVi ? "Chào mừng đến với HaoHan SMP" : "Welcome to HaoHan SMP"),
      haohanDesc: hl.desc || (isVi
        ? "Cộng đồng Minecraft sinh tồn do người chơi vận hành, mang đến trải nghiệm sinh tồn cốt lõi, roleplay và phát triển lâu dài."
        : "A community-run Minecraft survival server offering a focused co-op, roleplay and long-term survival experience."),
      discord: hl.join_discord || (isVi ? "Tham gia Discord" : "Join Discord"),
      donate: hl.donate || (isVi ? "Ủng hộ chúng tôi" : "Support us"),
      serversTitle: dict.servers?.title || hl.servers_title || (isVi ? "Danh sách máy chủ" : "Our Servers"),
      featuresTitle: dict.features_list?.title || hl.features_title || (isVi ? "Tính năng" : "Features"),
      faqTitle: hl.faq_title || "FAQ",
      serverIpLabel: hl.server_ip || (isVi ? "IP máy chủ:" : "Server IP:"),
      copied: hl.copied || (isVi ? "Đã copy" : "Copied"),
      discordBtn: hl.discord_connect || (isVi ? "Kết nối Discord" : "Discord Connect"),
      rights: dict.footer?.rights,
      disclaimer: dict.footer?.disclaimer,
      exploreHeader: hl.explore_header || (isVi ? "Khám Phá" : "Explore"),
      communityHeader: hl.community_header || (isVi ? "Liên Kết Cộng Đồng" : "Community Links")
    };
  }, [currentLang, dict]);

  const serverCardsTranslated = useMemo(() => [
    {
      title: dict.servers.survival_title || "Survival",
      address: "haohansmp.hopto.org",
      body: dict.servers.survival_desc || "Survival server.",
      block: "block--grass",
    },
    {
      title: dict.servers.bedrock_title || "Bedrock",
      address: "haohansmp.ga:19132",
      body: dict.servers.bedrock_desc || "Bedrock server.",
      block: "block--wood",
    },
    {
      title: dict.servers.community_title || "Community",
      address: "Discord HaoHan SMP",
      body: dict.servers.community_desc || "Discord community.",
      block: "block--chest",
      oneIcon: true,
    },
  ], [dict]);

  const featuresTranslated = useMemo(() => [
    ["/assets/img/bg.png", dict.features_list.explore || "Explore"],
    ["/assets/img/bg1.png", dict.features_list.survival || "Survival"],
    ["/assets/img/bg3.png", dict.features_list.wildlife || "Wildlife"],
    ["/assets/img/bg2.png", dict.features_list.custom || "Custom"],
    ["/assets/img/bg4.png", dict.features_list.modpack || "Modpack"],
    ["/assets/img/bg-checking-status.jpg", dict.features_list.more || "More"],
  ], [dict]);

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

    if (activeTab === "home") {
      setActive("#home");
    } else {
      setActive("#gallery");
    }

    [...haohanLinks, ...topLinks].forEach((link) => {
      link.addEventListener("mouseenter", () => {
        const nav = link.closest("nav");
        moveIndicator(nav === haohanNav ? haohanIndicatorRef.current : topbarIndicatorRef.current, link, nav);
      });
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (href === "#") {
          event.preventDefault();
          return;
        }
        if (!href.startsWith("#")) return;
        event.preventDefault();

        if (href === "#home") {
          setActiveTab("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (href === "#gallery") {
          setActiveTab("gallery");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
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
      if (activeTab !== "home") return;
      const gone = !entry.isIntersecting;
      topbar?.classList.toggle("topbar--visible", gone);
      topbar?.setAttribute("aria-hidden", String(!gone));
    }, { threshold: 0.15 });

    const sectionObserver = new IntersectionObserver((entries) => {
      if (activeTab !== "home") return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      });
    }, { rootMargin: "-25% 0px -65% 0px" });

    if (activeTab === "home" && haohan) haohanObserver.observe(haohan);
    if (activeTab === "home") {
      document.querySelectorAll("section[id], header[id]").forEach((section) => sectionObserver.observe(section));
    }

    const onResize = () => setActive(activeTab === "home" ? "#home" : "#gallery");
    window.addEventListener("resize", onResize);

    return () => {
      haohanObserver.disconnect();
      sectionObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [currentLang, activeTab]);

  useEffect(() => {
    const topbar = document.getElementById("topbar");
    if (activeTab === "gallery") {
      topbar?.classList.add("topbar--visible");
      topbar?.setAttribute("aria-hidden", "false");
    } else {
      if (window.scrollY < 100) {
        topbar?.classList.remove("topbar--visible");
        topbar?.setAttribute("aria-hidden", "true");
      }
    }
  }, [activeTab]);

  const toggleLang = () => {
    const next = currentLang === "vi" ? "en" : "vi";
    window.location.href = `/${next}`;
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

  const renderTools = (topbar = false) => (
    <div className={`topbar-tools${topbar ? " topbar__actions" : ""}`}>
      <button className="tool-pill tool-lang" type="button" aria-label="Switch language" onClick={toggleLang}>
        <span className={`lang-opt${currentLang === "vi" ? " active" : ""}`}>VI</span>
        <span className={`lang-opt${currentLang === "en" ? " active" : ""}`}>EN</span>
      </button>
      <a href={`/${currentLang}/login`} className="tool-pill tool-auth btn-login" style={{
        marginRight: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px'
      }}>
        <span className="tool-text">{labels.login}</span>
      </a>
      <a href={`/${currentLang}/signup`} className="tool-pill tool-auth btn-signup">
        <span className="tool-text">{labels.signup}</span>
      </a>
    </div>
  );

  const navLinks = [
    ["#home", labels.navHome],
    ["#gallery", labels.navGallery],
    [`/${currentLang}/rules`, labels.navRules],
    ["#", labels.navWiki],
  ];

  return (
    <>
      <div className="topbar" id="topbar" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="topbar__logo" src="/assets/img/logo.png" alt="HaoHan" />
        <nav className="topbar__nav" ref={topbarNavRef} aria-label="Quick navigation">
          <span className="topbar__nav__indicator" ref={topbarIndicatorRef}></span>
          {navLinks.map(([href, text]) => <a key={href} href={href}>{text}</a>)}
        </nav>
        {renderTools(true)}
      </div>

      {activeTab === "home" && (
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
      )}

      <main style={{ paddingTop: activeTab === "gallery" ? "80px" : "0" }}>
        {activeTab === "home" ? (
          <>
            <section className="intro section section--tight reveal visible">
              <div className="wrap">
                <h1>{labels.haohanTitle}</h1>
                <p>{labels.haohanDesc}</p>
                <div className="actions intro-actions">
                  <a className="button button--discord" href="https://discord.com/invite/znHfuc6hCR">{labels.discord}</a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
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
                  {serverCardsTranslated.map((server) => (
                    <article className="server-card" key={server.title}>
                      <div className={`block ${server.block}`} aria-hidden="true"></div>
                      <div>
                        <h3>{server.title}</h3>
                        <span>{server.address}</span>
                        <p>{server.body}</p>
                      </div>
                    </article>
                  ))}
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
          </>
        ) : (
          <section className="section reveal visible" id="gallery" style={{ minHeight: 'calc(100vh - 400px)' }}>
            <div className="wrap">
              <h2>{labels.featuresTitle}</h2>
              <div className="feature-grid">
                {featuresTranslated.map(([src, title], index) => (
                  <a
                    className="feature"
                    href="#gallery"
                    key={title}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImgIndex(index);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                    <strong>{title}</strong>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer style={{
        backgroundColor: '#0c0d10',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '50px 20px 40px 20px',
        color: '#888',
        fontSize: '0.95rem',
        width: '100%',
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}>
        <div className="wrap" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          paddingBottom: '30px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/assets/img/logo.png" alt="HaoHan SMP" style={{ width: '40px', height: '40px' }} />
              <strong style={{ color: '#fff', fontSize: '1.2rem' }}>HaoHan SMP</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6', color: '#6e717d' }}>
              {labels.haohanDesc}
            </p>
          </div>

          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong style={{ color: '#fff', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {labels.exploreHeader}
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <a href="#home" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>{labels.navHome}</a>
              <a href="#gallery" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>{labels.navGallery}</a>
              <a href={`/${currentLang}/rules`} style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>{labels.navRules}</a>
              <a href={`/${currentLang}/donate`} style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>{labels.donate}</a>
            </div>
          </div>

          {/* Column 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong style={{ color: '#fff', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {labels.communityHeader}
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>Discord</a>
              <a href="#" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>Facebook</a>
              <a href="#" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>Youtube</a>
              <a href="#" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>TikTok</a>
            </div>
          </div>
        </div>

        <div className="wrap" style={{
          marginTop: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#444', lineHeight: '1.5' }}>
            {labels.disclaimer}
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6e717d' }}>
            {labels.rights}
          </p>
        </div>
      </footer>
      {activeImgIndex !== null && (
        <div className="lightbox-overlay" onClick={() => setActiveImgIndex(null)}>
          <button className="lightbox-close" onClick={() => setActiveImgIndex(null)} aria-label="Close lightbox">&times;</button>
          <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : featuresTranslated.length - 1)); }} aria-label="Previous image">&#10094;</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featuresTranslated[activeImgIndex][0]} alt={featuresTranslated[activeImgIndex][1]} />
            <div className="lightbox-caption">{featuresTranslated[activeImgIndex][1]}</div>
          </div>
          <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); setActiveImgIndex((prev) => (prev < featuresTranslated.length - 1 ? prev + 1 : 0)); }} aria-label="Next image">&#10095;</button>
        </div>
      )}
    </>
  );
}
