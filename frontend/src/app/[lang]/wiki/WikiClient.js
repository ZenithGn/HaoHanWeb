"use client";

import { useState, useRef, useEffect } from "react";

export default function WikiClient({ dict, lang }) {
  const [activeWikiTab, setActiveWikiTab] = useState("intro");
  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const isVi = lang === "vi";

  const categories = [
    { id: "all", icon: "fa-solid fa-list-ul", label: isVi ? "Tất cả" : "All" },
    { id: "utilities", icon: "fa-solid fa-screwdriver-wrench", label: isVi ? "Tiện ích & Khác" : "Utilities & Others" },
    { id: "combat", icon: "fa-solid fa-shield-halved", label: isVi ? "Chiến đấu" : "Combat" },
    { id: "pickaxes", icon: "fa-solid fa-hammer", label: isVi ? "Cúp" : "Pickaxes" },
    { id: "spears", icon: "fa-solid fa-crosshairs", label: isVi ? "Vũ khí Giáo" : "Spears" },
    { id: "boats", icon: "fa-solid fa-ship", label: isVi ? "Thuyền bè" : "Boats" }
  ];

  const getStationBadgeClass = (station) => {
    switch (station) {
      case "smithing": return "recipe-station-badge--smithing";
      case "brewing": return "recipe-station-badge--brewing";
      case "smelting": return "recipe-station-badge--smelting";
      default: return "recipe-station-badge--crafting";
    }
  };

  const getStationLabel = (station) => {
    switch (station) {
      case "smithing": return isVi ? "Bàn Rèn" : "Smithing Table";
      case "brewing": return isVi ? "Bệ Pha Thuốc" : "Brewing Stand";
      case "smelting": return isVi ? "Lò Nung" : "Furnace";
      default: return isVi ? "Bàn Chế Tạo" : "Crafting Table";
    }
  };

  const getStationIcon = (station) => {
    switch (station) {
      case "smithing": return "fa-solid fa-screwdriver-wrench";
      case "brewing": return "fa-solid fa-flask";
      case "smelting": return "fa-solid fa-fire";
      default: return "fa-solid fa-hammer";
    }
  };

  const filteredRecipes = RECIPES_DATA.filter((recipe) => {
    const name = (recipe.name[lang] || recipe.name.vi).toLowerCase();
    const desc = (recipe.desc[lang] || recipe.desc.vi).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesCategory = activeCategory === "all" || recipe.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (category) => {
    return RECIPES_DATA.filter((recipe) => {
      const name = (recipe.name[lang] || recipe.name.vi).toLowerCase();
      const desc = (recipe.desc[lang] || recipe.desc.vi).toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || desc.includes(query);
      const matchesCategory = category === "all" || recipe.category === category;
      return matchesSearch && matchesCategory;
    }).length;
  };

  const wikiNavRef = useRef(null);
  const wikiNavIndicatorRef = useRef(null);

  useEffect(() => {
    const updateIndicator = () => {
      const nav = wikiNavRef.current;
      const indicator = wikiNavIndicatorRef.current;
      if (!nav || !indicator) return;

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
  }, [activeWikiTab]);

  return (
    <div style={{ backgroundColor: "#101115", minHeight: "100vh", padding: "120px 20px 60px" }}>
      <div className="wrap wiki-page-wrap">
        <div className="wiki-layout">
          <aside className="wiki-sidebar">
            <header className="wiki-card__header">
              <span className="wiki-card__eyebrow">
                <i className="fa-solid fa-book-open"></i>
                {dict.wiki_content?.hero_eyebrow || "Wiki Library"}
              </span>
              <h2>HAOHAN WIKI</h2>
              <p>{dict.wiki_content?.hero_desc || "Core guide and mechanisms of the server."}</p>
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
                    <strong>{dict.wiki_content?.intro_survival_label}</strong> <code>haohansmp.io.vn</code>
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
                  <a href={`/${lang}/rules`} style={{ color: "#84ca32", fontWeight: "bold" }}>
                    {dict.wiki_content?.intro_rules_link_text}
                  </a>
                  {dict.wiki_content?.intro_rules_note
                    ?.replace("{rules_link}", dict.wiki_content?.intro_rules_link_text)
                    ?.replace("{discord_link}", dict.wiki_content?.intro_discord_link_text)
                    ?.split(dict.wiki_content?.intro_rules_link_text)[1]
                    ?.split(dict.wiki_content?.intro_discord_link_text)[0]}
                  <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer" style={{ color: "#84ca32", fontWeight: "bold" }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginTop: "14px" }}>
                  <button
                    onClick={() => setActiveWikiTab("guide")}
                    className="wiki-guide-card"
                    style={{ border: "1px solid rgba(255, 255, 255, 0.06)", background: "rgba(255, 255, 255, 0.02)", textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
                  >
                    <i className="fa-solid fa-graduation-cap"></i>
                    <div>
                      <h4>{dict.wiki_content?.intro_quickstart_title}</h4>
                      <p>{dict.wiki_content?.intro_quickstart_desc}</p>
                    </div>
                  </button>
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
                <h2>
                  <i className="fa-solid fa-receipt text-accent"></i> {dict.wiki_content?.recipes_title}
                </h2>
                <p className="wiki-intro-text">{dict.wiki_content?.recipes_desc}</p>

                <div className="recipe-section">
                  <div className="recipe-controls">
                    <div className="recipe-search-box">
                      <input
                        type="text"
                        placeholder={isVi ? "Tìm kiếm công thức vật phẩm..." : "Search item recipes..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="recipe-search-input"
                      />
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </div>

                    <div className="recipe-categories">
                      {categories.map((cat) => {
                        const count = getCategoryCount(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            className={`recipe-category-btn ${activeCategory === cat.id ? "recipe-category-btn--active" : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                          >
                            <i className={cat.icon}></i>
                            <span>{cat.label}</span>
                            <span className="recipe-category-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="recipe-grid">
                    {filteredRecipes.length > 0 ? (
                      filteredRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="recipe-card"
                          onClick={() => setSelectedRecipe(recipe)}
                        >
                          <div className="recipe-card-header">
                            <h4 className="recipe-card-title">
                              {recipe.name[lang] || recipe.name.vi}
                            </h4>
                            <span className={`recipe-station-badge ${getStationBadgeClass(recipe.station)}`}>
                              <i className={getStationIcon(recipe.station)}></i>{" "}
                              {getStationLabel(recipe.station)}
                            </span>
                          </div>

                          <div className="recipe-img-container">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={recipe.image}
                              alt={recipe.name[lang] || recipe.name.vi}
                              className="recipe-img"
                              loading="lazy"
                            />
                            <div className="recipe-img-zoom-overlay">
                              <i className="fa-solid fa-magnifying-glass-plus"></i>
                            </div>
                          </div>

                          <p className="recipe-card-desc">
                            {recipe.desc[lang] || recipe.desc.vi}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="recipe-no-results">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <p style={{ marginTop: "12px" }}>
                          {isVi
                            ? "Không tìm thấy công thức nào phù hợp với từ khóa."
                            : "No recipes found matching your query."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
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

                <div className="wiki-alert" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.3)', color: '#ffd0d0', margin: '20px 0' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444' }}></i>
                  <span>{dict.wiki_content?.villagers_notice}</span>
                </div>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-gear text-accent"></i>{" "}
                  {isVi ? "Cơ chế giao dịch mới" : "New Trading Mechanics"}
                </h3>
                <ul className="wiki-list">
                  <li>
                    <strong>{dict.wiki_content?.villagers_novice_title}</strong>{" "}
                    {dict.wiki_content?.villagers_novice_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.villagers_mending_title}</strong>{" "}
                    {dict.wiki_content?.villagers_mending_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.villagers_rare_loot_title}</strong>{" "}
                    {dict.wiki_content?.villagers_rare_loot_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.villagers_lectern_title}</strong>{" "}
                    {dict.wiki_content?.villagers_lectern_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.villagers_region_title}</strong>{" "}
                    {dict.wiki_content?.villagers_region_desc}
                  </li>
                </ul>

                <h3 className="wiki-subtitle" style={{ marginTop: '28px' }}>
                  <i className="fa-solid fa-list-check text-accent"></i>{" "}
                  {dict.wiki_content?.villagers_list_title}
                </h3>
                <ul className="wiki-list">
                  <li>
                    {dict.wiki_content?.villagers_list_mending}
                  </li>
                  <li>
                    {dict.wiki_content?.villagers_list_tier1}
                  </li>
                  <li>
                    {dict.wiki_content?.villagers_list_tier2}
                  </li>
                  <li>
                    {dict.wiki_content?.villagers_list_tier3}
                  </li>
                </ul>

                <div className="wiki-recipe-box" style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#ffc97a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-images text-accent"></i> {dict.wiki_content?.villagers_images_caption}
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/assets/img/wiki/villager%20trade/trade1.png"
                        alt="Đặt sách gốc"
                        style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                      />
                      <span style={{ fontSize: '12px', color: '#8b8070', fontStyle: 'italic' }}>
                        {isVi ? "Bước 1: Đặt sách gốc cần nhân bản" : "Step 1: Place the source book to duplicate"}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/assets/img/wiki/villager%20trade/trade2.png"
                        alt="Giao dịch bản sao"
                        style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                      />
                      <span style={{ fontSize: '12px', color: '#8b8070', fontStyle: 'italic' }}>
                        {isVi ? "Bước 2: Giao dịch để lấy bản sao" : "Step 2: Complete trade to receive duplicate"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeWikiTab === "fishing" && (
              <div className="wiki-article">
                <h2>
                  <i className="fa-solid fa-fish text-accent"></i> {dict.wiki_content?.fishing_title}
                </h2>
                <p className="wiki-intro-text">{dict.wiki_content?.fishing_desc}</p>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-chart-line text-accent"></i>{" "}
                  {dict.wiki_content?.fishing_progression_title}
                </h3>
                <p className="wiki-intro-text" style={{ whiteSpace: 'pre-line' }}>
                  {dict.wiki_content?.fishing_progression_desc}
                </p>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-map-location-dot text-accent"></i>{" "}
                  {dict.wiki_content?.fishing_biome_title}
                </h3>
                <p className="wiki-intro-text" style={{ whiteSpace: 'pre-line' }}>
                  {dict.wiki_content?.fishing_biome_desc}
                </p>

                <div className="wiki-comparison-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', margin: '24px 0' }}>
                  <div style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '20px', borderRadius: '12px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', margin: '0 0 10px 0', fontSize: '15.5px', fontWeight: 'bold' }}>
                      <i className="fa-solid fa-shrimp"></i> {dict.wiki_content?.fishing_live_catch_title}
                    </h4>
                    <p style={{ color: '#dfd9ce', fontSize: '13.5px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
                      {dict.wiki_content?.fishing_live_catch_desc}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(251, 146, 60, 0.05)', border: '1px solid rgba(251, 146, 60, 0.2)', padding: '20px', borderRadius: '12px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb923c', margin: '0 0 10px 0', fontSize: '15.5px', fontWeight: 'bold' }}>
                      <i className="fa-solid fa-gem"></i> {dict.wiki_content?.fishing_treasure_hunter_title}
                    </h4>
                    <p style={{ color: '#dfd9ce', fontSize: '13.5px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
                      {dict.wiki_content?.fishing_treasure_hunter_desc}
                    </p>
                  </div>
                </div>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-fire text-accent" style={{ color: '#ef4444' }}></i>{" "}
                  {dict.wiki_content?.fishing_fireproof_title}
                </h3>
                <p className="wiki-intro-text" style={{ whiteSpace: 'pre-line' }}>
                  {dict.wiki_content?.fishing_fireproof_desc}
                </p>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-circle-question text-accent"></i>{" "}
                  {dict.wiki_content?.fishing_hidden_title}
                </h3>
                <p className="wiki-intro-text" style={{ whiteSpace: 'pre-line' }}>
                  {dict.wiki_content?.fishing_hidden_desc}
                </p>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-seedling text-accent"></i>{" "}
                  {dict.wiki_content?.fishing_chumming_title}
                </h3>
                <p className="wiki-intro-text" style={{ whiteSpace: 'pre-line' }}>
                  {dict.wiki_content?.fishing_chumming_desc}
                </p>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-wand-magic-sparkles text-accent"></i>{" "}
                  {dict.wiki_content?.fishing_rare_rods_title}
                </h3>
                <p className="wiki-intro-text" style={{ whiteSpace: 'pre-line' }}>
                  {dict.wiki_content?.fishing_rare_rods_desc}
                </p>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-book-open text-accent"></i>{" "}
                  {dict.wiki_content?.fishing_guide_title}
                </h3>
                <p className="wiki-intro-text" style={{ whiteSpace: 'pre-line' }}>
                  {dict.wiki_content?.fishing_guide_desc}
                </p>

                <div className="wiki-recipe-box" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#ffc97a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-hammer text-accent"></i> {dict.wiki_content?.fishing_recipe_caption}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/img/wiki/fishing/recipe.png"
                    alt="Fishing Guide Book Crafting Recipe"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  />
                </div>
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
                    <strong>{dict.wiki_content?.items_item1_title}</strong> {dict.wiki_content?.items_item1_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.items_item2_title}</strong> {dict.wiki_content?.items_item2_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.items_item3_title}</strong> {dict.wiki_content?.items_item3_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.items_item4_title}</strong> {dict.wiki_content?.items_item4_desc}
                  </li>
                </ul>
              </div>
            )}

            {activeWikiTab === "guilds" && (
              <div className="wiki-article">
                <h2>
                  <i className="fa-solid fa-shield-halved text-accent"></i> {dict.wiki_content?.guilds_title}
                </h2>
                <p className="wiki-intro-text">{dict.wiki_content?.guilds_desc}</p>
                <ul className="wiki-list">
                  <li>
                    <strong>{dict.wiki_content?.guilds_item1_title}</strong> {dict.wiki_content?.guilds_item1_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.guilds_item2_title}</strong> {dict.wiki_content?.guilds_item2_desc}
                  </li>
                  <li>
                    <strong>{dict.wiki_content?.guilds_item3_title}</strong> {dict.wiki_content?.guilds_item3_desc}
                  </li>
                </ul>
              </div>
            )}

            {activeWikiTab === "guide" && (
              <div className="wiki-article">
                <h2>
                  <i className="fa-solid fa-book-open text-accent"></i> {dict.wiki_content?.guide_title}
                </h2>

                <h3 className="wiki-subtitle">
                  <i className="fa-solid fa-earth-americas text-accent-green"></i> {dict.wiki_content?.guide_world_title}
                </h3>
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

                <h3 className="wiki-subtitle" style={{ marginTop: "24px" }}>
                  <i className="fa-solid fa-circle-check text-accent-green"></i> {dict.wiki_content?.guide_qol_title}
                </h3>
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

            <div style={{ marginTop: "45px", textAlign: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px" }}>
              <a href={`/${lang}`} style={{ color: "#ff952e", textDecoration: "none", fontSize: "1rem", fontWeight: "600" }}>
                {dict.signup.back}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Wiki Mobile floating action button and modal drawer */}
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

      {/* Recipe Zoom Modal */}
      {selectedRecipe && (
        <div className="recipe-modal" onClick={() => setSelectedRecipe(null)}>
          <div className="recipe-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-modal-header">
              <div className="recipe-modal-title">
                <span className={`recipe-station-badge ${getStationBadgeClass(selectedRecipe.station)}`}>
                  <i className={getStationIcon(selectedRecipe.station)}></i>{" "}
                  {getStationLabel(selectedRecipe.station)}
                </span>
                <h3>{selectedRecipe.name[lang] || selectedRecipe.name.vi}</h3>
              </div>
              <button
                type="button"
                className="recipe-modal-close"
                onClick={() => setSelectedRecipe(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="recipe-modal-body">
              <div className="recipe-modal-img-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedRecipe.image}
                  alt={selectedRecipe.name[lang] || selectedRecipe.name.vi}
                  className="recipe-modal-img"
                />
              </div>
              <p className="recipe-modal-footer-desc">
                {selectedRecipe.desc[lang] || selectedRecipe.desc.vi}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RECIPES_DATA = [
  // Utilities
  {
    id: "crafting_table",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/crafting_table.png",
    name: { vi: "Bàn Chế Tạo", en: "Crafting Table" },
    desc: {
      vi: "Bàn chế tạo cơ bản để tạo ra hầu hết mọi công cụ và vật phẩm trong Minecraft.",
      en: "The essential crafting table required to build almost all tools and items in Minecraft."
    }
  },
  {
    id: "furnace",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/furnace.png",
    name: { vi: "Lò Nung", en: "Furnace" },
    desc: {
      vi: "Lò nung dùng để nung quặng thô và nấu các thực phẩm cơ bản.",
      en: "Standard furnace used to smelt raw ores and cook basic food items."
    }
  },
  {
    id: "blast_furnace",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/blast_furnace.png",
    name: { vi: "Lò Luyện Kim", en: "Blast Furnace" },
    desc: {
      vi: "Nung quặng và kim loại nhanh gấp đôi so với lò nung thường.",
      en: "Smelts ores and metals twice as fast as a standard furnace."
    }
  },
  {
    id: "anvil",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/anvil.png",
    name: { vi: "Đe Sắt", en: "Iron Anvil" },
    desc: {
      vi: "Sử dụng để sửa chữa trang bị, đặt tên vật phẩm và kết hợp sách phù phép.",
      en: "Used to repair equipment, rename items, and combine enchanted books."
    }
  },
  {
    id: "enchanting_table",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/enchanting_table.png",
    name: { vi: "Bàn Phù Phép", en: "Enchanting Table" },
    desc: {
      vi: "Truyền sức mạnh ma thuật vào các công cụ, vũ khí và giáp của bạn.",
      en: "Infuses tools, weapons, and armor pieces with magical enchantments."
    }
  },
  {
    id: "ender_chest",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/ender_chest.png",
    name: { vi: "Rương Ender", en: "Ender Chest" },
    desc: {
      vi: "Rương chứa đồ kết nối không gian, bảo toàn vật phẩm ở mọi nơi.",
      en: "Interdimensional chest that shares the same inventory space across the world."
    }
  },
  {
    id: "respawn_anchor",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/respawn_anchor.png",
    name: { vi: "Neo Hồi Sinh", en: "Respawn Anchor" },
    desc: {
      vi: "Đặt điểm hồi sinh tại Địa Ngục (Nether). Cần nạp Đá Phát Sáng để hoạt động.",
      en: "Sets your respawn point in the Nether. Requires Glowstone blocks to charge."
    }
  },
  {
    id: "end_crystal",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/end_crystal.png",
    name: { vi: "Tinh Thể End", en: "End Crystal" },
    desc: {
      vi: "Vật phẩm ma thuật dùng để hồi sinh Rồng End hoặc tạo các vụ nổ cực mạnh.",
      en: "Magical crystal used to respawn the Ender Dragon or cause massive explosions."
    }
  },
  {
    id: "ender_eye",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/ender_eye.png",
    name: { vi: "Mắt Ender", en: "Eye of Ender" },
    desc: {
      vi: "Dùng để định vị và kích hoạt Cổng Stronghold dẫn tới thế giới End.",
      en: "Used to locate and activate Stronghold Portals leading to the End dimension."
    }
  },
  {
    id: "bucket",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/bucket.png",
    name: { vi: "Xô Sắt", en: "Iron Bucket" },
    desc: {
      vi: "Công cụ chứa nước, dung nham hoặc sữa, cực kỳ quan trọng khi sinh tồn.",
      en: "Essential tool for carrying water, lava, or milk during survival adventure."
    }
  },
  // Combat
  {
    id: "mace",
    category: "combat",
    station: "crafting",
    image: "/assets/img/recipe/mace.png",
    name: { vi: "Chùy (Mace)", en: "Mace" },
    desc: {
      vi: "Vũ khí cận chiến đặc biệt gây sát thương cực lớn dựa trên độ cao khi rơi xuống.",
      en: "Unique melee weapon that deals devastating damage based on fall height."
    }
  },
  {
    id: "shield",
    category: "combat",
    station: "crafting",
    image: "/assets/img/recipe/shield.png",
    name: { vi: "Khiên", en: "Shield" },
    desc: {
      vi: "Lá chắn bảo vệ chống lại các đòn tấn công từ quái vật và người chơi khác.",
      en: "Defensive shield to block incoming attacks from monsters and other players."
    }
  },
  {
    id: "haohansmp_super_stick",
    category: "combat",
    station: "crafting",
    image: "/assets/img/recipe/haohansmp_super_stick.png",
    name: { vi: "Gậy Thần Hảo Hán", en: "HaoHanSMP Super Stick" },
    desc: {
      vi: "Vũ khí huyền thoại của server HaoHanSMP với khả năng đẩy lùi cực mạnh.",
      en: "Legendary staff of HaoHanSMP with extreme knockback and special properties."
    }
  },
  // Pickaxes
  {
    id: "wooden_pickaxe",
    category: "pickaxes",
    station: "crafting",
    image: "/assets/img/recipe/pickaxe/wooden_pickaxe.png",
    name: { vi: "Cúp Gỗ", en: "Wooden Pickaxe" },
    desc: {
      vi: "Công cụ khai thác đá thô sơ đầu tiên của mọi người chơi.",
      en: "The very first mining tool crafted to gather stone resources."
    }
  },
  {
    id: "stone_pickaxe",
    category: "pickaxes",
    station: "crafting",
    image: "/assets/img/recipe/pickaxe/stone_pickaxe.png",
    name: { vi: "Cúp Đá", en: "Stone Pickaxe" },
    desc: {
      vi: "Cúp đá dùng để khai thác sắt, than và các khối đá cứng hơn.",
      en: "Stone pickaxe used to harvest iron ores, coal, and harder blocks."
    }
  },
  {
    id: "diamond_pickaxe_smithing",
    category: "pickaxes",
    station: "smithing",
    image: "/assets/img/recipe/pickaxe/diamond_pickaxe_smithing.png",
    name: { vi: "Cúp Kim Cương (Rèn)", en: "Diamond Pickaxe (Smithing)" },
    desc: {
      vi: "Công thức rèn cúp kim cương từ cúp sắt kết hợp phôi nâng cấp trên bàn rèn.",
      en: "Forging a diamond pickaxe from an iron pickaxe and upgrade templates."
    }
  },
  // Spears
  {
    id: "wooden_spear",
    category: "spears",
    station: "crafting",
    image: "/assets/img/recipe/spear/wooden_spear.png",
    name: { vi: "Giáo Gỗ", en: "Wooden Spear" },
    desc: {
      vi: "Cây giáo thô sơ làm từ gỗ, tầm đánh xa hơn kiếm thường.",
      en: "Rudimentary spear crafted from wood, offers extended attack range."
    }
  },
  {
    id: "stone_spear",
    category: "spears",
    station: "crafting",
    image: "/assets/img/recipe/spear/stone_spear.png",
    name: { vi: "Giáo Đá", en: "Stone Spear" },
    desc: {
      vi: "Giáo đá cải tiến, bền bỉ và gây sát thương cao hơn giáo gỗ.",
      en: "Improved stone spear, offering better durability and damage than wooden tier."
    }
  },
  {
    id: "iron_spear",
    category: "spears",
    station: "crafting",
    image: "/assets/img/recipe/spear/iron_spear.png",
    name: { vi: "Giáo Sắt", en: "Iron Spear" },
    desc: {
      vi: "Giáo làm từ sắt rèn, cân bằng tốt giữa tốc độ và lực sát thương.",
      en: "Iron-forged spear, well-balanced between attack speed and damage."
    }
  },
  {
    id: "copper_spear",
    category: "spears",
    station: "crafting",
    image: "/assets/img/recipe/spear/copper_spear.png",
    name: { vi: "Giáo Đồng", en: "Copper Spear" },
    desc: {
      vi: "Cây giáo bằng đồng rèn, tận dụng tốt nguồn tài nguyên đồng dư thừa.",
      en: "Copper-based spear, making excellent use of abundant copper resources."
    }
  },
  {
    id: "golden_spear",
    category: "spears",
    station: "crafting",
    image: "/assets/img/recipe/spear/golden_spear.png",
    name: { vi: "Giáo Vàng", en: "Golden Spear" },
    desc: {
      vi: "Cây giáo bằng vàng rực rỡ, độ bền thấp nhưng có khả năng tương tác ma thuật cao.",
      en: "Shiny golden spear, low durability but possesses high enchantability."
    }
  },
  {
    id: "diamond_spear",
    category: "spears",
    station: "crafting",
    image: "/assets/img/recipe/spear/diamond_spear.png",
    name: { vi: "Giáo Kim Cương", en: "Diamond Spear" },
    desc: {
      vi: "Vũ khí cận chiến sắc bén và bền bỉ vượt trội làm từ kim cương quý giá.",
      en: "Premium, razor-sharp melee weapon crafted using high-grade diamonds."
    }
  },
  {
    id: "netherite_spear_smithing",
    category: "spears",
    station: "smithing",
    image: "/assets/img/recipe/spear/netherite_spear_smithing.png",
    name: { vi: "Giáo Netherite (Rèn)", en: "Netherite Spear (Smithing)" },
    desc: {
      vi: "Rèn từ giáo kim cương trên Bàn Rèn, vũ khí cận chiến mạnh mẽ nhất thế giới.",
      en: "Forged from a diamond spear using the Smithing Table. The ultimate melee weapon."
    }
  },
  // Boats
  {
    id: "oak_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/oak_boat.png",
    name: { vi: "Thuyền Gỗ Sồi", en: "Oak Boat" },
    desc: {
      vi: "Phương tiện di chuyển trên nước chế tạo từ gỗ sồi phổ biến.",
      en: "Standard water vehicle crafted from common oak wood planks."
    }
  },
  {
    id: "spruce_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/spruce_boat.png",
    name: { vi: "Thuyền Gỗ Vân Sam", en: "Spruce Boat" },
    desc: {
      vi: "Thuyền chế tạo từ gỗ vân sam sẫm màu vùng taiga.",
      en: "Darker boat crafted using spruce wood found in cold taiga biomes."
    }
  },
  {
    id: "birch_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/birch_boat.png",
    name: { vi: "Thuyền Gỗ Bạch Dương", en: "Birch Boat" },
    desc: {
      vi: "Thuyền gỗ bạch dương màu sáng thanh lịch.",
      en: "Elegant light-colored boat crafted from birch wood planks."
    }
  },
  {
    id: "jungle_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/jungle_boat.png",
    name: { vi: "Thuyền Gỗ Rừng", en: "Jungle Boat" },
    desc: {
      vi: "Thuyền làm từ gỗ rừng rậm nhiệt đới ấm áp.",
      en: "Warm-colored boat made from jungle wood planks."
    }
  },
  {
    id: "acacia_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/acacia_boat.png",
    name: { vi: "Thuyền Gỗ Xiêm", en: "Acacia Boat" },
    desc: {
      vi: "Thuyền màu cam đặc trưng chế tạo từ gỗ xiêm thảo nguyên.",
      en: "Unique orange boat crafted from savanna acacia wood planks."
    }
  },
  {
    id: "dark_oak_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/dark_oak_boat.png",
    name: { vi: "Thuyền Gỗ Sồi Sẫm", en: "Dark Oak Boat" },
    desc: {
      vi: "Thuyền gỗ sồi sẫm màu chắc chắn từ những cánh rừng rậm.",
      en: "Sturdy dark oak boat crafted from dense forest wood planks."
    }
  },
  {
    id: "mangrove_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/mangrove_boat.png",
    name: { vi: "Thuyền Gỗ Đước", en: "Mangrove Boat" },
    desc: {
      vi: "Thuyền gỗ đước màu đỏ thẫm từ các khu đầm lầy đước bí ẩn.",
      en: "Deep red boat crafted from mangrove wood found in swamp biomes."
    }
  },
  {
    id: "bamboo_raft",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/bamboo_raft.png",
    name: { vi: "Bè Tre", en: "Bamboo Raft" },
    desc: {
      vi: "Chiếc bè trôi nổi làm từ các khối tre ép độc đáo.",
      en: "A lightweight floating raft crafted from compressed bamboo blocks."
    }
  },
  {
    id: "cherry_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/cherry_boat.png",
    name: { vi: "Thuyền Gỗ Anh Đào", en: "Cherry Boat" },
    desc: {
      vi: "Thuyền gỗ anh đào màu hồng mộng mơ quyến rũ.",
      en: "Charming pink-colored boat crafted from cherry wood planks."
    }
  },
  {
    id: "pale_oak_boat",
    category: "boats",
    station: "crafting",
    image: "/assets/img/recipe/boat/pale_oak_boat.png",
    name: { vi: "Thuyền Gỗ Sồi Nhạt", en: "Pale Oak Boat" },
    desc: {
      vi: "Thuyền làm từ gỗ sồi nhạt huyền bí thu được ở các khu rừng nhạt.",
      en: "Mysterious boat crafted from pale oak wood found in pale gardens."
    }
  }
];

