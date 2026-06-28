"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../components/AuthContext";
import Script from "next/script";
const serverIp = "haohansmp.io.vn";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DISCORD_DEFAULT_BANNER = "linear-gradient(135deg, #111214, #1e1f22)";

const discordProfiles = {
  "gờ không inn": {
    avatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=ginn&backgroundColor=ffb6c1",
    status: "dnd",
    customStatus: "Automemories",
    banner: "linear-gradient(135deg, #2c1a4d, #140b2b)",
    decoration: "cat-ears",
    tag: "@ginkei"
  },
  "ramon": {
    avatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=ramon&backgroundColor=c0a0c0",
    status: "online",
    customStatus: "unbound",
    banner: "linear-gradient(135deg, #4d1a2c, #2b0b14)",
    decoration: "cat-ears",
    tag: "@0ramen"
  },
  "duc": {
    avatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=duc&backgroundColor=a0c0e0",
    status: "dnd",
    customStatus: "🍪",
    banner: "linear-gradient(135deg, #1a2c4d, #0b142b)",
    decoration: "cat-ears",
    tag: "@duc_sei"
  },
  "wat": {
    avatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=wat&backgroundColor=a0e0c0",
    status: "dnd",
    customStatus: "wat2301 sẽ mua G63",
    banner: "linear-gradient(135deg, #1a4d3c, #0b2b1a)",
    decoration: "none",
    tag: "@wat_sei"
  },
  "pico": {
    avatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=pico&backgroundColor=e0c0a0",
    status: "dnd",
    customStatus: "PicoXSVipMax",
    banner: "linear-gradient(135deg, #4d3c1a, #2b1a0b)",
    decoration: "cat-ears",
    tag: "@pico"
  }
};
const DONATION_PRESETS = [20000, 50000, 100000, 200000, 500000];
const DONORS_PER_PAGE = 5;
const MANUAL_SUPPORTERS = [
  { username: "PicoXSvipMax", displayName: "Pico", amount: 3550000, note: "TYSM" },
  { username: "Ginkei", displayName: "Gỡ không inn", amount: 50000 },
  { username: "mica_san", displayName: "miCa", amount: 150000 },
  { username: "Tuckii", displayName: "a", amount: 250000 },
  { username: "CS02", displayName: "kyon5668", amount: 190000 },
  { username: "ILoveLinh", displayName: "H", amount: 170000 },
  { username: "hoanghydro", displayName: "imsosad", amount: 150000 },
  { username: "Miophilk", displayName: "Miophilk", amount: 140000 },
  { username: "dadadio", displayName: "᲼᲼᲼᲼᲼#3566", amount: 100000 },
  { username: "0Ramen", displayName: "Ramon", amount: 100000 },
  { username: "0Clone", displayName: "sicubidu", amount: 100000 },
  { username: "WAT", displayName: "WAT", amount: 100000 },
  { username: "!  DuckAnh", displayName: "!  DuckAnh", amount: 100000 },
  { username: "NgMinhDuckAnh", displayName: "Deleted User#0000", amount: 70000 },
  { username: "D3MON_VN", displayName: "mệt", amount: 70000 },
  { username: "Deleted User#0000", displayName: "Deleted User#0000", amount: 70000 },
  { username: "Kuangg_VN", displayName: "Deleted User#0000", amount: 60000 },
  { username: "Cowsep2021", displayName: "Cowsep", amount: 50000 },
  { username: "\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\", displayName: "\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\", amount: 50000 },
  { username: "minerwoftkk", displayName: "minerwoftkk", amount: 50000 },
  { username: "Thỏ", displayName: "Thỏ", amount: 50000 },
  { username: "Ender_Dragonn", displayName: "Ender_Dragon", amount: 50000 },
  { username: "Mai_Linh", displayName: "Mai Linh#4429", amount: 50000 },
  { username: "ohtanisvibrator", displayName: "ohtanisvibrator", amount: 50000 },
  { username: "satmamama", displayName: "Hảo Thật Đấy(REHAB)", amount: 40000 },
  { username: "FishSeller", displayName: "Mizu#9504", amount: 30000 },
  { username: "NotLynnZ", displayName: "Deleted User#0000", amount: 30000 },
  { username: "paindestroyleaf", displayName: "Eum ba pe", amount: 20000 },
  { username: "hamjang", displayName: "hamjang#4710", amount: 20000 },
  { username: "HLinh_2k4", displayName: "Chào Con Cặc Gì Mà Chào", amount: 20000 },
  { username: "song#5482", displayName: "song#5482", amount: 20000 },
  { username: "Jh7xn", displayName: "Bé Cá Bú Đá", amount: 20000 },
  { username: "Zz_South_zZ", displayName: "vuphuongnam_#0", amount: 10000 },
  { username: "shon", displayName: "shon", amount: 10000 },
  { username: "em cy cay", displayName: "em cy cay", amount: 10000 },
  { username: "Duc", displayName: "Duc", amount: 10000 },
  { username: "JUnLI", displayName: "unknown-user", amount: 400000 },
  { username: "dan choi nam dinh™", displayName: "dan choi nam dinh™", amount: 110000 },
].map((supporter) => ({ ...supporter, role: 'Donator' }));

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

function MinecraftSkinViewer({ username }) {
  const containerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;
    let viewerInstance = null;

    import("skinview3d").then((skinview3d) => {
      if (!active || !containerRef.current) return;

      // Clean up previous instance and clear inner HTML
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.dispose();
      }
      containerRef.current.innerHTML = "";

      try {
        const canvas = document.createElement("canvas");
        containerRef.current.appendChild(canvas);

        const playerSkinName = username && username !== "---" ? username : "Steve";

        const viewer = new skinview3d.SkinViewer({
          canvas: canvas,
          width: 140,
          height: 240,
          skin: `https://minotar.net/download/${playerSkinName}`
        });

        viewer.controls.enableZoom = false;
        viewer.controls.enableRotate = true;

        if (isAnimating) {
          viewer.animation = new skinview3d.WalkingAnimation();
          viewer.autoRotate = true;
        } else {
          viewer.animation = null;
          viewer.autoRotate = false;
        }
        viewer.autoRotateSpeed = 0.8;

        viewerInstanceRef.current = viewer;
        viewerInstance = viewer;
      } catch (err) {
        console.error("Error rendering 3D skin viewer:", err);
      }
    });

    return () => {
      active = false;
      if (viewerInstance) {
        viewerInstance.dispose();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [username, isAnimating]);

  return (
    <div className="minecraft-3d-skin-wrapper">
      <div ref={containerRef} className="minecraft-3d-skin-container" />
      <button
        type="button"
        className="minecraft-3d-skin-toggle"
        onClick={() => setIsAnimating(!isAnimating)}
        title={isAnimating ? "Pause Animation" : "Play Animation"}
      >
        <i className={`fa-solid ${isAnimating ? "fa-pause" : "fa-play"}`}></i>
      </button>
    </div>
  );
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
  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const [rulesMenuOpen, setRulesMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [donateName, setDonateName] = useState('');
  const [donateAmount, setDonateAmount] = useState(DONATION_PRESETS[1].toString());
  const [donateResult, setDonateResult] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [supporters, setSupporters] = useState([]);
  const [supporterPage, setSupporterPage] = useState(1);
  const [editingPageInput, setEditingPageInput] = useState(null);

  const [profileSubTab, setProfileSubTab] = useState("overview");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTopicImageIndex, setSelectedTopicImageIndex] = useState(0);

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [activeFeatureImgIndex, setActiveFeatureImgIndex] = useState(0);

  // Account Settings form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Minecraft Link states
  const [linkCode, setLinkCode] = useState("");
  const [linkingGame, setLinkingGame] = useState(false);
  const [linkMsg, setLinkMsg] = useState("");
  const [linkSuccess, setLinkSuccess] = useState(true);
  const [rulesSubTab, setRulesSubTab] = useState("smp");
  const profileNavRef = useRef(null);
  const profileNavIndicatorRef = useRef(null);
  const rulesNavRef = useRef(null);
  const rulesNavIndicatorRef = useRef(null);
  const wikiNavRef = useRef(null);
  const wikiNavIndicatorRef = useRef(null);

  // Discord role → color mapping (matches server role colors)
  const ROLE_COLORS = {
    'Owner': { color: '#f1c40f', bg: 'rgba(241, 196, 15, 0.12)', border: 'rgba(241, 196, 15, 0.25)' },
    'Administrator': { color: '#1abc9c', bg: 'rgba(26, 188, 156, 0.12)', border: 'rgba(26, 188, 156, 0.25)' },
    'Cán Bộ': { color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.12)', border: 'rgba(46, 204, 113, 0.25)' },
    'Hảo Hán Bot': { color: '#3498db', bg: 'rgba(52, 152, 219, 0.12)', border: 'rgba(52, 152, 219, 0.25)' },
    'Helper': { color: '#1abc9c', bg: 'rgba(26, 188, 156, 0.12)', border: 'rgba(26, 188, 156, 0.25)' },
    'HaoHan Support': { color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.12)', border: 'rgba(46, 204, 113, 0.25)' },
    'Donator': { color: '#f39c12', bg: 'rgba(243, 156, 18, 0.12)', border: 'rgba(243, 156, 18, 0.25)' },
    'Animator': { color: '#9b59b6', bg: 'rgba(155, 89, 182, 0.12)', border: 'rgba(155, 89, 182, 0.25)' },
    'Booster': { color: '#f47fff', bg: 'rgba(244, 127, 255, 0.12)', border: 'rgba(244, 127, 255, 0.25)' },
    'Dev': { color: '#3498db', bg: 'rgba(52, 152, 219, 0.12)', border: 'rgba(52, 152, 219, 0.25)' },
    'Youtuber': { color: '#e74c3c', bg: 'rgba(231, 76, 60, 0.12)', border: 'rgba(231, 76, 60, 0.25)' },
    'Emoji Man': { color: '#1abc9c', bg: 'rgba(26, 188, 156, 0.12)', border: 'rgba(26, 188, 156, 0.25)' },
    'Members': { color: '#95a5a6', bg: 'rgba(149, 165, 166, 0.12)', border: 'rgba(149, 165, 166, 0.25)' },
    'default': { color: '#95a5a6', bg: 'rgba(149, 165, 166, 0.12)', border: 'rgba(149, 165, 166, 0.25)' },
  };

  const getRoleStyle = (roleName) => {
    return ROLE_COLORS[roleName] || ROLE_COLORS['default'];
  };

  // Load saved tabs from sessionStorage on mount
  useEffect(() => {
    const savedActiveTab = sessionStorage.getItem('activeTab');
    if (savedActiveTab) {
      setActiveTab(savedActiveTab);
    }

    const savedRulesSubTab = sessionStorage.getItem('rulesSubTab');
    if (savedRulesSubTab) {
      setRulesSubTab(savedRulesSubTab);
    }

    const savedActiveWikiTab = sessionStorage.getItem('activeWikiTab');
    if (savedActiveWikiTab) {
      setActiveWikiTab(savedActiveWikiTab);
    }

    const savedProfileSubTab = sessionStorage.getItem('profileSubTab');
    if (savedProfileSubTab) {
      setProfileSubTab(savedProfileSubTab);
    }
  }, []);

  // Save active tabs to sessionStorage when they change
  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (rulesSubTab) {
      sessionStorage.setItem('rulesSubTab', rulesSubTab);
    }
  }, [rulesSubTab]);

  useEffect(() => {
    if (activeWikiTab) {
      sessionStorage.setItem('activeWikiTab', activeWikiTab);
    }
  }, [activeWikiTab]);

  useEffect(() => {
    if (profileSubTab) {
      sessionStorage.setItem('profileSubTab', profileSubTab);
    }
  }, [profileSubTab]);

  useEffect(() => {
    if (user && user.email) {
      setNewEmail(user.email);
    }
  }, [user]);

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
      navHome: hl.nav_home,
      navFeatures: hl.nav_features,
      navGallery: hl.nav_gallery,
      navRules: hl.nav_rules,
      navWiki: hl.nav_wiki || "Wiki",
      navProfile: hl.nav_profile || "Profile",
      signup: hl.signup,
      login: hl.login,
      haohanTitle: hl.title,
      haohanWelcomeBack: hl.hero_welcome_back,
      haohanDesc: hl.desc,
      discord: hl.join_discord,
      donate: hl.donate,
      serversTitle: hl.servers_title,
      featuresTitle: hl.features_title,
      galleryTitle: hl.gallery_title,
      faqTitle: hl.faq_title || "FAQ",
      serverIpLabel: hl.server_ip,
      copied: hl.copied,
      discordBtn: hl.discord_connect,
      rights: dict.footer?.rights,
      disclaimer: dict.footer?.disclaimer,
      exploreHeader: hl.explore_header,
      communityHeader: hl.community_header,
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
  const supporterList = [...(supporters.length > 0 ? supporters : MANUAL_SUPPORTERS)]
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  const supporterPageCount = Math.max(1, Math.ceil(supporterList.length / DONORS_PER_PAGE));
  const currentSupporterPage = Math.min(supporterPage, supporterPageCount);
  const visibleSupporters = supporterList.slice(
    (currentSupporterPage - 1) * DONORS_PER_PAGE,
    currentSupporterPage * DONORS_PER_PAGE
  );
  const formatVnd = (amount) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };
  useEffect(() => {
    let active = true;

    const loadSupporters = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/supporters/donations`);
        if (!response.ok) return;
        const data = await response.json();
        let sourceData = data;
        if ((sourceData.supporters || []).length > 0 && !(sourceData.supporters || []).some((donor) => donor.avatar_url)) {
          const refreshedResponse = await fetch(`${API_BASE}/api/supporters/donations?refresh=true`);
          if (refreshedResponse.ok) {
            sourceData = await refreshedResponse.json();
          }
        }

        const fetchedSupporters = (sourceData.supporters || [])
          .filter((donor) => Number(donor.amount) > 0)
          .map((donor) => ({
            username: donor.username,
            displayName: donor.display_name || donor.username,
            amount: donor.amount,
            entries: donor.entries,
            role: donor.role || "Donator",
            avatarUrl: donor.avatar_url,
            bannerUrl: donor.banner_url,
            accentColor: donor.accent_color,
          }));

        if (active && fetchedSupporters.length > 0) {
          setSupporters(fetchedSupporters);
          setSupporterPage(1);
        }
      } catch (error) {
        console.warn("Could not load donor leaderboard.", error);
      }
    };

    loadSupporters();

    return () => {
      active = false;
    };
  }, []);

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
      id: "explore",
      icon: "fa-solid fa-compass",
      title: dict.features_list.explore || "Explore the World",
      desc: dict.features_list.explore_desc,
      img: "/assets/img/feature/struct1.png",
      accent: "#4ade80",
      large: true,
      wikiTab: "guide",
    },
    {
      id: "survival",
      icon: "fa-solid fa-shield-halved",
      title: dict.features_list.survival || "Survival & Progress",
      desc: dict.features_list.survival_desc,
      img: "/assets/img/feature/gameplay.png",
      accent: "#fb923c",
      wikiTab: "guide",
    },
    {
      id: "terrain",
      icon: "fa-solid fa-mountain-sun",
      title: dict.features_list.terrain || "Customizable Terrain",
      desc: dict.features_list.terrain_desc,
      img: "/assets/img/feature/terrain1.png",
      accent: "#38bdf8",
      wikiTab: "guide",
    },
    {
      id: "custom",
      icon: "fa-solid fa-wand-magic-sparkles",
      title: dict.features_list.custom || "Custom Mechanics",
      desc: dict.features_list.custom_desc,
      img: "/assets/img/feature/gameplay1.png",
      accent: "#c084fc",
      wikiTab: "recipes",
    },
    {
      id: "modpack",
      icon: "fa-solid fa-box-archive",
      title: dict.features_list.modpack || "Get Modpack",
      desc: dict.features_list.modpack_desc,
      img: "/assets/img/feature/struct2.png",
      accent: "#facc15",
      wikiTab: "intro",
    },
    {
      id: "more",
      icon: "fa-solid fa-arrow-right-long",
      title: dict.features_list.more || "Learn More",
      desc: dict.features_list.more_desc,
      img: "/assets/img/feature/terrain2.png",
      accent: "#ff5757",
      wikiTab: "intro",
    },
  ], [dict, isVi]);

  const featureImages = useMemo(() => ({
    explore: Array.from({ length: 12 }, (_, i) => `/assets/img/feature/struct${i + 1}.png`),
    survival: Array.from({ length: 10 }, (_, i) => `/assets/img/feature/gameplay${i === 0 ? "" : i}.png`),
    terrain: Array.from({ length: 13 }, (_, i) => `/assets/img/feature/terrain${i + 1}.png`),
    custom: [
      "/assets/img/feature/gameplay1.png",
      "/assets/img/feature/gameplay3.png",
      "/assets/img/feature/gameplay4.png",
      "/assets/img/feature/gameplay5.png",
      "/assets/img/feature/gameplay6.png",
      "/assets/img/feature/gameplay7.png",
    ],
    modpack: [
      "/assets/img/feature/gameplay4.png",
      "/assets/img/feature/struct2.png",
      "/assets/img/feature/struct11.png",
      "/assets/img/feature/struct12.png",
    ],
    more: [
      "/assets/img/feature/struct6.png",
      "/assets/img/feature/terrain5.png",
      "/assets/img/feature/gameplay2.png",
      "/assets/img/feature/terrain12.png",
      "/assets/img/feature/terrain13.png",
    ],
  }), []);

  const featureExplanations = useMemo(() => dict.feature_explanations || {}, [dict]);

  const featuresTranslated = useMemo(() => featureCards.map(c => [c.img, c.title]), [featureCards]);
  const galleryImages = useMemo(() => [
    // Season 1 base images (Index 0 to 6)
    "/assets/img/gallery/ss1/mainbase3.jpg",  // index 0
    "/assets/img/gallery/ss1/mainbase4.jpg",  // index 1
    "/assets/img/gallery/ss1/mainbase5.jpg",  // index 2
    "/assets/img/gallery/ss1/mainbase7.jpg",  // index 3
    "/assets/img/gallery/ss1/mainbase8.jpg",  // index 4
    "/assets/img/gallery/ss1/mainbase9.jpg",  // index 5
    "/assets/img/gallery/ss1/mainbase10.jpg", // index 6

    // Season 2 images (Index 7 to 18)
    "/assets/img/gallery/ss2/mainbase.png",   // index 7
    "/assets/img/gallery/ss2/mainbase1.jpg",  // index 8
    "/assets/img/gallery/ss2/mainbase2.jpg",  // index 9
    "/assets/img/gallery/ss2/mainbase11.jpg", // index 10
    "/assets/img/gallery/ss2/meeting.jpg",    // index 11
    "/assets/img/gallery/ss2/boat.jpg",       // index 12
    "/assets/img/gallery/ss2/friend.jpg",     // index 13
    "/assets/img/gallery/ss2/friend1.jpg",    // index 14
    "/assets/img/gallery/ss2/friend2.jpg",    // index 15
    "/assets/img/gallery/ss2/fight.jpg",      // index 16
    "/assets/img/gallery/ss2/shield.jpg",     // index 17
    "/assets/img/gallery/ss2/qua_nghien(21h18-04-07-2022).png", // index 18

    // Season 3 images (Index 19 to 32)
    "/assets/img/gallery/ss3/mainbase.png",   // index 19
    "/assets/img/gallery/ss3/mainbase1.jpg",  // index 20
    "/assets/img/gallery/ss3/mainbase2.jpg",  // index 21
    "/assets/img/gallery/ss3/mainbase3.jpg",  // index 22
    "/assets/img/gallery/ss3/mainbase4.jpg",  // index 23
    "/assets/img/gallery/ss3/mainbase5.jpg",  // index 24
    "/assets/img/gallery/ss3/decor.jpg",      // index 25
    "/assets/img/gallery/ss3/decor1.jpg",     // index 26
    "/assets/img/gallery/ss3/decor2.jpg",     // index 27
    "/assets/img/gallery/ss3/friend.jpg",     // index 28
    "/assets/img/gallery/ss3/deal.jpg",       // index 29
    "/assets/img/gallery/ss3/zoombie_bug.png", // index 30
    "/assets/img/gallery/ss3/zoombie_bug1.png", // index 31
    "/assets/img/gallery/ss3/admin_abuse_power.jpg", // index 32
  ], []);
  const galleryCaptions = useMemo(() => dict.gallery?.captions || [], [dict]);
  const galleryAlbums = useMemo(() => dict.gallery_albums || [], [dict]);
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

  useEffect(() => {
    const updateIndicator = () => {
      const nav = profileNavRef.current;
      const indicator = profileNavIndicatorRef.current;
      if (!nav || !indicator || activeTab !== "profile" || !isLoggedIn) return;

      const activeBtn = nav.querySelector(".profile-sidebar-link--active");
      if (!activeBtn) {
        indicator.style.opacity = "0";
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      const top = btnRect.top - navRect.top;
      const height = btnRect.height;

      indicator.style.opacity = "1";
      indicator.style.transform = `translateY(${top}px)`;
      indicator.style.height = `${height}px`;
    };

    // Run immediately and after layout rendering
    updateIndicator();
    const timeout = setTimeout(updateIndicator, 50);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [profileSubTab, activeTab, isLoggedIn]);

  useEffect(() => {
    const updateIndicator = () => {
      const nav = rulesNavRef.current;
      const indicator = rulesNavIndicatorRef.current;
      if (!nav || !indicator || activeTab !== "rules") return;

      const activeBtn = nav.querySelector(".rules-sidebar-link--active");
      if (!activeBtn) {
        indicator.style.opacity = "0";
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      const top = btnRect.top - navRect.top;
      const height = btnRect.height;

      indicator.style.opacity = "1";
      indicator.style.transform = `translateY(${top}px)`;
      indicator.style.height = `${height}px`;
    };

    updateIndicator();
    const timeout = setTimeout(updateIndicator, 50);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [rulesSubTab, activeTab]);

  useEffect(() => {
    const updateIndicator = () => {
      const nav = wikiNavRef.current;
      const indicator = wikiNavIndicatorRef.current;
      if (!nav || !indicator || activeTab !== "wiki") return;

      const activeBtn = nav.querySelector(".wiki-sidebar-link--active");
      if (!activeBtn) {
        indicator.style.opacity = "0";
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      const top = btnRect.top - navRect.top;
      const height = btnRect.height;

      indicator.style.opacity = "1";
      indicator.style.transform = `translateY(${top}px)`;
      indicator.style.height = `${height}px`;
    };

    updateIndicator();
    const timeout = setTimeout(updateIndicator, 50);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeWikiTab, activeTab]);

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
  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = donateName.trim();
    const amount = Number(donateAmount);

    if (!trimmedName) {
      setDonateResult(dict.donate_form_messages?.error_empty_name);
      return;
    }

    if (!Number.isFinite(amount) || amount < 1000) {
      setDonateResult(dict.donate_form_messages?.error_min_amount);
      return;
    }

    if (!isLoggedIn) {
      setDonateResult(dict.donate_form_messages?.error_login_required);
      return;
    }

    setDonateLoading(true);
    setDonateResult(dict.donate_form_messages?.status_creating_link);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/donations/payos/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount,
          message: `Minecraft name: ${trimmedName}`,
          minecraft_name: trimmedName,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.checkoutUrl) {
        setDonateResult(dict.donate_form_messages?.status_redirecting);
        window.location.href = data.checkoutUrl;
      } else {
        setDonateResult(data.error || dict.donate_form_messages?.error_create_failed);
      }
    } catch (error) {
      console.error("Error submitting donation:", error);
      setDonateResult(dict.donate?.error2 || "Connection error. Please try again later.");
    } finally {
      setDonateLoading(false);
    }
  };

  const handleLinkDiscord = async () => {
    try {
      const token = getToken();
      if (!token) {
        alert(isVi ? "Bạn cần đăng nhập lại trước khi liên kết Discord." : "Please log in again before linking Discord.");
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/discord/url`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });
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
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setSettingsMsg(isVi ? "Vui lòng nhập mật khẩu hiện tại!" : "Please enter your current password!");
      setSettingsSuccess(false);
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setSettingsMsg(isVi ? "Mật khẩu mới không khớp!" : "New passwords do not match!");
      setSettingsSuccess(false);
      return;
    }
    setUpdatingSettings(true);
    setSettingsMsg("");
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          email: newEmail,
          new_password: newPassword || undefined
        })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setSettingsMsg(isVi ? "Cập nhật tài khoản thành công!" : "Profile updated successfully!");
        setSettingsSuccess(true);
        login(token, data.user);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsEditingSettings(false);
      } else {
        setSettingsMsg(data.error || (isVi ? "Cập nhật thất bại!" : "Update failed!"));
        setSettingsSuccess(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSettingsMsg(isVi ? "Lỗi kết nối máy chủ!" : "Server connection error!");
      setSettingsSuccess(false);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingSettings(false);
    setNewEmail(user ? user.email : "");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    setSettingsMsg("");
  };

  const handleLinkMinecraft = async (e) => {
    e.preventDefault();
    if (!linkCode) {
      setLinkMsg(isVi ? "Vui lòng nhập mã liên kết!" : "Please enter the link code!");
      setLinkSuccess(false);
      return;
    }
    setLinkingGame(true);
    setLinkMsg("");
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/auth/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: linkCode })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setLinkMsg(isVi ? "Liên kết tài khoản game thành công!" : "Game account linked successfully!");
        setLinkSuccess(true);
        const updatedUser = { ...user, ...data.user };
        login(token, updatedUser);
        setLinkCode("");
      } else {
        setLinkMsg(data.error || (isVi ? "Mã liên kết không hợp lệ!" : "Invalid link code!"));
        setLinkSuccess(false);
      }
    } catch (error) {
      console.error("Error linking Minecraft account:", error);
      setLinkMsg(isVi ? "Lỗi kết nối máy chủ!" : "Server connection error!");
      setLinkSuccess(false);
    } finally {
      setLinkingGame(false);
    }
  };

  const handleFeatureWikiClick = (wikiTab) => {
    setSelectedFeature(null);
    setActiveTab("wiki");
    setActiveWikiTab(wikiTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              <div className="haohan__logo-wrapper">
                <img className="haohan__logo-main" src="/assets/img/logo.png" alt="HaoHan SMP" />
              </div>
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
                      style={{ "--card-accent": card.accent, cursor: "pointer" }}
                      onClick={() => {
                        setSelectedFeature(card);
                        setActiveFeatureImgIndex(0);
                      }}
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
            <header className="gallery-header" style={{
              borderBottom: '1px solid rgba(255, 149, 46, 0.15)',
              paddingBottom: '24px',
              marginBottom: '30px'
            }}>
              <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 20px' }}>
                <span style={{
                  color: '#ff952e',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fa-solid fa-camera"></i> {labels.galleryHeroEyebrow}
                </span>
                <h1 style={{
                  color: '#fff',
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  margin: 0,
                  fontFamily: "'Be Vietnam Pro', 'Outfit', sans-serif"
                }}>
                  HAOHAN <span style={{ color: '#ff952e' }}>GALLERY</span>
                </h1>
                <p style={{
                  color: '#aaa9a6',
                  fontSize: '1rem',
                  margin: 0,
                  maxWidth: '700px',
                  lineHeight: '1.6',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  {dict.gallery?.intro || (isVi ? "Nơi lưu giữ những khoảnh khắc đáng nhớ và các công trình tuyệt đẹp từ các thành viên." : "Welcome to our gallery! This page contains albums and memorable images from HaoHan SMP. Click any image to view a full size version.")}
                </p>
              </div>
            </header>

            <div className="wrap gallery-page__wrap" style={{ marginTop: '40px' }}>
              {selectedTopic ? (
                /* Topic Media Explorer (Split Pane layout) */
                <div style={{ width: '100%' }}>
                  {/* Breadcrumbs and Back Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', fontFamily: "'Outfit', sans-serif" }}>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ff952e',
                        padding: '8px 18px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className="fa-solid fa-arrow-left"></i> {isVi ? "Quay lại" : "Back"}
                    </button>
                    <span style={{ color: '#868582', fontSize: '1.1rem' }}>/</span>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '1.1rem' }}>{selectedTopic.title}</span>
                  </div>

                  {/* Split layout */}
                  <div className="gallery-explorer-layout">
                    {/* Left Sidebar - Images List */}
                    <div className="gallery-explorer-sidebar">
                      <h4>
                        {isVi ? "Danh sách ảnh" : "Images List"}
                      </h4>
                      <div className="gallery-explorer-sidebar-list">
                        {selectedTopic.images.map((img, idx) => {
                          const isActive = selectedTopicImageIndex === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedTopicImageIndex(idx)}
                              className="gallery-explorer-thumb-btn"
                              style={{
                                background: isActive ? 'rgba(255, 149, 46, 0.15)' : 'rgba(20, 16, 12, 0.2)',
                                border: isActive ? '1px solid #ff952e' : '1px solid rgba(255, 255, 255, 0.08)'
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={galleryImages[img.index]}
                                alt={img.title}
                                style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: isActive ? '#ff952e' : '#fff', fontWeight: '700', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>
                                  {img.title}
                                </div>
                                <div style={{ color: '#868582', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', fontFamily: "'Outfit', sans-serif" }}>
                                  Index #{idx + 1}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Main Detail View */}
                    <div className="gallery-explorer-detail-pane">
                      <div className="gallery-explorer-main-view">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={galleryImages[selectedTopic.images[selectedTopicImageIndex].index]}
                          alt={selectedTopic.images[selectedTopicImageIndex].title}
                          className="gallery-explorer-main-img"
                        />
                      </div>

                      <div className="gallery-explorer-desc-box">
                        <h4 style={{ color: '#ff952e', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '700' }}>
                          {selectedTopic.images[selectedTopicImageIndex].title}
                        </h4>
                        <p style={{ color: '#f1f0ed', margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>
                          {selectedTopic.images[selectedTopicImageIndex].desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Seasons and Topic Cards view */
                <div className="gallery-timeline-container">
                  {galleryAlbums.map((album) => (
                    <section className="gallery-timeline-item" key={album.season}>
                      {/* Timeline dot ring */}
                      <div className="gallery-timeline-dot">
                        <div className="gallery-timeline-dot-inner"></div>
                      </div>

                      <div className="gallery-timeline-header">
                        <h3 className="gallery-timeline-title">
                          Season {album.season}: {album.name}
                        </h3>
                        <span className="gallery-timeline-badge">
                          {album.duration}
                        </span>
                      </div>

                      <p className="gallery-timeline-desc">
                        {album.desc}
                      </p>

                      <div className="gallery-album-grid">
                        {album.topics.map((topic, topicIdx) => (
                          <a
                            key={topicIdx}
                            className="gallery-album-card"
                            href="#gallery"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedTopic(topic);
                              setSelectedTopicImageIndex(0);
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={galleryImages[topic.coverIndex]} alt={topic.title} />
                            <span className="gallery-album-card__text">
                              <strong>{topic.title}</strong>
                              <em>{topic.desc}</em>
                            </span>
                          </a>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        {activeTab === "rules" && (
          <section className="rules-page reveal visible" id="rules" style={{ minHeight: 'calc(100vh - 400px)' }}>
            <SectionStars count={35} />
            <div className="wrap rules-page-wrap">
              <div className="rules-layout">
                <aside className="rules-sidebar">
                  <header className="rules-card__header">
                    <span className="rules-card__eyebrow">
                      <i className="fa-solid fa-clover"></i>
                      {labels.rulesHeroEyebrow}
                    </span>
                    <h2>HAOHAN SMP</h2>
                    <p>{labels.rulesHeroDesc}</p>
                  </header>
                  <nav className="rules-sidebar-nav" ref={rulesNavRef}>
                    <div className="rules-sidebar-indicator" ref={rulesNavIndicatorRef}></div>
                    <button
                      type="button"
                      className={`rules-sidebar-link ${rulesSubTab === "smp" ? "rules-sidebar-link--active" : ""}`}
                      onClick={() => setRulesSubTab("smp")}
                    >
                      <i className="fa-solid fa-gamepad"></i>
                      <span>{dict.rules.smp.title.replace("I. ", "")}</span>
                    </button>
                    <button
                      type="button"
                      className={`rules-sidebar-link ${rulesSubTab === "discord" ? "rules-sidebar-link--active" : ""}`}
                      onClick={() => setRulesSubTab("discord")}
                    >
                      <i className="fa-brands fa-discord"></i>
                      <span>{dict.rules.discord.title.replace("II. ", "")}</span>
                    </button>
                    <button
                      type="button"
                      className={`rules-sidebar-link ${rulesSubTab === "penalty" ? "rules-sidebar-link--active" : ""}`}
                      onClick={() => setRulesSubTab("penalty")}
                    >
                      <i className="fa-solid fa-gavel"></i>
                      <span>{dict.rules.penalty.title.replace("III. ", "")}</span>
                    </button>
                    <button
                      type="button"
                      className={`rules-sidebar-link ${rulesSubTab === "footer" ? "rules-sidebar-link--active" : ""}`}
                      onClick={() => setRulesSubTab("footer")}
                    >
                      <i className="fa-solid fa-info-circle"></i>
                      <span>{dict.rules.footer_msg.title.replace("IV. ", "")}</span>
                    </button>
                  </nav>
                </aside>

                <div className="rules-content">
                  {rulesSubTab === "smp" && (
                    <div className="rules-article">
                      <h2>
                        <i className="fa-solid fa-gamepad"></i>
                        {dict.rules.smp.title.replace("I. ", "")}
                      </h2>
                      {dict.rules.smp.rules_list.map((group, idx) => (
                        <div className="rules-rule-group" key={idx} style={{ marginBottom: "20px" }}>
                          <h3>{group.num}</h3>
                          <ul className="rules-list">
                            {group.sub_rules.map((rule, sIdx) => (
                              <li key={sIdx}>{formatText(rule.replace(/^\d+\.\d+\.\s*/, ""))}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {rulesSubTab === "discord" && (
                    <div className="rules-article">
                      <h2>
                        <i className="fa-brands fa-discord"></i>
                        {dict.rules.discord.title.replace("II. ", "")}
                      </h2>
                      <ul className="rules-list">
                        {dict.rules.discord.rules_list.map((rule, idx) => (
                          <li key={idx}>{formatText(rule)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rulesSubTab === "penalty" && (
                    <div className="rules-article">
                      <h2>
                        <i className="fa-solid fa-gavel"></i>
                        {dict.rules.penalty.title.replace("III. ", "")}
                      </h2>
                      <div className="rules-rule-group" style={{ marginBottom: "20px" }}>
                        <h3>{dict.rules.penalty.smp_title}</h3>
                        <ul className="rules-list">
                          {dict.rules.penalty.smp_rules.map((rule, idx) => (
                            <li key={idx}>{formatText(rule)}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rules-rule-group">
                        <h3>{dict.rules.penalty.discord_title}</h3>
                        <ul className="rules-list">
                          {dict.rules.penalty.discord_rules.map((rule, idx) => (
                            <li key={idx}>{formatText(rule)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {rulesSubTab === "footer" && (
                    <div className="rules-article">
                      <h2>
                        <i className="fa-solid fa-info-circle"></i>
                        {dict.rules.footer_msg.title.replace("IV. ", "")}
                      </h2>
                      <ul className="rules-list">
                        {dict.rules.footer_msg.msgs.map((msg, idx) => (
                          <li key={idx}>{formatText(msg)}</li>
                        ))}
                      </ul>

                      <div className="rules-ticket" style={{ marginTop: "30px" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/img/logo.png" alt="" />
                        <p>{labels.rulesTicketDesc}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === "wiki" && (
          <section className="wiki-section reveal visible" id="wiki">
            <SectionStars count={35} />
            <div className="wrap wiki-page-wrap">
              <div className="wiki-layout">
                <aside className="wiki-sidebar">
                  <header className="wiki-card__header">
                    <span className="wiki-card__eyebrow">
                      <i className="fa-solid fa-book-open"></i>
                      {dict.wiki_content?.hero_eyebrow}
                    </span>
                    <h2>HAOHAN WIKI</h2>
                    <p>{dict.wiki_content?.hero_desc}</p>
                  </header>
                  <nav className="wiki-sidebar-nav" ref={wikiNavRef}>
                    <div className="wiki-sidebar-indicator" ref={wikiNavIndicatorRef}></div>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "intro" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("intro")}
                    >
                      <i className="fa-solid fa-circle-info"></i>
                      <span>{dict.wiki_content?.nav_intro}</span>
                    </button>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "recipes" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("recipes")}
                    >
                      <i className="fa-solid fa-receipt"></i>
                      <span>{dict.wiki_content?.nav_recipes}</span>
                    </button>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "mobs" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("mobs")}
                    >
                      <i className="fa-solid fa-skull"></i>
                      <span>{dict.wiki_content?.nav_mobs}</span>
                    </button>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "villagers" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("villagers")}
                    >
                      <i className="fa-solid fa-people-arrows"></i>
                      <span>{dict.wiki_content?.nav_villagers}</span>
                    </button>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "fishing" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("fishing")}
                    >
                      <i className="fa-solid fa-fish"></i>
                      <span>{dict.wiki_content?.nav_fishing}</span>
                    </button>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "items" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("items")}
                    >
                      <i className="fa-solid fa-gem"></i>
                      <span>{dict.wiki_content?.nav_items}</span>
                    </button>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "guilds" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("guilds")}
                    >
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>{dict.wiki_content?.nav_guilds}</span>
                    </button>
                    <button
                      className={`wiki-sidebar-link ${activeWikiTab === "guide" ? "wiki-sidebar-link--active" : ""}`}
                      type="button"
                      onClick={() => setActiveWikiTab("guide")}
                    >
                      <i className="fa-solid fa-book-open"></i>
                      <span>{dict.wiki_content?.nav_guide}</span>
                    </button>
                  </nav>
                </aside>

                <div className="wiki-content">
                  {activeWikiTab === "intro" && (
                    <div className="wiki-article">
                      <h2>
                        <i className="fa-solid fa-circle-info text-accent"></i>{" "}
                        {dict.wiki_content?.intro_title}
                      </h2>
                      <p
                        className="wiki-intro-text"
                        dangerouslySetInnerHTML={{ __html: dict.wiki_content?.intro_desc }}
                      />

                      <h3 className="wiki-subtitle">
                        <i className="fa-solid fa-circle-play text-accent-green"></i>{" "}
                        {dict.wiki_content?.intro_servers_title}
                      </h3>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.intro_survival_label}</strong>{" "}
                          <code>haohansmp.io.vn</code>
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.intro_build_label}</strong> <code>None</code>
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.intro_archive_label}</strong> <code>None</code>
                        </li>
                      </ul>

                      <p className="wiki-intro-text" style={{ marginTop: "16px", fontSize: "13.5px", fontStyle: "italic" }}>
                        {dict.wiki_content?.intro_rules_note
                          ?.replace("{rules_link}", "")
                          ?.replace("{discord_link}", "")
                          ?.split(dict.wiki_content?.intro_rules_link_text)[0]}
                        <a
                          href="#rules"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("rules");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          style={{ color: "#84ca32", fontWeight: "bold" }}
                        >
                          {dict.wiki_content?.intro_rules_link_text}
                        </a>
                        {dict.wiki_content?.intro_rules_note
                          ?.replace("{rules_link}", dict.wiki_content?.intro_rules_link_text)
                          ?.replace("{discord_link}", dict.wiki_content?.intro_discord_link_text)
                          ?.split(dict.wiki_content?.intro_rules_link_text)[1]
                          ?.split(dict.wiki_content?.intro_discord_link_text)[0]}
                        <a
                          href="https://discord.com/invite/znHfuc6hCR"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#84ca32", fontWeight: "bold" }}
                        >
                          {dict.wiki_content?.intro_discord_link_text}
                        </a>
                        {dict.wiki_content?.intro_rules_note
                          ?.replace("{rules_link}", dict.wiki_content?.intro_rules_link_text)
                          ?.replace("{discord_link}", dict.wiki_content?.intro_discord_link_text)
                          ?.split(dict.wiki_content?.intro_discord_link_text)[1]}
                      </p>

                      <h3 className="wiki-subtitle" style={{ marginTop: "30px" }}>
                        <i className="fa-solid fa-compass text-accent-green"></i>{" "}
                        {dict.wiki_content?.intro_guide_title}
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                          gap: "14px",
                          marginTop: "14px",
                        }}
                      >
                        <button
                          onClick={() => setActiveWikiTab("guide")}
                          className="wiki-guide-card"
                          style={{
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            background: "rgba(255, 255, 255, 0.02)",
                            textAlign: "left",
                            cursor: "pointer",
                            width: "100%",
                            fontFamily: "inherit",
                          }}
                        >
                          <i className="fa-solid fa-graduation-cap"></i>
                          <div>
                            <h4>{dict.wiki_content?.intro_quickstart_title}</h4>
                            <p>{dict.wiki_content?.intro_quickstart_desc}</p>
                          </div>
                        </button>
                        <a
                          href="https://discord.com/invite/znHfuc6hCR"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wiki-guide-card"
                        >
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
                      <h2>
                        <i className="fa-solid fa-receipt text-accent"></i>{" "}
                        {dict.wiki_content?.recipes_title}
                      </h2>
                      <p className="wiki-intro-text">{dict.wiki_content?.recipes_desc}</p>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.recipes_item1_title}</strong>{" "}
                          {dict.wiki_content?.recipes_item1_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.recipes_item2_title}</strong>{" "}
                          {dict.wiki_content?.recipes_item2_desc}
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeWikiTab === "mobs" && (
                    <div className="wiki-article">
                      <h2>
                        <i className="fa-solid fa-skull text-accent"></i> {dict.wiki_content?.mobs_title}
                      </h2>
                      <div className="wiki-alert">
                        <i className="fa-solid fa-circle-info"></i>
                        <span>{dict.wiki_content?.mobs_notice}</span>
                      </div>
                    </div>
                  )}

                  {activeWikiTab === "villagers" && (
                    <div className="wiki-article">
                      <h2>
                        <i className="fa-solid fa-people-arrows text-accent"></i>{" "}
                        {dict.wiki_content?.villagers_title}
                      </h2>
                      <p className="wiki-intro-text">{dict.wiki_content?.villagers_desc}</p>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.villagers_item1_title}</strong>{" "}
                          {dict.wiki_content?.villagers_item1_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.villagers_item2_title}</strong>{" "}
                          {dict.wiki_content?.villagers_item2_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.villagers_item3_title}</strong>{" "}
                          {dict.wiki_content?.villagers_item3_desc}
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeWikiTab === "fishing" && (
                    <div className="wiki-article">
                      <h2>
                        <i className="fa-solid fa-fish text-accent"></i>{" "}
                        {dict.wiki_content?.fishing_title}
                      </h2>
                      <p className="wiki-intro-text">{dict.wiki_content?.fishing_desc}</p>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.fishing_item1_title}</strong>{" "}
                          {dict.wiki_content?.fishing_item1_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.fishing_item2_title}</strong>{" "}
                          {dict.wiki_content?.fishing_item2_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.fishing_item3_title}</strong>{" "}
                          {dict.wiki_content?.fishing_item3_desc}
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeWikiTab === "items" && (
                    <div className="wiki-article">
                      <h2>
                        <i className="fa-solid fa-gem text-accent"></i> {dict.wiki_content?.items_title}
                      </h2>
                      <p className="wiki-intro-text">{dict.wiki_content?.items_desc}</p>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.items_item1_title}</strong>{" "}
                          {dict.wiki_content?.items_item1_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.items_item2_title}</strong>{" "}
                          {dict.wiki_content?.items_item2_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.items_item3_title}</strong>{" "}
                          {dict.wiki_content?.items_item3_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.items_item4_title}</strong>{" "}
                          {dict.wiki_content?.items_item4_desc}
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeWikiTab === "guilds" && (
                    <div className="wiki-article">
                      <h2>
                        <i className="fa-solid fa-shield-halved text-accent"></i>{" "}
                        {dict.wiki_content?.guilds_title}
                      </h2>
                      <p className="wiki-intro-text">{dict.wiki_content?.guilds_desc}</p>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.guilds_item1_title}</strong>{" "}
                          {dict.wiki_content?.guilds_item1_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.guilds_item2_title}</strong>{" "}
                          {dict.wiki_content?.guilds_item2_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.guilds_item3_title}</strong>{" "}
                          {dict.wiki_content?.guilds_item3_desc}
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeWikiTab === "guide" && (
                    <div className="wiki-article">
                      <h2>
                        <i className="fa-solid fa-book-open text-accent"></i>{" "}
                        {dict.wiki_content?.guide_title}
                      </h2>

                      <h3 className="wiki-subtitle">
                        <i className="fa-solid fa-earth-americas text-accent-green"></i>{" "}
                        {dict.wiki_content?.guide_world_title}
                      </h3>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.guide_world_item1_title}</strong>{" "}
                          {dict.wiki_content?.guide_world_item1_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.guide_world_item2_title}</strong>{" "}
                          {dict.wiki_content?.guide_world_item2_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.guide_world_item3_title}</strong>{" "}
                          {dict.wiki_content?.guide_world_item3_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.guide_world_item4_title}</strong>{" "}
                          {dict.wiki_content?.guide_world_item4_desc}
                        </li>
                      </ul>

                      <h3 className="wiki-subtitle" style={{ marginTop: "24px" }}>
                        <i className="fa-solid fa-circle-check text-accent-green"></i>{" "}
                        {dict.wiki_content?.guide_qol_title}
                      </h3>
                      <ul className="wiki-list">
                        <li>
                          <strong>{dict.wiki_content?.guide_qol_item1_title}</strong>{" "}
                          {dict.wiki_content?.guide_qol_item1_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.guide_qol_item2_title}</strong>{" "}
                          {dict.wiki_content?.guide_qol_item2_desc}
                        </li>
                        <li>
                          <strong>{dict.wiki_content?.guide_qol_item3_title}</strong>{" "}
                          {dict.wiki_content?.guide_qol_item3_desc}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === "donate" && (
          <section className="reveal visible rules-page" id="donate" style={{ minHeight: 'calc(100vh - 400px)' }}>
            <SectionStars count={25} />
            <div className="wrap rules-page-wrap">
              <div className="donate-page-layout">

                {/* Left Column: Donation Form */}
                <div className="donate-form-col">
                  {/* Top Row: Supporters Header */}
                  <div className="donate-supporters-header" style={{ marginBottom: '24px' }}>
                    <span className="donate-eyebrow">
                      <i className="fa-solid fa-heart" style={{ color: '#ff4d4d' }}></i>
                      {dict.donate?.thank_you}
                    </span>
                    <h2 className="donate-supporters-title">
                      {dict.donate?.supporters_title}
                    </h2>
                    <p className="donate-supporters-desc">
                      {dict.donate?.supporters_desc}
                    </p>
                  </div>

                  {/* Separation Line */}
                  <div style={{ borderBottom: '2px solid rgba(255, 149, 46, 0.3)', marginBottom: '36px' }}></div>
                  <form onSubmit={handleDonateSubmit} className="donate-form">

                    {/* Minecraft character name */}
                    <div className="donate-field">
                      <label htmlFor="donate-name" className="donate-label">
                        {dict.donate?.name_label?.replace(':', '')}
                      </label>
                      <input
                        id="donate-name"
                        type="text"
                        value={donateName}
                        onChange={(e) => setDonateName(e.target.value)}
                        placeholder={dict.donate.name_placeholder}
                        required
                        className="donate-input"
                      />
                    </div>

                    {/* Support amount */}
                    <div className="donate-field">
                      <label htmlFor="donate-amount" className="donate-label">
                        {dict.donate?.amount_label?.replace(':', '')}
                      </label>

                      <div className="donate-presets">
                        {DONATION_PRESETS.map((preset) => {
                          const isSelected = Number(donateAmount) === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setDonateAmount(preset.toString())}
                              className={`donate-preset-btn ${isSelected ? 'donate-preset-btn--active' : ''}`}
                            >
                              {new Intl.NumberFormat('vi-VN').format(preset)} đ
                            </button>
                          );
                        })}
                      </div>

                      <input
                        id="donate-amount"
                        type="number"
                        min="1000"
                        step="1000"
                        value={donateAmount}
                        onChange={(e) => setDonateAmount(e.target.value)}
                        placeholder={dict.donate?.amount_placeholder}
                        required
                        className="donate-input"
                      />
                    </div>

                    <button type="submit" disabled={donateLoading} className="donate-submit-btn">
                      {donateLoading ? dict.donate?.creating : dict.donate?.support_us}
                    </button>

                    <div className="donate-disclaimer">
                      <p>{dict.donate?.disclaimer_name}</p>
                      <p>{dict.donate?.disclaimer_redirect}</p>
                    </div>

                    {donateResult && (
                      <div className="donate-result-msg">
                        {donateResult}
                      </div>
                    )}

                    <p style={{ display: 'none', margin: 0, color: '#868582', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {dict.donate?.confirm_disclaimer}
                    </p>
                  </form>
                </div>

                {/* Right Column: Supporters Leaderboard */}
                <div className="donate-supporters-col">
                  <div className="rules-article" style={{ marginBottom: '16px' }}>
                    <h2>
                      <i className="fa-solid fa-crown"></i>
                      {dict.donate?.donator_section_title}
                    </h2>
                  </div>

                  <div className="donate-leaderboard">
                    {visibleSupporters.map((supporter, index) => {
                      const overallIndex = (currentSupporterPage - 1) * DONORS_PER_PAGE + index;
                      const isTop1 = overallIndex === 0;

                      const displayName = supporter.displayName || supporter.display_name || supporter.username || 'Unknown User';
                      const minecraftName = supporter.minecraftName || supporter.minecraft_name;
                      const username = supporter.username || displayName;
                      const supporterIdentity = [displayName, minecraftName, username]
                        .filter(Boolean)
                        .map((value) => value.toString().toLowerCase());
                      const useDefaultDiscordBanner = supporterIdentity.some((value) =>
                        value === 'pico' || value === 'picosvip' || value === 'picoxsvipmax'
                      );

                      const keyName = displayName.toLowerCase().trim();
                      const fallbackProfile = discordProfiles[keyName] || {
                        status: overallIndex % 3 === 0 ? "dnd" : (overallIndex % 3 === 1 ? "online" : "idle"),
                        customStatus: supporter.note || "",
                        banner: "linear-gradient(135deg, #1e1e24, #121214)",
                        tag: `@${displayName.toLowerCase().replace(/\s+/g, '')}`
                      };

                      const discordAccount = supporter.discordAccount || supporter.discord_account || {};

                      // Resolve Discord avatar if synced, else fallback to Discord default avatar
                      const avatar = supporter.avatarUrl || supporter.avatar_url ||
                        discordAccount.guild_avatar_url || discordAccount.guildAvatarUrl ||
                        discordAccount.avatar_url || discordAccount.avatarUrl ||
                        fallbackProfile.avatar ||
                        `https://cdn.discordapp.com/embed/avatars/${(username.charCodeAt(0) || 0) % 6}.png`;

                      const displayTitle = discordAccount.guild_nickname || discordAccount.guildNickname ||
                        discordAccount.global_name || discordAccount.globalName ||
                        displayName;

                      const discordTag = discordAccount.username ? `@${discordAccount.username}` : fallbackProfile.tag;
                      const bannerUrl = supporter.bannerUrl || supporter.banner_url ||
                        discordAccount.banner_url || discordAccount.bannerUrl ||
                        discordAccount.guild_banner_url || discordAccount.guildBannerUrl;
                      const accentColor = supporter.accentColor || supporter.accent_color;
                      const rowBackground = useDefaultDiscordBanner
                        ? DISCORD_DEFAULT_BANNER
                        : bannerUrl
                          ? `linear-gradient(90deg, rgba(18, 14, 12, 0.78), rgba(18, 14, 12, 0.58)), url("${bannerUrl}")`
                          : (accentColor
                            ? `linear-gradient(90deg, rgba(18, 14, 12, 0.8), rgba(18, 14, 12, 0.55)), linear-gradient(135deg, #${Number(accentColor).toString(16).padStart(6, '0')}, #151515)`
                            : fallbackProfile.banner);

                      return (
                        <div
                          key={`${username}-${index}`}
                          className={`donate-donor-row ${isTop1 ? 'donate-donor-row--top1' : ''} ${useDefaultDiscordBanner ? 'donate-donor-row--default-discord' : ''}`}
                          style={{
                            backgroundImage: rowBackground,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          <div className="donate-donor-rank">
                            <span className="donate-rank-number">{overallIndex + 1}</span>
                          </div>

                          <div className="donate-donor-avatar" style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={avatar}
                              alt={displayTitle}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = `https://minotar.net/avatar/char/40`;
                              }}
                            />
                          </div>

                          <div className="donate-donor-info">
                            <strong className="donate-donor-name">{displayTitle}</strong>
                            <span className="donate-donor-handle">{discordTag}</span>
                          </div>

                          <div className="donate-donor-amount">
                            {formatVnd(supporter.amount || supporter.total_donated)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {supporterPageCount > 1 && (() => {
                    // Build page numbers with ellipsis
                    const pages = [];
                    const total = supporterPageCount;
                    const current = currentSupporterPage;

                    if (total <= 7) {
                      for (let i = 1; i <= total; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (current > 3) pages.push('...');
                      const start = Math.max(2, current - 1);
                      const end = Math.min(total - 1, current + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (current < total - 2) pages.push('...');
                      pages.push(total);
                    }

                    return (
                      <div className="donate-pagination">
                        <button
                          type="button"
                          className="donate-page-arrow"
                          onClick={() => setSupporterPage(p => Math.max(1, p - 1))}
                          disabled={currentSupporterPage === 1}
                          aria-label="Previous page"
                        >
                          <i className="fa-solid fa-chevron-left"></i>
                        </button>

                        <div className="donate-page-numbers">
                          {pages.map((page, i) => {
                            if (page === '...') {
                              const isEditing = editingPageInput === i;
                              return isEditing ? (
                                <input
                                  key={`dots-input-${i}`}
                                  type="number"
                                  min={1}
                                  max={supporterPageCount}
                                  className="donate-page-input-inline"
                                  placeholder="..."
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = parseInt(e.target.value, 10);
                                      if (val >= 1 && val <= supporterPageCount) {
                                        setSupporterPage(val);
                                      }
                                      setEditingPageInput(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingPageInput(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (val >= 1 && val <= supporterPageCount) {
                                      setSupporterPage(val);
                                    }
                                    setEditingPageInput(null);
                                  }}
                                />
                              ) : (
                                <button
                                  key={`dots-btn-${i}`}
                                  type="button"
                                  className="donate-page-dots-btn"
                                  onClick={() => setEditingPageInput(i)}
                                  title={isVi ? "Nhập số trang..." : "Go to page..."}
                                  aria-label="Go to page"
                                >
                                  ···
                                </button>
                              );
                            }
                            return (
                              <button
                                key={page}
                                type="button"
                                className={`donate-page-num ${page === currentSupporterPage ? 'donate-page-num--active' : ''}`}
                                onClick={() => setSupporterPage(page)}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          className="donate-page-arrow"
                          onClick={() => setSupporterPage(p => Math.min(supporterPageCount, p + 1))}
                          disabled={currentSupporterPage === supporterPageCount}
                          aria-label="Next page"
                        >
                          <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    );
                  })()}
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
                  <nav className="profile-sidebar-nav" ref={profileNavRef} aria-label={dict.profile.nav_label}>
                    <div className="profile-sidebar-indicator" ref={profileNavIndicatorRef}></div>
                    <button
                      type="button"
                      className={`profile-sidebar-link ${profileSubTab === "overview" ? "profile-sidebar-link--active" : ""}`}
                      onClick={() => setProfileSubTab("overview")}
                    >
                      <i className="fa-solid fa-user"></i><span>{dict.profile.nav_overview}</span>
                    </button>
                    <button
                      type="button"
                      className={`profile-sidebar-link ${profileSubTab === "settings" ? "profile-sidebar-link--active" : ""}`}
                      onClick={() => setProfileSubTab("settings")}
                    >
                      <i className="fa-solid fa-gear"></i><span>{dict.profile.nav_settings}</span>
                    </button>
                    <button
                      type="button"
                      className={`profile-sidebar-link ${profileSubTab === "connections" ? "profile-sidebar-link--active" : ""}`}
                      onClick={() => setProfileSubTab("connections")}
                    >
                      <i className="fa-solid fa-link"></i><span>{dict.profile.nav_connections}</span>
                    </button>
                    <button type="button" className="profile-sidebar-link profile-sidebar-link--logout" onClick={handleLogout}>
                      <i className="fa-solid fa-arrow-right-from-bracket"></i><span>{dict.profile.logout_btn}</span>
                    </button>
                  </nav>
                </aside>
                <div className="profile-card">
                  {profileSubTab === "overview" && (
                    <div className="profile-card-grid profile-tab-content">
                      <div className="profile-left-col">
                        <div className="profile-avatar-wrapper">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="profile-avatar"
                            src={`https://minotar.net/avatar/${user.username}/120`}
                            alt={user.username}
                          />
                        </div>
                        <MinecraftSkinViewer username={user.username} />
                      </div>
                      <div className="profile-info">
                        <div className="profile-name-row">
                          <h3 className="profile-username">{user.username}</h3>
                        </div>
                        <p className="profile-welcome">
                          {dict.profile.welcome_message}
                        </p>
                        <div className="profile-fields-grid">
                          <div className="profile-field-item">
                            <i className="profile-field-icon fa-solid fa-user"></i>
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
                            <span className="profile-field-value">
                              {(() => {
                                const roleName = user.role || 'default';
                                const roleStyle = getRoleStyle(roleName);
                                return (
                                  <span className="profile-role-badge" style={{
                                    color: roleStyle.color,
                                    background: roleStyle.bg,
                                    border: `1px solid ${roleStyle.border}`,
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    letterSpacing: '0.3px'
                                  }}>
                                    <i className="fa-solid fa-circle" style={{ fontSize: '0.45rem', color: roleStyle.color }}></i>
                                    {roleName === 'default' ? dict.profile.default_role : roleName}
                                  </span>
                                );
                              })()}
                            </span>
                          </div>
                          <div className="profile-field-item">
                            <i className="profile-field-icon fa-solid fa-fingerprint"></i>
                            <span className="profile-field-label">{dict.profile.uuid_label}</span>
                            <span className="profile-field-value profile-field-value--code">{user.uuid || "---"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {profileSubTab === "settings" && (
                    <div className="profile-tab-content" style={{ padding: '0 0 0 clamp(20px, 4vw, 40px)', width: '100%', fontFamily: "'Outfit', sans-serif" }}>
                      <h3 style={{ color: '#ff952e', fontSize: '1.6rem', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                        {dict.profile.settings_title}
                      </h3>
                      <p style={{ color: '#aaa9a6', fontSize: '0.95rem', marginBottom: '30px' }}>
                        {dict.profile.settings_desc}
                      </p>

                      <form onSubmit={handleUpdateSettings}>
                        <div className="profile-fields-grid" style={{ marginBottom: '24px' }}>
                          <div className="profile-field-item">
                            <i className="profile-field-icon fa-solid fa-envelope"></i>
                            <span className="profile-field-label">Email</span>
                            <span className="profile-field-value" style={{ width: '100%' }}>
                              <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={!isEditingSettings}
                                style={{
                                  width: '100%',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: isEditingSettings ? '1px dashed rgba(255, 255, 255, 0.2)' : 'none',
                                  color: isEditingSettings ? '#fff' : '#868582',
                                  fontSize: '0.95rem',
                                  padding: '4px 0',
                                  outline: 'none',
                                  cursor: isEditingSettings ? 'text' : 'not-allowed'
                                }}
                              />
                            </span>
                          </div>

                          <div className="profile-field-item">
                            <i className="profile-field-icon fa-solid fa-key"></i>
                            <span className="profile-field-label">{dict.profile.settings_new_password}</span>
                            <span className="profile-field-value" style={{ width: '100%' }}>
                              <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={isEditingSettings ? "••••••••" : ""}
                                minLength={6}
                                disabled={!isEditingSettings}
                                style={{
                                  width: '100%',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: isEditingSettings ? '1px dashed rgba(255, 255, 255, 0.2)' : 'none',
                                  color: isEditingSettings ? '#fff' : '#868582',
                                  fontSize: '0.95rem',
                                  padding: '4px 0',
                                  outline: 'none',
                                  cursor: isEditingSettings ? 'text' : 'not-allowed'
                                }}
                              />
                            </span>
                          </div>

                          {isEditingSettings && newPassword && (
                            <div className="profile-field-item">
                              <i className="profile-field-icon fa-solid fa-key"></i>
                              <span className="profile-field-label">{dict.profile.settings_confirm_password}</span>
                              <span className="profile-field-value" style={{ width: '100%' }}>
                                <input
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="••••••••"
                                  required={!!newPassword}
                                  disabled={!isEditingSettings}
                                  style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: isEditingSettings ? '1px dashed rgba(255, 255, 255, 0.2)' : 'none',
                                    color: isEditingSettings ? '#fff' : '#868582',
                                    fontSize: '0.95rem',
                                    padding: '4px 0',
                                    outline: 'none',
                                    cursor: isEditingSettings ? 'text' : 'not-allowed'
                                  }}
                                />
                              </span>
                            </div>
                          )}

                          <div className="profile-field-item">
                            <i className="profile-field-icon fa-solid fa-shield-halved"></i>
                            <span className="profile-field-label">{dict.profile.settings_current_password} {isEditingSettings && "*"}</span>
                            <span className="profile-field-value" style={{ width: '100%' }}>
                              <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                required={isEditingSettings}
                                disabled={!isEditingSettings}
                                style={{
                                  width: '100%',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: isEditingSettings ? '1px dashed rgba(255, 255, 255, 0.2)' : 'none',
                                  color: isEditingSettings ? '#fff' : '#868582',
                                  fontSize: '0.95rem',
                                  padding: '4px 0',
                                  outline: 'none',
                                  cursor: isEditingSettings ? 'text' : 'not-allowed'
                                }}
                              />
                            </span>
                          </div>
                        </div>

                        {settingsMsg && (
                          <div className={settingsSuccess ? "profile-sync-msg profile-sync-msg--success" : "auth-error"} style={{ marginBottom: '20px', padding: '12px', borderRadius: '6px' }}>
                            <i className={settingsSuccess ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ marginRight: '8px' }}></i>
                            {settingsMsg}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                          {!isEditingSettings ? (
                            <button
                              type="button"
                              onClick={() => setIsEditingSettings(true)}
                              style={{
                                minHeight: '44px',
                                padding: '0 30px',
                                background: 'linear-gradient(135deg, rgba(255, 149, 46, 0.15), rgba(255, 149, 46, 0.05))',
                                color: '#ff952e',
                                border: '1px solid rgba(255, 149, 46, 0.3)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                borderRadius: '6px',
                                transition: 'all 0.2s'
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                              {isVi ? "Chỉnh sửa" : "Edit"}
                            </button>
                          ) : (
                            <>
                              <button
                                type="submit"
                                disabled={!(newEmail !== (user ? user.email : "") || newPassword !== "" || currentPassword !== "") || updatingSettings}
                                style={{
                                  minHeight: '44px',
                                  padding: '0 30px',
                                  background: (newEmail !== (user ? user.email : "") || newPassword !== "" || currentPassword !== "") ? 'linear-gradient(135deg, #ff952e, #f37b18)' : 'rgba(255, 255, 255, 0.05)',
                                  color: (newEmail !== (user ? user.email : "") || newPassword !== "" || currentPassword !== "") ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                                  border: (newEmail !== (user ? user.email : "") || newPassword !== "" || currentPassword !== "") ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                                  fontWeight: '700',
                                  cursor: (newEmail !== (user ? user.email : "") || newPassword !== "" || currentPassword !== "") ? 'pointer' : 'not-allowed',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  borderRadius: '6px',
                                  boxShadow: (newEmail !== (user ? user.email : "") || newPassword !== "" || currentPassword !== "") ? '0 4px 15px rgba(243, 123, 24, 0.3)' : 'none',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {updatingSettings ? (
                                  <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    {dict.profile.settings_updating}
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-floppy-disk"></i>
                                    {dict.profile.settings_save_btn}
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                style={{
                                  minHeight: '44px',
                                  padding: '0 24px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  color: '#aaa9a6',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '6px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {isVi ? "Hủy" : "Cancel"}
                              </button>
                            </>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  {profileSubTab === "connections" && (
                    <div className="profile-tab-content" style={{ padding: '0 0 0 clamp(20px, 4vw, 40px)', width: '100%', fontFamily: "'Outfit', sans-serif" }}>
                      <h3 style={{ color: '#ff952e', fontSize: '1.6rem', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                        {dict.profile.connections_title}
                      </h3>
                      <p style={{ color: '#aaa9a6', fontSize: '0.95rem', marginBottom: '30px' }}>
                        {dict.profile.connections_desc}
                      </p>

                      <div className="profile-fields-grid" style={{ marginBottom: '24px' }}>
                        {/* Minecraft Connection */}
                        <div className="profile-field-item" style={{ minHeight: '120px', alignItems: 'start', paddingTop: '16px' }}>
                          <i className="profile-field-icon fa-solid fa-cube"></i>
                          <span className="profile-field-label">{dict.profile.connections_minecraft_title}</span>
                          <div className="profile-field-value" style={{ width: '100%', marginTop: '6px' }}>
                            {user.uuid ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="profile-badge profile-badge--verified" style={{ alignSelf: 'flex-start', margin: '4px 0 8px' }}>
                                  <i className="fas fa-check-circle"></i> {dict.profile.linked_minecraft}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#868582', display: 'block' }}>UUID: {user.uuid}</span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span className="profile-badge profile-badge--unverified" style={{ alignSelf: 'flex-start', margin: '4px 0' }}>
                                  <i className="fas fa-exclamation-circle"></i> {dict.profile.unlinked_minecraft}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#868582', lineHeight: '1.4' }}>
                                  {dict.profile.minecraft_link_tip}
                                </span>
                                <form onSubmit={handleLinkMinecraft} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <input
                                    type="text"
                                    value={linkCode}
                                    onChange={(e) => setLinkCode(e.target.value)}
                                    placeholder="AB12CD"
                                    maxLength={6}
                                    required
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      borderBottom: '1px dashed rgba(255, 255, 255, 0.2)',
                                      color: '#fff',
                                      fontSize: '0.95rem',
                                      padding: '4px 0',
                                      outline: 'none',
                                      width: '100px',
                                      textTransform: 'uppercase',
                                      textAlign: 'center',
                                      letterSpacing: '2px'
                                    }}
                                  />
                                  <button
                                    type="submit"
                                    disabled={linkingGame}
                                    style={{
                                      padding: '4px 12px',
                                      background: 'linear-gradient(135deg, #ff952e, #f37b18)',
                                      color: '#fff',
                                      border: 'none',
                                      fontWeight: '600',
                                      fontSize: '0.8rem',
                                      cursor: 'pointer',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {linkingGame ? <i className="fa-solid fa-circle-notch fa-spin"></i> : dict.profile.connections_link_btn}
                                  </button>
                                </form>
                                {linkMsg && (
                                  <div className={linkSuccess ? "profile-sync-msg profile-sync-msg--success" : "auth-error"} style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px', marginTop: '4px' }}>
                                    {linkMsg}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Discord Connection */}
                        <div className="profile-field-item" style={{ minHeight: '120px', alignItems: 'start', paddingTop: '16px' }}>
                          <i className="profile-field-icon fab fa-discord" style={{ color: '#5865f2', background: 'rgba(88, 101, 242, 0.09)', borderColor: 'rgba(88, 101, 242, 0.16)' }}></i>
                          <span className="profile-field-label">Discord Connection</span>
                          <div className="profile-field-value" style={{ width: '100%', marginTop: '6px' }}>
                            {user.discord_id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span className="profile-badge profile-badge--verified" style={{ alignSelf: 'flex-start', background: 'rgba(88, 101, 242, 0.15)', color: '#5865f2', borderColor: 'rgba(88, 101, 242, 0.3)' }}>
                                  <i className="fab fa-discord"></i> {dict.profile.linked_discord}
                                </span>
                                {user.avatar_url && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={user.avatar_url} alt="Discord avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                    <span style={{ fontSize: '0.85rem', color: '#aaa9a6' }}>Discord Account Connected</span>
                                  </div>
                                )}
                                {user.role && user.role !== 'default' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#868582' }}>{dict.profile.role_label}:</span>
                                    {(() => {
                                      const roleStyle = getRoleStyle(user.role);
                                      return (
                                        <span className="profile-role-badge" style={{
                                          color: roleStyle.color,
                                          background: roleStyle.bg,
                                          border: `1px solid ${roleStyle.border}`,
                                          padding: '3px 10px',
                                          borderRadius: '20px',
                                          fontSize: '0.78rem',
                                          fontWeight: '600',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          letterSpacing: '0.3px'
                                        }}>
                                          <i className="fa-solid fa-circle" style={{ fontSize: '0.4rem', color: roleStyle.color }}></i>
                                          {user.role}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                )}
                                <div style={{ marginTop: '4px' }}>
                                  <button className="btn-profile-sync" onClick={handleSyncDiscord} disabled={syncing} style={{ padding: '6px 12px', height: 'auto', fontSize: '0.8rem' }}>
                                    <i className="fas fa-sync-alt"></i> {syncing ? dict.profile.syncing : dict.profile.sync_btn}
                                  </button>
                                  {syncMsg && (
                                    <div className={`profile-sync-msg ${syncSuccess ? 'profile-sync-msg--success' : 'profile-sync-msg--error'}`} style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                                      {syncMsg}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span className="profile-badge profile-badge--unverified" style={{ alignSelf: 'flex-start' }}>
                                  <i className="fas fa-exclamation-circle"></i> {dict.profile.unlinked_discord}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#868582', lineHeight: '1.4' }}>
                                  {dict.profile.join_discord_required}
                                </span>
                                <button className="btn-profile-discord" onClick={handleLinkDiscord} style={{ alignSelf: 'flex-start', padding: '6px 12px', height: 'auto', fontSize: '0.8rem', marginTop: '4px' }}>
                                  <i className="fab fa-discord"></i> {dict.profile.link_discord_btn}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>
        )}
        {/* Wiki Mobile floating action button and modal drawer */}
        {activeTab === "wiki" && (
          <>
            <button className="mobile-fab wiki-fab" type="button" onClick={() => setWikiMenuOpen(true)}>
              <i className="fa-solid fa-list-ol"></i>
            </button>
            {wikiMenuOpen && (
              <div className="mobile-overlay" onClick={() => setWikiMenuOpen(false)}>
                <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                  <div className="mobile-drawer__header">
                    <h3>{dict.wiki_content?.sidebar_title}</h3>
                    <button className="mobile-drawer__close" type="button" onClick={() => setWikiMenuOpen(false)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div className="mobile-drawer__nav">
                    <button className={`wiki-sidebar-link ${activeWikiTab === "intro" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("intro"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-circle-info"></i>
                      <span>{dict.wiki_content?.nav_intro}</span>
                    </button>
                    <button className={`wiki-sidebar-link ${activeWikiTab === "recipes" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("recipes"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-receipt"></i>
                      <span>{dict.wiki_content?.nav_recipes}</span>
                    </button>
                    <button className={`wiki-sidebar-link ${activeWikiTab === "mobs" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("mobs"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-skull"></i>
                      <span>{dict.wiki_content?.nav_mobs}</span>
                    </button>
                    <button className={`wiki-sidebar-link ${activeWikiTab === "villagers" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("villagers"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-people-arrows"></i>
                      <span>{dict.wiki_content?.nav_villagers}</span>
                    </button>
                    <button className={`wiki-sidebar-link ${activeWikiTab === "fishing" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("fishing"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-fish"></i>
                      <span>{dict.wiki_content?.nav_fishing}</span>
                    </button>
                    <button className={`wiki-sidebar-link ${activeWikiTab === "items" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("items"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-gem"></i>
                      <span>{dict.wiki_content?.nav_items}</span>
                    </button>
                    <button className={`wiki-sidebar-link ${activeWikiTab === "guilds" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("guilds"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>{dict.wiki_content?.nav_guilds}</span>
                    </button>
                    <button className={`wiki-sidebar-link ${activeWikiTab === "guide" ? "wiki-sidebar-link--active" : ""}`} type="button" onClick={() => { setActiveWikiTab("guide"); setWikiMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-book-open"></i>
                      <span>{dict.wiki_content?.nav_guide}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Rules Mobile floating action button and modal drawer */}
        {activeTab === "rules" && (
          <>
            <button className="mobile-fab rules-fab" type="button" onClick={() => setRulesMenuOpen(true)}>
              <i className="fa-solid fa-list-ol"></i>
            </button>
            {rulesMenuOpen && (
              <div className="mobile-overlay" onClick={() => setRulesMenuOpen(false)}>
                <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                  <div className="mobile-drawer__header">
                    <h3>{isVi ? "MỤC LỤC NỘI QUY" : "RULES NAVIGATION"}</h3>
                    <button className="mobile-drawer__close" type="button" onClick={() => setRulesMenuOpen(false)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div className="mobile-drawer__nav">
                    <button className={`rules-sidebar-link ${rulesSubTab === "smp" ? "rules-sidebar-link--active" : ""}`} type="button" onClick={() => { setRulesSubTab("smp"); setRulesMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-gamepad"></i>
                      <span>{dict.rules.smp.title.replace("I. ", "")}</span>
                    </button>
                    <button className={`rules-sidebar-link ${rulesSubTab === "discord" ? "rules-sidebar-link--active" : ""}`} type="button" onClick={() => { setRulesSubTab("discord"); setRulesMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-brands fa-discord"></i>
                      <span>{dict.rules.discord.title.replace("II. ", "")}</span>
                    </button>
                    <button className={`rules-sidebar-link ${rulesSubTab === "penalty" ? "rules-sidebar-link--active" : ""}`} type="button" onClick={() => { setRulesSubTab("penalty"); setRulesMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-gavel"></i>
                      <span>{dict.rules.penalty.title.replace("III. ", "")}</span>
                    </button>
                    <button className={`rules-sidebar-link ${rulesSubTab === "footer" ? "rules-sidebar-link--active" : ""}`} type="button" onClick={() => { setRulesSubTab("footer"); setRulesMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <i className="fa-solid fa-info-circle"></i>
                      <span>{dict.rules.footer_msg.title.replace("IV. ", "")}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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
              <a href="#donate" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7c8ce', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#c7c8ce'}>
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
      {selectedFeature && (
        <div className="feature-modal-overlay" onClick={() => setSelectedFeature(null)}>
          <div className="feature-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="feature-modal-close" onClick={() => setSelectedFeature(null)} aria-label="Close feature details">
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="feature-modal-grid">
              {/* Left Column: Image Explorer */}
              <div className="feature-modal-media">
                <div className="feature-modal-preview-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featureImages[selectedFeature.id][activeFeatureImgIndex]}
                    alt={selectedFeature.title}
                    className="feature-modal-preview-img"
                  />
                  <div className="feature-modal-index-tag">
                    {activeFeatureImgIndex + 1} / {featureImages[selectedFeature.id].length}
                  </div>
                </div>

                {/* Thumbnails list */}
                <div className="feature-modal-thumbs">
                  {featureImages[selectedFeature.id].map((thumbUrl, idx) => {
                    const isActive = activeFeatureImgIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveFeatureImgIndex(idx)}
                        className={`feature-modal-thumb-btn ${isActive ? 'feature-modal-thumb-btn--active' : ''}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbUrl} alt="" className="feature-modal-thumb-img" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Explanations & Actions */}
              <div className="feature-modal-info">
                <div className="feature-modal-header">
                  <div className="feature-modal-icon-badge" style={{ color: selectedFeature.accent }}>
                    <i className={selectedFeature.icon}></i>
                  </div>
                  <h3 className="feature-modal-title">
                    {featureExplanations[selectedFeature.id]?.title || selectedFeature.title}
                  </h3>
                </div>

                <p className="feature-modal-desc">
                  {featureExplanations[selectedFeature.id]?.desc || selectedFeature.desc}
                </p>

                <div className="feature-modal-actions">
                  <button
                    onClick={() => handleFeatureWikiClick(selectedFeature.wikiTab)}
                    className="feature-modal-wiki-btn"
                    style={{
                      background: `linear-gradient(135deg, ${selectedFeature.accent} 0%, rgba(20,16,12,0.8) 120%)`,
                      border: `1px solid ${selectedFeature.accent}80`,
                      boxShadow: `0 4px 20px ${selectedFeature.accent}40`
                    }}
                  >
                    <i className="fa-solid fa-book-open"></i>
                    <span>
                      {featureExplanations[selectedFeature.id]?.wikiLabel || (isVi ? "Xem chi tiết trên Wiki" : "View details on Wiki")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
