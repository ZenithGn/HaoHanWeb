"use client";

import { useState, useRef, useEffect } from "react";
import MinecraftRecipe, { getItemImgPath } from "../../components/MinecraftRecipe";



export default function WikiClient({ dict, lang }) {
  const [activeWikiTab, setActiveWikiTab] = useState("intro");
  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const isVi = lang === "vi";

  const categories = [
    { id: "all", icon: "fa-solid fa-list-ul", label: isVi ? "Tất cả" : "All" },
    { id: "utilities", icon: "fa-solid fa-screwdriver-wrench", label: isVi ? "Tiện ích & Khác" : "Utilities & Others" },
    { id: "weapon", icon: "fa-solid fa-shield-halved", label: isVi ? "Vũ khí" : "Weapons" },
    { id: "tool", icon: "fa-solid fa-hammer", label: isVi ? "Công cụ" : "Tools" },
    { id: "boats", icon: "fa-solid fa-ship", label: isVi ? "Thuyền bè" : "Boats" }
  ];

  const getStationBadgeClass = (station) => {
    switch (station) {
      case "smithing": return "recipe-station-badge--smithing";
      case "brewing": return "recipe-station-badge--brewing";
      case "smelting":
      case "blasting": return "recipe-station-badge--smelting";
      default: return "recipe-station-badge--crafting";
    }
  };

  const getStationLabel = (station) => {
    switch (station) {
      case "smithing": return isVi ? "Bàn Rèn" : "Smithing Table";
      case "brewing": return isVi ? "Bệ Pha Thuốc" : "Brewing Stand";
      case "smelting": return isVi ? "Lò Nung" : "Furnace";
      case "blasting": return isVi ? "Lò Luyện Kim" : "Blast Furnace";
      default: return isVi ? "Bàn Chế Tạo" : "Crafting Table";
    }
  };

  const getStationIcon = (station) => {
    switch (station) {
      case "smithing": return "fa-solid fa-screwdriver-wrench";
      case "brewing": return "fa-solid fa-flask";
      case "smelting":
      case "blasting": return "fa-solid fa-fire";
      default: return "fa-solid fa-hammer";
    }
  };

  const filteredRecipes = RECIPES_DATA.filter((recipe) => {
    // Show one cycling boat recipe card, including Bamboo Raft.
    if (recipe.category === "boats" && recipe.id !== "oak_boat") {
      return false;
    }
    const name = (recipe.name[lang] || recipe.name.vi).toLowerCase();
    const desc = (recipe.desc[lang] || recipe.desc.vi).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesCategory = activeCategory === "all" || recipe.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (category) => {
    return RECIPES_DATA.filter((recipe) => {
      if (recipe.category === "boats" && recipe.id !== "oak_boat") {
        return false;
      }
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
    <div style={{ backgroundColor: "#101115", minHeight: "100vh", padding: "64px 20px 60px" }}>
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
                      filteredRecipes.map((recipe) => {
                        const displayName = recipe.id === "oak_boat"
                          ? (isVi ? "Thuyền / Bè" : "Boat / Raft")
                          : (recipe.name[lang] || recipe.name.vi);
                        const outputId = typeof recipe.recipe?.output === "string" ? recipe.recipe.output : recipe.recipe?.output?.id;
                        const outputImg = getItemImgPath(outputId);
                        return (
                          <div
                            key={recipe.id}
                            className="recipe-card"
                          >
                            <div className="recipe-card-inner">
                              <div className="recipe-card-header">
                                <div className="recipe-card-title-wrap">
                                  {outputImg && (
                                    <img
                                      src={outputImg}
                                      alt={displayName}
                                      className="recipe-card-title-icon"
                                    />
                                  )}
                                  <h4 className="recipe-card-title">
                                    {displayName}
                                  </h4>
                                </div>
                                <span className={`recipe-station-badge ${getStationBadgeClass(recipe.station)}`}>
                                  <i className={getStationIcon(recipe.station)}></i>{" "}
                                  {getStationLabel(recipe.station)}
                                </span>
                              </div>

                              <div className="recipe-img-container">
                                <MinecraftRecipe recipe={recipe.recipe} isVi={isVi} size="medium" />
                              </div>
                            </div>
                          </div>
                        );
                      })
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "bamboo", "oak_log", null,
        "oak_log", "bamboo", null,
        null, null, null
      ],
      output: "crafting_table"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "cobblestone", "cobblestone", "cobblestone",
        "gravel", null, "gravel",
        "cobblestone", "cobblestone", "cobblestone"
      ],
      output: "furnace"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "iron_ingot", "block_of_iron", "iron_ingot",
        "bricks", "furnace", "bricks",
        "stone", "stone", "stone"
      ],
      output: "blast_furnace"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "block_of_iron", "block_of_iron", "block_of_iron",
        null, "obsidian", null,
        "iron_ingot", "iron_ingot", "iron_ingot"
      ],
      output: "anvil"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "diamond", "book", "diamond",
        "amethyst_shard", "obsidian", "amethyst_shard",
        "obsidian", "obsidian", "obsidian"
      ],
      output: "enchanting_table"
    },
    stats: { rarity: "Common", renewable: "No", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "obsidian", "obsidian", "obsidian",
        "end_stone", "eye_of_ender", "end_stone",
        "obsidian", "obsidian", "obsidian"
      ],
      output: "ender_chest"
    },
    stats: { rarity: "Rare", renewable: "No", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "glowstone", "crying_obsidian", "glowstone",
        "crying_obsidian", "totem_of_undying", "crying_obsidian",
        "glowstone", "crying_obsidian", "glowstone"
      ],
      output: "respawn_anchor"
    },
    stats: { rarity: "Rare", renewable: "No", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "glass", "obsidian", "glass",
        "obsidian", "nether_star", "obsidian",
        "glass", "obsidian", "glass"
      ],
      output: "end_crystal"
    },
    stats: { rarity: "Rare", renewable: "Yes", stackable: "Yes (64)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "emerald", "blaze_powder", null,
        null, "ender_pearl", null,
        null, null, null
      ],
      output: "eye_of_ender"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
  },
  // Combat
  {
    id: "mace",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/mace.png",
    name: { vi: "Chùy (Mace)", en: "Mace" },
    desc: {
      vi: "Vũ khí cận chiến đặc biệt gây sát thương cực lớn dựa trên độ cao khi rơi xuống.",
      en: "Unique melee weapon that deals devastating damage based on fall height."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, "heavy_core", "block_of_netherite",
        null, "breeze_rod", "heavy_core",
        "breeze_rod", null, null
      ],
      output: "mace_item"
    },
    stats: { rarity: "Rare", renewable: "No", stackable: "No", durability: 250 }
  },
  {
    id: "shield",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/shield.png",
    name: { vi: "Khiên", en: "Shield" },
    desc: {
      vi: "Lá chắn bảo vệ chống lại các đòn tấn công từ quái vật và người chơi khác.",
      en: "Defensive shield to block incoming attacks from monsters and other players."
    },
    recipe: {
      type: "crafting",
      grid: [
        "leather", "iron_ingot", "leather",
        "crimson", "crimson", "crimson",
        null, "crimson", null
      ],
      output: "shield"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "No", durability: 336 }
  },
  // Pickaxes
  {
    id: "wooden_pickaxe",
    category: "tool",
    station: "crafting",
    image: "/assets/img/recipe/pickaxe/wooden_pickaxe.png",
    name: { vi: "Cúp Gỗ", en: "Wooden Pickaxe" },
    desc: {
      vi: "Công cụ khai thác đá thô sơ đầu tiên của mọi người chơi.",
      en: "The very first mining tool crafted to gather stone resources."
    },
    recipe: {
      type: "crafting",
      grid: [
        "oak_slab", "oak", "oak_slab",
        null, "stick", null,
        null, "stick", null
      ],
      output: "wooden_pickaxe"
    },
    stats: { rarity: "Common", renewable: "No", stackable: "No", durability: 59 }
  },
  {
    id: "stone_pickaxe",
    category: "tool",
    station: "crafting",
    image: "/assets/img/recipe/pickaxe/stone_pickaxe.png",
    name: { vi: "Cúp Đá", en: "Stone Pickaxe" },
    desc: {
      vi: "Cúp đá dùng để khai thác sắt, than và các khối đá cứng hơn.",
      en: "Stone pickaxe used to harvest iron ores, coal, and harder blocks."
    },
    recipe: {
      type: "crafting",
      grid: [
        "stone_variant", "stone_variant", "stone_variant",
        null, "flint", null,
        null, "stick", null
      ],
      output: "stone_pickaxe"
    },
    stats: { rarity: "Common", renewable: "No", stackable: "No", durability: 131 }
  },
  {
    id: "diamond_pickaxe_smithing",
    category: "tool",
    station: "smithing",
    image: "/assets/img/recipe/pickaxe/diamond_pickaxe_smithing.png",
    name: { vi: "Cúp Kim Cương (Rèn)", en: "Diamond Pickaxe (Smithing)" },
    desc: {
      vi: "Công thức rèn cúp kim cương từ cúp sắt kết hợp phôi nâng cấp trên bàn rèn.",
      en: "Forging a diamond pickaxe from an iron pickaxe and upgrade templates."
    },
    recipe: {
      type: "smithing",
      template: "echo_shard",
      base: "iron_pickaxe",
      addition: "diamond",
      output: "diamond_pickaxe"
    },
    stats: { rarity: "Rare", renewable: "No", stackable: "No", durability: 1561 }
  },
  // Spears
  {
    id: "wooden_spear",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/spear/wooden_spear.png",
    name: { vi: "Giáo Gỗ", en: "Wooden Spear" },
    desc: {
      vi: "Cây giáo thô sơ làm từ gỗ, tầm đánh xa hơn kiếm thường.",
      en: "Rudimentary spear crafted from wood, offers extended attack range."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, "oak", "arrow",
        null, "stick", "oak",
        "redstone", null, null
      ],
      output: "wooden_spear"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "No", durability: 59 }
  },
  {
    id: "stone_spear",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/spear/stone_spear.png",
    name: { vi: "Giáo Đá", en: "Stone Spear" },
    desc: {
      vi: "Giáo đá cải tiến, bền bỉ và gây sát thương cao hơn giáo gỗ.",
      en: "Improved stone spear, offering better durability and damage than wooden tier."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, "stone_variant", "spectral_arrow",
        null, "stick", "stone_variant",
        "redstone", null, null
      ],
      output: "stone_spear"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "No", durability: 131 }
  },
  {
    id: "iron_spear",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/spear/iron_spear.png",
    name: { vi: "Giáo Sắt", en: "Iron Spear" },
    desc: {
      vi: "Giáo làm từ sắt rèn, cân bằng tốt giữa tốc độ và lực sát thương.",
      en: "Iron-forged spear, well-balanced between attack speed and damage."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, "iron_ingot", "arrow",
        null, "stick", "iron_ingot",
        "redstone", null, null
      ],
      output: "iron_spear"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "No", durability: 250 }
  },
  {
    id: "copper_spear",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/spear/copper_spear.png",
    name: { vi: "Giáo Đồng", en: "Copper Spear" },
    desc: {
      vi: "Cây giáo bằng đồng rèn, tận dụng tốt nguồn tài nguyên đồng dư thừa.",
      en: "Copper-based spear, making excellent use of abundant copper resources."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, "copper_ingot", "tipped_arrow",
        null, "stick", "copper_ingot",
        "redstone", null, null
      ],
      output: "copper_spear"
    },
    stats: { rarity: "Uncommon", renewable: "Yes", stackable: "No", durability: 200 }
  },
  {
    id: "golden_spear",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/spear/golden_spear.png",
    name: { vi: "Giáo Vàng", en: "Golden Spear" },
    desc: {
      vi: "Cây giáo bằng vàng rực rỡ, độ bền thấp nhưng có khả năng tương tác ma thuật cao.",
      en: "Shiny golden spear, low durability but possesses high enchantability."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, "gold_ingot", "tipped_arrow",
        null, "stick", "gold_ingot",
        "redstone", null, null
      ],
      output: "golden_spear"
    },
    stats: { rarity: "Rare", renewable: "Yes", stackable: "No", durability: 32 }
  },
  {
    id: "diamond_spear",
    category: "weapon",
    station: "crafting",
    image: "/assets/img/recipe/spear/diamond_spear.png",
    name: { vi: "Giáo Kim Cương", en: "Diamond Spear" },
    desc: {
      vi: "Vũ khí cận chiến sắc bén và bền bỉ vượt trội làm từ kim cương quý giá.",
      en: "Premium, razor-sharp melee weapon crafted using high-grade diamonds."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, "diamond", "spectral_arrow",
        null, "stick", "diamond",
        "redstone", null, null
      ],
      output: "diamond_spear"
    },
    stats: { rarity: "Rare", renewable: "No", stackable: "No", durability: 1561 }
  },
  {
    id: "netherite_spear_smithing",
    category: "weapon",
    station: "smithing",
    image: "/assets/img/recipe/spear/netherite_spear_smithing.png",
    name: { vi: "Giáo Netherite (Rèn)", en: "Netherite Spear (Smithing)" },
    desc: {
      vi: "Rèn từ giáo kim cương trên Bàn Rèn, vũ khí cận chiến mạnh mẽ nhất thế giới.",
      en: "Forged from a diamond spear using the Smithing Table. The ultimate melee weapon."
    },
    recipe: {
      type: "smithing",
      template: "echo_shard",
      base: "diamond_spear",
      addition: "netherite_ingot",
      output: "netherite_spear"
    },
    stats: { rarity: "Epic", renewable: "No", stackable: "No", durability: 2031 }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "oak", "wooden_shovel", "oak",
        "oak", "oak", "oak",
        null, "wooden_shovel", null
      ],
      output: "oak_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "spruce", "wooden_shovel", "spruce",
        "spruce", "spruce", "spruce",
        null, "wooden_shovel", null
      ],
      output: "spruce_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "birch", "wooden_shovel", "birch",
        "birch", "birch", "birch",
        null, "wooden_shovel", null
      ],
      output: "birch_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "jungle", "wooden_shovel", "jungle",
        "jungle", "jungle", "jungle",
        null, "wooden_shovel", null
      ],
      output: "jungle_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "acacia", "wooden_shovel", "acacia",
        "acacia", "acacia", "acacia",
        null, "wooden_shovel", null
      ],
      output: "acacia_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "dark_oak", "wooden_shovel", "dark_oak",
        "dark_oak", "dark_oak", "dark_oak",
        null, "wooden_shovel", null
      ],
      output: "dark_oak_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "mangrove", "wooden_shovel", "mangrove",
        "mangrove", "mangrove", "mangrove",
        null, "wooden_shovel", null
      ],
      output: "mangrove_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "bamboo", "wooden_shovel", "bamboo",
        "bamboo", "bamboo", "bamboo",
        null, "wooden_shovel", null
      ],
      output: "bamboo_raft"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "cherry", "wooden_shovel", "cherry",
        "cherry", "cherry", "cherry",
        null, "wooden_shovel", null
      ],
      output: "cherry_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
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
    },
    recipe: {
      type: "crafting",
      grid: [
        "pale_oak", "wooden_shovel", "pale_oak",
        "pale_oak", "pale_oak", "pale_oak",
        null, "wooden_shovel", null
      ],
      output: "pale_oak_boat"
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (1)" }
  },
  {
    id: "bowl",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/bowl.png",
    name: { vi: "Bát Gỗ", en: "Wooden Bowl" },
    desc: {
      vi: "Dùng để đựng các loại súp và hầm ngon lành.",
      en: "Used to hold delicious stews and soups."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, null, null,
        "oak_slab", null, "oak_slab",
        "oak_slab", "oak", "oak_slab"
      ],
      output: "bowl",
      outputCount: 4
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
  },
  {
    id: "flower_pot",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/flower_pot.png",
    name: { vi: "Chậu Hoa", en: "Flower Pot" },
    desc: {
      vi: "Khối trang trí dùng để cắm các loại hoa, nấm hoặc cây cảnh.",
      en: "A decorative block used to display flowers, mushrooms, or saplings."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, null, null,
        "brick", "iron_ingot", "brick",
        "brick", "bowl", "brick"
      ],
      output: "flower_pot",
      outputCount: 1
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
  },
  {
    id: "glass_bottle",
    category: "utilities",
    station: "crafting",
    image: "/assets/img/recipe/glass_bottle.png",
    name: { vi: "Chai Thủy Tinh", en: "Glass Bottle" },
    desc: {
      vi: "Dùng để đựng nước, mật ong hoặc pha chế thuốc.",
      en: "Used to hold water, honey, or craft potions."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, null, null,
        "glass", "oak_button", "glass",
        null, "glass", null
      ],
      output: "glass_bottle",
      outputCount: 3
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
  },
  {
    id: "bucket_from_blasting",
    category: "utilities",
    station: "blasting",
    image: "/assets/img/recipe/bucket_from_blasting.png",
    name: { vi: "Xô Sắt (Luyện kim)", en: "Iron Bucket (Blasting)" },
    desc: {
      vi: "Đúc xô sắt trực tiếp bằng cách luyện sắt nóng chảy trong lò luyện kim.",
      en: "Cast an iron bucket directly using a blast furnace."
    },
    recipe: {
      type: "blasting",
      input: "flower_pot",
      inputCount: 1,
      output: "bucket",
      outputCount: 1
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (16)" }
  },
  {
    id: "button",
    category: "utilities",
    station: "crafting",
    image: "",
    name: { vi: "Nút", en: "Button" },
    desc: {
      vi: "Nút bấm dùng để kích hoạt tín hiệu đá đỏ trong thời gian ngắn.",
      en: "A button used to activate redstone signals briefly."
    },
    recipe: {
      type: "crafting",
      grid: [
        null, null, null,
        null, "oak", null,
        null, "redstone", null
      ],
      output: "oak_button",
      outputCount: 1
    },
    stats: { rarity: "Common", renewable: "Yes", stackable: "Yes (64)" }
  }
];

