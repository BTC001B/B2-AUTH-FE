import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Mail, ShieldCheck, Settings, Activity, LogOut,
  Smartphone, Monitor, Tablet, CheckCircle, AlertCircle,
  Trash2, Edit3, Save, Plus, ChevronRight, ChevronDown, User, Phone,
  Globe, Clock, MapPin, Briefcase,
  LockIcon,
  LockOpenIcon,
  Check,
  Circle,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import betaLogo from './assets/beta2.png';
import authLogo from './assets/auth2.png';
import cliksBusinessLogo from './assets/cliks-business.png';
import cliksLogo from './assets/cliks.png';
import bitToolLogo from './assets/BIT-TOOL-2.png';
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
      <span className="auth-code">{code.slice(0, 3)} {code.slice(3)}</span>
      <div className="auth-timer-container">
        <div className="auth-timer-bar" style={{ width: `${(timeLeft / 30) * 100}%`, backgroundColor: timeLeft < 5 ? '#ef4444' : '#4f46e5' }}></div>
      </div>
    </div>
  );
};

const API_BASE = import.meta.env.VITE_API_BASE;

const legalDocuments = {
  terms: {
    eyebrow: 'Terms and Conditions',
    title: 'Terms and Conditions for b2auth',
    updated: 'Last Updated: May 2026',
    entity: 'Beta Softnet (OPC) Private Limited ("BETA")',
    sections: [
      {
        title: '1. Scope of Service',
        paragraphs: [
          'b2auth is a security authentication product of Beta Softnet (OPC) Pvt Ltd. By using b2auth, you agree to these terms. b2auth provides Multi-Factor Authentication (MFA), secure login protocols, and identity verification for the BETA ecosystem, including BNXMail, Cliks, Cliks Business, and integrated third-party services.'
        ]
      },
      {
        title: '2. User Responsibility & Account Security',
        items: [
          { label: 'Identity Linkage', text: 'Your b2auth profile is linked to your accounts.beta-softnet.com ID. You are responsible for maintaining the confidentiality of your master credentials.' },
          { label: 'Device Security', text: 'You must ensure that the mobile device running b2auth is secure. BETA is not liable for unauthorized access resulting from a lost, stolen, or compromised device.' },
          { label: 'True Identity', text: 'You agree to provide accurate information during the KYC/Verification process required for the BETA ecosystem.' }
        ]
      },
      {
        title: '3. Data Privacy & Compliance',
        items: [
          { label: 'Consent', text: 'By using b2auth, you grant BETA the right to process biometric data, if enabled, and device metadata solely for authentication purposes.' },
          { label: 'No Third-Party Sharing', text: 'BETA will never sell your authentication logs or identity data to third-party advertisers.' },
          { label: 'Data Erasure', text: 'Users can request account deletion via accounts.beta-softnet.com, which will revoke all b2auth permissions.' }
        ]
      },
      {
        title: '4. Intellectual Property',
        paragraphs: [
          'The "b2auth" name, logo, and proprietary authentication algorithms are the exclusive property of Beta Softnet (OPC) Pvt Ltd. Any attempt to reverse-engineer the b2auth protocol is strictly prohibited and may lead to legal action.'
        ]
      },
      {
        title: '5. Limitation of Liability',
        paragraphs: [
          'While b2auth employs high-level encryption, BETA does not guarantee that the service will be 100% error-free or immune to sophisticated cyber-attacks. BETA shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the app.',
          'When a user accepts the Terms and Conditions on b2auth, that acceptance may be reflected across BNXMail and Cliks via the accounts.beta-softnet.com database as centralized consent.',
          'In case of a security breach, BETA reserves the right to temporarily freeze the linked Cliks Wallet to protect user funds.'
        ]
      }
    ]
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'Privacy Policy: b2auth',
    updated: 'Effective Date: May 15, 2026',
    entity: 'Beta Softnet (OPC) Private Limited ("BETA")',
    sections: [
      {
        title: '1. Introduction',
        paragraphs: [
          'At BETA, we believe security is a fundamental right. This Privacy Policy explains how b2auth collects, protects, and manages your information to provide secure authentication across the BETA ecosystem.'
        ]
      },
      {
        title: '2. Information We Collect',
        paragraphs: ['We only collect data that is essential for verifying your identity:'],
        items: [
          { label: 'Identity Data', text: 'Your name, email, and phone number linked to your account.beta-softnet.com profile.' },
          { label: 'Device Metadata', text: 'Unique device ID (UUID), OS version, and IP address to support Trusted Device binding.' },
          { label: 'Biometric Data', text: 'b2auth uses your device native Fingerprint or FaceID. BETA does not store your actual biometric patterns on our servers; we only receive a Success/Fail token from your device secure enclave.' },
          { label: 'Authentication Logs', text: 'Timestamps of successful and failed login attempts to detect and prevent hacking.' }
        ]
      },
      {
        title: '3. How We Use Your Data',
        items: [
          { text: 'To verify your identity during logins.' },
          { text: 'To send Critical Security Alerts if a login is attempted from an unrecognized location.' },
          { text: 'To prevent fraudulent access to your Cliks Wallet and BNXMail accounts.' }
        ]
      },
      {
        title: '4. Data Sharing & Third Parties',
        items: [
          { label: 'Zero Third-Party Sharing', text: 'We never sell, rent, or trade your personal data to advertisers or third-party data brokers.' },
          { label: 'Ecosystem Integration', text: 'Your data is shared internally with account.beta-softnet.com to provide a Single Sign-On (SSO) experience across all BETA products.' }
        ]
      },
      {
        title: '5. User Rights (Compliance)',
        items: [
          { label: 'Right to Access', text: 'You can view all data we hold about you at account.beta-softnet.com.' },
          { label: 'Right to Erase', text: 'You can request the deletion of your b2auth profile. Note: This will revoke access to all linked BETA services for security reasons.' },
          { label: 'Grievance Officer', text: 'As per Indian law, for any data concerns, contact our Grievance Officer at legal@beta-softnet.com.' }
        ]
      }
    ]
  }
};

const getInitialView = () => {
  if (window.location.pathname === '/privacy-policy') return 'legal-privacy';
  if (window.location.pathname === '/terms-and-conditions') return 'legal-terms';
  return 'login-email';
};

const LegalPage = ({ documentKey, onBack, onShowDocument }) => {
  const document = legalDocuments[documentKey];

  return (
    <div className="legal-page-shell">
      <header className="legal-topbar">
        <button className="legal-brand" onClick={onBack}>
          <img src={authLogo} alt="B2Auth" />
          <span>B2Auth</span>
        </button>
        <div className="legal-nav-actions">
          <button
            className={`legal-nav-link ${documentKey === 'privacy' ? 'active' : ''}`}
            onClick={() => onShowDocument('privacy')}
          >
            Privacy Policy
          </button>
          <button
            className={`legal-nav-link ${documentKey === 'terms' ? 'active' : ''}`}
            onClick={() => onShowDocument('terms')}
          >
            Terms
          </button>
        </div>
      </header>

      <main className="legal-document-wrap">
        <section className="legal-hero">
          <div className="legal-eyebrow">{document.eyebrow}</div>
          <h1>{document.title}</h1>
          <p>{document.updated}</p>
          <p>{document.entity}</p>
        </section>

        <article className="legal-document">
          {document.sections.map((section) => (
            <section className="legal-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items && (
                <ul>
                  {section.items.map((item, index) => (
                    <li key={`${section.title}-${index}`}>
                      {item.label && <strong>{item.label}: </strong>}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </main>
    </div>
  );
};

function App() {
  const [view, setView] = useState(getInitialView); // login-email, login-password, signup-selection, signup-profile, signup-child, signup-business, signup-mail, dashboard, verifying
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OAuth Context
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [state, setState] = useState('');
  const [registrationMode, setRegistrationMode] = useState(''); // business, child, public

  // Form Data
  const [formData, setFormData] = useState({
    identifier: localStorage.getItem('bnx_last_identifier') || '', password: '', username: '', firstName: '', lastName: '',
    emailName: '', otp: '', newPassword: '', confirmPassword: '',
    businessName: '', businessType: '', registrationNumber: '',
    ownerFirstName: '', ownerLastName: '', domain: '', dob: '',
    parentName: '', parentEmail: '', parentPhone: '', parentOtp: '',
  });

  const [tempToken, setTempToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userEmails, setUserEmails] = useState([]);
  const [recoveryOptions, setRecoveryOptions] = useState(null);
  const [selectedRecoveryMethod, setSelectedRecoveryMethod] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [externalSessions, setExternalSessions] = useState([]);
  const [expandedExternalSessionId, setExpandedExternalSessionId] = useState(null);
  const [accounts, setAccounts] = useState(() => JSON.parse(localStorage.getItem('bnx_accounts') || '[]'));
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [useSavedAccount, setUseSavedAccount] = useState(!!localStorage.getItem('bnx_last_identifier'));
  const [dashboardTab, setDashboardTab] = useState('emails'); // emails, sessions, settings, activity
  const [show2faRecovery, setShow2faRecovery] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [language, setLanguage] = useState('English (US)');
  const [recoveryInfo, setRecoveryInfo] = useState({ recoveryEmail: '', phoneNumber: '' });
  const [isEditingRecovery, setIsEditingRecovery] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);
  const [authenticatorAccounts, setAuthenticatorAccounts] = useState([]);
  const [showAddAuthModal, setShowAddAuthModal] = useState(false);
  const [addAuthMode, setAddAuthMode] = useState('scan'); // 'scan' or 'manual'
  const [manualAuthData, setManualAuthData] = useState({ name: '', secret: '' });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [signupType, setSignupType] = useState('PERSONAL');
  const [parentOtpSent, setParentOtpSent] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    businessType: 'Private Limited',
    industry: '',
    companySize: '',
    businessWebsite: '',
    businessAddress: '',
    profilePhoto: null,
    timeZone: 'UTC',
    language: 'English (US)',
    companyLogo: null,
    acceptTerms: false
  });
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showSetup2FAModal, setShowSetup2FAModal] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState({ secret: '', qrCodeUrl: '' });
  const [setup2FACode, setSetup2FACode] = useState('');
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'success' });
  const topbarRightRef = useRef(null);

  const showAlert = (message, type = 'success') => {
    setCustomAlert({ show: true, message, type });
    setTimeout(() => {
      setCustomAlert(prev => {
        if (prev.message === message) {
          return { show: false, message: '', type: 'success' };
        }
        return prev;
      });
    }, 3500);
  };

  const showLegalPage = (documentKey) => {
    const path = documentKey === 'privacy' ? '/privacy-policy' : '/terms-and-conditions';
    window.history.pushState({}, '', path);
    setError('');
    setView(`legal-${documentKey}`);
  };

  const leaveLegalPage = () => {
    window.history.pushState({}, '', '/');
    setView(accessToken || localStorage.getItem('bnx_accessToken') ? 'dashboard' : 'login-email');
  };

  useEffect(() => {
    if (!showAccountSwitcher) return;

    const handleOutsideClick = (event) => {
      if (topbarRightRef.current && !topbarRightRef.current.contains(event.target)) {
        setShowAccountSwitcher(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showAccountSwitcher]);

  const handleLogout = () => {
    localStorage.removeItem('bnx_accessToken');
    localStorage.removeItem('bnx_userData');
    setAccessToken('');
    setUserEmails([]);
    setSessions([]);
    setExternalSessions([]);
    setFormData({
      identifier: localStorage.getItem('bnx_last_identifier') || '', password: '', username: '', firstName: '', lastName: '',
      emailName: '', otp: '', newPassword: '', confirmPassword: '',
      businessName: '', businessType: '', registrationNumber: '',
      ownerFirstName: '', ownerLastName: '', domain: '', dob: '',
    });
    setUseSavedAccount(!!localStorage.getItem('bnx_last_identifier'));
    setOnboardingStep(1);
    setView('login-email');
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.warn("Session expired or unauthorized (401). Logging out...");
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const saveAccount = (token, userData) => {
    const storedAccounts = JSON.parse(localStorage.getItem('bnx_accounts') || '[]');
    // Avoid duplicates by email/username
    const filteredAccounts = storedAccounts.filter(acc => acc.userData.email !== userData.email);
    // Use accountType and isPrimary from backend response
    const updatedAccounts = [{
      token,
      userData: {
        ...userData,
        accountType: userData.accountType, // Will be BUSINESS, PUBLIC, or CHILD
        isPrimary: userData.isPrimary || false
      }
    }, ...filteredAccounts];
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

    if (window.location.pathname === '/privacy-policy' || window.location.pathname === '/terms-and-conditions') {
      return;
    }

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
      const validateAndRestore = async () => {
        setView('restoring');
        try {
          const userData = JSON.parse(storedUser);

          // Use fetchEmails & profile as a validation call
          const [res, meRes] = await Promise.all([
            axios.get(`${API_BASE}/emails/list`, { headers: { Authorization: `Bearer ${storedToken}` } }),
            axios.get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${storedToken}` } })
          ]);

          if (res.data.success && meRes.data.success) {
            setAccessToken(storedToken);
            setUserEmails(res.data.data.emails);
            const profile = meRes.data.data;
            setProfileData(profile);
            setFormData(prev => ({
              ...prev,
              identifier: profile.email || profile.username || '',
              firstName: profile.firstName || '',
              lastName: profile.lastName || ''
            }));
            // fetch others in parallel
            fetchSessions(storedToken);
            fetchExternalSessions(storedToken);
            fetchRecoveryInfo(storedToken);
            
            if (profile.accountType === 'BUSINESS' && !profile.onboarded) {
              setView('signup-business-onboarding');
            } else {
              setView('dashboard');
            }
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error("Session restoration failed", err);
          handleLogout();
        }
      };
      validateAndRestore();
    }
  }, []);

  const resetSignupForm = () => {
    setFormData(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      dob: '',
      username: '',
      emailName: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentOtp: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      registrationNumber: ''
    }));
    setError('');
    setParentOtpSent(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (formData.firstName?.trim().length >= 2 && formData.lastName?.trim() && formData.dob) {
        try {
          const res = await axios.get(`${API_BASE}/auth/username-suggestions`, {
            params: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              dob: formData.dob
            }
          });
          if (res.data.success) {
            setUsernameSuggestions(res.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch username suggestions", err);
        }
      } else {
        setUsernameSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timer);
  }, [formData.firstName, formData.lastName, formData.dob]);

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

  const handleRevokeExternalSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to remove access for this application?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await axios.delete(`${API_BASE}/auth/sessions/external/${sessionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        fetchExternalSessions(accessToken);
        showAlert("Application access revoked successfully");
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke application access');
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

  const handleDeleteAuthenticatorAccount = async (id) => {
    if (!window.confirm("Are you sure you want to delete this authenticator account?")) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.delete(`${API_BASE}/users/2fa/accounts/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        fetchAuthenticatorAccounts(accessToken);
        showAlert("Authenticator account deleted successfully");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete authenticator account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let scanner = null;
    if (showAddAuthModal && addAuthMode === 'scan') {
      // Small timeout to ensure DOM element #reader is mounted
      const timer = setTimeout(() => {
        const readerElement = document.getElementById("reader");
        if (!readerElement) return;

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
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(e => console.error("Scanner clear failed", e));
        }
      };
    }
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

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/users/2fa/setup`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setSetup2FAData({
          secret: res.data.data.secret,
          qrCodeUrl: res.data.data.qrCodeUrl
        });
        setSetup2FACode('');
        setShowSetup2FAModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate 2-Step Verification setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable2FA = async (e) => {
    e.preventDefault();
    if (!setup2FACode || setup2FACode.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/users/2fa/verify`, {
        code: setup2FACode
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setProfileData(prev => prev ? ({ ...prev, twoFactorEnabled: true }) : prev);
        setSettingsData(prev => prev ? ({ ...prev, twoFactorEnabled: true }) : prev);
        setShowSetup2FAModal(false);
        fetchAuthenticatorAccounts(accessToken);
        showAlert("2-Step Verification has been enabled successfully.");
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable 2-Step Verification? This will make your account less secure.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/users/2fa/disable`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setProfileData(prev => prev ? ({ ...prev, twoFactorEnabled: false }) : prev);
        setSettingsData(prev => prev ? ({ ...prev, twoFactorEnabled: false }) : prev);
        fetchAuthenticatorAccounts(accessToken);
        showAlert("2-Step Verification has been disabled.");
      }
    } catch (err) {
      setError("Failed to disable 2-Step Verification");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/auth/change-password`, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowChangePasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showAlert("Password changed successfully");
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotInModal = () => {
    setShowChangePasswordModal(false);
    const email = profileData?.email || formData.identifier;
    setFormData(prev => ({ ...prev, identifier: email }));
    handleForgotPasswordClickWithEmail(email);
  };

  const handleForgotPasswordClickWithEmail = async (email) => {
    setLoading(true);
    setError('');
    const normalizedEmail = normalizeIdentifier(email);
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
    const { token, userData } = account;

    localStorage.setItem('bnx_last_identifier', userData.email);
    setFormData(prev => ({ ...prev, identifier: userData.email, password: '' }));
    setUseSavedAccount(true);

    // Check if the application requires a business or child account
    if (registrationMode === 'business' && userData.accountType !== 'BUSINESS') {
      setError('This application requires a Business account.');
      return;
    }

    if (registrationMode === 'child' && userData.accountType !== 'CHILD') {
      setError('This application is restricted to Child accounts.');
      return;
    }

    setLoading(true);

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
    if (!ua) return { name: 'Unknown Device', browser: 'Browser', type: 'monitor' };
    const lowerUA = ua.toLowerCase();

    let name = 'Unknown Device';
    let type = 'monitor';
    if (lowerUA.includes('iphone')) {
      name = 'iPhone';
      type = 'phone';
    } else if (lowerUA.includes('android')) {
      name = 'Android Phone';
      type = 'phone';
    } else if (lowerUA.includes('ipad')) {
      name = 'iPad';
      type = 'tablet';
    } else if (lowerUA.includes('macintosh')) {
      name = 'MacBook';
      type = 'monitor';
    } else if (lowerUA.includes('windows')) {
      name = 'Windows PC';
      type = 'monitor';
    } else if (lowerUA.includes('linux')) {
      name = 'Linux PC';
      type = 'monitor';
    }

    let browser = 'Web Browser';
    if (lowerUA.includes('firefox')) {
      browser = 'Firefox';
    } else if (lowerUA.includes('opr/') || lowerUA.includes('opera')) {
      browser = 'Opera';
    } else if (lowerUA.includes('edg/')) {
      browser = 'Edge';
    } else if (lowerUA.includes('chrome')) {
      browser = 'Chrome';
    } else if (lowerUA.includes('safari') && !lowerUA.includes('chrome')) {
      browser = 'Safari';
    }

    return { name, browser, type };
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

    localStorage.setItem('bnx_last_identifier', formData.identifier);
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
            lastName: userData.lastName,
            accountType: userData.accountType,
            isPrimary: userData.isPrimary
          });

          setFormData(prev => ({ ...prev, identifier: userData.email, firstName: userData.firstName, lastName: userData.lastName }));
          setAccessToken(token);
          fetchEmails(token);
          fetchSessions(token);
          fetchExternalSessions(token);
          fetchRecoveryInfo(token);
          
          if (userData.accountType === 'BUSINESS' && !userData.onboarded) {
            setView('signup-business-onboarding');
          } else {
            setView('dashboard');
          }
        } else if (clientId && redirectUri) {
          // Still save the account for future use
          saveAccount(token, {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            accountType: userData.accountType,
            isPrimary: userData.isPrimary
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

        const isB2AuthFlow = window.location.hostname.includes('b2auth.com') || window.location.hostname === 'localhost';

        if (isB2AuthFlow && !clientId) {
          saveAccount(token, {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            accountType: userData.accountType,
            isPrimary: userData.isPrimary
          });

          setFormData(prev => ({ ...prev, identifier: userData.email, firstName: userData.firstName, lastName: userData.lastName }));
          setAccessToken(token);
          fetchEmails(token);
          fetchSessions(token);
          fetchExternalSessions(token);
          fetchRecoveryInfo(token);
          setView('dashboard');
        } else if (clientId && redirectUri) {
          saveAccount(token, {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            accountType: userData.accountType,
            isPrimary: userData.isPrimary
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
      setError(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountClick = () => {
    setError('');
    if (registrationMode === 'business') setView('signup-business');
    else if (registrationMode === 'child') {
      setSignupType('CHILD');
      setView('signup-child');
    } else if (registrationMode === 'public') {
      setSignupType('PERSONAL');
      setView('signup-profile');
    } else setView('signup-selection');
  };

  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleGoToMailSignup = (e) => {
    e.preventDefault();
    setError('');

    if (signupType === 'BUSINESS') {
      setFormData(prev => ({ ...prev, username: '', emailName: '' }));
      setView('signup-mail');
      return;
    }

    const age = calculateAge(formData.dob);

    if (signupType === 'PERSONAL') {
      if (age < 5) {
        setError('Age must be at least 5 years old to register.');
        return;
      }
      if (age < 18) {
        setSignupType('CHILD');
        setView('signup-child');
        setError('You are under 18 so open the child account');
        return;
      }
      
      setFormData(prev => ({ ...prev, username: '', emailName: '' }));
      setView('signup-mail');
    } else if (signupType === 'CHILD') {
      if (age < 5) {
        setError('Child must be at least 5 years old to register.');
        return;
      }
      if (age >= 18) {
        setSignupType('PERSONAL');
        setView('signup-profile');
        setError('You are 18 or older so open the personal account');
        return;
      }
      setParentOtpSent(false);
      setView('signup-parent-verify');
    }
  };

  const handleSendParentOtp = async (e) => {
    e.preventDefault();
    if (!formData.parentEmail || !formData.parentEmail.trim()) {
      setError('Parent email is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/child/send-parent-otp`, { parentEmail: formData.parentEmail });
      if (res.data.success) {
        setParentOtpSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP to parent');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyParentOtp = async (e) => {
    e.preventDefault();
    if (!formData.parentOtp || !formData.parentOtp.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/child/verify-parent-otp`, { 
        parentEmail: formData.parentEmail, 
        otp: formData.parentOtp 
      });
      if (res.data.success) {
        setFormData(prev => ({ ...prev, username: '', emailName: '' }));
        setView('signup-mail');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOnboardingData(prev => ({
          ...prev,
          [field]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!onboardingData.acceptTerms) {
      setError('You must accept the Terms of Service & Privacy Policy');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/business/onboard`, onboardingData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        // Fallback flag for extra client-side routing speed
        localStorage.setItem('bnx_business_onboarded_' + formData.identifier, 'true');
        
        // Fetch fresh profile state to sync profile photo, logo, etc.
        const meRes = await axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (meRes.data.success) {
          setProfileData(meRes.data.data);
        }
        
        setView('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete business profile onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSignupSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.username.trim()) {
      setError('Please select a suggested email handle or type one');
      setView('signup-mail');
      return;
    }

    if (signupType === 'PERSONAL' || signupType === 'CHILD') {
      const username = formData.username.trim();
      if (username.length < 10) {
        setError('Email handle must be atleast 10 characters long.');
        setView('signup-mail');
        return;
      }
      const digits = (username.match(/\d/g) || []).length;
      const letters = (username.match(/[a-zA-Z]/g) || []).length;
      console.log({
          username,
          letters,
          digits,
          length: username.length
      });
      if (digits < 3 || letters < 7) {
        setError('Email handle must be at least 7 letters and 3 numbers.');
        setView('signup-mail');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { isValid } = validatePassword(formData.password);
    if (!isValid) {
      setError('Password does not meet the security requirements');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      username: formData.username,
      password: formData.password,
      mode: signupType === 'CHILD' ? 'PERSONAL' : signupType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dob: formData.dob
    };

    if (signupType === 'CHILD') {
      payload.parentEmail = formData.parentEmail;
    }

    if (signupType === 'BUSINESS') {
      payload.ownerFirstName = formData.firstName;
      payload.ownerLastName = formData.lastName;
      payload.businessName = formData.businessName;
      payload.registrationNumber = formData.registrationNumber;
      payload.domain = 'bnxmail.com';
    }

    try {
      const regRes = await axios.post(`${API_BASE}/auth/register`, payload);
      if (regRes.data.success) {
        const token = regRes.data.data.tempToken;
        const mailRes = await axios.post(
          `${API_BASE}/emails/create`,
          { emailName: formData.username, password: formData.password, isPrimary: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (mailRes.data.success) {
          setFormData(prev => ({ ...prev, identifier: mailRes.data.data.email }));
          setView('login-password');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMailFormSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.username.trim()) {
      setError('Please select a suggested email handle or type one');
      return;
    }

    if (signupType === 'PERSONAL' || signupType === 'CHILD') {
      const username = formData.username.trim();
      if (username.length < 10) {
        setError('Email handle must be atleast 10 characters long.');
        return;
      }
      const digits = (username.match(/\d/g) || []).length;
      const letters = (username.match(/[a-zA-Z]/g) || []).length;
            console.log({
          username,
          letters,
          digits,
          length: username.length
      });
      if (digits < 3 || letters < 7) {
        setError('Email handle must contain at least 7 letters and 3 numbers.');
        return;
      }
    }

    if (tempToken) {
      handleCreateMailbox(e);
    } else {
      setView('signup-password-setup');
    }
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

    let finalUsername = formData.username?.trim();
    if (!finalUsername) {
      if (usernameSuggestions && usernameSuggestions.length > 0) {
        finalUsername = usernameSuggestions[0];
      } else {
        setError('Username is required');
        setLoading(false);
        return;
      }
    }

    let payload = {
      username: finalUsername,
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
        setFormData(prev => ({ ...prev, username: finalUsername, emailName: finalUsername }));
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
      console.log(normalizedEmail, method)
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

  const handleSend2faRecoveryOtp = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await axios.post(`${API_BASE}/auth/login/2fa/send-otp`, { tempToken });
      setSuccessMessage("Recovery code sent to your email.");
      setFormData({ ...formData, otp: '' });
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send recovery code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2faRecoveryOtp = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      setError('Please enter the code from your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login/2fa/verify-otp`, {
        tempToken,
        otp: formData.otp
      });
      if (res.data.success) {
        saveAccount(res.data.data.accessToken, res.data.data);
        setAccessToken(res.data.data.accessToken);

        // OAuth Redirection Fix
        if (clientId && redirectUri) {
          try {
            const authRes = await axios.post(
              `${API_BASE}/oauth/authorize`,
              { clientId, redirectUri, state },
              { headers: { Authorization: `Bearer ${res.data.data.accessToken}` } }
            );
            if (authRes.data.success) {
              const code = authRes.data.data.code;
              window.location.href = `${redirectUri}?code=${code}&state=${state}`;
              return;
            }
          } catch (oauthErr) {
            console.error("OAuth Authorization failed after 2FA recovery", oauthErr);
          }
        }

        fetchEmails(res.data.data.accessToken);
        fetchSessions(res.data.data.accessToken);
        fetchExternalSessions(res.data.data.accessToken);
        fetchRecoveryInfo(res.data.data.accessToken);
        setView('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid recovery code');
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
        showAlert('Password reset successfully.');
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
    localStorage.removeItem('bnx_last_identifier');
    setAccounts([]);
    setAccessToken('');
    setUserEmails([]);
    setSessions([]);
    setExternalSessions([]);
    setUseSavedAccount(false);
    setView('login-email');
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
    setUseSavedAccount(false);
    setFormData(prev => ({ ...prev, identifier: '', password: '' }));
  };

  if (view === 'legal-privacy' || view === 'legal-terms') {
    return (
      <LegalPage
        documentKey={view === 'legal-privacy' ? 'privacy' : 'terms'}
        onBack={leaveLegalPage}
        onShowDocument={showLegalPage}
      />
    );
  }

  if (view === 'restoring') {
    return (
      <div className="restoring-container">
        <div className="restoring-content">
          <img src={betaLogo} alt="B2Auth" className="loading-logo-spin" />
          <div className="restoring-text">
            <h3>Restoring Session</h3>
            <p>Checking your credentials...</p>
          </div>
          <div className="loading-spinner-bar">
            <div className="loading-spinner-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'profile-details') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <div className="navbar-brand">
              <img src={authLogo} alt="B2Auth" className="navbar-logo-img" />
              <span className="brand-text">B2Auth</span>
            </div>
          </div>
          <div className="topbar-right"></div>
        </header>

        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button className="sidebar-item" onClick={() => setView('dashboard')}>
              <div className="icon-box"><ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /></div>
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
            <div className="navbar-brand">
              <img src={authLogo} alt="B2Auth" className="navbar-logo-img" />
              <span className="brand-text">B2Auth</span>
            </div>
          </div>

          <div className="topbar-center">
            <div className="navbar-pill-container">
              <button
                className={`navbar-pill-item ${dashboardTab === 'emails' ? 'active' : ''}`}
                onClick={() => setDashboardTab('emails')}
              >
                Dashboard
              </button>
              <button
                className={`navbar-pill-item ${dashboardTab === 'security' ? 'active' : ''}`}
                onClick={() => {
                  setDashboardTab('security');
                  fetchFullProfile(accessToken);
                  fetchAuthenticatorAccounts(accessToken);
                  fetchSessions(accessToken);
                  fetchExternalSessions(accessToken);
                }}
              >
                Security
              </button>
              <button
                className={`navbar-pill-item ${dashboardTab === 'settings' ? 'active' : ''}`}
                onClick={() => setDashboardTab('settings')}
              >
                Settings
              </button>
            </div>
          </div>

          <div className="topbar-right" ref={topbarRightRef}>
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
                      <button onClick={() => showLegalPage('privacy')}>Privacy Policy</button>
                      <span className="dot">•</span>
                      <button onClick={() => showLegalPage('terms')}>Terms of Service</button>
                    </footer>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-group-label" style={{ padding: '0 16px 8px', fontSize: '12px', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Accounts
            </div>
            {accounts.map((account, index) => {
              const isActive = account.token === accessToken;
              const typeLabel = account.userData?.accountType ? 
                  account.userData.accountType.charAt(0).toUpperCase() + account.userData.accountType.slice(1).toLowerCase() + ' Account'
                  : 'Account';
                  
              return (
                <button
                  key={index}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSwitchAccount(account)}
                  style={{ height: 'auto', padding: '12px 16px', alignItems: 'center' }}
                >
                  <div className="icon-box" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isActive ? '#e8f0fe' : '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#1a73e8' : '#5f6368', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
                    {account.userData?.firstName?.[0] || account.userData?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="label" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '12px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: isActive ? '#1a73e8' : '#202124', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%' }}>{typeLabel}</span>
                    <span style={{ fontSize: '12px', color: isActive ? '#1a73e8' : '#5f6368', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%', opacity: 0.8 }}>{account.userData?.email}</span>
                  </div>
                </button>
              );
            })}

            <button
              className="sidebar-item"
              onClick={handleAddAccount}
              style={{ marginTop: '8px' }}
            >
              <div className="icon-box"><Plus size={18} /></div>
              <span className="label">Add account</span>
            </button>
          </nav>

          <div className="sidebar-spacer"></div>

          <footer className="sidebar-footer">
            <button className="sidebar-item logout-minimal" onClick={handleLogout}>
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
                  <h2>Admin</h2>
                  <p>Manage your linked mail accounts and primary address.</p>
                </header>
                <div className="identity-container animate-scale-in">
                  {userEmails.map(email => (
                    <div key={email.id} className="identity-row">
                      <div className="identity-leading">
                        <div className="identity-icon-box"><Mail size={18} /></div>
                      </div>
                      <div className="identity-info">
                        <div className="identity-label">
                          {email.email}
                          {email.isPrimary && <CheckCircle size={14} className="success-icon" />}
                        </div>
                        <div className="identity-sub">{email.emailName} • {email.active ? 'Active' : 'Inactive'}</div>
                      </div>
                      <div className="identity-trailing">
                        {email.isPrimary ? (
                          <span className="primary-pill-mini">Primary</span>
                        ) : (
                          <button
                            className="row-action-btn"
                            onClick={() => handleMakePrimary(email.id)}
                            disabled={loading}
                          >
                            Make Primary
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* <button className="add-identity-row">
                    <Plus size={18} />
                    <span>Add New Mailbox</span>
                  </button> */}
                </div>

                <div className="accounts-dashboard-section" style={{ marginTop: '40px' }}>
                  <header className="section-header">
                    <h2>Logged-in Identities</h2>
                    <p>Quickly switch between your active B2Auth accounts.</p>
                  </header>

                  {/* Business Accounts Section */}
                  {accounts.some(a => a.userData.accountType === 'BUSINESS') && (
                    <div className="identity-group">
                      <h3 className="identity-group-title"><Briefcase size={14} /> Business Accounts</h3>
                      <div className="identity-container animate-scale-in">
                        {accounts.filter(a => a.userData.accountType === 'BUSINESS').map(account => (
                          <div
                            key={account.userData.email}
                            className={`identity-row clickable ${account.token === accessToken ? 'active-identity' : ''}`}
                            onClick={() => account.token !== accessToken && handleSwitchAccount(account)}
                          >
                            <div className="identity-leading">
                              <div className="identity-avatar-mini business">
                                {account.userData.firstName?.[0] || account.userData.email[0].toUpperCase()}
                              </div>
                            </div>
                            <div className="identity-info">
                              <div className="identity-label">
                                {account.userData.firstName} {account.userData.lastName}
                                {account.token === accessToken && <span className="current-badge-mini">Current</span>}
                                {account.userData.isPrimary && <span className="primary-badge-mini">Primary</span>}
                              </div>
                              <div className="identity-sub">{account.userData.email}</div>
                            </div>
                            <div className="identity-trailing">
                              {account.token !== accessToken && <ChevronRight size={16} className="switch-arrow-hint" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal Accounts Section (PUBLIC or CHILD) */}
                  {accounts.some(a => a.userData.accountType !== 'BUSINESS') && (
                    <div className="identity-group" style={{ marginTop: '24px' }}>
                      <h3 className="identity-group-title"><User size={14} /> Personal Accounts</h3>
                      <div className="identity-container animate-scale-in">
                        {accounts.filter(a => a.userData.accountType !== 'BUSINESS').map(account => (
                          <div
                            key={account.userData.email}
                            className={`identity-row clickable ${account.token === accessToken ? 'active-identity' : ''}`}
                            onClick={() => account.token !== accessToken && handleSwitchAccount(account)}
                          >
                            <div className="identity-leading">
                              <div className="identity-avatar-mini">
                                {account.userData.firstName?.[0] || account.userData.email[0].toUpperCase()}
                              </div>
                            </div>
                            <div className="identity-info">
                              <div className="identity-label">
                                {account.userData.firstName} {account.userData.lastName}
                                {account.token === accessToken && <span className="current-badge-mini">Current</span>}
                                {account.userData.isPrimary && <span className="primary-badge-mini">Primary</span>}
                              </div>
                              <div className="identity-sub">{account.userData.email}</div>
                            </div>
                            <div className="identity-trailing">
                              {account.token !== accessToken && <ChevronRight size={16} className="switch-arrow-hint" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


              </motion.div>
            )}

            {dashboardTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="content-section"
              >
                <header className="section-header">
                  <h2>Security Dashboard</h2>
                  <p>Settings and recommendations to help you keep your account secure.</p>
                </header>

                <div className="security-grid">
                  {/* Signing in to B2Auth Section */}
                  <div className="security-section">
                    <h3 className="identity-group-title"><LockIcon size={14} /> Signing in to B2Auth</h3>
                    <div className="identity-container">
                      <div className="identity-row">
                        <div className="identity-leading">
                          <div className="identity-icon-box"><LockIcon size={18} /></div>
                        </div>
                        <div className="identity-info">
                          <div className="identity-label">Password</div>
                          <div className="identity-sub">A secure password helps protect your B2Auth Account</div>
                        </div>
                        <div className="identity-trailing">
                          <button className="row-action-btn" onClick={() => setShowChangePasswordModal(true)}>Change</button>
                        </div>
                      </div>
                      <div className="identity-row">
                        <div className="identity-leading">
                          <div className="identity-icon-box"><ShieldCheck size={18} /></div>
                        </div>
                        <div className="identity-info">
                          <div className="identity-label">2-Step Verification</div>
                          <div className="identity-sub">{(profileData?.twoFactorEnabled || settingsData?.twoFactorEnabled) ? 'On' : 'Off'}</div>
                        </div>
                        <div className="identity-trailing">
                          {(profileData?.twoFactorEnabled || settingsData?.twoFactorEnabled) ? (
                            <div className="status-with-action">
                              <div className="status-indicator-pill on">Enabled</div>
                              <button className="row-action-btn disable-btn" onClick={handleDisable2FA}>Disable</button>
                            </div>
                          ) : (
                            <button
                              className="row-action-btn"
                              onClick={handleEnable2FA}
                            >
                              Enable
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cloud Authenticator Section */}
                  <div className="security-section">
                    <div className="header-with-flex">
                      <h3 className="identity-group-title"><Smartphone size={14} /> Cloud Authenticator</h3>
                      <button className="text-link-btn" onClick={() => setShowAddAuthModal(true)}>Add account</button>
                    </div>
                    <div className="identity-container">
                      {authenticatorAccounts.length > 0 ? authenticatorAccounts.map(acc => (
                        <div key={acc.id} className="identity-row auth-row">
                          <div className="identity-leading">
                            <div className="identity-icon-box"><Smartphone size={18} /></div>
                          </div>
                          <div className="identity-info">
                            <div className="identity-label">{acc.accountName}</div>
                            <AuthenticatorCode secret={acc.secretKey} />
                          </div>
                          <div className="identity-trailing">
                            <button style={{color:"red"}} className="icon-action-btn" onClick={() => handleDeleteAuthenticatorAccount(acc.id)}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      )) : (
                        <div className="empty-row-hint">No authenticator accounts synced.</div>
                      )}
                    </div>
                  </div>

                  {/* Your Devices Section */}
                  <div className="security-section">
                    <h3 className="identity-group-title"><Monitor size={14} /> Active Sessions</h3>
                    <div className="identity-container scrollable-identity-container">
                      {sessions.map(session => {
                        const device = parseUserAgent(session.userAgent);
                        return (
                          <div key={session.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <div 
                              className="identity-row" 
                              onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                              style={{ cursor: 'pointer', borderBottom: 'none' }}
                            >
                              <div className="identity-leading">
                                <div className="identity-icon-box">
                                  {device.type === 'phone' ? <Smartphone size={18} /> :
                                    device.type === 'tablet' ? <Tablet size={18} /> : <Monitor size={18} />}
                                </div>
                              </div>
                              <div className="identity-info">
                                <div className="identity-label">
                                  {device.name}
                                  {session.isCurrentSession && <span className="current-badge-mini">This device</span>}
                                </div>
                                <div className="identity-sub">{session.ipAddress} • {device.browser}</div>
                              </div>
                              <div className="identity-trailing">
                                {!session.isCurrentSession && (
                                  <button className="icon-action-btn" onClick={(e) => { e.stopPropagation(); handleRevokeSession(session.id); }}><LogOut size={16} /></button>
                                )}
                              </div>
                            </div>
                            {expandedSessionId === session.id && (
                              <div style={{ padding: '0 16px 16px 68px', fontSize: '13px', color: '#4b5563' }}>
                                <div style={{ marginBottom: '6px' }}><strong>Location:</strong> {session.location || 'Unknown'}</div>
                                <div><strong>Device/Browser:</strong> {session.userAgent || 'Unknown'}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connected Apps Section */}
                  <div className="security-section">
                    <h3 className="identity-group-title"><Globe size={14} /> Third-party apps with account access</h3>
                    <div className="identity-container scrollable-identity-container">
                      {externalSessions.length > 0 ? externalSessions.map(session => {
                        const device = parseUserAgent(session.userAgent);
                        return (
                        <div key={session.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <div 
                            className="identity-row" 
                            onClick={() => setExpandedExternalSessionId(expandedExternalSessionId === session.id ? null : session.id)} 
                            style={{ cursor: 'pointer', borderBottom: 'none' }}
                          >
                            <div className="identity-leading">
                              <div className="identity-icon-box">
                                {session.appName?.toLowerCase().includes('cliks business') ? (
                                  <img src={cliksBusinessLogo} alt="Cliks Business" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                                ) : session.appName?.toLowerCase().includes('cliks') ? (
                                  <img src={cliksLogo} alt="Cliks" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                                ) : session.appName?.toLowerCase().includes('bit tool') || session.appName?.toLowerCase().includes('bit-tool') ? (
                                  <img src={bitToolLogo} alt="Bit Tool" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                                ) : (
                                  <Globe size={18} />
                                )}
                              </div>
                            </div>
                            <div className="identity-info">
                              <div className="identity-label">{session.appName}</div>
                              <div className="identity-sub">
                                {session.ipAddress} • {device.browser} on {device.name} • Authorized {new Date(session.loggedInAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="identity-trailing">
                              <button className="row-action-btn danger" onClick={(e) => { e.stopPropagation(); handleRevokeExternalSession(session.id); }}>Remove access</button>
                            </div>
                          </div>
                          {expandedExternalSessionId === session.id && (
                            <div style={{ padding: '0 16px 16px 68px', fontSize: '13px', color: '#4b5563' }}>
                              <div style={{ marginBottom: '6px' }}><strong>Location:</strong> {session.location || 'Unknown'}</div>
                              <div><strong>User Agent:</strong> {session.userAgent || 'Unknown'}</div>
                            </div>
                          )}
                        </div>
                      );
                      }) : (
                        <div className="empty-row-hint">No apps have access to your account.</div>
                      )}
                    </div>
                  </div>
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
                          className={addAuthMode === "scan" ? "active" : ""}
                          onClick={() => setAddAuthMode("scan")}
                        >
                          Scan QR Code
                        </button>
                        <button
                          className={addAuthMode === "manual" ? "active" : ""}
                          onClick={() => setAddAuthMode("manual")}
                        >
                          Manual Entry
                        </button>
                      </div>

                      <div className="auth-modal-body">
                        {addAuthMode === "scan" ? (
                          <div className="qr-scanner-container">
                            <div id="reader" style={{ width: "100%" }}></div>
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
                                onChange={e => setManualAuthData({ ...manualAuthData, name: e.target.value })}
                              />
                            </div>
                            <div className="auth-input-group">
                              <label>Secret Key</label>
                              <input
                                type="text"
                                placeholder="Enter 2FA secret"
                                value={manualAuthData.secret}
                                onChange={e => setManualAuthData({ ...manualAuthData, secret: e.target.value })}
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

                {/* 2FA Setup Modal */}
                {showSetup2FAModal && (
                  <div className="auth-modal-overlay">
                    <div className="auth-modal-content animate-scale-in" style={{ maxWidth: '450px' }}>
                      <div className="auth-modal-header">
                        <h3>Enable 2-Step Verification</h3>
                        <button className="auth-close-btn" onClick={() => setShowSetup2FAModal(false)}>
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleVerifyAndEnable2FA}>
                        <div className="auth-modal-body" style={{ textAlign: 'center', padding: '24px' }}>
                          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                            Scan this QR code with your authenticator app (e.g. Google Authenticator) or enter the key manually below.
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', background: '#fff', padding: '12px', borderRadius: '12px', width: 'fit-content', margin: '0 auto 20px auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            {setup2FAData.qrCodeUrl ? (
                              <QRCodeSVG value={setup2FAData.qrCodeUrl} size={160} />
                            ) : (
                              <div style={{ width: '160px', height: '160px', background: '#f8fafc', borderRadius: '8px' }} />
                            )}
                          </div>

                          <div style={{ marginBottom: '20px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Secret Key (Manual Entry):</span>
                            <code style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', letterSpacing: '0.5px' }}>
                              {setup2FAData.secret}
                            </code>
                          </div>

                          {error && <div className="error-message" style={{ marginBottom: '16px', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>}

                          <div className="auth-input-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Verification Code</label>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Enter 6-digit code"
                              value={setup2FACode}
                              onChange={(e) => setSetup2FACode(e.target.value.replace(/[^0-9]/g, ''))}
                              required
                              style={{ width: '100%', height: '48px', padding: '0 16px', border: '1.5px solid var(--border)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-main)', textAlign: 'center', letterSpacing: '4px', fontWeight: '700' }}
                            />
                          </div>
                        </div>

                        <div className="auth-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                          <button type="button" className="text-btn" onClick={() => setShowSetup2FAModal(false)}>Cancel</button>
                          <button type="submit" className="primary-btn" disabled={loading || setup2FACode.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify & Enable'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Change Password Modal */}
                {showChangePasswordModal && (
                  <div className="auth-modal-overlay">
                    <div className="auth-modal-content animate-scale-in" style={{ maxWidth: "400px" }}>
                      <div className="auth-modal-header">
                        <h3>Change Password</h3>
                        <button className="auth-close-btn" onClick={() => setShowChangePasswordModal(false)}>
                          <X size={20} />
                        </button>
                      </div>
                      <div className="auth-modal-body">
                        <div className="auth-input-group">
                          <label>Current Password</label>
                          <input
                            type="password"
                            placeholder="Enter current password"
                            value={passwordForm.oldPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                          />
                          <div className="input-helper-link">
                            <button type="button" onClick={handleForgotInModal} className="text-link-btn-small">Forgot password?</button>
                          </div>
                        </div>
                        <div className="auth-input-group">
                          <label>New Password</label>
                          <input
                            type="password"
                            placeholder="Enter new password"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="auth-input-group">
                          <label style={{ marginTop: '10px' }}>Confirm New Password</label>
                          <input
                            style={{ marginBottom: '10px' }}
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          />
                        </div>
                        {error && <div className="error-message-inline" style={{ marginBottom: "16px" }}>{error}</div>}
                        <button
                          className="action-btn primary-solid full-width"
                          onClick={handleChangePassword}
                          disabled={loading || !passwordForm.oldPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                        >
                          {loading ? <RefreshCw className="spin" size={16} /> : "Update Password"}
                        </button>
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
                            onChange={(e) => setRecoveryInfo({ ...recoveryInfo, recoveryEmail: e.target.value })}
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
                            onChange={(e) => setRecoveryInfo({ ...recoveryInfo, phoneNumber: e.target.value })}
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
            {(() => {
              let displayLogo = betaLogo;
              if (redirectUri.includes('cliksbusiness')) {
                displayLogo = cliksBusinessLogo;
              } else if (redirectUri.includes('cliks.beta-softnet.com')) {
                displayLogo = cliksLogo;
              } else if (redirectUri.includes('bit-tool.com')) {
                displayLogo = bitToolLogo;
              }
              return <img src={displayLogo} alt="B2Auth" className="beta-logo-img" />;
            })()}
          </div>
          {view === 'signup-business-onboarding' ? (
            <h1 className="sign-in-to">Business Profile</h1>
          ) : view.startsWith('signup') ? (
            <h1 className="sign-in-to">Create Account</h1>
          ) : view.startsWith('forgot-password') ? (
            <h1 className="sign-in-to">Account Recovery</h1>
          ) : clientId ? (
            <h1 className="sign-in-to">Sign in to <span style={{ textTransform: 'capitalize' }}>{clientId.replace(/-/g, ' ')}</span></h1>
          ) : (
            <h1 className="sign-in-to">Sign in to B2Auth</h1>
          )}
          <p className="use-account">
            {view === 'signup-business-onboarding' ? `Complete profile details (Step ${onboardingStep} of 2)` :
             view === 'signup-selection' ? 'Choose your account type' :
             view === 'signup-profile' ? 'Enter your profile details' :
             view === 'signup-child' ? 'Enter child\'s profile details' :
             view === 'signup-parent-verify' ? 'Parent verification details' :
             view === 'signup-business' ? 'Enter business details' :
             view === 'signup-mail' ? 'Choose your email address' :
             view === 'signup-password-setup' ? 'Choose a strong password' :
             view.startsWith('signup') ? 'Create your account' :
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
                    setFormData(prev => ({ ...prev, identifier: '', password: '' }));
                    setUseSavedAccount(false);
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
            <div className="auth-step-merged">
              {!show2faRecovery ? (
                <form onSubmit={handleVerifyLogin2fa}>
                  <div className="login-grid-2f">
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
                      <div style={{ marginTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => setShow2faRecovery(true)}
                          style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'block', margin: '0 auto' }}
                        >
                          Don't have your device? Try another way
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="button-group-right" style={{ marginTop: '32px' }}>
                    <button type="submit" className="primary-btn" disabled={loading}>
                      {loading ? 'Verifying...' : 'Next'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerify2faRecoveryOtp}>
                  <div className="login-grid-2f">
                    <div className="input-field-group">
                      <label style={{ fontSize: '18px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Account Recovery</label>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                        We will send a 6-digit recovery code to your registered secondary email address.
                      </p>

                      {successMessage && (
                        <div className="success-banner-elite" style={{ marginBottom: '16px' }}>
                          <CheckCircle size={18} />
                          <span>{successMessage}</span>
                        </div>
                      )}

                      <div style={{ marginBottom: '20px' }}>
                        <button
                          type="button"
                          className="recovery-send-btn"
                          onClick={handleSend2faRecoveryOtp}
                          disabled={loading}
                        >
                          {loading ? <RefreshCw className="spin" size={18} /> : 'Send Recovery Code to Email'}
                        </button>
                      </div>

                      <div className="login-input-wrapper">
                        <input
                          type="text"
                          name="otp"
                          placeholder="Enter 6-digit code"
                          value={formData.otp}
                          onChange={handleInputChange}
                          required
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
                      <div style={{ marginTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => setShow2faRecovery(false)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                        >
                          ← Back to Authenticator
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="button-group-right" style={{ marginTop: '32px' }}>
                    <button type="submit" className="primary-btn" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify and Login'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {(view === 'login-email' || view === 'login-password') && (
            <form onSubmit={handleLogin} className="auth-step-merged">
              {useSavedAccount && formData.identifier ? (
                <div className="relogin-container">
                  <div className="account-relogin-header">
                    <div className="avatar-circle-relogin">
                      {formData.identifier.split('@')[0]?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="relogin-info">
                      <span className="relogin-email">{formData.identifier.includes('@') ? formData.identifier : `${formData.identifier}@bnxmail.com`}</span>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button type="button" className="switch-account-btn" onClick={() => {
                          setUseSavedAccount(false);
                          setFormData(prev => ({ ...prev, identifier: '', password: '' }));
                          setView('login-email');
                        }}>
                          Use another account
                        </button>
                        {accounts.length > 1 && (
                          <button type="button" className="switch-account-btn" onClick={() => {
                            setUseSavedAccount(false);
                            setView('account-selection');
                          }}>
                            Switch account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="input-field-group relogin-password-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      placeholder='Enter your password'
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
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
              )}

              <div className="forgot-password-link" onClick={handleForgotPasswordClick}>
                Forgot Password?
              </div>

              {accounts.length > 0 && (
                <div
                  className="forgot-password-link"
                  style={{ marginTop: '-20px', marginBottom: '32px' }}
                  onClick={() => {
                    if (accounts.length === 1) {
                      const acc = accounts[0];
                      localStorage.setItem('bnx_last_identifier', acc.userData.email);
                      setFormData(prev => ({ ...prev, identifier: acc.userData.email, password: '' }));
                      setUseSavedAccount(true);
                      setView('login-email');
                    } else {
                      setUseSavedAccount(false);
                      setView('account-selection');
                    }
                  }}
                >
                  Sign in with a saved account
                </div>
              )}

              <div className="login-btn-container">
                <button type="submit" className="merged-login-btn" disabled={loading}>
                  {loading ? '...' : 'Login'}
                </button>
              </div>
              {/* <div><img src={authLogo} alt="" className="auth-logo" height={40} /></div> */}
              <div className="auth-footer-merged">
                <div className="footer-right-links">
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '9px' }}>
                    <span>Help</span>
                    <button type="button" onClick={() => showLegalPage('privacy')}>Privacy</button>
                    <button type="button" onClick={() => showLegalPage('terms')}>Terms</button>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'blue', fontFamily: 'inherit' }}>Report Issue</span>
                  </div>
                </div>
                {/* <div><LockOpenIcon size={20} /></div> */}
                <div><img src={authLogo} alt="" className="auth-logo" height={40} style={{ marginRight: '25px' }} /></div>
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
                <div className="selection-card-premium" onClick={() => { resetSignupForm(); setSignupType('PERSONAL'); setView('signup-profile'); }}>
                  <div className="selection-icon-circle">
                    <User size={32} />
                  </div>
                  <div className="selection-content">
                    <h3>For myself</h3>
                    <p>Create a personal account to manage your secure emails.</p>
                  </div>
                  <ChevronRight className="arrow-icon" size={20} />
                </div>

                <div className="selection-card-premium" onClick={() => { resetSignupForm(); setSignupType('CHILD'); setView('signup-child'); }}>
                  <div className="selection-icon-circle accent">
                    <User size={32} />
                  </div>
                  <div className="selection-content">
                    <h3>For my child</h3>
                    <p>Manage your child's digital identity with parental controls.</p>
                  </div>
                  <ChevronRight className="arrow-icon" size={20} />
                </div>

                <div className="selection-card-premium" onClick={() => { resetSignupForm(); setSignupType('BUSINESS'); setView('signup-business'); }}>
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
            <form onSubmit={handleGoToMailSignup} className="auth-step">
              <div className="name-grid">
                <div className="input-group"><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder=" " /><label>First name</label></div>
                <div className="input-group"><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder=" " /><label>Last name</label></div>
              </div>
              <div className="input-group"><input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required placeholder=" " /><label>Date of Birth</label></div>
              
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>Next</button>
              </div>
            </form>
          )}

          {view === 'signup-business' && (
            <form onSubmit={handleGoToMailSignup} className="auth-step">
              <div className="name-grid">
                <div className="input-group"><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder=" " /><label>First Name</label></div>
                <div className="input-group"><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder=" " /><label>Last Name</label></div>
              </div>
              <div className="signup-inputs-container">
                <div className="input-group"><input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} required placeholder=" " /><label>Business Name</label></div>
                <div className="input-group"><input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required placeholder=" " /><label>Business ID Number</label></div>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>Next</button>
              </div>
            </form>
          )}

          {view === 'signup-business-onboarding' && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (onboardingStep === 1) {
                  if (!onboardingData.businessType || !onboardingData.industry.trim()) {
                    setError('Please fill in all required fields');
                    return;
                  }
                  setError('');
                  setOnboardingStep(2);
                } else {
                  handleOnboardingSubmit(e);
                }
              }} 
              className="auth-step" 
              style={{ maxWidth: '650px' }}
            >
              <div className="onboarding-welcome" style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', marginBottom: '8px' }}>Welcome, {formData.firstName}!</h2>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Please complete your Business Profile setup to unlock your dashboard.</p>
              </div>

              <div className="signup-inputs-container">
                {onboardingStep === 1 ? (
                  <>
                    <span className="onboarding-section-title">Business Information</span>
                    
                    <div className="name-grid">
                      <div className="input-group">
                        <select
                          name="businessType"
                          value={onboardingData.businessType}
                          onChange={(e) => setOnboardingData({ ...onboardingData, businessType: e.target.value })}
                          required
                        >
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Private Limited">Private Limited</option>
                          <option value="LLP">LLP</option>
                          <option value="Corporation">Corporation</option>
                          <option value="Non-Profit">Non-Profit</option>
                          <option value="Other">Other</option>
                        </select>
                        <label className="floating-select-label">Business Type</label>
                      </div>

                      <div className="input-group">
                        <input
                          type="text"
                          name="industry"
                          value={onboardingData.industry}
                          onChange={(e) => setOnboardingData({ ...onboardingData, industry: e.target.value })}
                          required
                          placeholder=" "
                        />
                        <label>Industry</label>
                      </div>
                    </div>

                    <div className="name-grid">
                      <div className="input-group">
                        <select
                          name="companySize"
                          value={onboardingData.companySize}
                          onChange={(e) => setOnboardingData({ ...onboardingData, companySize: e.target.value })}
                        >
                          <option value="">Company Size (Optional)</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="500+">500+ employees</option>
                        </select>
                        {onboardingData.companySize && (
                          <label className="floating-select-label">Company Size</label>
                        )}
                      </div>
                      
                      <div className="input-group">
                        <input
                          type="text"
                          name="businessWebsite"
                          value={onboardingData.businessWebsite}
                          onChange={(e) => setOnboardingData({ ...onboardingData, businessWebsite: e.target.value })}
                          placeholder=" "
                        />
                        <label>Website (Optional)</label>
                      </div>
                    </div>

                    <div className="input-group">
                      <input
                        type="text"
                        name="businessAddress"
                        value={onboardingData.businessAddress}
                        onChange={(e) => setOnboardingData({ ...onboardingData, businessAddress: e.target.value })}
                        placeholder=" "
                      />
                      <label>Business Address (Optional)</label>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="onboarding-section-title">Branding & Preferences</span>

                    <div className="name-grid" style={{ marginBottom: '20px' }}>
                      <div className="file-upload-box" style={{ border: '1.5px dashed var(--border)', borderRadius: '16px', padding: '12px', textAlign: 'center', position: 'relative', minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {onboardingData.profilePhoto ? (
                          <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                            <img src={onboardingData.profilePhoto} alt="Profile" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setOnboardingData({ ...onboardingData, profilePhoto: null })} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>✕</button>
                          </div>
                        ) : (
                          <>
                            <User size={20} style={{ color: '#64748b', marginBottom: '4px' }} />
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Profile Photo</span>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePhoto')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                          </>
                        )}
                      </div>

                      <div className="file-upload-box" style={{ border: '1.5px dashed var(--border)', borderRadius: '16px', padding: '12px', textAlign: 'center', position: 'relative', minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {onboardingData.companyLogo ? (
                          <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                            <img src={onboardingData.companyLogo} alt="Logo" style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setOnboardingData({ ...onboardingData, companyLogo: null })} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>✕</button>
                          </div>
                        ) : (
                          <>
                            <Briefcase size={20} style={{ color: '#64748b', marginBottom: '4px' }} />
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Company Logo</span>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'companyLogo')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="name-grid">
                      <div className="input-group">
                        <select
                          name="timeZone"
                          value={onboardingData.timeZone}
                          onChange={(e) => setOnboardingData({ ...onboardingData, timeZone: e.target.value })}
                          required
                        >
                          <option value="UTC">UTC / GMT</option>
                          <option value="EST">EST (UTC-5)</option>
                          <option value="PST">PST (UTC-8)</option>
                          <option value="IST">IST (UTC+5:30)</option>
                          <option value="BST">BST (UTC+1)</option>
                          <option value="AEST">AEST (UTC+10)</option>
                        </select>
                        <label className="floating-select-label">Time Zone</label>
                      </div>

                      <div className="input-group">
                        <select
                          name="language"
                          value={onboardingData.language}
                          onChange={(e) => setOnboardingData({ ...onboardingData, language: e.target.value })}
                          required
                        >
                          <option value="English (US)">English (US)</option>
                          <option value="English (UK)">English (UK)</option>
                          <option value="Español">Español</option>
                          <option value="Français">Français</option>
                          <option value="Deutsch">Deutsch</option>
                          <option value="हिन्दी">हिन्दी</option>
                        </select>
                        <label className="floating-select-label">Language</label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', paddingLeft: '4px' }}>
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={onboardingData.acceptTerms}
                        onChange={(e) => setOnboardingData({ ...onboardingData, acceptTerms: e.target.checked })}
                        required
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                      <label htmlFor="acceptTerms" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                        I accept the <a href="#" onClick={(e) => { e.preventDefault(); showLegalPage('terms'); }} style={{ color: 'var(--primary)', fontWeight: '600' }}>Terms of Service</a> & <a href="#" onClick={(e) => { e.preventDefault(); showLegalPage('privacy'); }} style={{ color: 'var(--primary)', fontWeight: '600' }}>Privacy Policy</a>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="auth-actions" style={{ marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="text-btn" 
                  onClick={() => {
                    if (onboardingStep === 2) {
                      setOnboardingStep(1);
                    } else {
                      handleLogout();
                    }
                  }}
                >
                  {onboardingStep === 2 ? 'Back' : 'Log Out'}
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {onboardingStep === 1 ? 'Next' : (loading ? 'Submitting...' : 'Submit & Continue')}
                </button>
              </div>
            </form>
          )}

          {view === 'signup-child' && (
            <form onSubmit={handleGoToMailSignup} className="auth-step">
              <div className="name-grid">
                <div className="input-group"><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder=" " /><label>First name</label></div>
                <div className="input-group"><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder=" " /><label>Last name</label></div>
              </div>
              <div className="input-group"><input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required placeholder=" " /><label>Date of Birth</label></div>

              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-selection')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>Next</button>
              </div>
            </form>
          )}

          {view === 'signup-parent-verify' && (
            <form onSubmit={parentOtpSent ? handleVerifyParentOtp : handleSendParentOtp} className="auth-step">
              <div className="signup-inputs-container">
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px' }}>
                  Please verify your parent's contact details. We'll send a verification code to their email.
                </p>

                <div className="input-group">
                  <input 
                    type="text" 
                    name="parentName" 
                    value={formData.parentName} 
                    onChange={handleInputChange} 
                    required 
                    disabled={parentOtpSent}
                    placeholder=" " 
                  />
                  <label>Parent Name</label>
                </div>

                <div className="input-group">
                  <input 
                    type="email" 
                    name="parentEmail" 
                    value={formData.parentEmail} 
                    onChange={handleInputChange} 
                    required 
                    disabled={parentOtpSent}
                    placeholder=" " 
                  />
                  <label>Parent Email Address</label>
                </div>

                <div className="input-group">
                  <input 
                    type="text" 
                    name="parentPhone" 
                    value={formData.parentPhone} 
                    onChange={handleInputChange} 
                    required 
                    disabled={parentOtpSent}
                    placeholder=" " 
                  />
                  <label>Parent Phone Number</label>
                </div>

                {parentOtpSent && (
                  <div className="input-group animate-fade-in" style={{ marginTop: '20px' }}>
                    <input 
                      type="text" 
                      name="parentOtp" 
                      value={formData.parentOtp} 
                      onChange={handleInputChange} 
                      required 
                      placeholder=" " 
                    />
                    <label>Verification Code (OTP)</label>
                  </div>
                )}
              </div>

              <div className="auth-actions">
                <button 
                  type="button" 
                  className="text-btn" 
                  onClick={() => {
                    if (parentOtpSent) {
                      setParentOtpSent(false);
                    } else {
                      setView('signup-child');
                    }
                  }}
                >
                  {parentOtpSent ? 'Change details' : 'Back'}
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Verifying...' : (parentOtpSent ? 'Verify & Continue' : 'Send Verification Code')}
                </button>
              </div>
            </form>
          )}

          {view === 'signup-mail' && (
            <form onSubmit={handleMailFormSubmit} className="auth-step-merged">
              <div className="login-grid-2f">
                <div className="input-field-group" style={{ width: '100%' }}>
                  <label style={{ fontSize: '18px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Choose your email address</label>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                    Select one of the suggested handles or enter a custom one.
                  </p>

                  {usernameSuggestions && usernameSuggestions.length > 0 && (
                    <div className="username-suggestions-container" style={{ marginBottom: '24px', width: '100%' }}>
                      <span className="suggestions-title" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px', display: 'block' }}>Suggested email addresses:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                        {usernameSuggestions.map((suggestion) => {
                          const fullEmail = `${suggestion}@bnxmail.com`;
                          const isSelected = formData.emailName === suggestion;
                          return (
                            <button
                              key={suggestion}
                              type="button"
                              className={`suggestion-chip ${isSelected ? 'active' : ''}`}
                              style={{
                                background: isSelected ? 'var(--primary)' : 'rgba(241, 245, 249, 0.8)',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--primary)' : '#e2e8f0',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                fontSize: '13px',
                                color: isSelected ? '#ffffff' : '#334155',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, username: suggestion, emailName: suggestion }));
                                setError('');
                              }}
                            >
                              <Mail size={14} style={{ color: isSelected ? '#ffffff' : '#64748b' }} />
                              <span>{fullEmail}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="manual-handle-section" style={{ marginTop: '16px', width: '100%' }}>
                    <span className="suggestions-title" style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Or create your own:</span>
                    <div className="input-group-mail" style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        name="emailName"
                        value={formData.emailName}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                          setFormData(prev => ({ ...prev, username: val, emailName: val }));
                          setError('');
                        }}
                        placeholder="Choose your handle"
                        className="custom-handle-input"
                      />
                      <span className="domain-suffix">@bnxmail.com</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => {
                  if (signupType === 'CHILD') setView('signup-parent-verify');
                  else if (signupType === 'BUSINESS') setView('signup-business');
                  else setView('signup-profile');
                }}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {tempToken ? (loading ? 'Creating...' : 'Create Email') : 'Next'}
                </button>
              </div>
            </form>
          )}

          {view === 'signup-password-setup' && (
            <form onSubmit={handleFinalSignupSubmit} className="auth-step">
              <div className="signup-inputs-container">
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px' }}>
                  Create a strong password for your new email address: <span style={{ color: 'var(--primary)', textAlign: 'center' }}>{formData.emailName}@bnxmail.com</span>
                </p>

                <div className="input-group">
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    required 
                    placeholder=" " 
                  />
                  <label>Password</label>
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

                <PasswordRequirements password={formData.password} />
              </div>

              <div className="auth-actions">
                <button type="button" className="text-btn" onClick={() => setView('signup-mail')}>Back</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
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
            <div className="auth-step-merged">
              <div className="login-grid">
                <div className="input-field-group">
                  <label style={{ fontSize: '18px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Account Recovery</label>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                    Select a recovery method to receive a verification code.
                  </p>

                  <div className="recovery-methods-list">
                    {recoveryOptions?.recoveryEmail && (
                      <div className="recovery-option-premium" onClick={() => handleSendOtp('EMAIL')}>
                        <div className="option-icon"><Mail size={20} /></div>
                        <div className="option-info">
                          <span className="option-label">Email</span>
                          <span className="option-value">{recoveryOptions.recoveryEmail}</span>
                        </div>
                        <ChevronRight size={18} className="option-arrow" />
                      </div>
                    )}
                    {recoveryOptions?.phoneNumber && (
                      <div className="recovery-option-premium" onClick={() => handleSendOtp('PHONE')}>
                        <div className="option-icon"><Smartphone size={20} /></div>
                        <div className="option-info">
                          <span className="option-label">Phone</span>
                          <span className="option-value">{recoveryOptions.phoneNumber}</span>
                        </div>
                        <ChevronRight size={18} className="option-arrow" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="auth-footer-merged" style={{ marginTop: '32px', borderTop: 'none', justifyContent: 'center' }}>
                <button className="text-link-btn" onClick={() => setView('forgot-password-identifier')}>Try another way</button>
              </div>
            </div>
          )}

          {view === 'forgot-password-otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-step-merged">
              <div className="login-grid">
                <div className="input-field-group">
                  <label style={{ fontSize: '18px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Enter Code</label>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                    A verification code was sent to your recovery method. Enter it below to continue.
                  </p>
                  <div className="login-input-wrapper">
                    <input
                      type="text"
                      name="otp"
                      placeholder="Enter 6-digit code"
                      value={formData.otp}
                      onChange={handleInputChange}
                      required
                      autoFocus
                      className="otp-input-elite"
                      maxLength="6"
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
      {customAlert.show && (
        <div className={`custom-toast-alert ${customAlert.type}`}>
          {customAlert.type === 'success' ? (
            <CheckCircle size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{customAlert.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
