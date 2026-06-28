"use client";

import { useState } from 'react';
import { useAuth } from '../../components/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginClient({ dict, lang }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError(dict.login.error_empty);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        window.location.href = `/${lang}`;
      } else {
        setError(data.error || dict.login.error_invalid);
      }
    } catch {
      setError(dict.login.error_connection);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setError('');
    setDiscordLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/discord/login-url`);
      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || dict.login.error_connection);
        setDiscordLoading(false);
      }
    } catch {
      setError(dict.login.error_connection);
      setDiscordLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <img src="/assets/img/bg-checking-status.jpg" alt="Background" />
      </div>

      <a href={`/${lang}`} className="auth-back-to-home">
        <i className="fas fa-arrow-left" /> {dict.login.back_to_home}
      </a>

      <div className="auth-container">
        <h1 className="auth-heading">{dict.login.heading}</h1>
        <p className="auth-subtitle">{dict.login.subtitle}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">{dict.login.username_label}</label>
            <div className="auth-input-wrapper">
              <i className="fas fa-user" />
              <input
                type="text"
                className="auth-input"
                placeholder={dict.login.username_placeholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label">{dict.login.password_label}</label>
              <a href="#" className="auth-forgot">{dict.login.forgot_password}</a>
            </div>
            <div className="auth-input-wrapper">
              <i className="fas fa-lock" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <label className="auth-checkbox-label">
            <input type="checkbox" className="auth-checkbox" />
            <span>{dict.login.remember_me}</span>
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin" /> : dict.login.submit}
          </button>

          <div className="auth-divider">
            <span>{dict.login.or}</span>
          </div>

          <button
            type="button"
            className="auth-discord-btn"
            onClick={handleDiscordLogin}
            disabled={discordLoading}
          >
            {discordLoading ? (
              <i className="fas fa-spinner fa-spin" />
            ) : (
              <i className="fab fa-discord" />
            )}
            <span>{dict.login.discord_login}</span>
          </button>
        </form>

        <p className="auth-footer-text">
          {dict.login.no_account}{' '}
          <a href={`/${lang}/register`} className="auth-link">{dict.login.register_link}</a>
        </p>
      </div>
    </div>
  );
}

