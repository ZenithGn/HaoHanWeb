"use client";

import { useState } from 'react';

export default function DonateClient({ dict, lang }) {
  const [ten, setTen] = useState('');
  const [result, setResult] = useState('');
  const isVi = lang === "vi";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(dict.donate.sending + ten + '...');
    
    try {
      const response = await fetch('http://localhost:8080/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: ten }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(dict.donate.success.replace('{name}', data.name));
      } else {
        setResult(dict.donate.error1.replace('{name}', ten));
      }
    } catch (error) {
      console.error("Error submitting donation:", error);
      setResult(dict.donate.error2.replace('{name}', ten));
    }
  };

  return (
    <div style={{ backgroundColor: "#101115", minHeight: "100vh", padding: "120px 20px 60px" }}>
      <div className="wrap rules-page-wrap">
        <div className="rules-layout">
          <aside className="rules-sidebar">
            <header className="rules-card__header">
              <span className="rules-card__eyebrow">
                <i className="fa-solid fa-heart" style={{ color: '#ff4d4d' }}></i>
                {isVi ? "Cảm ơn bạn" : "Thank you"}
              </span>
              <h2>{isVi ? "SUPPORT US" : "DONATION"}</h2>
              <p>
                {isVi 
                  ? "Mọi sự đóng góp của bạn đều giúp duy trì, nâng cấp cấu hình máy chủ và phát triển thêm các tính năng độc quyền."
                  : "Every contribution helps maintain, upgrade hosting configurations, and develop exclusive features."}
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', fontFamily: "'Outfit', sans-serif" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 149, 46, 0.1)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 149, 46, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-bolt" style={{ color: '#ff952e', fontSize: '1.1rem' }}></i>
                </div>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>{isVi ? "Xử lý tự động" : "Instant sync"}</strong>
                  <span style={{ color: '#868582', fontSize: '0.78rem' }}>{isVi ? "Nhận rank ngay lập tức" : "Receive roles instantly"}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 149, 46, 0.1)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 149, 46, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#ff952e', fontSize: '1.1rem' }}></i>
                </div>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>{isVi ? "Bảo mật & an toàn" : "Safe & Secure"}</strong>
                  <span style={{ color: '#868582', fontSize: '0.78rem' }}>{isVi ? "Giao dịch mã hóa an toàn" : "Encrypted payment transfer"}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="rules-content">
            <div style={{
              background: 'rgba(20, 18, 16, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 149, 46, 0.15)',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '30px',
              fontFamily: "'Outfit', sans-serif"
            }} className="donate-panel-grid">
              
              {/* QR Code Card */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 149, 46, 0.2)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  width: '240px',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/assets/img/give_me_money.jpg" 
                    alt="Donation QR Code" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <strong style={{ color: '#ff952e', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                    {isVi ? "QUÉT MÃ QR ĐỂ DONATE" : "SCAN QR CODE TO DONATE"}
                  </strong>
                  <span style={{ color: '#aaa9a6', fontSize: '0.85rem', lineHeight: '1.4', display: 'block' }}>
                    {dict.donate.desc}
                  </span>
                </div>
              </div>

              {/* Form Input / Action */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: '800', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
                  {dict.donate.heading}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="ten" style={{ color: '#aaa9a6', fontSize: '0.9rem', fontWeight: '600' }}>
                    {dict.donate.name_label}
                  </label>
                  <input 
                    id="ten"
                    type="text" 
                    value={ten}
                    onChange={(e) => setTen(e.target.value)}
                    placeholder={dict.donate.name_placeholder}
                    required
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.25s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(255, 149, 46, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>

                <button 
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #e8741e, #f37b18)',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 12px rgba(232, 116, 30, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                >
                  {dict.donate.submit}
                </button>

                {result && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '12px 16px', 
                    backgroundColor: 'rgba(255, 149, 46, 0.08)', 
                    border: '1px solid rgba(255, 149, 46, 0.25)', 
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {result}
                  </div>
                )}

                <div style={{ marginTop: "10px", textAlign: "center" }}>
                  <a href={`/${lang}`} style={{ color: "#ff952e", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}>
                    {dict.donate.back}
                  </a>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
