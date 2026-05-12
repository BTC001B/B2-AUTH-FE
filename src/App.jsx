import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Mail, ShieldCheck, Settings, Activity, LogOut, 
  Smartphone, Monitor, Tablet, CheckCircle, AlertCircle, 
  Trash2, Edit3, Save, Plus, ChevronRight, User, Phone,
  Globe, Clock, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [sessions, setSessions] = useState([]);
  const [dashboardTab, setDashboardTab] = useState('emails'); // emails, sessions, settings, activity
  const [recoveryInfo, setRecoveryInfo] = useState({ recoveryEmail: '', phoneNumber: '' });
  const [isEditingRecovery, setIsEditingRecovery] = useState(false);

  const handleVerificationCallback = async (refId) => {
    setView('verifying');
    setLoading(true);
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      console.log("Polling for verification status...", refId);
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
        console.error("Poll error:", err);
        setError('Verification check failed');
        setLoading(false);
      }
    };
    poll();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('reference_id');
    const cid = params.get('client_id');
    const ruri = params.get('redirect_uri');

    // MANUAL ROUTE DETECTION: Check if we are on /verification-complete
    if (window.location.pathname === '/verification-complete' || refId) {
      if (refId) {
        handleVerificationCallback(refId);
        return;
      }
    }

    setClientId(cid || '');
    setRedirectUri(ruri || '');
    setState(params.get('state') || '');
    setRegistrationMode(params.get('mode') || '');

    // Session Restoration Logic
    const storedToken = localStorage.getItem('bnx_accessToken');
    const storedUser = localStorage.getItem('bnx_userData');
    
    // Only restore dashboard if NOT an OAuth request (no cid) and NOT a verification flow
    if (storedToken && storedUser && !refId && !cid) {
      try {
        const userData = JSON.parse(storedUser);
        setAccessToken(storedToken);
        setFormData(prev => ({
          ...prev,
          identifier: userData.email || userData.username || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        }));
        fetchEmails(storedToken);
        fetchSessions(storedToken);
        fetchRecoveryInfo(storedToken);
        setView('dashboard');
      } catch (err) {
        console.error("Failed to restore session", err);
        localStorage.clear();
      }
    }
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

  const fetchSessions = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setLoading(true);
    try {
      const res = await axios.delete(`${API_BASE}/auth/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        fetchSessions(accessToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke session');
    } finally {
      setLoading(false);
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

  const fetchRecoveryInfo = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/users/recovery`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRecoveryInfo(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch recovery info", err);
    }
  };

  const handleUpdateRecovery = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.patch(`${API_BASE}/users/recovery`, recoveryInfo, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setIsEditingRecovery(false);
        fetchRecoveryInfo(accessToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update recovery info');
    } finally {
      setLoading(false);
    }
  };

  const parseUserAgent = (ua) => {
    if (!ua) return { name: 'Unknown Device', type: 'monitor' };
    const lowerUA = ua.toLowerCase();
    
    if (lowerUA.includes('iphone')) return { name: 'iPhone', type: 'phone' };
    if (lowerUA.includes('android')) return { name: 'Android Phone', type: 'phone' };
    if (lowerUA.includes('ipad')) return { name: 'iPad', type: 'tablet' };
    if (lowerUA.includes('macintosh')) return { name: 'MacBook', type: 'monitor' };
    if (lowerUA.includes('windows')) return { name: 'Windows PC', type: 'monitor' };
    if (lowerUA.includes('linux')) return { name: 'Linux PC', type: 'monitor' };
    
    return { name: ua.split('/')[0] || 'Web Browser', type: 'monitor' };
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
          localStorage.setItem('bnx_accessToken', token);
          localStorage.setItem('bnx_userData', JSON.stringify({
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName
          }));
          
          setAccessToken(token);
          fetchEmails(token);
          fetchSessions(token);
          fetchRecoveryInfo(token);
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

  if (view === 'dashboard') {
    return (
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-logo">BNX</div>
          
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-item ${dashboardTab === 'emails' ? 'active' : ''}`}
              onClick={() => setDashboardTab('emails')}
            >
              <Mail size={20} />
              <span className="label">Mailboxes</span>
            </button>
            <button 
              className={`sidebar-item ${dashboardTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setDashboardTab('sessions')}
            >
              <ShieldCheck size={20} />
              <span className="label">Security</span>
            </button>
            <button 
              className={`sidebar-item ${dashboardTab === 'settings' ? 'active' : ''}`}
              onClick={() => setDashboardTab('settings')}
            >
              <Settings size={20} />
              <span className="label">Settings</span>
            </button>
            <button 
              className={`sidebar-item ${dashboardTab === 'activity' ? 'active' : ''}`}
              onClick={() => setDashboardTab('activity')}
            >
              <Activity size={20} />
              <span className="label">Activity</span>
            </button>
          </nav>

          <div className="sidebar-spacer"></div>
          
          <footer className="sidebar-footer">
            <div className="user-profile-mini">
              <div className="avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <div className="user-name">{formData.firstName || 'User'}</div>
                <div className="user-email">{formData.identifier}</div>
              </div>
            </div>
            <button className="sidebar-item logout" onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}>
              <LogOut size={20} />
              <span className="label">Sign Out</span>
            </button>
          </footer>
        </aside>

        <main className="dashboard-content">
          <AnimatePresence mode="wait">
            {dashboardTab === 'emails' && (
              <motion.div 
                key="emails"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="content-section"
              >
                <header className="section-header">
                  <h2>Email Identities</h2>
                  <p>Manage your linked mail accounts and primary address.</p>
                </header>
                <div className="card-list">
                  {userEmails.map(email => (
                    <div key={email.id} className={`glass-card email-card ${email.isPrimary ? 'primary' : ''}`}>
                      <div className="card-info">
                        <div className="card-main-text">
                          {email.email}
                          {email.isPrimary && <CheckCircle size={16} className="success-icon" />}
                        </div>
                        <div className="card-sub-text">{email.emailName} • {email.active ? 'Active' : 'Inactive'}</div>
                      </div>
                      <div className="card-actions">
                        {email.isPrimary ? (
                          <span className="status-pill primary">Primary</span>
                        ) : (
                          <button 
                            className="action-btn secondary" 
                            onClick={() => handleMakePrimary(email.id)}
                            disabled={loading}
                          >
                            Make Primary
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button className="add-card-btn">
                    <Plus size={20} />
                    <span>Add New Mailbox</span>
                  </button>
                </div>
              </motion.div>
            )}

            {dashboardTab === 'sessions' && (
              <motion.div 
                key="sessions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="content-section"
              >
                <header className="section-header">
                  <h2>Active Sessions</h2>
                  <p>Devices currently logged into your BNX Account.</p>
                </header>
                <div className="card-list">
                  {sessions.map(session => {
                    const device = parseUserAgent(session.userAgent);
                    return (
                      <div key={session.id} className={`glass-card session-card ${session.isCurrentSession ? 'current' : ''}`}>
                        <div className="device-icon">
                          {device.type === 'phone' ? <Smartphone size={24} /> : 
                           device.type === 'tablet' ? <Tablet size={24} /> : <Monitor size={24} />}
                        </div>
                        <div className="card-info">
                          <div className="card-main-text">
                            {device.name}
                            {session.isCurrentSession && <span className="current-indicator">Current</span>}
                          </div>
                          <div className="card-sub-text">
                            <div className="meta-item"><Globe size={12} /> {session.ipAddress}</div>
                            <div className="meta-item"><Monitor size={12} /> {session.userAgent?.split(' ')[0] || 'Browser'}</div>
                          </div>
                          <div className="card-meta-text">
                            <Clock size={12} /> Created: {new Date(session.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="card-actions">
                          {!session.isCurrentSession && (
                            <button 
                              className="action-btn danger"
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {dashboardTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="content-section"
              >
                <header className="section-header">
                  <h2>Account Settings</h2>
                  <p>Manage your recovery information and security preferences.</p>
                </header>
                
                <div className="settings-grid">
                  <div className="glass-card settings-card">
                    <div className="card-header">
                      <ShieldCheck size={20} className="accent-icon" />
                      <h3>Recovery Information</h3>
                    </div>
                    
                    <div className="settings-form">
                      <div className="settings-group">
                        <label>Recovery Email</label>
                        <div className="input-with-icon">
                          <Mail size={18} />
                          <input 
                            type="email" 
                            value={recoveryInfo.recoveryEmail || ''} 
                            onChange={(e) => setRecoveryInfo({...recoveryInfo, recoveryEmail: e.target.value})}
                            placeholder="Add recovery email"
                            disabled={!isEditingRecovery}
                          />
                        </div>
                      </div>

                      <div className="settings-group">
                        <label>Phone Number</label>
                        <div className="input-with-icon">
                          <Phone size={18} />
                          <input 
                            type="text" 
                            value={recoveryInfo.phoneNumber || ''} 
                            onChange={(e) => setRecoveryInfo({...recoveryInfo, phoneNumber: e.target.value})}
                            placeholder="Add phone number"
                            disabled={!isEditingRecovery}
                          />
                        </div>
                      </div>

                      <div className="settings-actions">
                        {isEditingRecovery ? (
                          <>
                            <button className="action-btn secondary" onClick={() => setIsEditingRecovery(false)}>Cancel</button>
                            <button className="action-btn primary-solid" onClick={handleUpdateRecovery} disabled={loading}>
                              <Save size={16} /> Save Changes
                            </button>
                          </>
                        ) : (
                          <button className="action-btn secondary" onClick={() => setIsEditingRecovery(true)}>
                            <Edit3 size={16} /> Edit Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card settings-card">
                    <div className="card-header">
                      <Settings size={20} className="accent-icon" />
                      <h3>Preferences</h3>
                    </div>
                    <div className="settings-placeholder">
                      <AlertCircle size={48} />
                      <p>Additional settings coming soon in the next update.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {dashboardTab === 'activity' && (
              <motion.div 
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="content-section"
              >
                <header className="section-header">
                  <h2>Recent Activity</h2>
                  <p>A log of important security events on your account.</p>
                </header>
                <div className="activity-placeholder">
                  <Activity size={64} />
                  <h3>Nothing to show yet</h3>
                  <p>Your recent sign-ins and security changes will appear here.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="google-auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="bnx-logo">BNX</div>
          {clientId && (
            <div className="oauth-client-info animate-fade-in">
              <span className="client-label">Sign in to</span>
              <span className="client-name">{clientId}</span>
            </div>
          )}
          <h1>
            {view === 'verifying' ? 'Security Check' :
             view.startsWith('login') ? 'Sign in' : 'Create account'}
          </h1>
          <p>
            {view === 'verifying' ? 'Verifying your status' :
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

          {view === 'verifying' && (
            <div className="auth-step verifying-view">
              <div className="premium-spinner"></div>
              <h3>Security Check</h3>
              <p>We're verifying your identity with Cashfree. This only takes a moment.</p>
              {verificationStatus && (verificationStatus.toUpperCase() === 'SUCCESS' || verificationStatus.toUpperCase() === 'VERIFIED') && (
                <div className="success-badge">Verification Successful! Updating your account...</div>
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
