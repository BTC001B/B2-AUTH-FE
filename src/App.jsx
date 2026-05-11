import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [view, setView] = useState('login-email'); // login-email, login-password, signup-selection, signup-profile, signup-child, signup-business, signup-mail, dashboard, verifying
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OAuth Context
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [state, setState] = useState('');
  const [registrationMode, setRegistrationMode] = useState(''); // business, child, public

  // Form Data
  const [formData, setFormData] = useState({
    identifier: '', password: '', username: '', firstName: '', lastName: '',
    emailName: '', otp: '', newPassword: '', confirmPassword: '',
    businessName: '', businessType: '', registrationNumber: '',
    ownerFirstName: '', ownerLastName: '', domain: '', dob: '',
  });

  const [tempToken, setTempToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userEmails, setUserEmails] = useState([]);
  const [recoveryOptions, setRecoveryOptions] = useState(null);
  const [selectedRecoveryMethod, setSelectedRecoveryMethod] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);

  const handleVerificationCallback = async (refId) => {
    setView('verifying');
    setLoading(true);
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      try {
        const res = await axios.get(`${API_BASE}/verification/status/${refId}`);
        if (res.data.success) {
          const status = res.data.data.status;
          setVerificationStatus(status);
          
          const upperStatus = status ? status.toUpperCase() : "";
          if (upperStatus === 'SUCCESS' || upperStatus === 'AUTHENTICATED' || upperStatus === 'VERIFIED') {
            setTimeout(() => {
              window.location.href = window.location.origin;
            }, 3000);
            setLoading(false);
          } else if (upperStatus === 'PENDING' && attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 3000);
          } else {
            setLoading(false);
            if (upperStatus !== 'PENDING') {
              setError(`Verification failed: ${status}`);
            } else {
              setError('Verification timed out. Please refresh the page to check again.');
            }
          }
        }
      } catch (err) {
        setError('Verification check failed');
        setLoading(false);
      }
    };
    poll();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('reference_id');

    // MANUAL ROUTE DETECTION: Check if we are on /verification-complete
    if (window.location.pathname === '/verification-complete' || refId) {
      if (refId) {
        handleVerificationCallback(refId);
        return;
      }
    }

    setClientId(params.get('client_id') || '');
    setRedirectUri(params.get('redirect_uri') || '');
    setState(params.get('state') || '');
    setRegistrationMode(params.get('mode') || '');
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // API CALLS
  const fetchEmails = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/emails/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserEmails(res.data.data.emails);
      }
    } catch (err) {
      console.error("Failed to fetch emails", err);
    }
  };

  const handleMakePrimary = async (emailId) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/verification/initiate/${emailId}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data.success) {
        window.location.href = res.data.data.redirectUrl;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate verification');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: formData.identifier,
        password: formData.password
      });

      if (loginRes.data.success) {
        const userData = loginRes.data.data;
        const token = userData.accessToken;
        const userAccountType = userData.accountType;

        if (registrationMode === 'business' && userAccountType !== 'BUSINESS') {
          setError('This application requires a Business account.');
          setLoading(false);
          return;
        }

        if (registrationMode === 'child' && userAccountType !== 'CHILD') {
          setError('This application is restricted to Child accounts.');
          setLoading(false);
          return;
        }

        const isB2AuthFlow = window.location.hostname.includes('b2auth.com') || window.location.hostname === 'localhost';

        if (isB2AuthFlow && !clientId) {
          setAccessToken(token);
          fetchEmails(token);
          setView('dashboard');
        } else if (clientId && redirectUri) {
          const authRes = await axios.post(
            `${API_BASE}/oauth/authorize`,
            { clientId, redirectUri, state },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (authRes.data.success) {
            const code = authRes.data.data.code;
            window.location.href = `${redirectUri}?code=${code}&state=${state}`;
          }
        } else {
          window.location.href = 'https://mail.bnxmail.com';
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountClick = () => {
    if (registrationMode === 'business') setView('signup-business');
    else if (registrationMode === 'child') setView('signup-child');
    else if (registrationMode === 'public') setView('signup-profile');
    else setView('signup-selection');
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
      payload = { ...payload, businessName: formData.businessName, businessType: formData.businessType, registrationNumber: formData.registrationNumber, ownerFirstName: formData.ownerFirstName, ownerLastName: formData.ownerLastName, domain: formData.domain };
    } else {
      payload = { ...payload, firstName: formData.firstName, lastName: formData.lastName, dob: formData.dob };
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
        { emailName: formData.emailName, password: formData.password, isPrimary: true },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      if (mailRes.data.success) {
        setFormData({ ...formData, identifier: mailRes.data.data.email });
        setView('login-password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = async () => {
    let identifier = formData.identifier;
    if (!identifier) {
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          identifier = profile.email || profile.username;
          setFormData({ ...formData, identifier });
        } catch (e) { }
      }
    }
    if (!identifier) {
      setError('Please enter your email or username first.');
      setView('login-email');
      return;
    }
    setLoading(true);
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
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password/send-otp`, { identifier: formData.identifier, method });
      if (res.data.success) setView('forgot-password-otp');
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
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password/verify-otp`, { identifier: formData.identifier, otp: formData.otp });
      if (res.data.success) setView('forgot-password-reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
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
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, { identifier: formData.identifier, otp: formData.otp, newPassword: formData.newPassword });
      if (res.data.success) {
        setView('login-password');
        alert('Password reset successfully.');
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
            {view === 'verifying' ? 'Security Check' :
             view === 'dashboard' ? 'My BNX Account' : 
             view.startsWith('login') ? 'Sign in' : 'Create account'}
          </h1>
          <p>
            {view === 'verifying' ? 'Verifying your status' :
             view === 'dashboard' ? 'Manage your emails' : 
             view === 'login-email' ? 'Use your BNX Account' : 
             view === 'login-password' ? `Welcome, ${formData.identifier}` : 'Enter your details'}
          </p>
        </div>

        <div className="auth-body">
          {error && <div className="error-badge">{error}</div>}

          {view === 'login-email' && (
            <div className="auth-step">
              <div className="input-group">
                <input type="text" name="identifier" value={formData.identifier} onChange={handleInputChange} required placeholder=" " />
                <label>Email</label>
              </div>
              <div className="forgot-link">Forgot email?</div>
              <div className="auth-actions">
                <button className="text-btn" onClick={handleCreateAccountClick}>Create account</button>
                <button className="primary-btn" onClick={() => setView('login-password')}>Next</button>
              </div>
            </div>
          )}

          {view === 'login-password' && (
            <form onSubmit={handleLogin} className="auth-step">
              <div className="user-chip" onClick={() => setView('login-email')}>
                <div className="avatar">{formData.identifier.charAt(0).toUpperCase()}</div>
                <span>{formData.identifier}</span>
              </div>
              <div className="input-group">
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required autoFocus placeholder=" " />
                <label>Enter your password</label>
              </div>
              <div className="forgot-link" onClick={handleForgotPasswordClick} style={{ cursor: 'pointer' }}>Forgot password?</div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('login-email')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
              </div>
            </form>
          )}

          {view === 'signup-selection' && (
            <div className="auth-step">
              <div className="selection-grid">
                <div className="selection-card" onClick={() => setView('signup-profile')}>
                  <div className="selection-icon">👤</div>
                  <div className="selection-info"><strong>For myself</strong></div>
                </div>
                <div className="selection-card" onClick={() => setView('signup-child')}>
                  <div className="selection-icon">👶</div>
                  <div className="selection-info"><strong>For my child</strong></div>
                </div>
                <div className="selection-card" onClick={() => setView('signup-business')}>
                  <div className="selection-icon">💼</div>
                  <div className="selection-info"><strong>For business</strong></div>
                </div>
              </div>
            </div>
          )}

          {view === 'signup-profile' && (
            <form onSubmit={(e) => handleRegisterProfile(e, 'PERSONAL')} className="auth-step">
              <div className="name-grid">
                <div className="input-group"><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder=" " /><label>First name</label></div>
                <div className="input-group"><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder=" " /><label>Last name</label></div>
              </div>
              <div className="input-group"><input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder=" " /><label>Username</label></div>
              <div className="input-group"><input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " /><label>Password</label></div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>Next</button>
              </div>
            </form>
          )}

          {view === 'signup-business' && (
            <form onSubmit={(e) => handleRegisterProfile(e, 'BUSINESS')} className="auth-step">
              <div className="input-group"><input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} required placeholder=" " /><label>Business name</label></div>
              <div className="input-group"><input type="text" name="businessType" value={formData.businessType} onChange={handleInputChange} required placeholder=" " /><label>Business Type</label></div>
              <div className="input-group"><input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} placeholder=" " /><label>Reg. Number</label></div>
              <div className="name-grid">
                <div className="input-group"><input type="text" name="ownerFirstName" value={formData.ownerFirstName} onChange={handleInputChange} required placeholder=" " /><label>Owner First name</label></div>
                <div className="input-group"><input type="text" name="ownerLastName" value={formData.ownerLastName} onChange={handleInputChange} required placeholder=" " /><label>Owner Last name</label></div>
              </div>
              <div className="input-group"><input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder=" " /><label>Username (Admin)</label></div>
              <div className="input-group"><input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " /><label>Password</label></div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>Next</button>
              </div>
            </form>
          )}

          {view === 'signup-child' && (
            <form onSubmit={(e) => handleRegisterProfile(e, 'CHILD')} className="auth-step">
              <div className="name-grid">
                <div className="input-group"><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder=" " /><label>First name</label></div>
                <div className="input-group"><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder=" " /><label>Last name</label></div>
              </div>
              <div className="input-group"><input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required placeholder=" " /><label>Date of Birth</label></div>
              <div className="input-group"><input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder=" " /><label>Username</label></div>
              <div className="input-group"><input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " /><label>Password</label></div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>Next</button>
              </div>
            </form>
          )}

          {view === 'signup-mail' && (
            <form onSubmit={handleCreateMailbox} className="auth-step">
              <div className="input-group-mail">
                <input type="text" name="emailName" value={formData.emailName} onChange={handleInputChange} required placeholder="Choose your handle" />
                <span className="domain-suffix">@bnxmail.com</span>
              </div>
              <div className="auth-actions">
                <button type="submit" className="primary-btn" disabled={loading}>Create Email</button>
              </div>
            </form>
          )}

          {view === 'forgot-password-options' && (
            <div className="auth-step">
              {recoveryOptions?.recoveryEmail && <div className="recovery-option" onClick={() => handleSendOtp('EMAIL')}>📧 Email to {recoveryOptions.recoveryEmail}</div>}
              {recoveryOptions?.phoneNumber && <div className="recovery-option" onClick={() => handleSendOtp('PHONE')}>📱 SMS to {recoveryOptions.phoneNumber}</div>}
              <div className="auth-actions"><button className="text-btn" onClick={() => setView('login-password')}>Back</button></div>
            </div>
          )}

          {view === 'forgot-password-otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-step">
              <div className="input-group"><input type="text" name="otp" value={formData.otp} onChange={handleInputChange} required placeholder=" " /><label>Verification Code</label></div>
              <div className="auth-actions"><button type="submit" className="primary-btn">Verify</button></div>
            </form>
          )}

          {view === 'forgot-password-reset' && (
            <form onSubmit={handleResetPassword} className="auth-step">
              <div className="input-group"><input type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} required placeholder=" " /><label>New Password</label></div>
              <div className="input-group"><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required placeholder=" " /><label>Confirm Password</label></div>
              <div className="auth-actions"><button type="submit" className="primary-btn">Reset</button></div>
            </form>
          )}

          {view === 'dashboard' && (
            <div className="auth-step dashboard-view">
              <div className="dashboard-header"><h3>Manage Emails</h3><p>Verify your Aadhaar to promote a secondary email.</p></div>
              <div className="email-list">
                {userEmails.map(email => (
                  <div key={email.id} className="email-item">
                    <div className="email-info"><div className="email-addr">{email.email}</div></div>
                    <div className="email-action">
                      {email.isPrimary ? <span className="badge-primary">Primary</span> : 
                      <button className="btn-outline-small" onClick={() => handleMakePrimary(email.id)} disabled={loading}>Make Primary</button>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="auth-actions"><button className="text-btn" onClick={() => window.location.reload()}>Sign Out</button></div>
            </div>
          )}

          {view === 'verifying' && (
            <div className="auth-step verifying-view">
              <div className="spinner-large"></div>
              <h3>Verifying...</h3>
              <p>Checking status with Cashfree. Please wait.</p>
              {verificationStatus && (verificationStatus.toUpperCase() === 'SUCCESS' || verificationStatus.toUpperCase() === 'VERIFIED') && (
                <div className="success-badge">Successful! Updating your account...</div>
              )}
            </div>
          )}
        </div>

        <div className="auth-footer">
          <div className="footer-left">English (United States)</div>
          <div className="footer-right"><span>Help</span><span>Privacy</span><span>Terms</span></div>
        </div>
      </div>
    </div>
  );
}

export default App;
