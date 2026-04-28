import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [view, setView] = useState('login-email'); // login-email, login-password, signup-profile, signup-mail
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  console.log(API_BASE)
  
  // OAuth Context
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [state, setState] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    identifier: '', // email or username for login
    password: '',
    username: '',   // for signup
    firstName: '',
    lastName: '',
    emailName: '',  // for bnxmail address
    otp: '',
    newPassword: '',
  });

  const [tempToken, setTempToken] = useState('');
  const [recoveryOptions, setRecoveryOptions] = useState(null);
  const [selectedRecoveryMethod, setSelectedRecoveryMethod] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setClientId(params.get('client_id') || '');
    setRedirectUri(params.get('redirect_uri') || '');
    setState(params.get('state') || '');
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- LOGIN FLOW ---
  const proceedToPassword = () => {
    if (!formData.identifier) {
      setError('Enter an email or username');
      return;
    }
    setView('login-password');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate with backend
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: formData.identifier,
        password: formData.password
      });

      if (loginRes.data.success) {
        const accessToken = loginRes.data.data.accessToken;
        
        // 2. If it's an OAuth flow, authorize the client
        if (clientId && redirectUri) {
          const authRes = await axios.post(
            `${API_BASE}/oauth/authorize`,
            { clientId, redirectUri, state },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (authRes.data.success) {
            const code = authRes.data.data.code;
            window.location.href = `${redirectUri}?code=${code}&state=${state}`;
          }
        } else {
          // Normal login redirect (fallback)
          window.location.href = 'https://mail.bnxmail.com'; // Default Mail Dashboard
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP FLOW ---
  const handleRegisterProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const regRes = await axios.post(`${API_BASE}/auth/register`, {
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        mode: 'PERSONAL'
      });

      if (regRes.data.success) {
        setTempToken(regRes.data.data.tempToken);
        setView('signup-mail');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMailbox = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const mailRes = await axios.post(
        `${API_BASE}/emails/create`,
        {
          emailName: formData.emailName,
          password: formData.password,
          isPrimary: true
        },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      if (mailRes.data.success) {
        // Success! Now log in with the new account
        setFormData({ ...formData, identifier: mailRes.data.data.email });
        setView('login-password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email creation failed');
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD FLOW ---
  const handleForgotPasswordClick = async () => {
    let identifier = formData.identifier;
    if (!identifier) {
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          identifier = profile.email || profile.username;
          setFormData({ ...formData, identifier });
        } catch (e) {}
      }
    }

    if (!identifier) {
      setError('Please enter your email or username first.');
      setView('login-email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/auth/forgot-password/options?identifier=${identifier}`);
      if (res.data.success) {
        setRecoveryOptions(res.data.data);
        setView('forgot-password-options');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recovery options');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (method) => {
    setSelectedRecoveryMethod(method);
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password/send-otp`, {
        identifier: formData.identifier,
        method: method
      });
      if (res.data.success) {
        setView('forgot-password-verify');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, {
        identifier: formData.identifier,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      if (res.data.success) {
        setView('login-password');
        setFormData({ ...formData, password: '', otp: '', newPassword: '' });
        alert('Password reset successfully. Please log in with your new password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="google-auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="bnx-logo">BNX</div>
          <h1>
            {view.startsWith('login') ? 'Sign in' : 'Create account'}
          </h1>
          <p>
            {view === 'login-email' && 'Use your BNX Account'}
            {view === 'login-password' && `Welcome, ${formData.identifier}`}
            {view === 'signup-profile' && 'Start your journey with BNX'}
            {view === 'signup-mail' && 'Choose your @bnxmail.com address'}
            {view === 'forgot-password-options' && 'Account Recovery'}
            {view === 'forgot-password-verify' && 'Verify your identity'}
            {view === 'forgot-password-reset' && 'Create a new password'}
          </p>
        </div>

        <div className="auth-body">
          {error && <div className="error-badge">{error}</div>}

          {/* LOGIN STEP 1: EMAIL */}
          {view === 'login-email' && (
            <div className="auth-step">
              <div className="input-group">
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  required
                />
                <label>Email or username</label>
              </div>
              <div className="forgot-link">Forgot email?</div>
              <p className="helper-text">
                Not your computer? Use Guest mode to sign in privately. <a href="#">Learn more</a>
              </p>
              <div className="auth-actions">
                <button className="text-btn" onClick={() => setView('signup-profile')}>Create account</button>
                <button className="primary-btn" onClick={proceedToPassword}>Next</button>
              </div>
            </div>
          )}

          {/* LOGIN STEP 2: PASSWORD */}
          {view === 'login-password' && (
            <form onSubmit={handleLogin} className="auth-step">
              <div className="user-chip" onClick={() => setView('login-email')}>
                <div className="avatar">{formData.identifier.charAt(0).toUpperCase()}</div>
                <span>{formData.identifier}</span>
                <i className="chevron-down"></i>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoFocus
                />
                <label>Enter your password</label>
              </div>
              <div className="forgot-link" onClick={handleForgotPasswordClick} style={{cursor: 'pointer'}}>Forgot password?</div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('login-email')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP STEP 1: PROFILE */}
          {view === 'signup-profile' && (
            <form onSubmit={handleRegisterProfile} className="auth-step">
              <div className="name-grid">
                <div className="input-group">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  <label>First name</label>
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                  <label>Last name</label>
                </div>
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
                <label>Username</label>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <label>Password</label>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('login-email')}>Sign in instead</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Creating...' : 'Next'}
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP STEP 2: MAILBOX */}
          {view === 'signup-mail' && (
            <form onSubmit={handleCreateMailbox} className="auth-step">
              <div className="input-group-mail">
                <input
                  type="text"
                  name="emailName"
                  value={formData.emailName}
                  onChange={handleInputChange}
                  required
                  placeholder="Choose your handle"
                />
                <span className="domain-suffix">@bnxmail.com</span>
              </div>
              <p className="helper-text">This will be your official email address. You can change your primary email later.</p>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-profile')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Setting up...' : 'Create Email'}
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD STEP 1: OPTIONS */}
          {view === 'forgot-password-options' && (
            <div className="auth-step">
              <p className="helper-text" style={{marginBottom: '20px'}}>
                How do you want to receive the password reset code?
              </p>
              
              {recoveryOptions?.recoveryEmail && (
                <div className="recovery-option" onClick={() => handleSendOtp('EMAIL')}>
                  <div className="recovery-icon">📧</div>
                  <div className="recovery-text">
                    <strong>Get an email</strong>
                    <span>Send an email to {recoveryOptions.recoveryEmail}</span>
                  </div>
                </div>
              )}
              
              {recoveryOptions?.phoneNumber && (
                <div className="recovery-option" onClick={() => handleSendOtp('PHONE')}>
                  <div className="recovery-icon">📱</div>
                  <div className="recovery-text">
                    <strong>Get a text message</strong>
                    <span>Send an SMS to {recoveryOptions.phoneNumber}</span>
                  </div>
                </div>
              )}

              {(!recoveryOptions?.recoveryEmail && !recoveryOptions?.phoneNumber) && (
                <p className="helper-text error-badge">
                  No recovery methods are associated with this account. Please contact support.
                </p>
              )}

              <div className="auth-actions" style={{marginTop: '20px'}}>
                <button className="text-btn" onClick={() => setView('login-password')}>Back to Sign In</button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD STEP 2: VERIFY AND RESET */}
          {view === 'forgot-password-verify' && (
            <form onSubmit={handleResetPassword} className="auth-step">
              <p className="helper-text" style={{marginBottom: '20px'}}>
                Enter the verification code sent to your {selectedRecoveryMethod === 'EMAIL' ? 'email' : 'phone'}.
              </p>
              <div className="input-group">
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  autoFocus
                  maxLength="6"
                />
                <label>Verification Code</label>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                />
                <label>New Password</label>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('forgot-password-options')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="auth-footer">
          <div className="footer-left">English (United States)</div>
          <div className="footer-right">
            <span>Help</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
