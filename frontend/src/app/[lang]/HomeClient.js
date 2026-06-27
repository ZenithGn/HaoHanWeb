"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../components/AuthContext";
const serverIp = "haohansmp.io.vn";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function SectionStars({ count = 25 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let w = 0, h = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    class Star {
      constructor(init) { this.spawn(init); }

      spawn(scatter) {
        this.x = Math.random() * w;
        this.y = scatter ? Math.random() * h : Math.random() * h * 0.85;
        this.size = Math.random() * 1.9 + 0.65;
        this.opacity = 0;
        this.maxOpacity = Math.random() * 0.45 + 0.2;
        this.green = Math.random() > 0.45;
        this.phase = 'in';
        this.fadeSpeed = Math.random() * 0.006 + 0.003;
        this.twinkleTime = Math.random() * 320 + 180;
        this.age = 0;
        this.vx = 0;
        this.vy = 0;
        this.trail = [];
        this.trailMax = Math.floor(12 + this.size * 5 + Math.random() * 5);
        this.meteorSize = this.size;
      }

      update() {
        if (this.phase === 'in') {
          this.opacity += this.fadeSpeed;
          if (this.opacity >= this.maxOpacity) {
            this.opacity = this.maxOpacity;
            this.phase = 'twinkle';
          }
        } else if (this.phase === 'twinkle') {
          this.age++;
          this.opacity = this.maxOpacity + Math.sin(this.age * 0.065) * 0.07;
          if (this.age >= this.twinkleTime) {
            if (Math.random() < 0.08) {
              this.phase = 'shoot';
              const a = (Math.random() * 20 + 20) * Math.PI / 180;
              const spd = Math.random() * 5 + 3.5;
              this.vx = -spd * Math.cos(a);
              this.vy = spd * Math.sin(a);
              this.opacity = Math.max(this.opacity, 0.82);
              this.meteorSize = this.size * (Math.random() * 0.25 + 1.05);
            } else {
              this.phase = 'out';
            }
          }
        } else if (this.phase === 'shoot') {
          this.trail.push({ x: this.x, y: this.y, o: this.opacity });
          if (this.trail.length > this.trailMax) this.trail.shift();
          this.x += this.vx;
          this.y += this.vy;
          this.opacity -= 0.0045;
          if (this.opacity <= 0 || this.x < -60 || this.y > h + 60 || this.x > w + 60) {
            this.spawn(false);
          }
        } else if (this.phase === 'out') {
          this.opacity -= this.fadeSpeed;
          if (this.opacity <= 0) this.spawn(false);
        }
      }

      draw() {
        if (this.opacity <= 0) return;
        const r = this.green ? 163 : 255;
        const g = this.green ? 230 : 255;
        const b = this.green ? 88 : 255;

        if (this.phase === 'shoot' && this.trail.length > 0) {
          const tail = this.trail[0];
          const gradient = ctx.createLinearGradient(tail.x, tail.y, this.x, this.y);
          gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
          gradient.addColorStop(0.42, `rgba(${r},${g},${b},${this.opacity * 0.18})`);
          gradient.addColorStop(1, `rgba(255,255,255,${this.opacity * 0.9})`);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(tail.x, tail.y);
          for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
          }
          ctx.lineTo(this.x, this.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = Math.max(1.2, this.meteorSize * 1.55);
          ctx.lineCap = 'round';
          ctx.shadowColor = `rgba(${r},${g},${b},${this.opacity * 0.85})`;
          ctx.shadowBlur = 10;
          ctx.stroke();

          // A thin, hot core keeps the meteor trail crisp inside the glow.
          ctx.strokeStyle = `rgba(255,255,255,${this.opacity * 0.48})`;
          ctx.lineWidth = Math.max(0.5, this.meteorSize * 0.5);
          ctx.shadowBlur = 3;
          ctx.stroke();
          ctx.restore();

          for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const ratio = i / this.trail.length;
            const to = t.o * ratio * 0.38;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.meteorSize * ratio * 0.72, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${to})`;
            ctx.fill();
          }
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
        ctx.fill();

        if (this.phase === 'shoot') {
          ctx.save();
          ctx.fillStyle = `rgba(255,255,255,${this.opacity * 0.72})`;
          ctx.shadowColor = `rgba(${r},${g},${b},${this.opacity})`;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.meteorSize * 1.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (this.phase === 'twinkle' && this.size > 1.2 && Math.sin(this.age * 0.09) > 0.55) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${this.opacity * 0.35})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(this.x - 3, this.y); ctx.lineTo(this.x + 3, this.y);
          ctx.moveTo(this.x, this.y - 3); ctx.lineTo(this.x, this.y + 3);
          ctx.stroke();
        }
      }
    }

    const stars = Array.from({ length: count }, () => new Star(true));

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(s => { s.update(); s.draw(); });
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [count]);

  return <canvas ref={canvasRef} className="section-stars-canvas" />;
}

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
  const [openFaq, setOpenFaq] = useState(null);
  const [activeWikiTab, setActiveWikiTab] = useState("intro");
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
      haohanWelcomeBack: hl.welcome_back || (isVi ? "Chào mừng trở lại" : "Welcome back"),
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
      communityHeader: hl.community_header || (isVi ? "Liên Kết Cộng Đồng" : "Community Links"),
      heroWelcomeBack: hl.hero_welcome_back,
      heroWelcomeTo: hl.hero_welcome_to,
      serversEyebrow: hl.servers_eyebrow,
      serversSubtitle: hl.servers_subtitle,
      featuresSubtitle: hl.features_subtitle,
      faqEyebrow: hl.faq_eyebrow,
      faqSubtitle: hl.faq_subtitle,
      faqMorePrefix: hl.faq_more_prefix,
      faqMoreDiscord: hl.faq_more_discord,
      faqMoreOr: hl.faq_more_or,
      faqMoreTicket: hl.faq_more_ticket,
      copyIpBtn: hl.copy_ip_btn,
      copiedIpBtn: hl.copied_ip_btn,
      joinBtn: hl.join_btn,
      galleryHeroEyebrow: hl.gallery_hero_eyebrow,
      rulesHeroEyebrow: hl.rules_hero_eyebrow,
      rulesHeroDesc: hl.rules_hero_desc,
      rulesSection4Title: hl.rules_section4_title,
      rulesTicketDesc: hl.rules_ticket_desc,
    };
  }, [dict, isVi]);
  const serverCardsTranslated = useMemo(() => [
    {
      title: dict.servers.survival_title || "Survival",
      address: serverIp,
      body: dict.servers.survival_desc || "Survival server.",
      block: "block--grass",
    },
    {
      title: dict.servers.bedrock_title || "Bedrock",
      address: serverIp + ":19132",
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
  const featureCards = useMemo(() => [
    {
      icon: "fa-solid fa-compass",
      title: dict.features_list.explore || "Explore the World",
      desc: dict.features_list.explore_desc,
      img: "/assets/img/bg.png",
      accent: "#4ade80",
      large: true,
    },
    {
      icon: "fa-solid fa-shield-halved",
      title: dict.features_list.survival || "Survival & Progress",
      desc: dict.features_list.survival_desc,
      img: "/assets/img/bg1.png",
      accent: "#fb923c",
    },
    {
      icon: "fa-solid fa-mountain-sun",
      title: dict.features_list.terrain || "Customizable Terrain",
      desc: dict.features_list.terrain_desc,
      img: "/assets/img/bg3.png",
      accent: "#38bdf8",
    },
    {
      icon: "fa-solid fa-wand-magic-sparkles",
      title: dict.features_list.custom || "Custom Mechanics",
      desc: dict.features_list.custom_desc,
      img: "/assets/img/bg2.png",
      accent: "#c084fc",
    },
    {
      icon: "fa-solid fa-box-archive",
      title: dict.features_list.modpack || "Get Modpack",
      desc: dict.features_list.modpack_desc,
      img: "/assets/img/bg4.png",
      accent: "#facc15",
    },
    {
      icon: "fa-solid fa-arrow-right-long",
      title: dict.features_list.more || "Learn More",
      desc: dict.features_list.more_desc,
      img: "/assets/img/bg-checking-status.jpg",
      accent: "#ff5757",
    },
  ], [dict, isVi]);
  const featuresTranslated = useMemo(() => featureCards.map(c => [c.img, c.title]), [featureCards]);
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
  const galleryCaptions = useMemo(() => dict.gallery?.captions || [], [dict]);
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
        alert(dict.alerts?.discord_url_error);
      }
    } catch (error) {
      console.error("Error fetching Discord URL:", error);
      alert(dict.alerts?.discord_connection_error);
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
        setSyncMsg(data.error || dict.alerts?.sync_failed);
      }
    } catch (error) {
      console.error("Error syncing Discord:", error);
      setSyncSuccess(false);
      setSyncMsg(dict.alerts?.connection_error);
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
          <SectionStars count={30} />
          <div className="haohan__shade"></div>
          <div className="haohan__content wrap">
            <div className="haohan__welcome">
              <span className="haohan__subtitle-green">
                <i className="fa-solid fa-leaf"></i>
                {isLoggedIn && user
                  ? labels.heroWelcomeBack?.replace('{name}', user.username.toUpperCase())
                  : labels.heroWelcomeTo
                }
                <i className="fa-solid fa-leaf"></i>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
      <main>
        {activeTab === "home" && (
          <>
            <section className="section section--panel reveal visible" id="servers">
              <SectionStars count={20} />
              <div className="wrap">
                <div className="section-header">
                  <span className="section-header__eyebrow">
                    <i className="fa-solid fa-server"></i> {labels.serversEyebrow}
                  </span>
                  <h2 className="section-header__title">{labels.serversTitle}</h2>
                  <p className="section-header__subtitle">
                    {labels.serversSubtitle}
                  </p>
                </div>
                <div className="mc-server-list">
                  {serverCardsTranslated.map((server, idx) => (
                    <div className="mc-server-row" key={server.title} onClick={() => {
                      if (idx < 2) {
                        navigator.clipboard.writeText(server.address);
                        setCopiedIp(true);
                        setTimeout(() => setCopiedIp(false), 2000);
                      } else {
                        window.open("https://discord.com/invite/znHfuc6hCR", "_blank");
                      }
                    }}>
                      <div className="mc-server-icon">
                        {server.block === "block--fox" ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src="/assets/img/logo.png" alt="" className="mc-pixel-logo" />
                        ) : (
                          <div className={`block ${server.block}`} aria-hidden="true"></div>
                        )}
                      </div>

                      <div className="mc-server-details">
                        <div className="mc-server-top">
                          <h3 className="mc-server-title">{server.title}</h3>
                          <span className="mc-server-version">
                            {idx === 0 && dict.servers.java_bedrock_version}
                            {idx === 1 && dict.servers.bedrock_port}
                            {idx === 2 && dict.servers.discord_link_label}
                          </span>
                        </div>
                        <p className="mc-server-motd">{server.body}</p>
                        <div className="mc-server-ip-container">
                          <span className="mc-server-ip">{server.address}</span>
                          {idx < 2 ? (
                            <button className="mc-copy-ip-btn" onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(server.address);
                              setCopiedIp(true);
                              setTimeout(() => setCopiedIp(false), 2000);
                            }}>
                              <i className="fa-solid fa-copy"></i>
                              <span>{copiedIp ? labels.copiedIpBtn : labels.copyIpBtn}</span>
                            </button>
                          ) : (
                            <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer" className="mc-join-link" onClick={(e) => e.stopPropagation()}>
                              <i className="fa-brands fa-discord"></i> {labels.joinBtn}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="mc-server-status">
                        <div className="mc-connection-ping">
                          <span className="mc-ping-bar active"></span>
                          <span className="mc-ping-bar active"></span>
                          <span className="mc-ping-bar active"></span>
                          <span className="mc-ping-bar active"></span>
                          <span className="mc-ping-bar active"></span>
                        </div>
                        <span className="mc-player-count">
                          {idx === 0 && "18/150"}
                          {idx === 1 && "24/150"}
                          {idx === 2 && "Online"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ===== REDESIGNED FEATURES SECTION ===== */}
            <section className="section section--panel reveal visible features-section" id="features">
              <SectionStars count={25} />
              <div className="wrap">
                <div className="features-header">
                  <h2 className="features-title">{labels.featuresTitle}</h2>
                  <p className="features-subtitle">
                    {labels.featuresSubtitle}
                  </p>
                </div>
                <div className="feature-bento">
                  {featureCards.map((card, idx) => (
                    <div
                      className={`feature-card${card.large ? " feature-card--large" : ""}`}
                      key={card.title}
                      style={{ "--card-accent": card.accent }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="feature-card__bg" src={card.img} alt="" aria-hidden="true" />
                      <div className="feature-card__overlay"></div>
                      <div className="feature-card__body">
                        <div className="feature-card__icon">
                          <i className={card.icon}></i>
                        </div>
                        <h3 className="feature-card__title">{card.title}</h3>
                        <p className="feature-card__desc">{card.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section--panel faq reveal visible">
              <SectionStars count={20} />
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
                  <div className="section-header">
                    <span className="section-header__eyebrow">
                      <i className="fa-solid fa-circle-question"></i> {labels.faqEyebrow}
                    </span>
                    <h2 className="section-header__title">{labels.faqTitle}</h2>
                    <p className="section-header__subtitle">
                      {labels.faqSubtitle}
                    </p>
                  </div>
                  {[1, 2, 3, 4, 5].map((item, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={item} className={`faq-item ${isOpen ? "faq-item--open" : ""}`}>
                        <button className="faq-question" type="button" onClick={() => setOpenFaq(isOpen ? null : idx)}>
                          <span>{dict.faq[`q${item}`]}</span>
                          <span className="faq-icon-arrow"></span>
                        </button>
                        <div className="faq-answer-wrapper">
                          <div className="faq-answer">
                            <p>{dict.faq[`a${item}`]}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="faq-more-questions">
                    {labels.faqMorePrefix}{" "}
                    <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer">
                      {labels.faqMoreDiscord}
                    </a>{" "}
                    {labels.faqMoreOr}{" "}
                    <a href="#rules" onClick={(e) => { e.preventDefault(); setActiveTab("rules"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      {labels.faqMoreTicket}
                    </a>
                    !
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
        {activeTab === "gallery" && (
          <section className="gallery-page reveal visible" id="gallery">
            <SectionStars count={35} />
            <header className="page-hero gallery-hero">
              <div className="wrap page-hero__inner">
                <div className="page-hero__art">
                  <i className="fa-solid fa-images"></i>
                </div>
                <div className="page-hero__copy">
                  <span><i className="fa-solid fa-camera"></i> {labels.galleryHeroEyebrow}</span>
                  <h1>HAOHAN <strong>GALLERY</strong></h1>
                  <p>{dict.gallery?.intro || (isVi ? "Nơi lưu giữ những khoảnh khắc đáng nhớ và các công trình tuyệt đẹp từ các thành viên." : "Welcome to our gallery! This page contains albums and memorable images from HaoHan SMP. Click any image to view a full size version.")}</p>
                </div>
                <div className="page-hero__cube" style={{ background: 'linear-gradient(#facc15 0 30%, transparent 31%), repeating-linear-gradient(45deg, #8a6233 0 7px, #654826 7px 14px)' }} aria-hidden="true"></div>
              </div>
            </header>
            <div className="wrap gallery-page__wrap" style={{ marginTop: '40px' }}>
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
            <SectionStars count={35} />
            <header className="page-hero rules-hero">
              <div className="wrap page-hero__inner">
                <div className="page-hero__art">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/img/Fox_with_emerald.webp" alt="" aria-hidden="true" />
                </div>
                <div className="page-hero__copy">
                  <span><i className="fa-solid fa-clover"></i> {labels.rulesHeroEyebrow}</span>
                  <h1>HAOHAN <strong>SMP</strong></h1>
                  <p>{labels.rulesHeroDesc}</p>
                </div>
                <div className="page-hero__cube" style={{ background: 'linear-gradient(#66bf49 0 30%, transparent 31%), repeating-linear-gradient(45deg, #8a6233 0 7px, #654826 7px 14px)' }} aria-hidden="true"></div>
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
                  <h2><i className="fa-solid fa-clover"></i> {labels.rulesSection4Title}</h2>
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
                    <p>{labels.rulesTicketDesc}</p>
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
          <section className="wiki-section reveal visible" id="wiki">
            <SectionStars count={35} />
            <header className="page-hero wiki-hero">
              <div className="wrap page-hero__inner">
                <div className="page-hero__art">
                  <i className="fa-solid fa-book-open"></i>
                </div>
                <div className="page-hero__copy">
                  <span><i className="fa-solid fa-circle-info"></i> {dict.wiki_content?.hero_eyebrow}</span>
                  <h1>HAOHAN <strong>WIKI</strong></h1>
                  <p>{dict.wiki_content?.hero_desc}</p>
                </div>
                <div className="page-hero__cube" style={{ background: 'linear-gradient(#38bdf8 0 30%, transparent 31%), repeating-linear-gradient(45deg, #8a6233 0 7px, #654826 7px 14px)' }} aria-hidden="true"></div>
              </div>
            </header>
            <div className="wrap wiki-wrap" style={{ marginTop: '40px' }}>
              <div className="wiki-sidebar">
                <h3 className="wiki-sidebar-title">{dict.wiki_content?.sidebar_title}</h3>
                <nav className="wiki-sidebar-nav">
                  <button className={`wiki-nav-btn ${activeWikiTab === "intro" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("intro")}>
                    <i className="fa-solid fa-circle-info"></i>
                    <span>{dict.wiki_content?.nav_intro}</span>
                  </button>
                  <button className={`wiki-nav-btn ${activeWikiTab === "recipes" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("recipes")}>
                    <i className="fa-solid fa-receipt"></i>
                    <span>{dict.wiki_content?.nav_recipes}</span>
                  </button>
                  <button className={`wiki-nav-btn ${activeWikiTab === "mobs" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("mobs")}>
                    <i className="fa-solid fa-skull"></i>
                    <span>{dict.wiki_content?.nav_mobs}</span>
                  </button>
                  <button className={`wiki-nav-btn ${activeWikiTab === "villagers" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("villagers")}>
                    <i className="fa-solid fa-people-arrows"></i>
                    <span>{dict.wiki_content?.nav_villagers}</span>
                  </button>
                  <button className={`wiki-nav-btn ${activeWikiTab === "fishing" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("fishing")}>
                    <i className="fa-solid fa-fish"></i>
                    <span>{dict.wiki_content?.nav_fishing}</span>
                  </button>
                  <button className={`wiki-nav-btn ${activeWikiTab === "items" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("items")}>
                    <i className="fa-solid fa-gem"></i>
                    <span>{dict.wiki_content?.nav_items}</span>
                  </button>
                  <button className={`wiki-nav-btn ${activeWikiTab === "guilds" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("guilds")}>
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>{dict.wiki_content?.nav_guilds}</span>
                  </button>
                  <button className={`wiki-nav-btn ${activeWikiTab === "guide" ? "active" : ""}`} type="button" onClick={() => setActiveWikiTab("guide")}>
                    <i className="fa-solid fa-book-open"></i>
                    <span>{dict.wiki_content?.nav_guide}</span>
                  </button>
                </nav>
              </div>

              <div className="wiki-content">
                {activeWikiTab === "intro" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-circle-info text-accent"></i> {dict.wiki_content?.intro_title}</h2>
                    <p className="wiki-intro-text" dangerouslySetInnerHTML={{ __html: dict.wiki_content?.intro_desc }} />

                    <h3 className="wiki-subtitle"><i className="fa-solid fa-circle-play text-accent-green"></i> {dict.wiki_content?.intro_servers_title}</h3>
                    <ul className="wiki-list">
                      <li>
                        <strong>{dict.wiki_content?.intro_survival_label}</strong> <code>haohansmp.io.vn</code>
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.intro_build_label}</strong> <code>None</code>
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.intro_archive_label}</strong> <code>None</code>
                      </li>
                    </ul>

                    <p className="wiki-intro-text" style={{ marginTop: '16px', fontSize: '13.5px', fontStyle: 'italic' }}>
                      {dict.wiki_content?.intro_rules_note
                        ?.replace('{rules_link}', '').replace('{discord_link}', '')
                        ?.split(dict.wiki_content?.intro_rules_link_text)[0]}
                      <a href="#rules" onClick={(e) => { e.preventDefault(); setActiveTab("rules"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ color: '#84ca32', fontWeight: 'bold' }}>{dict.wiki_content?.intro_rules_link_text}</a>
                      {dict.wiki_content?.intro_rules_note
                        ?.replace('{rules_link}', dict.wiki_content?.intro_rules_link_text)
                        ?.replace('{discord_link}', dict.wiki_content?.intro_discord_link_text)
                        ?.split(dict.wiki_content?.intro_rules_link_text)[1]
                        ?.split(dict.wiki_content?.intro_discord_link_text)[0]}
                      <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer" style={{ color: '#84ca32', fontWeight: 'bold' }}>{dict.wiki_content?.intro_discord_link_text}</a>
                      {dict.wiki_content?.intro_rules_note
                        ?.replace('{rules_link}', dict.wiki_content?.intro_rules_link_text)
                        ?.replace('{discord_link}', dict.wiki_content?.intro_discord_link_text)
                        ?.split(dict.wiki_content?.intro_discord_link_text)[1]}
                    </p>

                    <h3 className="wiki-subtitle" style={{ marginTop: '30px' }}><i className="fa-solid fa-compass text-accent-green"></i> {dict.wiki_content?.intro_guide_title}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '14px' }}>
                      <a href="#wiki" onClick={(e) => { e.preventDefault(); setActiveWikiTab("guide"); }} className="wiki-guide-card">
                        <i className="fa-solid fa-graduation-cap"></i>
                        <div>
                          <h4>{dict.wiki_content?.intro_quickstart_title}</h4>
                          <p>{dict.wiki_content?.intro_quickstart_desc}</p>
                        </div>
                      </a>
                      <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer" className="wiki-guide-card">
                        <i className="fa-solid fa-cubes"></i>
                        <div>
                          <h4>{dict.wiki_content?.intro_modpack_title}</h4>
                          <p>{dict.wiki_content?.intro_modpack_desc}</p>
                        </div>
                      </a>
                    </div>
                  </div>
                )}

                {activeWikiTab === "recipes" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-receipt text-accent"></i> {dict.wiki_content?.recipes_title}</h2>
                    <p className="wiki-intro-text">{dict.wiki_content?.recipes_desc}</p>
                    <ul className="wiki-list">
                      <li>
                        <strong>{dict.wiki_content?.recipes_item1_title}</strong> {dict.wiki_content?.recipes_item1_desc}
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.recipes_item2_title}</strong> {dict.wiki_content?.recipes_item2_desc}
                      </li>
                    </ul>
                  </div>
                )}

                {activeWikiTab === "mobs" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-skull text-accent"></i> {dict.wiki_content?.mobs_title}</h2>
                    <div className="wiki-alert">
                      <i className="fa-solid fa-circle-info"></i>
                      <span>{dict.wiki_content?.mobs_notice}</span>
                    </div>
                  </div>
                )}

                {activeWikiTab === "villagers" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-people-arrows text-accent"></i> {dict.wiki_content?.villagers_title}</h2>
                    <p className="wiki-intro-text">{dict.wiki_content?.villagers_desc}</p>
                    <ul className="wiki-list">
                      <li><strong>{dict.wiki_content?.villagers_item1_title}</strong> {dict.wiki_content?.villagers_item1_desc}</li>
                      <li><strong>{dict.wiki_content?.villagers_item2_title}</strong> {dict.wiki_content?.villagers_item2_desc}</li>
                      <li><strong>{dict.wiki_content?.villagers_item3_title}</strong> {dict.wiki_content?.villagers_item3_desc}</li>
                    </ul>
                  </div>
                )}

                {activeWikiTab === "fishing" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-fish text-accent"></i> {dict.wiki_content?.fishing_title}</h2>
                    <p className="wiki-intro-text">{dict.wiki_content?.fishing_desc}</p>
                    <ul className="wiki-list">
                      <li><strong>{dict.wiki_content?.fishing_item1_title}</strong> {dict.wiki_content?.fishing_item1_desc}</li>
                      <li><strong>{dict.wiki_content?.fishing_item2_title}</strong> {dict.wiki_content?.fishing_item2_desc}</li>
                      <li><strong>{dict.wiki_content?.fishing_item3_title}</strong> {dict.wiki_content?.fishing_item3_desc}</li>
                    </ul>
                  </div>
                )}

                {activeWikiTab === "items" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-gem text-accent"></i> {dict.wiki_content?.items_title}</h2>
                    <p className="wiki-intro-text">{dict.wiki_content?.items_desc}</p>
                    <ul className="wiki-list">
                      <li><strong>{dict.wiki_content?.items_item1_title}</strong> {dict.wiki_content?.items_item1_desc}</li>
                      <li><strong>{dict.wiki_content?.items_item2_title}</strong> {dict.wiki_content?.items_item2_desc}</li>
                      <li><strong>{dict.wiki_content?.items_item3_title}</strong> {dict.wiki_content?.items_item3_desc}</li>
                      <li><strong>{dict.wiki_content?.items_item4_title}</strong> {dict.wiki_content?.items_item4_desc}</li>
                    </ul>
                  </div>
                )}

                {activeWikiTab === "guilds" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-shield-halved text-accent"></i> {dict.wiki_content?.guilds_title}</h2>
                    <p className="wiki-intro-text">{dict.wiki_content?.guilds_desc}</p>
                    <ul className="wiki-list">
                      <li><strong>{dict.wiki_content?.guilds_item1_title}</strong> {dict.wiki_content?.guilds_item1_desc}</li>
                      <li><strong>{dict.wiki_content?.guilds_item2_title}</strong> {dict.wiki_content?.guilds_item2_desc}</li>
                      <li><strong>{dict.wiki_content?.guilds_item3_title}</strong> {dict.wiki_content?.guilds_item3_desc}</li>
                    </ul>
                  </div>
                )}

                {activeWikiTab === "guide" && (
                  <div className="wiki-article">
                    <h2><i className="fa-solid fa-book-open text-accent"></i> {dict.wiki_content?.guide_title}</h2>

                    <h3 className="wiki-subtitle"><i className="fa-solid fa-earth-americas text-accent-green"></i> {dict.wiki_content?.guide_world_title}</h3>
                    <ul className="wiki-list">
                      <li>
                        <strong>{dict.wiki_content?.guide_world_item1_title}</strong> {dict.wiki_content?.guide_world_item1_desc}
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.guide_world_item2_title}</strong> {dict.wiki_content?.guide_world_item2_desc}
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.guide_world_item3_title}</strong> {dict.wiki_content?.guide_world_item3_desc}
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.guide_world_item4_title}</strong> {dict.wiki_content?.guide_world_item4_desc}
                      </li>
                    </ul>

                    <h3 className="wiki-subtitle" style={{ marginTop: '24px' }}><i className="fa-solid fa-circle-check text-accent-green"></i> {dict.wiki_content?.guide_qol_title}</h3>
                    <ul className="wiki-list">
                      <li>
                        <strong>{dict.wiki_content?.guide_qol_item1_title}</strong> {dict.wiki_content?.guide_qol_item1_desc}
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.guide_qol_item2_title}</strong> {dict.wiki_content?.guide_qol_item2_desc}
                      </li>
                      <li>
                        <strong>{dict.wiki_content?.guide_qol_item3_title}</strong> {dict.wiki_content?.guide_qol_item3_desc}
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {activeTab === "donate" && (
          <section className="section reveal visible" id="donate" style={{ minHeight: 'calc(100vh - 400px)', padding: '40px 20px' }}>
            <SectionStars count={20} />
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
                  {dict.donate?.updating_message}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === "profile" && isLoggedIn && user && (
          <section className="section reveal visible profile-section" id="profile">
            <SectionStars count={12} />
            <div className="wrap profile-page-wrap">
              <div className="profile-layout">
                <aside className="profile-sidebar">
                  <header className="profile-card__header">
                    <span className="profile-card__eyebrow">
                      <i className="fa-solid fa-leaf"></i>
                      {dict.profile.eyebrow}
                    </span>
                    <h2>{dict.profile.title}</h2>
                    <p>{dict.profile.description}</p>
                  </header>
                  <nav className="profile-sidebar-nav" aria-label={dict.profile.nav_label}>
                    <button type="button" className="profile-sidebar-link profile-sidebar-link--active">
                      <i className="fa-solid fa-user"></i><span>{dict.profile.nav_overview}</span>
                    </button>
                    <button type="button" className="profile-sidebar-link">
                      <i className="fa-solid fa-gear"></i><span>{dict.profile.nav_settings}</span>
                    </button>
                    <button type="button" className="profile-sidebar-link">
                      <i className="fa-regular fa-bell"></i><span>{dict.profile.nav_notifications}</span>
                    </button>
                    <button type="button" className="profile-sidebar-link">
                      <i className="fa-solid fa-link"></i><span>{dict.profile.nav_connections}</span>
                    </button>
                    <button type="button" className="profile-sidebar-link profile-sidebar-link--logout" onClick={handleLogout}>
                      <i className="fa-solid fa-arrow-right-from-bracket"></i><span>{dict.profile.logout_btn}</span>
                    </button>
                  </nav>
                </aside>
                <div className="profile-card">
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
                      <p className="profile-welcome">
                        {dict.profile.welcome_message}
                      </p>
                      <div className="profile-fields-grid">
                        <div className="profile-field-item">
                          <i className="profile-field-icon fa-solid fa-cube"></i>
                          <span className="profile-field-label">{dict.profile.username_label}</span>
                          <span className="profile-field-value profile-field-value--accent">{user.username}</span>
                        </div>
                        <div className="profile-field-item">
                          <i className="profile-field-icon fa-solid fa-envelope"></i>
                          <span className="profile-field-label">Email</span>
                          <span className="profile-field-value">{user.email}</span>
                        </div>
                        <div className="profile-field-item">
                          <i className="profile-field-icon fa-solid fa-clock"></i>
                          <span className="profile-field-label">{dict.profile.playtime_label}</span>
                          <span className="profile-field-value">
                            {dict.profile.playtime_value
                              .replace('{hours}', Math.floor((user.play_time || 0) / 3600))
                              .replace('{minutes}', Math.floor(((user.play_time || 0) % 3600) / 60))}
                          </span>
                        </div>
                        <div className="profile-field-item">
                          <i className="profile-field-icon fa-brands fa-discord"></i>
                          <span className="profile-field-label">{dict.profile.discord_status_label}</span>
                          <span className="profile-field-value">
                            {user.discord_id ? (
                              <span className="profile-connection profile-connection--linked">
                                <i className="fab fa-discord"></i> {dict.profile.linked_discord}
                              </span>
                            ) : (
                              <span className="profile-connection">
                                <i className="fab fa-discord"></i> {dict.profile.unlinked_discord}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="profile-field-item">
                          <i className="profile-field-icon fa-solid fa-shield-halved"></i>
                          <span className="profile-field-label">{dict.profile.role_label}</span>
                          <span className="profile-field-value">{user.role || dict.profile.default_role}</span>
                        </div>
                        <div className="profile-field-item">
                          <i className="profile-field-icon fa-solid fa-fingerprint"></i>
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
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer" style={{
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
