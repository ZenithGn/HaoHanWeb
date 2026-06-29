"use client";

import { useState, useRef, useEffect } from "react";

export default function WikiClient({ dict, lang }) {
  const [activeWikiTab, setActiveWikiTab] = useState("intro");
  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const isVi = lang === "vi";

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
    </div>
  );
}
