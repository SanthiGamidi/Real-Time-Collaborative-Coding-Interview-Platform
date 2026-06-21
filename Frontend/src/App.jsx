// Ensure global variable exists for SockJS/STOMP in Vite/ESM environment
if (typeof global === 'undefined') {
  window.global = window;
}

import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import {
  Play,
  LogOut,
  Code,
  MessageSquare,
  Users,
  Copy,
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  Sparkles,
  User,
  Mail,
  Lock,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  Terminal
} from 'lucide-react';
import './App.css';

function App() {
  // Navigation / Auth States
  const [view, setView] = useState('auth'); // 'auth' | 'dashboard' | 'workspace'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Auth Form Inputs
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // User Profile
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Dashboard States
  const [sessions, setSessions] = useState([]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [joinRole, setJoinRole] = useState('CANDIDATE'); // 'INTERVIEWER' | 'CANDIDATE'
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardSuccess, setDashboardSuccess] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Workspace States
  const [currentSession, setCurrentSession] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'collaborators'
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const [collaboratorCursors, setCollaboratorCursors] = useState({}); // userId -> { line, ch }
  const [toastMessage, setToastMessage] = useState('');
  const [hasControl, setHasControl] = useState(true);

  // Refs for tracking and WebSocket connection
  const stompClientRef = useRef(null);
  const editorRef = useRef(null);
  const gutterRef = useRef(null);
  const chatFeedRef = useRef(null);
  const debounceCodeTimeoutRef = useRef(null);
  const debounceCursorTimeoutRef = useRef(null);

  // Synchronization refs to avoid stale closures in WebSocket subscription
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const currentSessionRef = useRef(currentSession);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Auth Error/Loading states
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize Auth from local storage token
  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    }
  }, [token]);

  // Load dashboard sessions list when view is 'dashboard'
  useEffect(() => {
    if (view === 'dashboard' && token) {
      loadMySessions();
    }
  }, [view, token]);

  // Scroll chat feed to bottom
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Display Toast messages temporary
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Fetch current user details using JWT
  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        setView('dashboard');
      } else {
        // Token might be expired
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      handleLogout();
    }
  };

  // Perform Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Please fill in all fields.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        // Reset fields
        setPasswordInput('');
        setAuthError('');
      } else {
        setAuthError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setAuthError('Unable to connect to the authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nameInput || !emailInput || !passwordInput) {
      setAuthError('Please fill in all fields.');
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          email: emailInput,
          password: passwordInput,
          role: 'USER' // Defaults to USER
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after registration
        localStorage.setItem('token', data.token);
        setToken(data.token);
        // Reset fields
        setNameInput('');
        setPasswordInput('');
        setAuthError('');
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setAuthError('Unable to connect to the authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out current session
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setCurrentUser(null);
    setView('auth');
    setSessions([]);
  };

  // Load Sessions
  const loadMySessions = async () => {
    try {
      const response = await fetch('/api/sessions/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        setDashboardError('Failed to load sessions.');
      }
    } catch (err) {
      setDashboardError('Server connectivity issue.');
    }
  };

  // Create New Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) {
      setDashboardError('Please enter a session title.');
      return;
    }
    setDashboardError('');
    setIsCreatingSession(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newSessionTitle })
      });

      if (response.ok) {
        const sessionData = await response.json();
        setNewSessionTitle('');
        setDashboardSuccess('Session created successfully!');
        loadMySessions();
        // Automatically open the session as INTERVIEWER
        enterWorkspace(sessionData);
      } else {
        const errorData = await response.json();
        setDashboardError(errorData.message || 'Failed to create session.');
      }
    } catch (err) {
      setDashboardError('Server connection issue.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Join Existing Session by ID
  const handleJoinSession = async (sessionId) => {
    setDashboardError('');
    try {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionRole: joinRole })
      });

      if (response.ok) {
        const sessionData = await response.json();
        enterWorkspace(sessionData);
      } else {
        const errorData = await response.json();
        setDashboardError(errorData.message || 'Failed to join session. Verify the Room ID.');
      }
    } catch (err) {
      setDashboardError('Could not join session.');
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadMySessions();
        triggerToast('Session deleted successfully.');
      } else {
        setDashboardError('You are not authorized to delete this session.');
      }
    } catch (err) {
      setDashboardError('Could not delete session.');
    }
  };

  // Enter Workspace
  const enterWorkspace = (sessionData) => {
    setCurrentSession(sessionData);
    setCode('// Start writing collaborative code here...\n\nfunction helloWorld() {\n    console.log("Hello, World!");\n}');
    setLanguage('javascript');
    setChatMessages([]);
    setCollaboratorCursors({});
    const selfParticipant = sessionData.participants?.find(p => p.user.id === currentUser?.id);
    setHasControl(selfParticipant ? selfParticipant.hasControl !== false : true);
    setView('workspace');
    connectWebSocket(sessionData.id);
  };

  // Leave Workspace
  const handleLeaveWorkspace = () => {
    disconnectWebSocket();
    setView('dashboard');
    setCurrentSession(null);
  };

  // WebSocket Integration (SockJS & STOMP)
  const connectWebSocket = (sessionId) => {
    setConnectionStatus('connecting');

    // Create a new SockJS connection
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);

    // Turn off console debugging to keep output clean, but let's log connection info
    client.debug = (str) => {
      console.log('[STOMP]:', str);
    };

    client.connect(
      { Authorization: `Bearer ${token}` },
      (frame) => {
        setConnectionStatus('connected');
        stompClientRef.current = client;

        // 1. Subscribe to the session topic
        client.subscribe(`/topic/session/${sessionId}`, (message) => {
          const data = JSON.parse(message.body);

          // Handle incoming messages based on properties
          if (data.code !== undefined) {
            // Code Update
            if (data.userId !== currentUserRef.current?.id) {
              setCode(data.code);
              if (data.language) {
                setLanguage(data.language);
              }
            }
          } else if (data.content !== undefined) {
            // Chat Message
            setChatMessages((prev) => [...prev, data]);
          } else if (data.line !== undefined) {
            // Cursor Position Movement
            if (data.userId !== currentUserRef.current?.id) {
              setCollaboratorCursors((prev) => ({
                ...prev,
                [data.userId]: { line: data.line, ch: data.ch }
              }));
            }
          } else if (data.hasControl !== undefined) {
            // Editing Control Sync
            if (data.userId === currentUserRef.current?.id) {
              setHasControl(data.hasControl);
              triggerToast(data.hasControl ? 'Your editing permission has been granted.' : 'Your editing permission has been revoked.');
            }
            fetchUpdatedParticipants(sessionId);
          } else if (data.action !== undefined) {
            if (data.action === 'CLOSE') {
              triggerToast('The session has been ended by the interviewer.');
              setTimeout(() => {
                handleLeaveWorkspace();
              }, 2000);
              return;
            }
            // User Join/Leave
            const systemMsg = {
              senderName: 'System',
              content: `${data.userName} has ${data.action.toLowerCase()}ed the workspace.`,
              timestamp: data.timestamp,
              userId: 0 // System ID
            };
            setChatMessages((prev) => [...prev, systemMsg]);

            // Refresh participant details from backend
            fetchUpdatedParticipants(sessionId);

            // Sync current code to new participant if they just joined
            if (data.action === 'JOIN' && data.userId !== currentUserRef.current?.id) {
              broadcastCodeUpdate(codeRef.current, languageRef.current);
            }
          }
        });

        // 2. Broadcast Join Message
        sendJoinLeaveMessage(sessionId, 'JOIN');
      },
      (error) => {
        console.error('STOMP Connection error:', error);
        setConnectionStatus('disconnected');
        // Retry connection after a short delay
        setTimeout(() => {
          if (view === 'workspace') {
            connectWebSocket(sessionId);
          }
        }, 5000);
      }
    );
  };

  // Fetch updated participant list in workspace
  const fetchUpdatedParticipants = async (sessionId) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSession((prev) => {
          if (!prev) return null;
          return { ...prev, participants: data.participants };
        });
        
        // Sync local control state from backend response
        const selfParticipant = data.participants?.find(p => p.user.id === currentUserRef.current?.id);
        if (selfParticipant) {
          setHasControl(selfParticipant.hasControl !== false);
        }
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      const sId = currentSessionRef.current?.id;
      if (sId) {
        sendJoinLeaveMessage(sId, 'LEAVE');
      }
      stompClientRef.current.disconnect(() => {
        console.log('STOMP Disconnected');
      });
    }
    stompClientRef.current = null;
    setConnectionStatus('disconnected');
  };

  // Send Join/Leave state to socket
  const sendJoinLeaveMessage = (sessionId, action) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.send(
        `/app/session/${sessionId}/join-leave`,
        {},
        JSON.stringify({
          userId: currentUserRef.current?.id,
          userName: currentUserRef.current?.name,
          action: action,
          timestamp: Date.now()
        })
      );
    }
  };

  // Broadcast code update
  const broadcastCodeUpdate = (updatedCode, selectedLanguage) => {
    const sId = currentSessionRef.current?.id;
    if (sId && stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.send(
        `/app/session/${sId}/code`,
        {},
        JSON.stringify({
          userId: currentUserRef.current?.id,
          code: updatedCode,
          language: selectedLanguage,
          timestamp: Date.now()
        })
      );
    }
  };

  // Broadcast cursor movements
  const broadcastCursorMove = (line, ch) => {
    const sId = currentSessionRef.current?.id;
    if (sId && stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.send(
        `/app/session/${sId}/cursor`,
        {},
        JSON.stringify({
          userId: currentUserRef.current?.id,
          line: line,
          ch: ch,
          timestamp: Date.now()
        })
      );
    }
  };

  // Handle local code typing
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);

    // Debounce WebSocket transmission to preserve typing performance
    if (debounceCodeTimeoutRef.current) {
      clearTimeout(debounceCodeTimeoutRef.current);
    }
    debounceCodeTimeoutRef.current = setTimeout(() => {
      broadcastCodeUpdate(newCode, languageRef.current);
    }, 200);

    // Track local cursor position immediately
    handleCursorMovement(e);
  };

  // Handle local language change
  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    broadcastCodeUpdate(codeRef.current, selectedLang);
  };

  // Track cursor position inside textarea
  const handleCursorMovement = (e) => {
    const textarea = e.target;
    const selectionStart = textarea.selectionStart;
    const textUpToCursor = textarea.value.substring(0, selectionStart);
    const lines = textUpToCursor.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;

    // Debounce cursor broadcast
    if (debounceCursorTimeoutRef.current) {
      clearTimeout(debounceCursorTimeoutRef.current);
    }
    debounceCursorTimeoutRef.current = setTimeout(() => {
      broadcastCursorMove(lineNum, colNum);
    }, 250);
  };

  // Tab key indentation support inside editor
  const handleEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      
      setCode(newValue);
      
      // Keep cursor in relative position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);

      broadcastCodeUpdate(newValue, languageRef.current);
    }
  };

  // Sync scroll top between textarea and line number gutter
  const handleEditorScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Send Chat message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const sId = currentSessionRef.current?.id;
    if (sId && stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.send(
        `/app/session/${sId}/chat`,
        {},
        JSON.stringify({
          userId: currentUserRef.current?.id,
          senderName: currentUserRef.current?.name,
          content: chatInput,
          timestamp: Date.now()
        })
      );
      setChatInput('');
    } else {
      triggerToast('Cannot send. Chat disconnected.');
    }
  };

  // Copy room code to clipboard
  const copyRoomId = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.id);
      triggerToast('Room ID copied to clipboard!');
    }
  };

  const toggleParticipantControl = async (participantId, currentControl) => {
    const sId = currentSession?.id;
    if (!sId) return;
    try {
      const response = await fetch(`/api/sessions/${sId}/participants/${participantId}/control?hasControl=${!currentControl}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        if (stompClientRef.current && stompClientRef.current.connected) {
          stompClientRef.current.send(
            `/app/session/${sId}/control`,
            {},
            JSON.stringify({
              sessionId: sId,
              userId: participantId,
              hasControl: !currentControl,
              timestamp: Date.now()
            })
          );
        }
      } else {
        triggerToast('Failed to change control.');
      }
    } catch (err) {
      console.error('Error toggling control:', err);
    }
  };

  const handleEndSession = async () => {
    const sId = currentSession?.id;
    if (!sId) return;
    if (!window.confirm('Are you sure you want to end this session for all participants?')) return;
    try {
      const response = await fetch(`/api/sessions/${sId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        if (stompClientRef.current && stompClientRef.current.connected) {
          stompClientRef.current.send(
            `/app/session/${sId}/join-leave`,
            {},
            JSON.stringify({
              userId: currentUser?.id,
              userName: currentUser?.name,
              action: 'CLOSE',
              timestamp: Date.now()
            })
          );
        }
      } else {
        triggerToast('Failed to end session.');
      }
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const handleLeaveSession = async () => {
    const sId = currentSession?.id;
    if (!sId) return;
    if (!window.confirm('Are you sure you want to leave the room?')) return;
    try {
      await fetch(`/api/sessions/${sId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error leaving session:', err);
    } finally {
      handleLeaveWorkspace();
    }
  };

  // Helpers for displaying line numbers in Editor
  const getLineNumbers = () => {
    const lineCount = code.split('\n').length;
    const lines = [];
    for (let i = 1; i <= Math.max(1, lineCount); i++) {
      lines.push(
        <div key={i} className="gutter-number">
          {i}
        </div>
      );
    }
    return lines;
  };

  // Clean up references on unmount
  useEffect(() => {
    return () => {
      if (stompClientRef.current) {
        disconnectWebSocket();
      }
    };
  }, []);


  // --- VIEW RENDERING ---

  // 1. AUTHENTICATION (Login / Sign Up)
  if (view === 'auth') {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <div className="auth-logo">
              <Code size={28} />
            </div>
            <h2 className="auth-title">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="auth-subtitle">
              {authMode === 'login' 
                ? 'Sign in to access your collaborative coding workspace' 
                : 'Join the collaborative workspace platform'
              }
            </p>
          </div>

          {authError && (
            <div className="auth-error-box" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(248, 113, 113, 0.1)', 
              color: 'var(--danger)', 
              padding: '12px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '13px', 
              marginBottom: '20px',
              border: '1px solid rgba(248, 113, 113, 0.2)'
            }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              {authMode === 'login' 
                ? "Don't have an account? " 
                : 'Already have an account? '
              }
            </span>
            <span
              className="auth-toggle-link text-primary"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              style={{ color: 'var(--primary)', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? 'Register here' : 'Sign in here'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW
  if (view === 'dashboard') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="brand-section">
            <div className="brand-logo">
              <Code size={22} />
            </div>
            <h1 className="brand-name">CollabCode</h1>
          </div>

          <div className="user-profile">
            <div className="user-info">
              <p className="user-name">{currentUser?.name}</p>
              <p className="user-role">{currentUser?.email}</p>
            </div>
            <button className="btn-outline" onClick={handleLogout}>
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </header>

        {dashboardError && (
          <div className="alert-message" style={{
            background: 'rgba(248, 113, 113, 0.1)',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {dashboardError}
          </div>
        )}

        {dashboardSuccess && (
          <div className="alert-message" style={{
            background: 'rgba(52, 211, 153, 0.1)',
            color: 'var(--success)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            {dashboardSuccess}
          </div>
        )}

        <div className="dashboard-grid">
          {/* Create & Join Session Forms */}
          <div className="session-forms">
            <div className="session-form-card glass-panel" style={{ marginBottom: '24px' }}>
              <h2 className="section-title">
                <Plus size={18} />
                Create New Room
              </h2>
              <form onSubmit={handleCreateSession}>
                <div className="form-group">
                  <label className="form-label">Room Session Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="System Design Mock Interview"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    style={{ paddingLeft: '14px' }}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isCreatingSession}>
                  {isCreatingSession ? 'Creating...' : 'Create & Host Session'}
                </button>
              </form>
            </div>

            <div className="session-form-card glass-panel">
              <h2 className="section-title">
                <Users size={18} />
                Join Existing Room
              </h2>
              <div className="form-group">
                <label className="form-label">Select Session Role</label>
                <div className="role-selector">
                  <div
                    className={`role-option ${joinRole === 'CANDIDATE' ? 'active' : ''}`}
                    onClick={() => setJoinRole('CANDIDATE')}
                  >
                    <span className="role-title">Candidate</span>
                    <span className="role-desc">Allows typing code</span>
                  </div>
                  <div
                    className={`role-option ${joinRole === 'INTERVIEWER' ? 'active' : ''}`}
                    onClick={() => setJoinRole('INTERVIEWER')}
                  >
                    <span className="role-title">Interviewer</span>
                    <span className="role-desc">Review and type code</span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Room ID (UUID)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    id="join-session-id-input"
                    className="form-input"
                    placeholder="Enter Session UUID"
                    style={{ paddingLeft: '14px' }}
                  />
                  <button
                    className="btn-success"
                    onClick={() => {
                      const input = document.getElementById('join-session-id-input');
                      if (input && input.value.trim()) {
                        handleJoinSession(input.value.trim());
                      } else {
                        setDashboardError('Please enter a valid Room ID.');
                      }
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions List */}
          <div className="session-list-section">
            <h2 className="section-title" style={{ margin: 0 }}>
              <Terminal size={18} />
              Your Active Rooms ({sessions.length})
            </h2>

            <div className="sessions-list">
              {sessions.length === 0 ? (
                <div className="empty-sessions">
                  <Info size={28} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ fontWeight: '500' }}>No active rooms found</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Create a session on the left or enter a room code to get started.
                  </p>
                </div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    className="session-item glass-panel"
                    onClick={() => handleJoinSession(s.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="session-details">
                      <p className="session-title-text">{s.title}</p>
                      <div className="session-meta">
                        <span className={`session-status ${s.status.toLowerCase()}`}>
                          {s.status}
                        </span>
                        <span>Created: {new Date(s.createdAt).toLocaleDateString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} />
                          {s.participants?.length || 0} online
                        </span>
                      </div>
                    </div>
                    <div className="session-actions">
                      <button className="btn-success" onClick={() => handleJoinSession(s.id)}>
                        Enter
                      </button>
                      {(s.createdBy.id === currentUser?.id || currentUser?.role === 'ADMIN') && (
                        <button
                          className="btn-danger"
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          title="Delete Session"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Floating toast */}
        {toastMessage && (
          <div className="toast-msg">
            <Check size={16} />
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  // 3. COLLABORATIVE WORKSPACE VIEW
  if (view === 'workspace') {
    const isSelfInterviewer = currentSession?.participants?.find(
      (p) => p.user.id === currentUser?.id
    )?.sessionRole === 'INTERVIEWER';

    const isHost = currentSession?.createdBy?.id === currentUser?.id;

    return (
      <div className="workspace">
        {/* Workspace Top Bar */}
        <header className="workspace-header">
          <div className="workspace-info">
            {isSelfInterviewer ? (
              <button className="back-btn" onClick={handleLeaveWorkspace}>
                <ArrowLeft size={16} />
                Dashboard
              </button>
            ) : (
              <button className="back-btn" onClick={handleLeaveSession}>
                <ArrowLeft size={16} />
                Dashboard
              </button>
            )}
            <div className="workspace-title-box">
              <span className="workspace-title">{currentSession?.title}</span>
              <div className="connection-badge">
                <span className={`connection-dot ${connectionStatus}`}></span>
                <span style={{ textTransform: 'capitalize', fontSize: '10px' }}>
                  {connectionStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="workspace-controls">
            <div className="session-id-badge">
              <span style={{ color: 'var(--text-secondary)' }}>Room ID:</span>
              <span>{currentSession?.id.substring(0, 8)}...</span>
              <button className="btn-copy" onClick={copyRoomId} title="Copy Room ID">
                <Copy size={14} />
              </button>
            </div>
            {isSelfInterviewer ? (
              <button
                className="btn-outline"
                onClick={handleEndSession}
                style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}
              >
                End Session
              </button>
            ) : (
              <button
                className="btn-outline"
                onClick={handleLeaveSession}
                style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}
              >
                Leave Room
              </button>
            )}
          </div>
        </header>

        {/* Workspace Split Layout */}
        <div className="workspace-main">
          
          {/* Left Panel: Info & Users */}
          <aside className="workspace-left-panel">
            <div className="panel-section">
              <h3 className="panel-section-title">Session Info</h3>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Host: {currentSession?.createdBy.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Mode: {isSelfInterviewer ? 'Interviewer Panel' : 'Candidate Panel'}
              </p>
            </div>

            <div className="panel-section" style={{ flex: 1 }}>
              <h3 className="panel-section-title">Active Collaborators</h3>
              <div className="participants-list">
                {currentSession?.participants?.map((p) => {
                  const isSelf = p.user.id === currentUser?.id;
                  const cursor = collaboratorCursors[p.user.id];
                  return (
                    <div key={p.user.id} className={`participant-row ${isSelf ? 'self' : ''}`}>
                      <div className="participant-details">
                        <div className="participant-avatar">
                          {p.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span className="participant-name" title={p.user.name}>
                            {p.user.name} {isSelf && '(You)'}
                          </span>
                          {cursor && (
                            <span style={{ fontSize: '10px', color: 'var(--accent)' }}>
                              L: {cursor.line} C: {cursor.ch}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`participant-role-badge ${p.sessionRole.toLowerCase()}`}>
                          {p.sessionRole.substring(0, 5)}
                        </span>
                        {isHost && !isSelf && (
                          <button
                            className="btn-control-toggle"
                            onClick={() => toggleParticipantControl(p.user.id, p.hasControl !== false)}
                            title={p.hasControl !== false ? 'Revoke Editing Permission' : 'Grant Editing Permission'}
                            style={{
                              padding: '2px 5px',
                              fontSize: '9px',
                              fontWeight: '600',
                              borderRadius: '4px',
                              border: '1px solid',
                              background: p.hasControl !== false ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              borderColor: p.hasControl !== false ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                              color: p.hasControl !== false ? 'var(--success)' : 'var(--danger)',
                              cursor: 'pointer'
                            }}
                          >
                            {p.hasControl !== false ? 'Ctrl' : 'No Ctrl'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Center Panel: Custom Text Area Code Editor */}
          <main className="workspace-editor-container">
            <div className="editor-toolbar">
              <div className="editor-settings">
                <label className="form-label" style={{ margin: 0, fontSize: '12px' }}>Language:</label>
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="select-language"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="html">HTML</option>
                </select>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Indent: 4 Spaces
              </div>
            </div>

            <div className="editor-body">
              <div className="editor-gutter" ref={gutterRef}>
                {getLineNumbers()}
              </div>
              <div className="editor-textarea-wrapper">
                <textarea
                  ref={editorRef}
                  className="editor-textarea"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleEditorKeyDown}
                  onScroll={handleEditorScroll}
                  onKeyUp={handleCursorMovement}
                  onClick={handleCursorMovement}
                  placeholder={hasControl ? "Type your code here..." : "Editing permissions revoked by the Host."}
                  spellCheck="false"
                  readOnly={!hasControl}
                />
              </div>
            </div>

            <div className="cursor-broadcast-info" style={{
              background: !hasControl ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
              color: !hasControl ? 'var(--danger)' : 'var(--text-secondary)',
              transition: 'all 0.3s ease'
            }}>
              <div>
                {!hasControl ? '⚠️ Editing Control Revoked by Host' : 'Collaborative Code Editor'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>
                {language.toUpperCase()}
              </div>
            </div>
          </main>

          {/* Right Panel: Live Room Chat */}
          <section className="workspace-right-panel">
            <div className="chat-header">
              <MessageSquare size={16} className="text-primary" />
              <span className="chat-header-title">Live Room Chat</span>
            </div>

            <div className="chat-feed" ref={chatFeedRef}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px' }}>
                  No messages yet. Send a message to start chatting!
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isSelf = msg.userId === currentUser?.id;
                  const isSystem = msg.userId === 0;

                  if (isSystem) {
                    return (
                      <div key={index} className="chat-msg system">
                        <div className="chat-msg-bubble">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={`chat-msg ${isSelf ? 'self' : ''}`}>
                      <div className="chat-msg-meta">
                        <span className="chat-msg-sender">{isSelf ? 'You' : msg.senderName}</span>
                        <span className="chat-msg-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="chat-msg-bubble">
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="chat-input-area">
              <form onSubmit={handleSendChat} className="chat-form">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Send a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn-send">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </section>

        </div>

        {/* Floating toast */}
        {toastMessage && (
          <div className="toast-msg">
            <Check size={16} />
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;
