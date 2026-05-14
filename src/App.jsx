import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Mail, ShieldCheck, Settings, Activity, LogOut, 
  Smartphone, Monitor, Tablet, CheckCircle, AlertCircle, 
  Trash2, Edit3, Save, Plus, ChevronRight, ChevronDown, User, Phone,
  Globe, Clock, MapPin, Briefcase,
  LockIcon,
  LockOpenIcon,
  Check,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import betaLogo from './assets/beta2.png';
import authLogo from './assets/auth2.png';
import * as OTPAuth from 'otpauth';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from "html5-qrcode";
import './App.css';

const AuthenticatorCode = ({ secret }) => {
  const [code, setCode] = useState('000000');
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: "BNX",
        label: "Account",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const update = () => {
        setCode(totp.generate());
        setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30));
      };

      update();
      const timer = setInterval(update, 1000);
      return () => clearInterval(timer);
    } catch (e) {
      console.error("Invalid secret", e);
    }
  }, [secret]);

  return (
    <div className="auth-code-box">
      <span className="auth-code">{code.slice(0,3)} {code.slice(3)}</span>
      <div className="auth-timer-container">
        <div className="auth-timer-bar" style={{ width: `${(timeLeft / 30) * 100}%`, backgroundColor: timeLeft < 5 ? '#ef4444' : '#4f46e5' }}></div>
      </div>
    </div>
  );
};

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
  const [externalSessions, setExternalSessions] = useState([]);
  const [accounts, setAccounts] = useState(() => JSON.parse(localStorage.getItem('bnx_accounts') || '[]'));
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('emails'); // emails, sessions, settings, activity
  const [language, setLanguage] = useState('English (US)');
  const [recoveryInfo, setRecoveryInfo] = useState({ recoveryEmail: '', phoneNumber: '' });
  const [isEditingRecovery, setIsEditingRecovery] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);
  const [authenticatorAccounts, setAuthenticatorAccounts] = useState([]);
  const [showAddAuthModal, setShowAddAuthModal] = useState(false);
  const [addAuthMode, setAddAuthMode] = useState('scan'); // 'scan' or 'manual'
  const [manualAuthData, setManualAuthData] = useState({ name: '', secret: '' });

  const saveAccount = (token, userData) => {
    const storedAccounts = JSON.parse(localStorage.getItem('bnx_accounts') || '[]');
    // Avoid duplicates by email/username
    const filteredAccounts = storedAccounts.filter(acc => acc.userData.email !== userData.email);
    const updatedAccounts = [{ token, userData }, ...filteredAccounts];
    localStorage.setItem('bnx_accounts', JSON.stringify(updatedAccounts));
    localStorage.setItem('bnx_accessToken', token);
    localStorage.setItem('bnx_userData', JSON.stringify(userData));
    setAccounts(updatedAccounts);
  };

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
    const storedAccounts = JSON.parse(localStorage.getItem('bnx_accounts') || '[]');
    setAccounts(storedAccounts);
    
    // 1. If it's an OAuth flow (cid present) and we have accounts, show selection
    if (cid && storedAccounts.length > 0) {
      setView('account-selection');
      return;
    }

    // 2. Regular Session Restoration
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
        fetchExternalSessions(storedToken);
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

  const fetchExternalSessions = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/auth/sessions/external`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setExternalSessions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch external sessions", err);
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

  const fetchAuthenticatorAccounts = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/users/2fa/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAuthenticatorAccounts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch authenticator accounts", err);
    }
  };

  useEffect(() => {
    let scanner = null;
    if (showAddAuthModal && addAuthMode === 'scan') {
      scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
      }, false);

      const onScanSuccess = (decodedText) => {
        scanner.clear();
        handleProcessQR(decodedText);
      };

      const onScanError = (err) => {
        // Ignore errors
      };

      scanner.render(onScanSuccess, onScanError);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Scanner clear failed", e));
      }
    };
  }, [showAddAuthModal, addAuthMode]);

  const handleProcessQR = (text) => {
    if (text.startsWith('otpauth://')) {
      try {
        const url = new URL(text);
        const name = decodeURIComponent(url.pathname.split(':').pop() || 'New Account');
        const secret = url.searchParams.get('secret');
        if (secret) {
          handleAddAuthenticatorAccount(name, secret);
        }
      } catch (e) {
        setError("Invalid QR Code format");
      }
    } else {
      // Assume raw secret
      setManualAuthData({ ...manualAuthData, secret: text });
      setAddAuthMode('manual');
    }
  };

  const handleAddAuthenticatorAccount = async (name, secret) => {
    try {
      const res = await axios.post(`${API_BASE}/users/2fa/accounts`, {
        name, secret
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setShowAddAuthModal(false);
        fetchAuthenticatorAccounts(accessToken);
        setManualAuthData({ name: '', secret: '' });
      }
    } catch (err) {
      setError("Failed to add account");
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

  const handleSelectAccount = async (account) => {
    setLoading(true);
    const { token, userData } = account;
    
    // Set as active session
    localStorage.setItem('bnx_accessToken', token);
    localStorage.setItem('bnx_userData', JSON.stringify(userData));
    setAccessToken(token);
    
    if (clientId && redirectUri) {
      try {
        const authRes = await axios.post(
          `${API_BASE}/oauth/authorize`,
          { clientId, redirectUri, state },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (authRes.data.success) {
          const code = authRes.data.data.code;
          window.location.href = `${redirectUri}?code=${code}&state=${state}`;
        }
      } catch (err) {
        setError('Session expired. Please log in again.');
        // Remove expired from list
        const updated = accounts.filter(acc => acc.userData.email !== userData.email);
        setAccounts(updated);
        localStorage.setItem('bnx_accounts', JSON.stringify(updated));
        setView('login-email');
      } finally {
        setLoading(false);
      }
    } else {
      fetchEmails(token);
      fetchSessions(token);
      fetchExternalSessions(token);
      fetchRecoveryInfo(token);
      setView('dashboard');
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

  const normalizeIdentifier = (id) => {
    if (!id) return id;
    if (id.includes('@')) return id;
    return `${id}@bnxmail.com`;
  };

  const validatePassword = (password) => {
    if (!password) return { isValid: false, requirements: { minLength: false, hasUpper: false, hasNumber: false, hasSpecial: false } };
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return {
      isValid: minLength && hasUpper && hasNumber && hasSpecial,
      requirements: { minLength, hasUpper, hasNumber, hasSpecial }
    };
  };

  const PasswordRequirements = ({ password }) => {
    const { requirements } = validatePassword(password);
    
    const missing = [];
    if (!requirements.minLength) missing.push("8+ characters");
    if (!requirements.hasUpper) missing.push("one uppercase");
    if (!requirements.hasNumber) missing.push("one number");
    if (!requirements.hasSpecial) missing.push("one special character");
    
    if (missing.length === 0) return <p className="password-hint success">Password is strong</p>;
    
    return <p className="password-hint error">Must include: {missing.join(", ")}</p>;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = normalizeIdentifier(formData.identifier);

    try {
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: normalizedEmail,
        password: formData.password
      });

      if (loginRes.data.success) {
        const data = loginRes.data.data;
        
        if (data.status === '2FA_REQUIRED') {
          setTempToken(data.tempToken);
          setView('login-2fa');
          setLoading(false);
          return;
        }

        const userData = data;
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
          saveAccount(token, {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName
          });
          
          setFormData(prev => ({ ...prev, identifier: userData.email, firstName: userData.firstName, lastName: userData.lastName }));
          setAccessToken(token);
          fetchEmails(token);
          fetchSessions(token);
          fetchExternalSessions(token);
          fetchRecoveryInfo(token);
          setView('dashboard');
        } else if (clientId && redirectUri) {
          // Still save the account for future use
          saveAccount(token, {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName
          });

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

  const handleVerifyLogin2fa = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login/2fa`, {
        tempToken: tempToken,
        code: formData.otp
      });
      if (res.data.success) {
        const userData = res.data.data;
        const token = userData.accessToken;
        
        saveAccount(token, {
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName
        });
        
        setAccessToken(token);
        fetchEmails(token);
        fetchSessions(token);
        fetchExternalSessions(token);
        fetchRecoveryInfo(token);
        setView('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountClick = () => {
    setError('');
    if (registrationMode === 'business') setView('signup-business');
    else if (registrationMode === 'child') setView('signup-child');
    else if (registrationMode === 'public') setView('signup-profile');
    else setView('signup-selection');
  };

  const handleRegisterProfile = async (e, type = 'PERSONAL') => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { isValid } = validatePassword(formData.password);
    if (!isValid) {
      setError('Password does not meet the security requirements');
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
    setError('');
    if (formData.identifier) {
      setLoading(true);
      setError('');
      const normalizedEmail = normalizeIdentifier(formData.identifier);
      try {
        const res = await axios.get(`${API_BASE}/auth/forgot-password/options?identifier=${normalizedEmail}`);
        if (res.data.success) {
          setRecoveryOptions(res.data.data);
          setView('forgot-password-options');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'User not found or no recovery options set');
        setView('forgot-password-identifier');
      } finally {
        setLoading(false);
      }
    } else {
      setView('forgot-password-identifier');
    }
  };

  const handleForgotPasswordIdentifierSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const normalizedEmail = normalizeIdentifier(formData.identifier);
    try {
      const res = await axios.get(`${API_BASE}/auth/forgot-password/options?identifier=${normalizedEmail}`);
      if (res.data.success) {
        setRecoveryOptions(res.data.data);
        setView('forgot-password-options');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (method) => {
    setLoading(true);
    setError('');
    try {
      const normalizedEmail = normalizeIdentifier(formData.identifier);
      console.log(normalizedEmail,method)
      await axios.post(`${API_BASE}/auth/forgot-password/send-otp`, {
        identifier: normalizedEmail,
        method: method
      });

      setView('forgot-password-otp');
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
    const normalizedEmail = normalizeIdentifier(formData.identifier);
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password/verify-otp`, { identifier: normalizedEmail, otp: formData.otp });
      if (res.data.success) setView('forgot-password-reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { isValid } = validatePassword(formData.newPassword);
    if (!isValid) {
      setError('New password does not meet security requirements');
      setLoading(false);
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    setLoading(true);
    const normalizedEmail = normalizeIdentifier(formData.identifier);
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, { identifier: normalizedEmail, otp: formData.otp, newPassword: formData.newPassword });
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

  const handleSwitchAccount = (account) => {
    localStorage.setItem('bnx_accessToken', account.token);
    localStorage.setItem('bnx_userData', JSON.stringify(account.userData));
    setAccessToken(account.token);
    setShowAccountSwitcher(false);
    window.location.reload(); 
  };

  const handleSignOutAll = () => {
    localStorage.removeItem('bnx_accessToken');
    localStorage.removeItem('bnx_userData');
    localStorage.removeItem('bnx_accounts');
    setAccounts([]);
    window.location.reload();
  };

  const fetchFullProfile = async (token) => {
    setLoading(true);
    try {
      const [meRes, settingsRes, recoveryRes] = await Promise.all([
        axios.get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/users/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/users/recovery`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (meRes.data.success) setProfileData(meRes.data.data);
      if (settingsRes.data.success) setSettingsData(settingsRes.data.data);
      if (recoveryRes.data.success) {
        setRecoveryInfo({
          recoveryEmail: recoveryRes.data.data.recoveryEmail,
          phoneNumber: recoveryRes.data.data.phoneNumber
        });
      }
    } catch (err) {
      console.error("Failed to fetch full profile:", err);
      setError("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    // fetchFullProfile(accessToken);
    // setView('profile-details');
    window.open('https://account.beta-softnet.com?token=' + accessToken, '_blank');
  };

  const handleAddAccount = () => {
    setShowAccountSwitcher(false);
    setView('login-email');
    setFormData(prev => ({ ...prev, identifier: '', password: '' }));
  };

  if (view === 'profile-details') {
    return (
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <img src={authLogo} alt="B2Auth" className="sidebar-logo-img" />
            <span className="brand-text">B2Auth</span>
          </div>
          <nav className="sidebar-nav">
            <button className="sidebar-item" onClick={() => setView('dashboard')}>
              <div className="icon-box"><ChevronRight size={18} style={{transform: 'rotate(180deg)'}} /></div>
              <span className="label">Back to Dashboard</span>
            </button>
          </nav>
        </aside>

        <main className="dashboard-content profile-page-content">
          <header className="section-header">
            <h2>Your B2Auth Account</h2>
            <p>Manage your personal info, security across BNX services.</p>
          </header>

          <div className="profile-card-elite animate-scale-in">
            <div className="profile-hero-section">
              <div className="profile-cover"></div>
              <div className="profile-header-main">
                <div className="large-avatar-circle">
                  {profileData?.name?.[0] || formData.firstName?.[0] || 'U'}
                </div>
                <div className="profile-titles">
                  <h3>{profileData?.name || `${formData.firstName} ${formData.lastName}`}</h3>
                  <p>{profileData?.email || formData.identifier}</p>
                  <div className="account-badge">{profileData?.accountType || 'PERSONAL'} ACCOUNT</div>
                </div>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="detail-category">
                <h4><User size={18} /> Personal Information</h4>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{profileData?.name || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Display Email</span>
                    <span className="info-value">{profileData?.email || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{settingsData?.location || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Job Title</span>
                    <span className="info-value">{settingsData?.jobTitle || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-category">
                <h4><ShieldCheck size={18} /> Security & Recovery</h4>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Recovery Email</span>
                    <span className="info-value">{recoveryInfo.recoveryEmail || 'Not configured'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone Number</span>
                    <span className="info-value">{recoveryInfo.phoneNumber || 'Not configured'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">2FA Status</span>
                    <span className="info-value">{settingsData?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Storage Limit</span>
                    <span className="info-value">{settingsData?.storageLimit || '5 GB'}</span>
                  </div>
                </div>
              </div>

              {/* <div className="detail-category">
                <h4><Settings size={18} /> Preferences</h4>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Display Language</span>
                    <span className="info-value">{settingsData?.language || 'English (US)'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Theme Preference</span>
                    <span className="info-value" style={{textTransform: 'capitalize'}}>{settingsData?.themeMode || 'Light'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Accent Color</span>
                    <div className="color-preview-box" style={{backgroundColor: settingsData?.accentColor || '#4f46e5'}}></div>
                  </div>
                </div>
              </div> */}
            </div>

            <footer className="profile-card-footer">
              <button className="primary-btn" onClick={() => { setDashboardTab('settings'); setView('dashboard'); }}>
                Go to Settings
              </button>
            </footer>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="dashboard-container">
        {/* Top Navigation / Account Switcher */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h1 className="tab-title">
              {dashboardTab === 'emails' ? 'Dashboard' : 
               dashboardTab === 'sessions' ? 'Security' :
               dashboardTab === 'apps' ? 'Connected Apps' : 'Settings'}
            </h1>
          </div>
          
          <div className="topbar-right">
            <div className="account-switcher-container">
              <button 
                className="profile-trigger-btn" 
                onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
              >
                <div className="avatar-circle-elite">
                  {formData.firstName?.[0] || formData.identifier?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>

              {showAccountSwitcher && (
                <>
                  <div className="switcher-overlay-fixed" onClick={() => setShowAccountSwitcher(false)} />
                  <div className="switcher-panel animate-scale-in">
                    <div className="current-account-banner">
                      <div className="banner-avatar">
                        {formData.firstName?.[0] || formData.identifier?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="banner-info">
                        <div className="banner-name">{formData.firstName} {formData.lastName}</div>
                        <div className="banner-email">{formData.identifier}</div>
                      </div>
                      <button className="manage-link" onClick={handleProfileClick}>Manage your Account</button>
                    </div>

                    <div className="other-accounts-section">
                      {accounts.filter(a => a.token !== accessToken).map(account => (
                        <div 
                          key={account.userData?.email} 
                          className="account-row" 
                          onClick={() => handleSwitchAccount(account)}
                        >
                          <div className="row-avatar">
                            {account.userData?.firstName?.[0] || account.userData?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="row-info">
                            <div className="row-name">{account.userData?.firstName} {account.userData?.lastName}</div>
                            <div className="row-email">{account.userData?.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="switcher-actions-list">
                      <button className="action-item-btn" onClick={handleAddAccount}>
                        <Plus size={18} />
                        <span>Add another account</span>
                      </button>
                      <button className="action-item-btn" onClick={handleSignOutAll}>
                        <LogOut size={18} />
                        <span>Sign out of all accounts</span>
                      </button>
                    </div>

                    <footer className="switcher-legal">
                      <span>Privacy Policy</span>
                      <span className="dot">•</span>
                      <span>Terms of Service</span>
                    </footer>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <img src={authLogo} alt="B2Auth" className="sidebar-logo-img" />
            <span className="brand-text">B2Auth</span>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-item ${dashboardTab === 'emails' ? 'active' : ''}`}
              onClick={() => setDashboardTab('emails')}
            >
              <div className="icon-box"><Mail size={18} /></div>
              <span className="label">Dashboard</span>
            </button>
            <button 
              className={`sidebar-item ${dashboardTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setDashboardTab('sessions')}
            >
              <div className="icon-box"><ShieldCheck size={18} /></div>
              <span className="label">Security</span>
            </button>
            <button 
              className={`sidebar-item ${dashboardTab === 'apps' ? 'active' : ''}`}
              onClick={() => setDashboardTab('apps')}
            >
              <div className="icon-box"><Globe size={18} /></div>
              <span className="label">Apps</span>
            </button>
            <button 
              className={`sidebar-item ${dashboardTab === 'authenticator' ? 'active' : ''}`}
              onClick={() => {
                setDashboardTab('authenticator');
                fetchAuthenticatorAccounts(accessToken);
              }}
            >
              <div className="icon-box"><Smartphone size={18} /></div>
              <span className="label">Authenticator</span>
            </button>
            <button 
              className={`sidebar-item ${dashboardTab === 'settings' ? 'active' : ''}`}
              onClick={() => setDashboardTab('settings')}
            >
              <div className="icon-box"><Settings size={18} /></div>
              <span className="label">Settings</span>
            </button>
          </nav>

          <div className="sidebar-spacer"></div>
          
          <footer className="sidebar-footer">
            {/* <div className="user-profile-card" onClick={handleProfileClick}>
              <div className="avatar">
                {formData.firstName?.[0] || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">{formData.firstName} {formData.lastName}</div>
                <div className="user-email">Manage</div>
              </div>
              <ChevronRight size={16} className="switch-arrow" />
            </div> */}
            
            <button className="sidebar-item logout-minimal" onClick={() => {
              localStorage.removeItem('bnx_accessToken');
              localStorage.removeItem('bnx_userData');
              window.location.reload();
            }}>
              <LogOut size={16} />
              <span>Sign Out</span>
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

                <div className="accounts-dashboard-section" style={{marginTop: '48px'}}>
                  <header className="section-header">
                    <h2>Logged-in Identities</h2>
                    <p>Quickly switch between your active B2Auth accounts.</p>
                  </header>
                  <div className="card-list">
                    {accounts.map(account => (
                      <div 
                        key={account.userData.email} 
                        className={`glass-card account-card-horizontal ${account.token === accessToken ? 'active-identity' : ''}`}
                        onClick={() => account.token !== accessToken && handleSwitchAccount(account)}
                      >
                        <div className="account-avatar-small">
                          {account.userData.firstName?.[0] || account.userData.email[0].toUpperCase()}
                        </div>
                        <div className="card-info">
                          <div className="card-main-text">
                            {account.userData.firstName} {account.userData.lastName}
                            {account.token === accessToken && <span className="current-badge">Current</span>}
                          </div>
                          <div className="card-sub-text">{account.userData.email}</div>
                        </div>
                        {account.token !== accessToken && <ChevronRight size={16} className="switch-arrow-hint" />}
                      </div>
                    ))}
                  </div>
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
                  <p>Devices currently logged into your B2Auth Account.</p>
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

            {dashboardTab === 'apps' && (
              <motion.div 
                key="apps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="content-section"
              >
                <header className="section-header">
                  <h2>Connected Applications</h2>
                  <p>Applications you have authorized via SSO.</p>
                </header>

                {externalSessions.length > 0 ? (
                  <div className="card-list">
                    {externalSessions.map(session => (
                      <div key={session.id} className="glass-card session-card external">
                        <div className="device-icon app">
                          <Globe size={24} />
                        </div>
                        <div className="card-info">
                          <div className="card-main-text">
                            {session.appName}
                            <span className="app-id-pill">{session.clientId}</span>
                          </div>
                          <div className="card-sub-text">
                            <div className="meta-item"><Globe size={12} /> {session.ipAddress}</div>
                            <div className="meta-item"><Clock size={12} /> Logged in: {new Date(session.loggedInAt).toLocaleString()}</div>
                          </div>
                          <div className="card-meta-text">
                            {session.userAgent?.substring(0, 80)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="activity-placeholder">
                    <Globe size={64} />
                    <h3>No Apps Authorized</h3>
                    <p>When you log in to external apps via B2Auth, they will appear here.</p>
                  </div>
                )}
              </motion.div>
            )}

            {dashboardTab === 'authenticator' && (
              <motion.div 
                key="authenticator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="content-section"
              >
                <header className="section-header">
                  <div className="header-with-action">
                    <div>
                      <h2>B2Auth Cloud Authenticator</h2>
                      <p>Your synced 2FA codes are available on all your devices.</p>
                    </div>
                    <button className="action-btn primary-solid" onClick={() => setShowAddAuthModal(true)}>
                      <Plus size={16} />
                      <span>Add Account</span>
                    </button>
                  </div>
                </header>

                <div className="authenticator-grid">
                  {authenticatorAccounts.length > 0 ? (
                    authenticatorAccounts.map(acc => (
                      <div key={acc.id} className="glass-card auth-code-card">
                        <div className="auth-card-header">
                          <div className="auth-icon-box"><Smartphone size={20} /></div>
                          <div className="auth-account-info">
                            <div className="auth-name">{acc.accountName}</div>
                            <div className="auth-issuer">B2Auth Synced</div>
                          </div>
                        </div>
                        <AuthenticatorCode secret={acc.secretKey} />
                      </div>
                    ))
                  ) : (
                    <div className="activity-placeholder">
                      <Smartphone size={64} />
                      <h3>No Authenticator Accounts</h3>
                      <p>Enable 2FA on your apps to see synced codes here.</p>
                    </div>
                  )}
                </div>

                {/* Add Authenticator Account Modal */}
                {showAddAuthModal && (
                  <div className="auth-modal-overlay">
                    <div className="auth-modal-content animate-scale-in">
                      <div className="auth-modal-header">
                        <h3>Add New Account</h3>
                        <button className="auth-close-btn" onClick={() => setShowAddAuthModal(false)}>
                          <X size={20} />
                        </button>
                      </div>

                      <div className="auth-tab-switcher">
                        <button 
                          className={addAuthMode === 'scan' ? 'active' : ''} 
                          onClick={() => setAddAuthMode('scan')}
                        >
                          Scan QR Code
                        </button>
                        <button 
                          className={addAuthMode === 'manual' ? 'active' : ''} 
                          onClick={() => setAddAuthMode('manual')}
                        >
                          Manual Entry
                        </button>
                      </div>

                      <div className="auth-modal-body">
                        {addAuthMode === 'scan' ? (
                          <div className="qr-scanner-container">
                            <div id="reader" style={{width: '100%'}}></div>
                            <p className="scanner-hint">Point your camera at the QR code</p>
                          </div>
                        ) : (
                          <div className="manual-entry-form">
                            <div className="auth-input-group">
                              <label>Account Name</label>
                              <input 
                                type="text" 
                                placeholder="e.g. GitHub: vishal" 
                                value={manualAuthData.name}
                                onChange={e => setManualAuthData({...manualAuthData, name: e.target.value})}
                              />
                            </div>
                            <div className="auth-input-group">
                              <label>Secret Key</label>
                              <input 
                                type="text" 
                                placeholder="Enter 2FA secret" 
                                value={manualAuthData.secret}
                                onChange={e => setManualAuthData({...manualAuthData, secret: e.target.value})}
                              />
                            </div>
                            <button 
                              className="action-btn primary-solid full-width"
                              onClick={() => handleAddAuthenticatorAccount(manualAuthData.name, manualAuthData.secret)}
                              disabled={!manualAuthData.name || !manualAuthData.secret}
                            >
                              Save Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
        <div className="language-selector-container">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="language-select"
          >
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Español</option>
            <option>Français</option>
            <option>Deutsch</option>
            <option>हिन्दी</option>
          </select>
          <ChevronDown size={14} className="select-arrow" />
        </div>
        <div className="auth-header">
          {error && <div className="error-message-top">{error}</div>}
          <div className="beta-logo-container">
            <img src={betaLogo} alt="B2Auth" className="beta-logo-img" />
          </div>
          {view.startsWith('signup') ? (
            <h1 className="sign-in-to">Create Account</h1>
          ) : view.startsWith('forgot-password') ? (
            <h1 className="sign-in-to">Account Recovery</h1>
          ) : clientId ? (
            <h1 className="sign-in-to">Sign in to <span style={{ textTransform: 'capitalize' }}>{clientId.replace(/-/g, ' ')}</span></h1>
          ) : (
            <h1 className="sign-in-to">Sign in to B2Auth</h1>
          )}
          <p className="use-account">
            {view.startsWith('signup') ? 'Choose your account type' : 
             view.startsWith('forgot-password') ? 'Verify your identity' : 'Use your BETA Account'}
          </p>
        </div>

        <div className="auth-body">
          {view === 'account-selection' && (
            <div className="account-switcher-container">
              <header className="switcher-header">
                <h2>Choose an account</h2>
                <p>to continue to {clientId ? clientId.replace(/-/g, ' ') : 'B2Auth'}</p>
              </header>

              <div className="account-list-premium">
                {accounts.map((acc, index) => (
                  <div key={index} className="account-item-card">
                    <div className="account-clickable" onClick={() => handleSelectAccount(acc)}>
                      <div className="account-avatar">
                        {acc.userData.firstName?.[0]}
                      </div>
                      <div className="account-info">
                        <div className="account-name">{acc.userData.firstName} {acc.userData.lastName}</div>
                        <div className="account-email">{acc.userData.email}</div>
                        {accessToken === acc.token && <span className="signed-in-tag">Signed in</span>}
                      </div>
                    </div>
                    <button className="remove-account-btn" title="Remove account" onClick={(e) => {
                      e.stopPropagation();
                      const updated = accounts.filter(a => a.userData.email !== acc.userData.email);
                      setAccounts(updated);
                      localStorage.setItem('bnx_accounts', JSON.stringify(updated));
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button 
                  className="add-account-action"
                  onClick={() => {
                    localStorage.removeItem('bnx_accessToken');
                    localStorage.removeItem('bnx_userData');
                    setAccessToken(null);
                    setFormData(prev => ({ ...prev, password: '' }));
                    setError('');
                    setView('login-email');
                  }}
                >
                  <div className="add-icon-circle"><Plus size={18} /></div>
                  <span>Use another account</span>
                </button>
              </div>

              {(!clientId) && (
                <button className="back-to-dash-btn" onClick={() => setView('dashboard')}>
                  Back to Dashboard
                </button>
              )}
            </div>
          )}

          {view === 'login-2fa' && (
            <form onSubmit={handleVerifyLogin2fa} className="auth-step-merged">
              <div className="login-grid">
                <div className="input-field-group">
                  <label style={{ fontSize: '18px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>2-Step Verification</label>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                    To help keep your account safe, B2Auth wants to make sure it's really you. 
                    Enter the 6-digit code from your <b>Authenticator App</b>.
                  </p>
                  <div className="login-input-wrapper">
                    <input 
                      type="text" 
                      name="otp"
                      placeholder="Enter code"
                      value={formData.otp}
                      onChange={handleInputChange}
                      required
                      autoFocus
                      className="otp-input-elite"
                      maxLength="6"
                      style={{ 
                        width: '100%', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        border: '2px solid #e2e8f0', 
                        fontSize: '24px', 
                        fontWeight: '700', 
                        textAlign: 'center',
                        letterSpacing: '4px'
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="button-group-right" style={{ marginTop: '32px' }}>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Next'}
                </button>
              </div>
            </form>
          )}

          {(view === 'login-email' || view === 'login-password') && (
            <form onSubmit={handleLogin} className="auth-step-merged">
              <div className="login-grid">
                <div className="input-field-group">
                  <label>Email:</label>
                  <div className={`login-input-wrapper ${!formData.identifier.includes('@') ? 'has-domain-hint' : ''}`}>
                    <input 
                      type="text" 
                      name="identifier" 
                      value={formData.identifier} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="Username"
                    />
                    {!formData.identifier.includes('@') && <span className="domain-hint">@bnxmail.com</span>}
                  </div>
                </div>
                <div className="input-field-group">
                  <label>Password:</label>
                  <input 
                    type="password" 
                    placeholder='Enter your password'
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="forgot-password-link" onClick={handleForgotPasswordClick}>
                Forgot Password?
              </div>

              <div className="login-btn-container">
                <button type="submit" className="merged-login-btn" disabled={loading}>
                  {loading ? '...' : 'Login'}
                </button>
              </div>
              {/* <div><img src={authLogo} alt="" className="auth-logo" height={40} /></div> */}
              <div className="auth-footer-merged">
                <div className="footer-right-links">
                  <div style={{display:'flex',flexDirection:'row',gap:'9px'}}>
                    <span>Help</span>
                    <span>Privacy</span>
                    <span>Terms</span>
                  </div>
                  <div>
                    <span style={{fontSize:'12px', color:'blue', fontFamily:'inherit'}}>Report Issue</span>
                  </div>
                </div>
                {/* <div><LockOpenIcon size={20} /></div> */}
                <div><img src={authLogo} alt="" className="auth-logo" height={40} style={{marginRight:'25px'}} /></div>
                <div className="footer-left-link" onClick={handleCreateAccountClick}>
                  Create Account
                </div>
              </div>
              {/* <span style={{fontSize:'12px', color:'blue', fontFamily:'inherit'}}>Report Issue</span> */}
            </form>
          )}

          {view === 'signup-selection' && (
            <div className="auth-step selection-view">
              <div className="selection-grid">
                <div className="selection-card-premium" onClick={() => setView('signup-profile')}>
                  <div className="selection-icon-circle">
                    <User size={32} />
                  </div>
                  <div className="selection-content">
                    <h3>For myself</h3>
                    <p>Create a personal account to manage your secure emails.</p>
                  </div>
                  <ChevronRight className="arrow-icon" size={20} />
                </div>

                <div className="selection-card-premium" onClick={() => setView('signup-child')}>
                  <div className="selection-icon-circle accent">
                    <User size={32} />
                  </div>
                  <div className="selection-content">
                    <h3>For my child</h3>
                    <p>Manage your child's digital identity with parental controls.</p>
                  </div>
                  <ChevronRight className="arrow-icon" size={20} />
                </div>

                <div className="selection-card-premium" onClick={() => setView('signup-business')}>
                  <div className="selection-icon-circle business">
                    <Briefcase size={32} />
                  </div>
                  <div className="selection-content">
                    <h3>For business</h3>
                    <p>Powerful tools to manage your team and business communications.</p>
                  </div>
                  <ChevronRight className="arrow-icon" size={20} />
                </div>
              </div>
              <div className="selection-footer">
                <button className="text-btn" onClick={() => setView('login-email')}>Already have an account? Sign in</button>
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
              <div className="input-group">
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " />
                <label>Password</label>
              </div>
              <PasswordRequirements password={formData.password} />
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
              <div className="input-group">
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " />
                <label>Password</label>
              </div>
              <PasswordRequirements password={formData.password} />
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
              <div className="input-group">
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder=" " />
                <label>Password</label>
              </div>
              <PasswordRequirements password={formData.password} />
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

          {view === 'forgot-password-identifier' && (
            <form onSubmit={handleForgotPasswordIdentifierSubmit} className="auth-step">
              <div className="input-group">
                <div className={`login-input-wrapper ${!formData.identifier.includes('@') ? 'has-domain-hint' : ''}`}>
                  <input 
                    type="text" 
                    name="identifier" 
                    value={formData.identifier} 
                    onChange={handleInputChange} 
                    required 
                    placeholder=" " 
                  />
                  {!formData.identifier.includes('@') && <span className="domain-hint">@bnxmail.com</span>}
                  <label>Email or Username</label>
                </div>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('login-email')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>Next</button>
              </div>
            </form>
          )}

          {view === 'forgot-password-options' && (
            <div className="auth-step">
              <p className="recovery-helper">Choose where you want to receive the verification code:</p>
              {recoveryOptions?.recoveryEmail && (
                <div className="recovery-option-premium" onClick={() => handleSendOtp('EMAIL')}>
                  <Mail size={20} />
                  <span>Email to {recoveryOptions.recoveryEmail}</span>
                </div>
              )}
              {recoveryOptions?.phoneNumber && (
                <div className="recovery-option-premium" onClick={() => handleSendOtp('PHONE')}>
                  <Smartphone size={20} />
                  <span>SMS to {recoveryOptions.phoneNumber}</span>
                </div>
              )}
              <div className="auth-actions">
                <button className="text-btn" onClick={() => setView('forgot-password-identifier')}>Back</button>
              </div>
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
              <div className="input-group">
                <input type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} required placeholder=" " />
                <label>New Password</label>
              </div>
              <PasswordRequirements password={formData.newPassword} />
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
          {/* <div className="footer-right"><span>Help</span><span>Privacy</span><span>Terms</span></div> */}
        </div>
      </div>
    </div>
  );
}

export default App;
