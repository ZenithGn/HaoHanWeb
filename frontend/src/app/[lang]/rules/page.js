import { getDictionary } from "../../../dictionaries/get-dictionary";

export default async function RulesPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const rules = dict.rules;

  const formatText = (text) => {
    return text.split('\n').map((line, idx) => {
      if (line.trim().startsWith('•')) {
        return (
          <span key={idx} style={{ display: 'block', marginTop: '6px', color: '#a0a5b5', paddingLeft: '15px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0', color: '#ff952e' }}>•</span>
            {line.substring(line.indexOf('•') + 1).trim()}
          </span>
        );
      }
      return (
        <span key={idx} style={{ display: 'block', marginTop: idx > 0 ? '6px' : '0' }}>
          {line}
        </span>
      );
    });
  };

  return (
    <div style={{
      backgroundColor: '#101115',
      color: '#f4f4f5',
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '60px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '850px',
        width: '100%',
        backgroundColor: '#161922',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Accent Top Gradient Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #ff952e, #f37b18)'
        }}></div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          textAlign: 'center',
          color: '#ff952e',
          marginBottom: '40px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          background: 'linear-gradient(to right, #ff952e, #fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {rules.title}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* SECTION I: SMP */}
          <section style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '25px',
            transition: 'border-color 0.2s'
          }}>
            <h2 style={{
              color: '#ff952e',
              fontSize: '1.6rem',
              fontWeight: '700',
              marginTop: 0,
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem', padding: '4px 8px', backgroundColor: 'rgba(255, 149, 46, 0.1)', borderRadius: '6px', color: '#ff952e' }}>I</span>
              {rules.smp.title.replace('I. ', '')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {rules.smp.rules_list.map((group, idx) => (
                <div key={idx}>
                  <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '600', margin: '0 0 12px 0' }}>
                    {group.num}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '15px', borderLeft: '2px solid rgba(255, 149, 46, 0.2)' }}>
                    {group.sub_rules.map((subRule, sIdx) => (
                      <div key={sIdx} style={{ fontSize: '0.98rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        {formatText(subRule)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION II: Discord */}
          <section style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '25px'
          }}>
            <h2 style={{
              color: '#ff952e',
              fontSize: '1.6rem',
              fontWeight: '700',
              marginTop: 0,
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem', padding: '4px 8px', backgroundColor: 'rgba(255, 149, 46, 0.1)', borderRadius: '6px', color: '#ff952e' }}>II</span>
              {rules.discord.title.replace('II. ', '')}
            </h2>
            <ul style={{
              paddingLeft: '20px',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              lineHeight: '1.6',
              fontSize: '0.98rem',
              color: '#e4e4e7'
            }}>
              {rules.discord.rules_list.map((rule, idx) => (
                <li key={idx} style={{ paddingLeft: '5px' }}>
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          {/* SECTION III: Penalties */}
          <section style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '25px'
          }}>
            <h2 style={{
              color: '#ff952e',
              fontSize: '1.6rem',
              fontWeight: '700',
              marginTop: 0,
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem', padding: '4px 8px', backgroundColor: 'rgba(255, 149, 46, 0.1)', borderRadius: '6px', color: '#ff952e' }}>III</span>
              {rules.penalty.title.replace('III. ', '')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', margin: '0 0 10px 0' }}>
                  {rules.penalty.smp_title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '15px', borderLeft: '2px solid rgba(239, 68, 68, 0.3)' }}>
                  {rules.penalty.smp_rules.map((rule, idx) => (
                    <div key={idx} style={{ fontSize: '0.98rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                      {formatText(rule)}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', margin: '0 0 10px 0' }}>
                  {rules.penalty.discord_title}
                </h3>
                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.98rem', color: '#e4e4e7' }}>
                  {rules.penalty.discord_rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION IV: Final Notes */}
          <section style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '25px'
          }}>
            <h2 style={{
              color: '#ff952e',
              fontSize: '1.6rem',
              fontWeight: '700',
              marginTop: 0,
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem', padding: '4px 8px', backgroundColor: 'rgba(255, 149, 46, 0.1)', borderRadius: '6px', color: '#ff952e' }}>IV</span>
              {rules.footer_msg.title.replace('IV. ', '')}
            </h2>
            <ul style={{
              paddingLeft: '20px',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              lineHeight: '1.6',
              fontSize: '0.98rem',
              color: '#e4e4e7'
            }}>
              {rules.footer_msg.msgs.map((msg, idx) => (
                <li key={idx} style={{
                  paddingLeft: '5px',
                  fontWeight: idx === rules.footer_msg.msgs.length - 1 ? '700' : 'normal',
                  color: idx === rules.footer_msg.msgs.length - 1 ? '#ff952e' : '#e4e4e7'
                }}>
                  {msg}
                </li>
              ))}
            </ul>
          </section>

        </div>

        <div style={{
          marginTop: '50px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '25px'
        }}>
          <a href={`/${lang}`} style={{
            color: '#ff952e',
            textDecoration: 'none',
            fontSize: '1.05rem',
            fontWeight: '600',
            transition: 'color 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          >
            {dict.signup.back}
          </a>
        </div>
      </div>
    </div>
  );
}

