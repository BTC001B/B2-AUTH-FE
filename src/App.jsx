import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [view, setView] = useState('login-email'); // login-email, login-password, signup-profile, signup-mail
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OAuth Context
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [state, setState] = useState('');
  const [registrationMode, setRegistrationMode] = useState(''); // business, child, public

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
    confirmPassword: '',
    // Business specific
    businessName: '',
    businessType: '',
    registrationNumber: '',
    ownerFirstName: '',
    ownerLastName: '',
    domain: '',
    // Child specific
    dob: '',
  });

  const [tempToken, setTempToken] = useState('');
  const [recoveryOptions, setRecoveryOptions] = useState(null);
  const [selectedRecoveryMethod, setSelectedRecoveryMethod] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setClientId(params.get('client_id') || '');
    setRedirectUri(params.get('redirect_uri') || '');
    setState(params.get('state') || '');
    setRegistrationMode(params.get('mode') || '');
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- LOGIN FLOW ---
  const proceedToPassword = () => {
    if (!formData.identifier) {
      setError('Enter an email');
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
        const userData = loginRes.data.data;
        const accessToken = userData.accessToken;
        const userAccountType = userData.accountType;
        
        // 2. Validate account type for business/child modes
        if (registrationMode === 'business' && userAccountType !== 'BUSINESS') {
          setError('This application requires a Business account. Please log in with a Business account or create a new one.');
          setLoading(false);
          return;
        }

        if (registrationMode === 'child' && userAccountType !== 'CHILD') {
          setError('This application is restricted to Child accounts.');
          setLoading(false);
          return;
        }

        // 3. If it's an OAuth flow, authorize the client
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
  const handleCreateAccountClick = () => {
    if (registrationMode === 'business') {
      setView('signup-business');
    } else if (registrationMode === 'child') {
      setView('signup-child');
    } else if (registrationMode === 'public') {
      setView('signup-profile');
    } else {
      setView('signup-selection');
    }
  };

  const handleRegisterProfile = async (e, type = 'PERSONAL') => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    let payload = {
      username: formData.username,
      password: formData.password,
      mode: type
    };

    if (type === 'BUSINESS') {
      payload = {
        ...payload,
        businessName: formData.businessName,
        businessType: formData.businessType,
        registrationNumber: formData.registrationNumber,
        ownerFirstName: formData.ownerFirstName,
        ownerLastName: formData.ownerLastName,
        domain: formData.domain || 'bnxmail.com'
      };
    } else {
      payload = {
        ...payload,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob // Will be used by backend to mark as CHILD if < 18
      };
    }

    try {
      const regRes = await axios.post(`${API_BASE}/auth/register`, payload);

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
        setView('forgot-password-otp');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password/verify-otp`, {
        identifier: formData.identifier,
        otp: formData.otp
      });
      if (res.data.success) {
        setView('forgot-password-reset');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

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
        setFormData({ ...formData, password: '', otp: '', newPassword: '', confirmPassword: '' });
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
            {view === 'signup-selection' && 'Choose your account type'}
            {view === 'signup-profile' && 'Create a Personal BNX Account'}
            {view === 'signup-child' && 'Create an account for your child'}
            {view === 'signup-business' && 'Create a BNX Business Account'}
            {view === 'signup-mail' && 'Choose your @bnxmail.com address'}
            {view === 'forgot-password-options' && 'Account Recovery'}
            {view === 'forgot-password-otp' && 'Verify your identity'}
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
                  placeholder=" "
                />
                <label>Email</label>
              </div>
              <div className="forgot-link">Forgot email?</div>
              <p className="helper-text">
                Not your computer? Use Guest mode to sign in privately. <a href="#">Learn more</a>
              </p>
              <div className="auth-actions">
                <button className="text-btn" onClick={handleCreateAccountClick}>Create account</button>
                <button className="primary-btn" onClick={() => {
                  if (!formData.identifier) {
                    setError('Enter an email');
                    return;
                  }
                  setView('login-password');
                }}>Next</button>
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
                  placeholder=" "
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

          {/* SIGNUP STEP 0: SELECTION */}
          {view === 'signup-selection' && (
            <div className="auth-step">
              <div className="selection-grid">
                <div className="selection-card" onClick={() => setView('signup-profile')}>
                  <div className="selection-icon">👤</div>
                  <div className="selection-info">
                    <strong>For myself</strong>
                    <span>Use for your personal needs</span>
                  </div>
                </div>
                <div className="selection-card" onClick={() => setView('signup-child')}>
                  <div className="selection-icon">👶</div>
                  <div className="selection-info">
                    <strong>For my child</strong>
                    <span>Manage an account for your child</span>
                  </div>
                </div>
                <div className="selection-card" onClick={() => setView('signup-business')}>
                  <div className="selection-icon">💼</div>
                  <div className="selection-info">
                    <strong>To manage my business</strong>
                    <span>For your company or organization</span>
                  </div>
                </div>
              </div>
              <div className="auth-actions" style={{marginTop: '20px'}}>
                <button className="text-btn" onClick={() => setView('login-email')}>Back</button>
              </div>
            </div>
          )}

          {/* SIGNUP STEP 1: PERSONAL PROFILE */}
          {view === 'signup-profile' && (
            <form onSubmit={(e) => handleRegisterProfile(e, 'PERSONAL')} className="auth-step">
              <div className="name-grid">
                <div className="input-group">
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder=" " />
                  <label>First name</label>
                </div>
                <div className="input-group">
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder=" " />
                  <label>Last name</label>
                </div>
              </div>
              <div className="input-group">
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder=" " />
                <label>Username</label>
              </div>
              <div className="input-group">
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " />
                <label>Password</label>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating...' : 'Next'}</button>
              </div>
            </form>
          )}

          {/* SIGNUP STEP 1: CHILD PROFILE */}
          {view === 'signup-child' && (
            <form onSubmit={(e) => handleRegisterProfile(e, 'PERSONAL')} className="auth-step">
              <div className="name-grid">
                <div className="input-group">
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder=" " />
                  <label>First name</label>
                </div>
                <div className="input-group">
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder=" " />
                  <label>Last name</label>
                </div>
              </div>
              <div className="input-group">
                <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required placeholder=" " />
                <label>Date of Birth</label>
              </div>
              <div className="input-group">
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder=" " />
                <label>Username</label>
              </div>
              <div className="input-group">
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " />
                <label>Password</label>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating...' : 'Next'}</button>
              </div>
            </form>
          )}

          {/* SIGNUP STEP 1: BUSINESS PROFILE */}
          {view === 'signup-business' && (
            <form onSubmit={(e) => handleRegisterProfile(e, 'BUSINESS')} className="auth-step">
              <div className="input-group">
                <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} required placeholder=" " />
                <label>Business name</label>
              </div>
              <div className="name-grid">
                <div className="input-group">
                  <input type="text" name="businessType" value={formData.businessType} onChange={handleInputChange} required placeholder=" " />
                  <label>Business Type</label>
                </div>
                <div className="input-group">
                  <input type="text" name="domain" value={formData.domain} onChange={handleInputChange} required placeholder=" " />
                  <label>Business Domain (e.g. company.com)</label>
                </div>
              </div>
              <div className="input-group">
                <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required placeholder=" " />
                <label>Reg. Number (GST/VAT)</label>
              </div>
              <div className="name-grid">
                <div className="input-group">
                  <input type="text" name="ownerFirstName" value={formData.ownerFirstName} onChange={handleInputChange} required placeholder=" " />
                  <label>Owner First name</label>
                </div>
                <div className="input-group">
                  <input type="text" name="ownerLastName" value={formData.ownerLastName} onChange={handleInputChange} required placeholder=" " />
                  <label>Owner Last name</label>
                </div>
              </div>
              <div className="input-group">
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder=" " />
                <label>Username (Admin)</label>
              </div>
              <div className="input-group">
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " />
                <label>Password</label>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating...' : 'Next'}</button>
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

          {/* FORGOT PASSWORD STEP 2: VERIFY OTP */}
          {view === 'forgot-password-otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-step">
              <p className="helper-text" style={{marginBottom: '20px'}}>
                Enter the 6-digit verification code sent to your {selectedRecoveryMethod === 'EMAIL' ? 'email' : 'phone'}.
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
                  placeholder=" "
                />
                <label>Verification Code</label>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('forgot-password-options')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD STEP 3: RESET PASSWORD */}
          {view === 'forgot-password-reset' && (
            <form onSubmit={handleResetPassword} className="auth-step">
              <p className="helper-text" style={{marginBottom: '20px'}}>
                Choose a strong, secure password that you don't use for other accounts.
              </p>
              <div className="input-group">
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  autoFocus
                  placeholder=" "
                />
                <label>New Password</label>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder=" "
                />
                <label>Confirm Password</label>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('forgot-password-otp')}>Back</button>
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
