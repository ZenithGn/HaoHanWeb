"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const fallbackDonors = [
  { username: "Ginn", total_donated: 1500000, role: "ADMIN", uuid: "Ginn" },
  { username: "Pigku", total_donated: 1000000, role: "VIP", uuid: "Pigku" },
  { username: "HaoHanPlayer", total_donated: 500000, role: "VIP", uuid: "HaoHanPlayer" },
  { username: "Steve", total_donated: 250000, role: "PLAYER", uuid: "Steve" },
  { username: "Alex", total_donated: 100000, role: "PLAYER", uuid: "Alex" }
];

const PRESETS = [20000, 50000, 100000, 200000, 500000];

export default function DonateClient({ dict, lang, isEmbedded = false }) {
  const { user } = useAuth();
  const [ten, setTen] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const isVi = lang === "vi";

  // Pre-fill username if logged in
  useEffect(() => {
    if (user && user.username) {
      const timer = setTimeout(() => {
        setTen(user.username);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Fetch leaderboard donors
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/leaderboards`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.top_donors && data.top_donors.length > 0) {
            setDonors(data.top_donors);
          } else {
            setDonors(fallbackDonors);
          }
        } else {
          setDonors(fallbackDonors);
        }
      } catch (error) {
        console.error("Error fetching donors:", error);
        setDonors(fallbackDonors);
      } finally {
        setLoadingDonors(false);
      }
    };
    fetchDonors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult('');
    setIsSuccess(false);

    if (!ten.trim() || !amount || parseFloat(amount) <= 0) {
      setResult(isVi ? "Vui lòng nhập đầy đủ thông tin hợp lệ!" : "Please fill in all valid details!");
      return;
    }

    setResult(dict.donate.sending);

    try {
      const response = await fetch(`${API_BASE}/api/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: ten,
          amount: parseFloat(amount),
          message: message
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsSuccess(true);
        // Format success message replacing name and amount
        let successMsg = dict.donate.success
          .replace('{name}', data.name || ten)
          .replace('{amount}', formatVND(amount));
        setResult(successMsg);
        setShowPayment(true);
      } else {
        setResult(dict.donate.error1.replace('{name}', ten));
      }
    } catch (error) {
      console.error("Error submitting donation:", error);
      setResult(dict.donate.error2.replace('{name}', ten));
    }
  };

  const formatVND = (value) => {
    if (!value) return "0đ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleReset = () => {
    setAmount('');
    setMessage('');
    setResult('');
    setIsSuccess(false);
    setShowPayment(false);
  };

  const getRankBadge = (index) => {
    if (index === 0) return { icon: "👑", color: "#ffd700", label: "TOP 1" };
    if (index === 1) return { icon: "⭐", color: "#c0c0c0", label: "TOP 2" };
    if (index === 2) return { icon: "⭐", color: "#cd7f32", label: "TOP 3" };
    return { icon: "🛡️", color: "#aaa9a6", label: `#${index + 1}` };
  };

  const content = (
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
              gridTemplateColumns: '1.1fr 1fr',
              gap: '30px',
              fontFamily: "'Outfit', sans-serif"
            }} className="donate-panel-grid">
              
              {/* Left Column: Donors Honor Roll */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid rgba(255, 255, 255, 0.05)', paddingRight: '20px' }} className="donors-column">
                <div>
                  <h3 style={{ margin: 0, color: '#ff952e', fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-award"></i>
                    {dict.donate.donor_board_title}
                  </h3>
                  <p style={{ margin: '6px 0 0 0', color: '#868582', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {dict.donate.donor_board_subtitle}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }} className="donors-list">
                  {loadingDonors ? (
                    <div style={{ color: '#868582', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>
                      <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i>
                      {isVi ? "Đang tải danh sách..." : "Loading honor roll..."}
                    </div>
                  ) : donors.length === 0 ? (
                    <div style={{ color: '#868582', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>
                      {dict.donate.empty_donors}
                    </div>
                  ) : (
                    donors.map((donor, idx) => {
                      const badge = getRankBadge(idx);
                      return (
                        <div 
                          key={donor.username + idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: idx < 3 ? 'rgba(255, 149, 46, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                            border: idx < 3 ? `1px solid rgba(255, 149, 46, 0.15)` : '1px solid rgba(255, 255, 255, 0.03)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            transition: 'transform 0.2s, border-color 0.2s',
                          }}
                          className="donor-item"
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.borderColor = 'rgba(255, 149, 46, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.borderColor = idx < 3 ? 'rgba(255, 149, 46, 0.15)' : 'rgba(255, 255, 255, 0.03)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                              width: '38px', 
                              height: '38px', 
                              borderRadius: '6px', 
                              overflow: 'hidden',
                              background: 'rgba(0, 0, 0, 0.2)',
                              border: `1px solid ${badge.color}33`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={donor.avatar_url || `https://minotar.net/avatar/${donor.username}/40`} 
                                alt={donor.username}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = `https://minotar.net/avatar/char/40`;
                                }}
                              />
                            </div>
                            <div>
                              <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {donor.username}
                                {donor.role === 'ADMIN' && (
                                  <span style={{ fontSize: '0.7rem', background: 'rgba(214, 48, 49, 0.15)', color: '#d63031', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(214, 48, 49, 0.2)' }}>Admin</span>
                                )}
                                {donor.role === 'VIP' && (
                                  <span style={{ fontSize: '0.7rem', background: 'rgba(255, 184, 52, 0.15)', color: '#ffb834', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 184, 52, 0.2)' }}>VIP</span>
                                )}
                              </strong>
                              <span style={{ color: '#868582', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                                {badge.icon} {badge.label}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: idx < 3 ? '#ff952e' : '#fff', fontWeight: '800', fontSize: '1rem' }}>
                              {formatVND(donor.total_donated)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Donate Form OR Dynamic Payment Screen */}
              <div className="form-column" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {!showPayment ? (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '800', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
                      {dict.donate.heading}
                    </h3>
                    
                    {/* Account Name input */}
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

                    {/* Amount input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="amount" style={{ color: '#aaa9a6', fontSize: '0.9rem', fontWeight: '600' }}>
                        {dict.donate.amount_label}
                      </label>
                      
                      {/* Presets */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '4px' }}>
                        {PRESETS.map((preset) => {
                          const isSelected = parseFloat(amount) === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAmount(preset.toString())}
                              style={{
                                background: isSelected ? 'linear-gradient(135deg, #e8741e, #f37b18)' : 'rgba(255, 255, 255, 0.03)',
                                border: isSelected ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '6px',
                                color: isSelected ? '#fff' : '#aaa9a6',
                                padding: '8px 4px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 149, 46, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                              }}
                            >
                              {preset / 1000}k
                            </button>
                          );
                        })}
                      </div>

                      <input 
                        id="amount"
                        type="number" 
                        min="1000"
                        step="1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={dict.donate.amount_placeholder}
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

                    {/* Message input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="message" style={{ color: '#aaa9a6', fontSize: '0.9rem', fontWeight: '600' }}>
                        {dict.donate.message_label}
                      </label>
                      <textarea 
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={dict.donate.message_placeholder}
                        rows="2"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          outline: 'none',
                          fontFamily: 'inherit',
                          resize: 'none',
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

                    {result && !isSuccess && (
                      <div style={{ 
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

                    <div style={{ textAlign: "center" }}>
                      <a href={`/${lang}`} style={{ color: "#ff952e", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}>
                        {dict.donate.back}
                      </a>
                    </div>
                  </form>
                ) : (
                  /* Dynamic Payment Instruction Panel */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(76, 209, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-circle-check" style={{ color: '#4cd137', fontSize: '1.2rem' }}></i>
                      </div>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '800' }}>
                        {isVi ? "Yêu Cầu Đã Được Khởi Tạo" : "Request Initialized"}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 149, 46, 0.12)', borderRadius: '10px', padding: '16px' }} className="payment-instructions-wrap">
                      
                      {/* Dynamic / Fallback QR Code */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          background: '#fff',
                          padding: '8px',
                          borderRadius: '8px',
                          width: '150px',
                          height: '150px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={amount ? `https://img.vietqr.io/image/mbbank-0359871183-compact2.png?amount=${amount}&addInfo=HAOHAN%20${encodeURIComponent(ten)}&accountName=NGUYEN%20TIEN%20DAT` : "/assets/img/give_me_money.jpg"} 
                            alt="Donation QR Code" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.src = "/assets/img/give_me_money.jpg";
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#868582', fontWeight: '600' }}>
                          {isVi ? "QUÉT MÃ QR THANH TOÁN" : "SCAN QR CODE"}
                        </span>
                      </div>

                      {/* Payment text instructions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, fontSize: '0.85rem', color: '#aaa9a6' }}>
                        <div>
                          <strong style={{ color: '#fff', display: 'block', fontSize: '0.9rem', marginBottom: '2px' }}>
                            {isVi ? "Thông Tin Chuyển Khoản:" : "Bank Details:"}
                          </strong>
                          <span style={{ display: 'block' }}>🏦 MB Bank (Ngân hàng Quân Đội)</span>
                          <span style={{ display: 'block' }}>💳 STK: <strong>0359871183</strong></span>
                          <span style={{ display: 'block' }}>👤 Chủ TK: <strong>NGUYEN TIEN DAT</strong></span>
                        </div>
                        
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                          <span style={{ display: 'block' }}>💵 {isVi ? "Số tiền:" : "Amount:"} <strong style={{ color: '#ff952e', fontSize: '0.95rem' }}>{formatVND(amount)}</strong></span>
                          <span style={{ display: 'block' }}>📝 {isVi ? "Nội dung chuyển:" : "Transfer message:"} <strong style={{ color: '#ff952e', fontSize: '0.95rem' }}>HAOHAN {ten}</strong></span>
                        </div>
                      </div>
                    </div>

                    {result && (
                      <div style={{ 
                        padding: '12px 16px', 
                        backgroundColor: 'rgba(76, 209, 55, 0.08)', 
                        border: '1px solid rgba(76, 209, 55, 0.2)', 
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        lineHeight: '1.4'
                      }}>
                        {result}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                      <button 
                        onClick={handleReset}
                        style={{
                          flex: 1,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                      >
                        {isVi ? "Quay lại" : "Back"}
                      </button>
                      <button 
                        onClick={handleReset}
                        style={{
                          flex: 1.5,
                          background: 'linear-gradient(135deg, #e8741e, #f37b18)',
                          border: 'none',
                          color: '#fff',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'transform 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                      >
                        {isVi ? "Quyên Góp Tiếp" : "Donate More"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div style={{ backgroundColor: "#101115", minHeight: "100vh", padding: "120px 20px 60px" }}>
      <div className="wrap rules-page-wrap">
        {content}
      </div>
    </div>
  );
}
