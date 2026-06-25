import { getDictionary } from "../../../dictionaries/get-dictionary";

export default async function WikiPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const wiki = dict.wiki;

  return (
    <div style={{
      backgroundColor: '#101115',
      color: '#f4f4f5',
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '35px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          textAlign: 'center',
          color: '#ff952e',
          marginBottom: '30px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {wiki.title}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {wiki.section1_title}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {wiki.section1_desc}
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {wiki.section2_title}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {wiki.section2_desc}
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {wiki.section3_title}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {wiki.section3_desc}
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {wiki.section4_title}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {wiki.section4_desc}
            </p>
          </section>
        </div>

        <div style={{
          marginTop: '45px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px'
        }}>
          <a href={`/${lang}`} style={{
            color: '#ff952e',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '600'
          }}
          >
            {dict.signup.back}
          </a>
        </div>
      </div>
    </div>
  );
}
