"use client";

import { useState } from 'react';
import { useAuth } from '../../components/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegisterClient({ dict, lang }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeRules, setAgreeRules] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !username.trim() || !password || !confirmPassword) {
      setError(dict.register.error_empty);
      return;
    }

    // Client-side email pattern validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(dict.register.error_invalid_email);
      return;
    }

    if (username.trim().length > 16) {
      setError(dict.register.error_username_long);
      return;
    }

    if (password.length < 6) {
      setError(dict.register.error_password_short);
      return;
    }

    if (password !== confirmPassword) {
      setError(dict.register.error_password_mismatch);
      return;
    }

    if (!agreeRules) {
      setError(dict.register.error_agree);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          email: email.trim(), 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        login(data.token, data.user);
        window.location.href = `/${lang}`;
      } else {
        setError(data.error || dict.register.error_connection);
      }
    } catch {
      setError(dict.register.error_connection);
    } finally {
      setLoading(false);
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

      <div className="auth-container auth-container--register">
        <h1 className="auth-heading">
          <span className="auth-heading--gradient">Hảo Hán</span>{" "}
          <span className="auth-heading--smp">SMP</span>
        </h1>
        <p className="auth-subtitle">{dict.register.subtitle}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">{dict.register.email_label}</label>
            <div className="auth-input-wrapper">
              <i className="fas fa-envelope" />
              <input
                type="email"
                className="auth-input"
                placeholder={dict.register.email_placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">{dict.register.username_label}</label>
            <div className="auth-input-wrapper">
              <i className="fas fa-user" />
              <input
                type="text"
                className="auth-input"
                placeholder={dict.register.username_placeholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={16}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">{dict.register.password_label}</label>
            <div className="auth-input-wrapper">
              <i className="fas fa-lock" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder={dict.register.password_placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          <div className="auth-field">
            <label className="auth-label">{dict.register.confirm_password_label}</label>
            <div className="auth-input-wrapper">
              <i className="fas fa-shield-alt" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder={dict.register.confirm_password_placeholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <div className="auth-checkboxes">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={agreeRules}
                onChange={(e) => setAgreeRules(e.target.checked)}
              />
              <span>{dict.register.agree_rules} <button type="button" onClick={() => setShowRulesModal(true)} className="auth-link-btn">{dict.register.server_rules}</button>.</span>
            </label>
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
              />
              <span>{dict.register.agree_privacy} <a href="#" className="auth-link">{dict.register.privacy_policy}</a>.</span>
            </label>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin" /> : dict.register.submit}
          </button>
        </form>

        <p className="auth-footer-text">
          {dict.register.has_account}{' '}
          <a href={`/${lang}/login`} className="auth-link">{dict.register.login_link}</a>
        </p>
      </div>

      {showRulesModal && (
        <div className="rules-modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="rules-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal-header">
              <h2 className="rules-modal-title">{dict.rule.title}</h2>
              <button className="rules-modal-close" onClick={() => setShowRulesModal(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="rules-modal-body">
              <div className="rules-container" style={{ marginTop: 0 }}>
                {dict.rule.sections.map((section, si) => (
                  <div className="rules-section" key={si} style={{ marginBottom: '1.5rem' }}>
                    <h3 className="rules-heading">{section.heading}</h3>
                    {section.subsections.map((sub, subi) => (
                      <div className="rules-subsection" key={subi}>
                        {sub.title && <h4 className="rules-subtitle">{sub.title}</h4>}
                        <ul className="rules-list">
                          {sub.items.map((item, ii) => (
                            <li className="rules-item" key={ii}>
                              <span className="rules-item-text">{item.text}</span>
                              {item.sub && <span className="rules-item-sub">{item.sub}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="rules-modal-footer">
              <button type="button" className="btn-close-modal" onClick={() => setShowRulesModal(false)}>
                {dict.register.close_modal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
