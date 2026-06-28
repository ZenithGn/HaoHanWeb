"use client";

import { useState, useRef, useEffect } from "react";

export default function RulesClient({ dict, lang }) {
  const [rulesSubTab, setRulesSubTab] = useState("smp");
  const [rulesMenuOpen, setRulesMenuOpen] = useState(false);
  const isVi = lang === "vi";

  const rulesNavRef = useRef(null);
  const rulesNavIndicatorRef = useRef(null);

  useEffect(() => {
    const updateIndicator = () => {
      const nav = rulesNavRef.current;
      const indicator = rulesNavIndicatorRef.current;
      if (!nav || !indicator) return;

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
  }, [rulesSubTab]);

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

  const cleanNumber = (text = "") => text.replace(/^\d+\.\d+\.\s*/, "");

  const renderLines = (items = []) => (
    <ul className="rules-list">
      {items.map((item, idx) => (
        <li key={idx}>{formatText(cleanNumber(item))}</li>
      ))}
    </ul>
  );

  return (
    <div style={{ backgroundColor: "#101115", minHeight: "100vh", padding: "120px 20px 60px" }}>
      <div className="wrap rules-page-wrap">
        <div className="rules-layout">
          <aside className="rules-sidebar">
            <header className="rules-card__header">
              <span className="rules-card__eyebrow">
                <i className="fa-solid fa-clover"></i>
                {isVi ? "Nội quy server" : "Server rules"}
              </span>
              <h2>HAOHAN SMP</h2>
              <p>
                {isVi
                  ? "Vui lòng đọc kỹ và tuân thủ các quy định để có trải nghiệm tốt nhất."
                  : "Please read and follow the rules below for the best experience."}
              </p>
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
                    {renderLines(group.sub_rules)}
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
                {renderLines(dict.rules.discord.rules_list)}
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
                  {renderLines(dict.rules.penalty.smp_rules)}
                </div>
                <div className="rules-rule-group">
                  <h3>{dict.rules.penalty.discord_title}</h3>
                  {renderLines(dict.rules.penalty.discord_rules)}
                </div>
              </div>
            )}

            {rulesSubTab === "footer" && (
              <div className="rules-article">
                <h2>
                  <i className="fa-solid fa-info-circle"></i>
                  {dict.rules.footer_msg.title.replace("IV. ", "")}
                </h2>
                {renderLines(dict.rules.footer_msg.msgs)}

                <div className="rules-ticket" style={{ marginTop: "30px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/img/logo.png" alt="" />
                  <p>{isVi ? "Bạn có thể liên hệ admin bằng cách tạo một ticket để được giải quyết." : "You can contact admin by creating a support ticket."}</p>
                </div>

                <a className="rules-back-link" href={`/${lang}`}>
                  <i className="fa-solid fa-arrow-left"></i>
                  {dict.signup.back}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Mobile floating action button and modal drawer */}
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
    </div>
  );
}
