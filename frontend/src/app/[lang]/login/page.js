"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function LoginPage({ params }) {
  const { lang } = use(params);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Simplified translations for the client side
  const isVi = lang === 'vi';
  const translations = {
    title: isVi ? "Đăng Nhập - HaoHan SMP" : "Login - HaoHan SMP",
    heading: isVi ? "Đăng Nhập" : "Sign In",
    emailLabel: isVi ? "Địa chỉ Email:" : "Email Address:",
    emailPlaceholder: isVi ? "Nhập email của bạn..." : "Enter your email...",
    passwordLabel: isVi ? "Mật khẩu:" : "Password:",
    passwordPlaceholder: isVi ? "Nhập mật khẩu..." : "Enter password...",
    submitBtn: isVi ? "Đăng Nhập" : "Log In",
    loadingText: isVi ? "Đang xử lý..." : "Processing...",
    noAccount: isVi ? "Chưa có tài khoản?" : "Don't have an account?",
    registerNow: isVi ? "Đăng ký ngay" : "Register now",
    backHome: isVi ? "← Trở về trang chủ" : "← Back to home",
    successMsg: isVi ? "Đăng nhập thành công!" : "Login successful!",
    failMsg: isVi ? "Email hoặc mật khẩu không chính xác!" : "Invalid email or password."
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
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
        setError(data.error || translations.failMsg);
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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#161922',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? translations.loadingText : translations.submitBtn}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#a0a5b5' }}>
          {translations.noAccount}{' '}
          <a href={`/${lang}/signup`} style={{ color: '#ff952e', textDecoration: 'none', fontWeight: '600' }}>
            {translations.registerNow}
          </a>
        </p>

        <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <a href={`/${lang}`} style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem' }}>
            {translations.backHome}
          </a>
        </div>
      </div>
    </div>
  );
}
