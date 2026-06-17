"use client";

import { useEffect, useRef } from 'react';
import AOS from 'aos';

export default function HomeClient({ dict, lang }) {
  const destypewriteRef = useRef(null);

  useEffect(() => {
    AOS.init();

    // Dynamically load TypeIt
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/jquery.typeit/4.4.0/typeit.min.js";
    script.onload = () => {
      if (window.$ && window.$.fn.typeIt) {
        new window.$(destypewriteRef.current).typeIt({
          strings: [
            `<b>${dict.home.title}</b>`,
            `<b style='font-size: 28px'>${dict.home.survival}</b>`,
            `<b style='font-size: 28px'>${dict.home.fun}</b>`,
          ],
          speed: 150,
          breakLines: false,
          autoStart: false,
          loop: true,
          delay: 200,
          startDelay: 150,
          startDelete: false,
        });
      }
    };

    // We need jQuery for this version of typeIt
    const jqScript = document.createElement('script');
    jqScript.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js";
    jqScript.onload = () => {
      document.body.appendChild(script);
    };
    document.body.appendChild(jqScript);

    return () => {
      if (document.body.contains(jqScript)) document.body.removeChild(jqScript);
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  return (
    <main>
      {/* Home - start */}
      <div className="body_content" id="home">
        <img src="/assets/img/bg.png" alt="background" className="background-img img_setting" style={{ display: 'block' }} />
        <img src="/assets/img/bg1.png" alt="background" className="background-img img_setting" />
        <img src="/assets/img/bg2.png" alt="background" className="background-img img_setting" />
        <img src="/assets/img/bg3.png" alt="background" className="background-img img_setting" />
        <img src="/assets/img/bg4.png" alt="background" className="background-img img_setting" />
        <div className="body_center" style={{ position: 'absolute' }}>
          <h1 className="heading content" id="destypewrite" ref={destypewriteRef}></h1>
          <br />
          <p className="des1" dangerouslySetInnerHTML={{ __html: dict.home.desc1 }}></p>
          <br />
          <p className="des2" dangerouslySetInnerHTML={{ __html: dict.home.desc2 }}></p>
          <p className="des3" dangerouslySetInnerHTML={{ __html: dict.home.desc3 }}></p>
          <p className="des4" dangerouslySetInnerHTML={{ __html: dict.home.desc4 }}></p>
          <br />
          <p className="des5">{dict.home.connect}</p>
          <br />
          <div className="buttons">
            <a href="https://discord.com/invite/znHfuc6hCR" className="button-discord">
              <span className="button-i">
                <i className="fab fa-discord"></i>
              </span>
              <span className="button-t"> {dict.home.discord}</span>
            </a>
            <a href={`/${lang}/signup`} className="button-signin">
              <span className="button-i">
                <i className="fa-solid fa-user-plus"></i>
              </span>
              <span className="button-t"> {dict.home.signup}</span>
            </a>
          </div>
        </div>
      </div>
      {/* Home - end */}

      {/* About - start */}
      <div className="main" id="about">
        <div className="main__content">
          <b data-aos="fade-up" data-aos-duration="2000"></b>
          <hr data-aos="zoom-in" data-aos-duration="3000" />
          <br />
          <h1 data-aos="fade-up" data-aos-easing="linear" data-aos-duration="5000">{dict.about.title}</h1>
          <div data-aos="fade-up" data-aos-duration="2000" dangerouslySetInnerHTML={{ __html: dict.about.desc }}>
          </div>
        </div>
      </div>
      {/* About - end */}

      {/* FAQ - start */}
      <section className="sub_content">
        <div className="traloicauhoi" id="faq">
          <hr data-aos="zoom-in" data-aos-duration="3000" />
          <br />
          {/* Sub_Content_Line_1 */}
          <div className="container" data-aos="fade-up" data-aos-duration="1000">
            <div className="hoi" onClick={(e) => e.currentTarget.parentElement.classList.toggle('active')}>
              {dict.faq.q1}
            </div>
            <div className="traloi">
              <div className="traloi1">
                {dict.faq.a1}
              </div>
            </div>
          </div>
          {/* Sub_Content_Line_2 */}
          <div className="container" data-aos="fade-up" data-aos-duration="1000">
            <div className="hoi" onClick={(e) => e.currentTarget.parentElement.classList.toggle('active')}>
              {dict.faq.q2}
            </div>
            <div className="traloi">
              <div className="traloi2">
                {dict.faq.a2}
              </div>
            </div>
          </div>
          {/* Sub_Content_Line_3 */}
          <div className="container" data-aos="fade-up" data-aos-duration="1000">
            <div className="hoi" onClick={(e) => e.currentTarget.parentElement.classList.toggle('active')}>
              {dict.faq.q3}
            </div>
            <div className="traloi">
              <div className="traloi2">
                {dict.faq.a3}
              </div>
            </div>
          </div>
          {/* Sub_Content_Line_4 */}
          <div className="container" data-aos="fade-up" data-aos-duration="1000">
            <div className="hoi" onClick={(e) => e.currentTarget.parentElement.classList.toggle('active')}>
              {dict.faq.q4}
            </div>
            <div className="traloi">
              <div className="traloi2">
                {dict.faq.a4}
              </div>
            </div>
          </div>
          {/* Sub_Content_Line_5 */}
          <div className="container" data-aos="fade-up" data-aos-duration="1000">
            <div className="hoi" onClick={(e) => e.currentTarget.parentElement.classList.toggle('active')}>
              {dict.faq.q5}
            </div>
            <div className="traloi">
              <div className="traloi3">
                {dict.faq.a5}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ - end */}

      {/* wave */}
      <div className="wavemove">
        <div className="wave-transition">
          <svg className="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
              <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g className="parallax">
              <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(62,62,62,0.7)" />
              <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(62,62,62,0.5)" />
              <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(62,62,62,0.3)" />
              <use xlinkHref="#gentle-wave" x="48" y="7" fill="#3e3e3e" />
            </g>
          </svg>
        </div>
      </div>

      {/* Checking status server */}
      <div className="color"></div>
      <div className="checking-status">
        <div className="icon">
          <img src="/favicon/android-chrome-192x192.png" id="favicon" alt="favicon" />
        </div>
        <div className="header">
          <div className="image">
            <img src="/assets/img/bg-checking-status.jpg" alt="background status" />
          </div>
          <h2>haohansmp</h2>
        </div>
        <div id="rest" style={{ padding: '20px', textAlign: 'center' }}>Loading ...</div>
      </div>
    </main>
  );
}
