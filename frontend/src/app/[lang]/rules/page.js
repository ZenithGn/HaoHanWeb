import { getDictionary } from "../../../dictionaries/get-dictionary";

export default async function RulesPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const rules = dict.rules;
  const isVi = lang === "vi";

  const cleanNumber = (text = "") => text.replace(/^\d+\.\d+\.\s*/, "");

  const renderLines = (items = []) => (
    <ul>
      {items.map((item, idx) => (
        <li key={idx}>{cleanNumber(item)}</li>
      ))}
    </ul>
  );

  return (
    <section className="rules-page rules-page--standalone">
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
          <span className="rules-line-section__num">1</span>
          <div className="rules-line-section__content">
            <h2><i className="fa-solid fa-clover"></i> {rules.smp.title.replace("I. ", "")}</h2>
            {rules.smp.rules_list.map((group, idx) => (
              <div className="rules-rule-group" key={idx}>
                <h3>{group.num}</h3>
                {renderLines(group.sub_rules)}
              </div>
            ))}
          </div>
        </section>

        <section className="rules-line-section">
          <span className="rules-line-section__num">2</span>
          <div className="rules-line-section__content">
            <h2><i className="fa-solid fa-clover"></i> {rules.discord.title.replace("II. ", "")}</h2>
            {renderLines(rules.discord.rules_list)}
          </div>
        </section>

        <section className="rules-line-section">
          <span className="rules-line-section__num">3</span>
          <div className="rules-line-section__content">
            <h2><i className="fa-solid fa-clover"></i> {rules.penalty.title.replace("III. ", "")}</h2>
            <div className="rules-rule-group">
              <h3>{rules.penalty.smp_title}</h3>
              {renderLines(rules.penalty.smp_rules)}
            </div>
            <div className="rules-rule-group">
              <h3>{rules.penalty.discord_title}</h3>
              {renderLines(rules.penalty.discord_rules)}
            </div>
          </div>
        </section>

        <section className="rules-line-section">
          <span className="rules-line-section__num">4</span>
          <div className="rules-line-section__content">
            <h2><i className="fa-solid fa-clover"></i> {rules.footer_msg.title.replace("IV. ", "")}</h2>
            {renderLines(rules.footer_msg.msgs)}
            <a className="rules-back-link" href={`/${lang}`}>
              <i className="fa-solid fa-arrow-left"></i>
              {dict.signup.back}
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
