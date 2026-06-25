"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DiscordCallbackClient({ dict, lang, code }) {
  const router = useRouter();
  const { login, getToken } = useAuth();
  
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const handshakeAttempted = useRef(false);

  useEffect(() => {
    if (handshakeAttempted.current) return;
    handshakeAttempted.current = true;

    if (!code) {
      setStatus('error');
      setMessage(dict.profile?.join_discord_required || 'Không tìm thấy mã xác thực OAuth từ Discord.');
      return;
    }

    const linkDiscord = async () => {
      const token = getToken();
      if (!token) {
        setStatus('error');
        setMessage('Bạn cần đăng nhập trước khi thực hiện liên kết Discord.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/discord/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (response.ok) {
          // Update user session locally
          login(token, data.user);
          setStatus('success');
          setMessage(data.message || 'Liên kết tài khoản Discord thành công!');
          
          let count = 3;
          const timer = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(timer);
              router.push(`/${lang}`);
            }
          }, 1000);

          return () => clearInterval(timer);
        } else {
          setStatus('error');
          setMessage(data.error || 'Đã xảy ra lỗi trong quá trình liên kết với Discord.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    };

    linkDiscord();
  }, [code, dict, lang, getToken, login, router]);

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <img src="/assets/img/bg-checking-status.jpg" alt="Background" />
      </div>

      <div className="auth-container" style={{ maxWidth: '500px', backdropFilter: 'blur(20px)' }}>
        {status === 'processing' && (
          <div className="callback-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="spinner-glow" style={{ marginBottom: '1.5rem' }}>
              <i className="fab fa-discord discord-spin-icon" style={{ fontSize: '3rem', color: '#5865F2' }} />
            </div>
            <h2 className="callback-title" style={{ fontSize: '1.5rem', marginBottom: '0.8rem', color: '#fff' }}>Đang xác thực liên kết...</h2>
            <p className="callback-desc" style={{ color: 'var(--text-muted)' }}>Hệ thống đang kiểm tra thông tin tài khoản Discord của bạn.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="callback-card callback-card--success" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="status-badge status-badge--success" style={{ marginBottom: '1.5rem', color: '#43b581', fontSize: '3.5rem' }}>
              <i className="fas fa-check-circle" />
            </div>
            <h2 className="callback-title callback-title--success" style={{ fontSize: '1.6rem', marginBottom: '0.8rem', color: '#fff' }}>Liên Kết Thành Công!</h2>
            <p className="callback-desc" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
            <p className="callback-redirect" style={{ color: '#aaa', fontSize: '0.9rem' }}>
              Quay lại trang chủ sau <strong>{countdown}</strong> giây...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="callback-card callback-card--error" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="status-badge status-badge--error" style={{ marginBottom: '1.5rem', color: '#f04747', fontSize: '3.5rem' }}>
              <i className="fas fa-exclamation-triangle" />
            </div>
            <h2 className="callback-title callback-title--error" style={{ fontSize: '1.6rem', marginBottom: '0.8rem', color: '#fff' }}>Liên Kết Thất Bại!</h2>
            <p className="callback-desc" style={{ color: '#fff', opacity: 0.9, backgroundColor: 'rgba(240, 71, 71, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(240, 71, 71, 0.2)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{message}</p>
            
            <div className="callback-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <a href="https://discord.com/invite/znHfuc6hCR" target="_blank" rel="noopener noreferrer" className="auth-discord-btn" style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <i className="fab fa-discord" /> Tham Gia Discord Server
              </a>
              <button onClick={() => router.push(`/${lang}`)} className="auth-submit" style={{ width: '100%' }}>
                Quay lại Trang Chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
