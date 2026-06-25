"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { getDictionary } from '../../../dictionaries/get-dictionary';

export default function SignupPage({ params }) {
  const { lang } = use(params);
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeRules, setAgreeRules] = useState(true); // "giu tick server rules" (keep checked by default)
  
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [dict, setDict] = useState(null);

  useEffect(() => {
    getDictionary(lang).then(setDict);
  }, [lang]);

  const isVi = lang === 'vi';
  const translations = {
    title: isVi ? "Đăng Ký - HaoHan SMP" : "Register - HaoHan SMP",
    heading: isVi ? "Đăng Ký Tài Khoản" : "Create Account",
    usernameLabel: isVi ? "Tên nhân vật (Minecraft):" : "Character Name (Minecraft):",
    usernamePlaceholder: isVi ? "Nhập tên nhân vật Minecraft..." : "Enter Minecraft character name...",
    emailLabel: isVi ? "Địa chỉ Email:" : "Email Address:",
    emailPlaceholder: isVi ? "Nhập email của bạn..." : "Enter your email...",
    passwordLabel: isVi ? "Mật khẩu:" : "Password:",
    passwordPlaceholder: isVi ? "Nhập mật khẩu (tối thiểu 6 ký tự)..." : "Enter password (min 6 characters)...",
    confirmPasswordLabel: isVi ? "Xác nhận mật khẩu:" : "Confirm Password:",
    confirmPasswordPlaceholder: isVi ? "Nhập lại mật khẩu..." : "Re-enter password...",
    agreeText: isVi ? "Tôi đồng ý với " : "I agree to the ",
    rulesLink: isVi ? "Luật Máy Chủ" : "Server Rules",
    submitBtn: isVi ? "Đăng Ký" : "Register",
    loadingText: isVi ? "Đang xử lý..." : "Processing...",
    hasAccount: isVi ? "Đã có tài khoản?" : "Already have an account?",
    loginNow: isVi ? "Đăng nhập ngay" : "Login now",
    backHome: isVi ? "← Trở về trang chủ" : "← Back to home",
    successMsg: isVi ? "Đăng ký thành công!" : "Registration successful!",
    rulesModalTitle: isVi ? "Luật Máy Chủ HaoHan SMP" : "HaoHan SMP Server Rules",
    rulesClose: isVi ? "Đóng" : "Close",
    rulesList: isVi ? [
      "Không sử dụng hack, cheat, client gian lận hoặc mod gây mất cân bằng game.",
      "Không phá hoại công trình (griefing) của người chơi khác.",
      "Không xúc phạm, chửi bới, phân biệt đối xử hay quấy rối người khác.",
      "Không lợi dụng lỗi game (exploit/dupe) để trục lợi. Hãy báo cáo lỗi cho BQT.",
      "Tôn trọng Ban Quản Trị và các quyết định từ đội ngũ điều hành."
    ] : [
      "No hacking, cheating, using hacked clients, or mods that give unfair advantages.",
      "No griefing (destroying other players' houses, structures, or properties).",
      "No offensive language, toxicity, discrimination, or harassment.",
      "No exploiting bugs/duping items. Report any discovered exploits to the staff.",
      "Respect the administrators and follow all team decisions."
    ]
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agreeRules) {
      setError(isVi ? "Bạn phải đồng ý với Luật Máy Chủ để tiếp tục!" : "You must agree to the Server Rules to continue!");
      return;
    }

    if (password !== confirmPassword) {
      setError(isVi ? "Mật khẩu xác nhận không trùng khớp!" : "Confirm password does not match!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          password_confirmation: confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(translations.successMsg);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user_info', JSON.stringify(data.user));
        }
        setTimeout(() => {
          router.push(`/${lang}`);
        }, 1500);
      } else {
        setError(data.error || (isVi ? "Đăng ký thất bại!" : "Registration failed!"));
      }
    } catch (err) {
      console.error(err);
      setError(isVi ? "Không thể kết nối tới máy chủ!" : "Unable to connect to server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#101115',
      color: '#f4f4f5',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '40px 20px'
    }}>
      <div style={{
        backgroundColor: '#161922',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '460px',
        padding: '40px 30px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          textAlign: 'center',
          color: '#ff952e',
          marginBottom: '30px',
          fontWeight: '700'
        }}>
          {translations.heading}
        </h1>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', color: '#dedfe3' }}>{translations.usernameLabel}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={translations.usernamePlaceholder}
              required
              maxLength={16}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', color: '#dedfe3' }}>{translations.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={translations.emailPlaceholder}
              required
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', color: '#dedfe3' }}>{translations.passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={translations.passwordPlaceholder}
              required
              minLength={6}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', color: '#dedfe3' }}>{translations.confirmPasswordLabel}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={translations.confirmPasswordPlaceholder}
              required
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="rules-checkbox"
              checked={agreeRules}
              onChange={(e) => setAgreeRules(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#ff952e', width: '16px', height: '16px' }}
            />
            <label htmlFor="rules-checkbox" style={{ fontSize: '0.9rem', color: '#c7c8ce', cursor: 'pointer' }}>
              {translations.agreeText}
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRulesModal(true);
                }}
                style={{ color: '#ff952e', textDecoration: 'underline', fontWeight: '600', cursor: 'pointer' }}
              >
                {translations.rulesLink}
              </span>
            </label>
          </div>

          {error && (
            <div style={{ color: '#ff6b6b', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ color: '#4caf50', fontSize: '0.9rem', textAlign: 'center' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: '#ff952e',
              color: '#101115',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.7 : 1,
              marginTop: '10px'
            }}
          >
            {loading ? translations.loadingText : translations.submitBtn}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#a0a5b5' }}>
          {translations.hasAccount}{' '}
          <a href={`/${lang}/login`} style={{ color: '#ff952e', textDecoration: 'none', fontWeight: '600' }}>
            {translations.loginNow}
          </a>
        </p>

        <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <a href={`/${lang}`} style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem' }}>
            {translations.backHome}
          </a>
        </div>
      </div>

      {/* Rules Modal Popup */}
      {showRulesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => setShowRulesModal(false)}
        >
          <div style={{
            backgroundColor: '#161922',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              color: '#ff952e', 
              marginTop: 0, 
              marginBottom: '20px', 
              fontSize: '1.4rem', 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              paddingBottom: '10px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: '700'
            }}>
              {translations.rulesModalTitle}
            </h2>

            <div style={{ 
              maxHeight: '380px', 
              overflowY: 'auto', 
              color: '#d7d8dc', 
              lineHeight: '1.6', 
              fontSize: '0.92rem',
              paddingRight: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {dict ? (
                <>
                  {/* SMP Rules */}
                  <div>
                    <h3 style={{ color: '#ff952e', margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: '600' }}>
                      {dict.rules.smp.title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingLeft: '5px' }}>
                      {dict.rules.smp.rules_list.map((group, idx) => (
                        <div key={idx}>
                          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '600', margin: '0 0 6px 0' }}>
                            {group.num}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', borderLeft: '1.5px solid rgba(255, 149, 46, 0.2)' }}>
                            {group.sub_rules.map((subRule, sIdx) => (
                              <div key={sIdx} style={{ fontSize: '0.88rem', color: '#c7c8ce', whiteSpace: 'pre-line' }}>
                                {subRule}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discord Rules */}
                  <div>
                    <h3 style={{ color: '#ff952e', margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: '600' }}>
                      {dict.rules.discord.title}
                    </h3>
                    <ul style={{ paddingLeft: '15px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#c7c8ce' }}>
                      {dict.rules.discord.rules_list.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Penalties */}
                  <div>
                    <h3 style={{ color: '#ff952e', margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: '600' }}>
                      {dict.rules.penalty.title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '5px' }}>
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                          {dict.rules.penalty.smp_title}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px', borderLeft: '1.5px solid rgba(239, 68, 68, 0.3)', fontSize: '0.88rem', color: '#c7c8ce', whiteSpace: 'pre-line' }}>
                          {dict.rules.penalty.smp_rules.map((rule, idx) => (
                            <div key={idx}>{rule}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                          {dict.rules.penalty.discord_title}
                        </h4>
                        <ul style={{ paddingLeft: '15px', margin: 0, fontSize: '0.88rem', color: '#c7c8ce' }}>
                          {dict.rules.penalty.discord_rules.map((rule, idx) => (
                            <li key={idx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Final Messages */}
                  <div>
                    <h3 style={{ color: '#ff952e', margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: '600' }}>
                      {dict.rules.footer_msg.title}
                    </h3>
                    <ul style={{ paddingLeft: '15px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#c7c8ce' }}>
                      {dict.rules.footer_msg.msgs.map((msg, idx) => (
                        <li key={idx} style={{
                          fontWeight: idx === dict.rules.footer_msg.msgs.length - 1 ? '700' : 'normal',
                          color: idx === dict.rules.footer_msg.msgs.length - 1 ? '#ff952e' : '#c7c8ce'
                        }}>
                          {msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  {translations.loadingText}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              style={{
                marginTop: '20px',
                float: 'right',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              {translations.rulesClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
