"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../components/AuthContext";
const serverIp = "haohansmp.io.vn";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export default function HomeClient({ dict, lang }) {
  const [currentLang, setCurrentLang] = useState(lang);
  const [copiedIp, setCopiedIp] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const haohanNavRef = useRef(null);
  const topbarNavRef = useRef(null);
  const haohanIndicatorRef = useRef(null);
  const topbarIndicatorRef = useRef(null);
  const isVi = currentLang === "vi";
  const { user, isLoggedIn, logout, login, getToken } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncSuccess, setSyncSuccess] = useState(true);
  const formatText = (text) => {
    return text.split('\n').map((line, idx) => {
      if (line.trim().startsWith('•')) {
        return (
          <span key={idx} className="rules-sub-rule">
            {line.substring(line.indexOf('•') + 1).trim()}
          </span>
        );
      }
      return (
        <span key={idx} className="rules-main-rule">
          {line}
        </span>
      );
    });
  };
  const labels = useMemo(() => {
    const hl = dict.home_labels || {};
    return {
      navHome: hl.nav_home || (isVi ? "Trang chủ" : "Home"),
      navFeatures: hl.nav_features || (isVi ? "Tính năng" : "Features"),
      navGallery: hl.nav_gallery || (isVi ? "Thư viện" : "Gallery"),
      navRules: hl.nav_rules || (isVi ? "Luật" : "Rules"),
      navWiki: hl.nav_wiki || "Wiki",
      navProfile: hl.nav_profile || "Profile",
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
      galleryTitle: hl.gallery_title || (isVi ? "Thư viện ảnh" : "Gallery"),
      faqTitle: hl.faq_title || "FAQ",
      serverIpLabel: hl.server_ip || (isVi ? "IP máy chủ:" : "Server IP:"),
      copied: hl.copied || (isVi ? "Đã copy" : "Copied"),
      discordBtn: hl.discord_connect || (isVi ? "Kết nối Discord" : "Discord Connect"),
      rights: dict.footer?.rights,
      disclaimer: dict.footer?.disclaimer,
      exploreHeader: hl.explore_header || (isVi ? "Khám Phá" : "Explore"),
      communityHeader: hl.community_header || (isVi ? "Liên Kết Cộng Đồng" : "Community Links")
    };
  }, [dict, isVi]);
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
      block: "block--fox",
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
  const galleryImages = useMemo(() => [
    "/assets/img/b1.png",
    "/assets/img/b2.png",
    "/assets/img/b3.png",
    "/assets/img/b4.png",
    "/assets/img/bg.png",
    "/assets/img/bg1.png",
    "/assets/img/bg2.png",
    "/assets/img/bg3.png",
    "/assets/img/bg4.png",
    "/assets/img/bg-checking-status.jpg",
    "/assets/img/bg-status-server.png"
  ], []);
  const galleryCaptions = useMemo(() => [
    isVi ? "Khoảnh khắc sinh tồn" : "Survival moments",
    isVi ? "Căn cứ người chơi" : "Player base",
    isVi ? "Cảnh quan thiên nhiên" : "Scenic view",
    isVi ? "Công trình cộng đồng" : "Community build",
    isVi ? "Khám phá thế giới rộng lớn" : "Explore the vast world",
    isVi ? "Sinh tồn cùng bạn bè" : "Survival with friends",
    isVi ? "Động vật hoang dã phong phú" : "Rich wildlife",
    isVi ? "Cơ chế tùy chỉnh độc đáo" : "Unique custom mechanics",
    isVi ? "Hệ thống Modpack đa dạng" : "Diverse Modpack system",
    isVi ? "Khu di tích cổ kính" : "Ancient ruins",
    isVi ? "Bảng trạng thái máy chủ" : "Server status board"
  ], [isVi]);
  const galleryAlbums = useMemo(() => {
    const albums = dict.gallery?.albums || {};
    return [
      {
        year: "2024",
        items: [
          { index: 9, title: albums.anniversary_7_title || "7 year anniversary", subtitle: albums.anniversary_7_subtitle || "Screenshot competition" },
          { index: 1, title: albums.artworks_title || "Artworks", subtitle: albums.artworks_subtitle || "Artworks made by members of the community" },
          { index: 10, title: albums.website_originals_title || "Website originals", subtitle: albums.website_originals_subtitle || "Images originally used in the website redesign" },
        ],
      },
      {
        year: "2021",
        items: [
          { index: 2, title: albums.anniversary_4_title || "4 Year anniversary", subtitle: albums.anniversary_4_subtitle || "Community memories" },
        ],
      },
      {
        year: "2020",
        items: [
          { index: 4, title: albums.survival_world_title || "Survival world", subtitle: albums.survival_world_subtitle || "From the early days of the server" },
        ],
      },
    ];
  }, [dict]);
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
    setActive(`#${activeTab}`);
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
        } else if (href === "#features") {
          if (activeTab !== "home") {
            setActiveTab("home");
            setTimeout(() => {
              const target = document.getElementById("features");
              if (target) {
                const offset = topbar?.classList.contains("topbar--scrolled") ? 62 : 0;
                window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
              }
            }, 100);
          } else {
            const target = document.getElementById("features");
            if (target) {
              const offset = topbar?.classList.contains("topbar--scrolled") ? 62 : 0;
              window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
            }
          }
        } else if (href === "#rules") {
          setActiveTab("rules");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (href === "#wiki") {
          setActiveTab("wiki");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (href === "#donate") {
          setActiveTab("donate");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (href === "#profile") {
          setActiveTab("profile");
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
      topbar?.classList.toggle("topbar--scrolled", gone);
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
    const onResize = () => setActive(`#${activeTab}`);
    window.addEventListener("resize", onResize);
    return () => {
      haohanObserver.disconnect();
      sectionObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [currentLang, activeTab, isLoggedIn]);
  useEffect(() => {
    const topbar = document.getElementById("topbar");
    if (activeTab !== "home") {
      topbar?.classList.add("topbar--scrolled");
    } else {
      if (window.scrollY < 100) {
        topbar?.classList.remove("topbar--scrolled");
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
  const handleLinkDiscord = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/discord/url`);
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(isVi ? "Không thể tải URL liên kết Discord." : "Could not load Discord link URL.");
      }
    } catch (error) {
      console.error("Error fetching Discord URL:", error);
      alert(isVi ? "Lỗi kết nối khi lấy URL Discord." : "Connection error getting Discord URL.");
    }
  };
  const handleSyncDiscord = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/auth/discord/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSyncSuccess(true);
        setSyncMsg(data.message || dict.profile.sync_success);
        if (data.user) {
          login(token, data.user);
        }
      } else {
        setSyncSuccess(false);
        setSyncMsg(data.error || (isVi ? "Đồng bộ thất bại." : "Sync failed."));
      }
    } catch (error) {
      console.error("Error syncing Discord:", error);
      setSyncSuccess(false);
      setSyncMsg(isVi ? "Lỗi kết nối." : "Connection error.");
    } finally {
      setSyncing(false);
    }
  };
  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setActiveTab("home");
    window.location.href = `/${currentLang}`;
  };
  const renderTools = (topbar = false) => (
    <div className={`topbar-tools${topbar ? " topbar__actions" : ""}${topbar && mobileMenuOpen ? " topbar__actions--open" : ""}`}>
      {isLoggedIn && user ? (
        <button className="tool-pill tool-auth" onClick={() => { setActiveTab("profile"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          padding: '7px 14px',
          fontWeight: 600,
          fontFamily: "'Outfit', 'Inter', sans-serif"
        }}>
          <span className="tool-text">{dict.hero.hello.replace('{name}', user.username)}</span>
        </button>
      ) : (
        <>
          <a href={`/${currentLang}/login`} className="tool-pill tool-auth btn-login">
            <span className="tool-text">{labels.login}</span>
          </a>
          <a href={`/${currentLang}/signup`} className="tool-pill tool-auth btn-signup">
            <span className="tool-text">{labels.signup}</span>
          </a>
        </>
      )}
    </div>
  );
  const navLinks = useMemo(() => {
    const list = [
      ["#home", labels.navHome, "fa-solid fa-campground"],
      ["#gallery", labels.navGallery, "fa-solid fa-images"],
      ["#rules", labels.navRules, "fa-solid fa-scroll"],
      ["#wiki", labels.navWiki, "fa-solid fa-circle-question"],
      ["#donate", labels.donate, "fa-solid fa-heart"],
    ];
    if (isLoggedIn) {
      list.push(["#profile", labels.navProfile, "fa-solid fa-user"]);
    }
    return list;
  }, [labels, isLoggedIn]);
  return (
    <>
      <div className={`topbar${mobileMenuOpen ? " topbar--menu-open" : ""}`} id="topbar" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="topbar__logo" src="/assets/img/logo.png" alt="HaoHan" />
        <button
          className="topbar__menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
        <nav className={`topbar__nav${mobileMenuOpen ? " topbar__nav--open" : ""}`} ref={topbarNavRef} aria-label="Quick navigation">
          <span className="topbar__nav__indicator" ref={topbarIndicatorRef}></span>
          {navLinks.map(([href, text, icon]) => (
            <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
              {icon && <i className={icon}></i>}
              <span className="nav-text">{text}</span>
            </a>
          ))}
        </nav>
        {renderTools(true)}
      </div>
      {activeTab === "home" && (
        <header className="haohan" id="home">
          <div className="haohan__shade"></div>
          <div className="haohan__content wrap">
            <div className="haohan__welcome">
              <span className="haohan__subtitle-green">
                <i className="fa-solid fa-leaf"></i> CHÀO MỪNG ĐẾN VỚI <i className="fa-solid fa-leaf"></i>
              </span>
              <img className="haohan__logo-main" src="/assets/img/logo.png" alt="HaoHan SMP" />
              <p className="haohan__desc">{labels.haohanDesc}</p>

              <div className="haohan__actions">
                <a className="haohan__btn-discord" href="https://discord.com/invite/znHfuc6hCR">
                  <i className="fab fa-discord"></i> {labels.discord}
                </a>
                <button className="haohan__btn-ip" onClick={copyServerIp}>
                  <i className="fa-solid fa-cube"></i> IP: {serverIp} <i className={`fa-solid ${copiedIp ? "fa-check" : "fa-copy"}`} style={{ marginLeft: '4px' }}></i>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}
      <main style={{ paddingTop: activeTab === "home" ? "0" : "80px" }}>
        {activeTab === "home" && (
          <>
            <section className="section section--panel reveal visible" id="servers">
              <div className="wrap">
                <h2>{labels.serversTitle}</h2>
                <div className="server-grid">
                  {serverCardsTranslated.map((server) => (
                    <article className="server-card" key={server.title}>
                      {server.block === "block--fox" ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}>
                          <img src="/assets/img/logo.png" alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                        </div>
                      ) : (
                        <div className={`block ${server.block}`} aria-hidden="true"></div>
                      )}
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
            <section className="section section--panel reveal visible" id="features">
              <div className="wrap">
                <h2>{labels.featuresTitle}</h2>
                <div className="feature-grid">
                  {featuresTranslated.map(([src, title]) => (
                    <div className="feature" key={title}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                      <strong>{title}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="section section--panel faq reveal visible">
              <div className="wrap faq__wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="faq__fox faq__fox--left"
                  src="/assets/img/Fox_with_emerald.webp"
                  alt=""
                  aria-hidden="true"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="faq__fox faq__fox--right"
                  src="/assets/img/Fox_with_emerald.webp"
                  alt=""
                  aria-hidden="true"
                />
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
        )}
        {activeTab === "gallery" && (
          <section className="section section--panel gallery-page reveal visible" id="gallery" style={{ minHeight: 'calc(100vh - 400px)' }}>
            <div className="wrap gallery-page__wrap">
              <header className="gallery-page__header">
                <h2>{labels.galleryTitle}</h2>
                <p>{dict.gallery?.intro || "Welcome to our gallery! This page contains albums and memorable images from HaoHan SMP. Click any image to view a full size version."}</p>
              </header>
              <div className="gallery-albums">
                {galleryAlbums.map((album) => (
                  <section className="gallery-year" key={album.year}>
                    <h3>{album.year}</h3>
                    <div className="gallery-album-grid">
                      {album.items.map((item) => (
                        <a
                          className="gallery-album-card"
                          href="#gallery"
                          key={`${album.year}-${item.index}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveImgIndex(item.index);
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={galleryImages[item.index]} alt="" />
                          <span className="gallery-album-card__text">
                            <strong>{item.title}</strong>
                            <em>{item.subtitle}</em>
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>
        )}
        {activeTab === "rules" && (
          <section className="rules-page reveal visible" id="rules">
            <header className="rules-hero">
              <div className="wrap rules-hero__inner">
                <div className="rules-hero__art">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/img/Fox_with_emerald.webp" alt="" aria-hidden="true" />
                </div>
                <div className="rules-hero__copy">
                  <span><i className="fa-solid fa-clover"></i> {isVi ? "Nội quy server" : "Server rules"}</span>
                  <h1>HAOHAN <strong>SMP</strong></h1>
                  <p>{isVi ? "Vui lòng đọc kỹ và tuân thủ các quy định dưới đây để có trải nghiệm tốt nhất cùng cộng đồng." : "Please read and follow the rules below to keep the community friendly and fair."}</p>
                </div>
                <div className="rules-hero__cube" aria-hidden="true"></div>
              </div>
            </header>

            <div className="wrap rules-page__body">
              <section className="rules-line-section">
                <div className="rules-line-section__header">
                  <span className="rules-line-section__num">1</span>
                  <h2><i className="fa-solid fa-clover"></i> {dict.rules.smp.title.replace('I. ', '')}</h2>
                </div>
                <div className="rules-line-section__content">
                  <ul>
                    {dict.rules.smp.rules_list[0]?.sub_rules.map((rule, idx) => (
                      <li key={idx}>{formatText(rule.replace(/^\d+\.\d+\.\s*/, ""))}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="rules-line-section">
                <div className="rules-line-section__header">
                  <span className="rules-line-section__num">2</span>
                  <h2><i className="fa-solid fa-clover"></i> Client/Mod</h2>
                </div>
                <div className="rules-line-section__content">
                  <ul>
                    {dict.rules.smp.rules_list[1]?.sub_rules.map((rule, idx) => (
                      <li key={idx}>{formatText(rule.replace(/^\d+\.\d+\.\s*/, ""))}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="rules-line-section">
                <div className="rules-line-section__header">
                  <span className="rules-line-section__num">3</span>
                  <h2><i className="fa-solid fa-clover"></i> {dict.rules.discord.title.replace('II. ', '')}</h2>
                </div>
                <div className="rules-line-section__content">
                  <ul>
                    {dict.rules.discord.rules_list.map((rule, idx) => (
                      <li key={idx}>{formatText(rule)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="rules-line-section">
                <div className="rules-line-section__header">
                  <span className="rules-line-section__num">4</span>
                  <h2><i className="fa-solid fa-clover"></i> {isVi ? "Giải quyết vấn đề" : "Issue resolution"}</h2>
                </div>
                <div className="rules-line-section__content">
                  <ul>
                    {dict.rules.smp.rules_list[2]?.sub_rules.map((rule, idx) => (
                      <li key={idx}>{formatText(rule)}</li>
                    ))}
                  </ul>
                  <div className="rules-ticket">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/img/logo.png" alt="" />
                    <p>{isVi ? "Bạn có thể liên hệ admin bằng cách tạo một ticket để được giải quyết." : "You can contact admins by opening a ticket for support."}</p>
                  </div>
                  <div className="rules-note">
                    <i className="fa-solid fa-clover"></i>
                    <span>{dict.rules.footer_msg.msgs[0]} {dict.rules.footer_msg.msgs[1]}</span>
                  </div>
                </div>
              </section>
            </div>
          </section>
        )}
        {activeTab === "wiki" && (
          <section className="section reveal visible" id="wiki" style={{ minHeight: 'calc(100vh - 400px)', padding: '40px 20px' }}>
            <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                maxWidth: '850px',
                width: '100%',
                backgroundColor: '#161922',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ff952e, #f37b18)'
                }}></div>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  color: '#ff952e',
                  marginBottom: '40px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  background: 'linear-gradient(to right, #ff952e, #fff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  border: 'none',
                  padding: 0
                }}>
                  {labels.navWiki}
                </h2>
                <div style={{ color: '#d7d8dc', fontSize: '1.05rem', lineHeight: '1.6', textAlign: 'center', padding: '40px 0', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                  {isVi ? "Nội dung Wiki đang được cập nhật..." : "Wiki content is being updated..."}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === "donate" && (
          <section className="section reveal visible" id="donate" style={{ minHeight: 'calc(100vh - 400px)', padding: '40px 20px' }}>
            <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                maxWidth: '850px',
                width: '100%',
                backgroundColor: '#161922',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ff952e, #f37b18)'
                }}></div>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  color: '#ff952e',
                  marginBottom: '40px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  background: 'linear-gradient(to right, #ff952e, #fff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  border: 'none',
                  padding: 0
                }}>
                  {labels.donate}
                </h2>
                <div style={{ color: '#d7d8dc', fontSize: '1.05rem', lineHeight: '1.6', textAlign: 'center', padding: '40px 0', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                  {isVi ? "Nội dung Donate đang được cập nhật..." : "Donate content is being updated..."}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === "profile" && isLoggedIn && user && (
          <section className="section reveal visible profile-section" id="profile" style={{ minHeight: 'calc(100vh - 400px)', padding: '40px 20px' }}>
            <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="profile-card" style={{
                maxWidth: '850px',
                width: '100%',
                backgroundColor: '#161922',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #5865F2, #ff952e)'
                }}></div>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  color: '#ff952e',
                  marginBottom: '40px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  background: 'linear-gradient(to right, #ff952e, #fff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  border: 'none',
                  padding: 0
                }}>
                  {dict.profile.title}
                </h2>
                <div className="profile-card-grid">
                  <div className="profile-avatar-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="profile-avatar"
                      src={`https://minotar.net/avatar/${user.username}/120`}
                      alt={user.username}
                    />
                    <div className={`profile-discord-badge ${!user.discord_id ? "profile-discord-badge--unlinked" : ""}`}>
                      {user.discord_id && user.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={user.avatar_url}
                          alt="Discord avatar"
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className="fab fa-discord"></i>
                      )}
                    </div>
                  </div>
                  <div className="profile-info">
                    <div className="profile-name-row">
                      <h3 className="profile-username">{user.username}</h3>
                      {user.uuid ? (
                        <span className="profile-badge profile-badge--verified">
                          <i className="fas fa-check-circle"></i> {dict.profile.linked_minecraft}
                        </span>
                      ) : (
                        <span className="profile-badge profile-badge--unverified">
                          <i className="fas fa-exclamation-circle"></i> {dict.profile.unlinked_minecraft}
                        </span>
                      )}
                    </div>
                    <div className="profile-fields-grid">
                      <div className="profile-field-item">
                        <span className="profile-field-label">{dict.profile.username_label || (isVi ? "Tài khoản Minecraft" : "Minecraft Account")}</span>
                        <span className="profile-field-value" style={{ fontWeight: '700', color: '#ff952e' }}>{user.username}</span>
                      </div>
                      <div className="profile-field-item">
                        <span className="profile-field-label">Email</span>
                        <span className="profile-field-value">{user.email}</span>
                      </div>
                      <div className="profile-field-item">
                        <span className="profile-field-label">{dict.profile.playtime_label}</span>
                        <span className="profile-field-value" style={{ fontWeight: '600', color: '#fff' }}>
                          {dict.profile.playtime_value
                            .replace('{hours}', Math.floor((user.play_time || 0) / 3600))
                            .replace('{minutes}', Math.floor(((user.play_time || 0) % 3600) / 60))}
                        </span>
                      </div>
                      <div className="profile-field-item">
                        <span className="profile-field-label">{dict.profile.discord_status_label || (isVi ? "Liên kết Discord" : "Discord Connection")}</span>
                        <span className="profile-field-value">
                          {user.discord_id ? (
                            <span style={{ color: '#43b581', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                              <i className="fab fa-discord"></i> {dict.profile.linked_discord}
                            </span>
                          ) : (
                            <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <i className="fab fa-discord"></i> {dict.profile.unlinked_discord}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="profile-field-item">
                        <span className="profile-field-label">{dict.profile.role_label}</span>
                        <span className="profile-field-value">{user.role || (isVi ? "Thành viên" : "Member")}</span>
                      </div>
                      <div className="profile-field-item">
                        <span className="profile-field-label">{dict.profile.uuid_label}</span>
                        <span className="profile-field-value profile-field-value--code">{user.uuid || "---"}</span>
                      </div>
                    </div>
                    {!user.uuid && (
                      <div className="profile-tip-box" style={{ marginTop: '10px' }}>
                        <i className="fas fa-info-circle"></i>
                        <span>{dict.profile.minecraft_link_tip}</span>
                      </div>
                    )}
                    <div className="profile-actions-row" style={{ marginTop: '20px' }}>
                      <div className="profile-actions-left">
                        {user.discord_id ? (
                          <span className="profile-sync-msg profile-sync-msg--success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fab fa-discord"></i> {dict.profile.linked_discord}
                          </span>
                        ) : (
                          <button className="btn-profile-discord" onClick={handleLinkDiscord}>
                            <i className="fab fa-discord"></i> {dict.profile.link_discord_btn}
                          </button>
                        )}
                        {user.discord_id && (
                          <button className="btn-profile-sync" onClick={handleSyncDiscord} disabled={syncing}>
                            <i className="fas fa-sync-alt"></i> {syncing ? dict.profile.syncing : dict.profile.sync_btn}
                          </button>
                        )}
                        {syncMsg && (
                          <span className={`profile-sync-msg ${syncSuccess ? 'profile-sync-msg--success' : 'profile-sync-msg--error'}`}>
                            {syncMsg}
                          </span>
                        )}
                      </div>
                      <button className="btn-profile-logout" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> {dict.profile.logout_btn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer style={{
        backgroundColor: '#18120c',
        padding: '0 0 40px 0',
        color: '#c7c8ce',
        fontSize: '0.95rem',
        width: '100%',
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}>
        <div className="footer-grass"></div>
        <div className="wrap" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          padding: '50px 20px 30px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/img/logo.png" alt="HaoHan SMP" style={{ width: '40px', height: '40px' }} />
              <strong style={{ color: '#fff', fontSize: '1.2rem' }}>HaoHan SMP</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6', color: '#c7c8ce' }}>
              {labels.haohanDesc}
            </p>
          </div>
          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong style={{ color: '#ff952e', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {labels.exploreHeader}
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fa-solid fa-house" style={{ width: '16px', color: '#ff952e' }}></i> {labels.navHome}
              </a>
              <a href="#gallery" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fa-solid fa-images" style={{ width: '16px', color: '#ff952e' }}></i> {labels.navGallery}
              </a>
              <a href={`/${currentLang}/rules`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fa-solid fa-scroll" style={{ width: '16px', color: '#ff952e' }}></i> {labels.navRules}
              </a>
              <a href={`/${currentLang}/donate`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fa-solid fa-heart" style={{ width: '16px', color: '#ff952e' }}></i> {labels.donate}
              </a>
            </div>
          </div>
          {/* Column 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong style={{ color: '#ff952e', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {labels.communityHeader}
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fab fa-discord" style={{ width: '16px', color: '#ff952e' }}></i> Discord
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fab fa-facebook" style={{ width: '16px', color: '#ff952e' }}></i> Facebook
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fab fa-youtube" style={{ width: '16px', color: '#ff952e' }}></i> YouTube
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
                <i className="fab fa-tiktok" style={{ width: '16px', color: '#ff952e' }}></i> TikTok
              </a>
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
          <button className="lightbox-prev" onClick={(e) => {
            e.stopPropagation();
            const list = activeTab === "gallery" ? galleryImages : featuresTranslated;
            setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
          }} aria-label="Previous image">&#10094;</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeTab === "gallery" ? galleryImages[activeImgIndex] : featuresTranslated[activeImgIndex][0]}
              alt={activeTab === "gallery" ? galleryCaptions[activeImgIndex] : featuresTranslated[activeImgIndex][1]}
            />
            <div className="lightbox-caption">
              {activeTab === "gallery" ? galleryCaptions[activeImgIndex] : featuresTranslated[activeImgIndex][1]}
            </div>
          </div>
          <button className="lightbox-next" onClick={(e) => {
            e.stopPropagation();
            const list = activeTab === "gallery" ? galleryImages : featuresTranslated;
            setActiveImgIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
          }} aria-label="Next image">&#10095;</button>
        </div>
      )}
    </>
  );
}
