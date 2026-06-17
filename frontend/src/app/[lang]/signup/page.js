import { getDictionary } from "../../../dictionaries/get-dictionary";
import Head from 'next/head';

export default async function DangKi({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <>
      <Head>
        <title>{dict.signup.title}</title>
      </Head>
      <div style={{ backgroundColor: 'black', color: 'white', textAlign: 'center', fontFamily: "'Roboto', sans-serif", minHeight: '100vh', padding: '20px' }}>
        <h1 style={{ padding: '20px 0' }} dangerouslySetInnerHTML={{ __html: dict.signup.step1 }}></h1>
        <img src="/assets/img/b1.png" width="650" alt="Step 1" style={{ maxWidth: '100%', height: 'auto' }} />
        
        <h1 style={{ padding: '20px 0' }} dangerouslySetInnerHTML={{ __html: dict.signup.step2 }}></h1>
        <img src="/assets/img/b2.png" width="650" alt="Step 2" style={{ maxWidth: '100%', height: 'auto' }} />
        
        <h1 style={{ padding: '20px 0' }} dangerouslySetInnerHTML={{ __html: dict.signup.step3 }}></h1>
        <img src="/assets/img/b3.png" width="650" alt="Step 3" style={{ maxWidth: '100%', height: 'auto' }} />
        
        <h1 style={{ padding: '20px 0' }} dangerouslySetInnerHTML={{ __html: dict.signup.step4 }}></h1>
        <img src="/assets/img/b4.png" width="650" alt="Step 4" style={{ maxWidth: '100%', height: 'auto' }} />
        
        <h1 style={{ padding: '20px 0' }} dangerouslySetInnerHTML={{ __html: dict.signup.step5 }}></h1>
        
        <h4 style={{ marginTop: '40px', color: '#888' }}>{dict.signup.joke}</h4>
        
        <div style={{ marginTop: '40px' }}>
          <a href={`/${lang}`} style={{ color: 'lightblue', textDecoration: 'none', fontSize: '1.2rem' }}>{dict.signup.back}</a>
        </div>
      </div>
    </>
  );
}
