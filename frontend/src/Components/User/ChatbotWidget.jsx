import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Logo from '../logo/logo.png';

const ChatbotWidget = ({ isOpen, onClose, sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [user, setUser] = useState(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const widgetSessionId = useRef(
    sessionId || `milion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ─── CSS ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'rs-styles-v2';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

      @keyframes rs-up   { from{transform:translateY(24px) scale(.97);opacity:0} to{transform:none;opacity:1} }
      @keyframes rs-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      @keyframes rs-ring { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.7);opacity:0} }
      @keyframes rs-blink{ 0%,80%,100%{transform:scale(.55);opacity:.35} 40%{transform:scale(1);opacity:1} }
      @keyframes rs-float{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      @keyframes rs-glow { 0%,100%{box-shadow:0 0 18px rgba(5,150,105,.28),0 8px 28px rgba(0,0,0,.4)} 50%{box-shadow:0 0 34px rgba(5,150,105,.52),0 12px 34px rgba(0,0,0,.5)} }

      /* shell */
      .rs-w {
        position:fixed; bottom:24px; right:24px;
        width:382px; height:608px;
        display:flex; flex-direction:column;
        z-index:9999;
        animation:rs-up .38s cubic-bezier(.16,1,.3,1);
        font-family:'DM Sans',sans-serif;
        border-radius:24px;
        background:#ffffff;
        border:1px solid rgba(5,150,105,.15);
        box-shadow:0 20px 60px rgba(0,0,0,.12);
      }

      .rs-inner {
        width:100%; height:100%;
        display:flex; flex-direction:column;
        border-radius:24px; overflow:hidden;
        background:#ffffff;
      }

      /* header */
      .rs-header {
        padding:14px 16px;
        display:flex; align-items:center; justify-content:space-between;
        flex-shrink:0; position:relative; overflow:hidden;
        background:linear-gradient(135deg,#059669,#047857);
        border-bottom:1px solid rgba(255,255,255,.08);
      }
      .rs-header::before {
        content:''; position:absolute; inset:0; pointer-events:none;
        background:radial-gradient(ellipse at top left, rgba(255,255,255,.06) 0%, transparent 65%);
      }

      .rs-header-left { display:flex; align-items:center; gap:11px; position:relative; z-index:1; }

      /* logo box */
      .rs-logo-wrap { position:relative; width:40px; height:40px; flex-shrink:0; }
      .rs-logo-box {
        width:40px; height:40px; border-radius:13px; overflow:hidden;
        display:flex; align-items:center; justify-content:center;
        background:rgba(255,255,255,.15);
        border:1.5px solid rgba(255,255,255,.2);
      }
      .rs-logo-box img { 
        width:26px; 
        height:26px; 
        object-fit:contain;
      }

      .rs-dot {
        position:absolute; bottom:-2px; right:-2px;
        width:11px; height:11px; border-radius:50%;
        background:#4ade80; z-index:2;
        border:2px solid #ffffff;
      }
      .rs-dot::after {
        content:''; position:absolute; inset:-3px; border-radius:50%;
        background:#4ade80; animation:rs-ring 2s ease-out infinite;
      }

      .rs-header-info h3 {
        margin:0; font-family:'Syne',sans-serif; font-size:14.5px; font-weight:700;
        letter-spacing:-.02em; color:#ffffff;
      }
      .rs-sub { font-size:10.5px; margin-top:2px; color:rgba(255,255,255,.7); }

      /* icon buttons */
      .rs-actions { display:flex; align-items:center; gap:5px; position:relative; z-index:1; }
      .rs-ibtn {
        width:32px; height:32px; border-radius:10px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.08);
        color:rgba(255,255,255,.7); transition:all .2s;
      }
      .rs-ibtn:hover { background:rgba(255,255,255,.18); color:#ffffff; border-color:rgba(255,255,255,.25); }
      .rs-ibtn.danger:hover { background:rgba(239,68,68,.2)!important; color:#fca5a5!important; border-color:rgba(239,68,68,.3)!important; }

      /* error */
      .rs-err {
        padding:7px 15px; font-size:11px; color:#dc2626; flex-shrink:0;
        display:flex; align-items:center; gap:6px;
        background:#fef2f2; border-bottom:1px solid #fecaca;
      }

      /* messages */
      .rs-msgs {
        flex:1; overflow-y:auto; padding:18px 14px;
        display:flex; flex-direction:column; gap:14px;
        background:#f9fafb; scrollbar-width:thin;
        scrollbar-color:rgba(0,0,0,.08) transparent;
      }
      .rs-msgs::-webkit-scrollbar { width:4px; }
      .rs-msgs::-webkit-scrollbar-thumb { border-radius:4px; background:rgba(0,0,0,.08); }

      .rs-row { display:flex; align-items:flex-end; gap:8px; animation:rs-in .28s ease; }
      .rs-row.user { flex-direction:row-reverse; }

      /* bot icon in messages */
      .rs-bot-ico {
        width:28px; height:28px; border-radius:9px; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        overflow:hidden;
        background:linear-gradient(135deg,#059669,#047857);
        border:1px solid rgba(5,150,105,.15);
      }
      .rs-bot-ico img { 
        width:18px; 
        height:18px; 
        object-fit:contain;
      }

      /* user avatar */
      .rs-uavatar {
        width:28px; height:28px; border-radius:9px; flex-shrink:0;
        overflow:hidden; border:1.5px solid rgba(5,150,105,.2);
      }
      .rs-uavatar img { width:100%; height:100%; object-fit:cover; display:block; }

      .rs-bwrap { max-width:73%; display:flex; flex-direction:column; gap:3px; }
      .rs-row.user .rs-bwrap { align-items:flex-end; }

      .rs-bubble {
        padding:10px 14px; border-radius:18px; border:1px solid;
        font-size:13.5px; line-height:1.65; word-wrap:break-word; white-space:pre-line;
        transition:background .3s,color .3s,border-color .3s;
      }
      .rs-bubble.bot  { 
        border-bottom-left-radius:5px; 
        background:#ffffff; 
        border-color:rgba(5,150,105,.1); 
        color:#1f2937; 
      }
      .rs-bubble.user { 
        border-bottom-right-radius:5px; 
        background:linear-gradient(135deg,#059669,#047857); 
        border-color:rgba(5,150,105,.2); 
        color:#ffffff; 
      }
      .rs-bubble.err  { 
        background:#fef2f2!important; 
        border-color:#fecaca!important; 
        color:#dc2626!important; 
      }

      .rs-time { font-size:10px; padding:0 3px; color:rgba(0,0,0,.25); }

      .rs-divider { display:flex; align-items:center; gap:10px; margin:2px 0; }
      .rs-divider span { font-size:10px; font-weight:500; letter-spacing:.05em; text-transform:uppercase; white-space:nowrap; color:rgba(0,0,0,.26); }
      .rs-divider::before,.rs-divider::after { content:''; flex:1; height:1px; background:rgba(0,0,0,.07); }

      /* typing */
      .rs-typing { display:flex; gap:4px; align-items:center; padding:3px 0; }
      .rs-typing span { width:6px; height:6px; border-radius:50%; display:inline-block; animation:rs-blink 1.2s infinite ease-in-out; background:#059669; }
      .rs-typing span:nth-child(2){animation-delay:.2s}
      .rs-typing span:nth-child(3){animation-delay:.4s}

      /* chips */
      .rs-chips-wrap {
        flex-shrink:0; border-top:1px solid rgba(0,0,0,.06);
        background:#ffffff;
      }

      .rs-chips {
        display:flex; flex-wrap:wrap; gap:7px; padding:10px 14px;
      }

      .rs-chip {
        padding:6px 12px; border-radius:20px; border:1px solid rgba(5,150,105,.15);
        font-size:11.5px; cursor:pointer; transition:all .2s; white-space:nowrap;
        font-family:'DM Sans',sans-serif;
        background:rgba(5,150,105,.04); color:rgba(5,150,105,.7);
      }
      .rs-chip:hover:not(:disabled) { 
        background:rgba(5,150,105,.1); 
        border-color:rgba(5,150,105,.3); 
        color:#047857; 
      }
      .rs-chip:disabled { opacity:.38; cursor:not-allowed; }

      /* input */
      .rs-input-area {
        padding:11px 14px 15px; flex-shrink:0; border-top:1px solid rgba(0,0,0,.06);
        background:#ffffff;
      }

      .rs-input-row {
        display:flex; align-items:flex-end; gap:9px;
        border-radius:16px; padding:9px 9px 9px 15px; border:1px solid rgba(5,150,105,.15);
        transition:all .3s;
        background:#f9fafb;
      }
      .rs-input-row:focus-within { 
        border-color:rgba(5,150,105,.4); 
        box-shadow:0 0 0 3px rgba(5,150,105,.06);
        background:#ffffff;
      }

      .rs-textarea {
        flex:1; background:none; border:none; outline:none; resize:none;
        font-size:13.5px; font-family:'DM Sans',sans-serif; line-height:1.5;
        max-height:90px; color:#1f2937;
      }
      .rs-textarea::placeholder { color:rgba(0,0,0,.25); }

      .rs-send {
        width:34px; height:34px; border-radius:11px; border:none;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        flex-shrink:0; transition:all .2s;
        background:linear-gradient(135deg,#059669,#047857);
      }
      .rs-send svg { display:block; stroke:#ffffff !important; color:#ffffff !important; }
      .rs-send:hover:not(:disabled) { 
        background:linear-gradient(135deg,#047857,#065f46); 
        transform:scale(1.06); 
      }
      .rs-send:disabled { background:rgba(100,100,100,.15); cursor:not-allowed; transform:none; }
      .rs-send:disabled svg { stroke:rgba(130,130,130,.5) !important; }

      /* chat head */
      .rs-head {
        position:fixed; bottom:24px; right:24px;
        width:58px; height:58px; border-radius:18px;
        background:linear-gradient(135deg,#059669,#047857);
        border:1.5px solid rgba(5,150,105,.3);
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; z-index:9999; overflow:hidden;
        transition:all .22s cubic-bezier(.34,1.56,.64,1);
        animation:rs-float 4s ease-in-out infinite, rs-glow 3.5s ease-in-out infinite;
        box-shadow:0 4px 15px rgba(5,150,105,.3);
      }
      .rs-head img { 
        width:34px; 
        height:34px; 
        object-fit:contain;
      }
      .rs-head:hover { transform:scale(1.1) rotate(-4deg); }
    `;
    if (!document.getElementById('rs-styles-v2')) document.head.appendChild(el);
    return () => { const s = document.getElementById('rs-styles-v2'); if (s) s.remove(); };
  }, []);

  // ─── data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) { fetchUserProfile(); checkApiHealth(); }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setIsFetchingUser(true);
    const token = localStorage.getItem('token');
    if (!token) { setIsFetchingUser(false); return; }
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
      if (res.data.success) setUser(res.data.user);
    } catch (e) { console.error('Profile fetch:', e); }
    finally { setIsFetchingUser(false); }
  };

  const checkApiHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/groqchatbot/health`);
      const data = await res.json();
      setConnectionError(data.groqInitialized ? null : 'Chatbot service is not properly configured');
    } catch {
      setConnectionError('Cannot connect to chatbot service');
    }
  };

  // ─── welcome message ──────────────────────────────────────────────────────────
  const buildWelcome = (u) => {
    const first = u?.name?.split(' ')[0] || null;
    return `Hey${first ? ` ${first}` : ''}! 👋\n\nI'm **MAPA-Milihan AI** — your agricultural intelligence assistant. Ask me anything about farming, crop management, and agricultural best practices, and I'll give you expert advice.\n\nWhat's on your mind today?`;
  };

  useEffect(() => {
    if (isOpen && messages.length === 0 && !isFetchingUser) {
      setMessages([{ id: Date.now(), text: buildWelcome(user), sender: 'bot', timestamp: new Date() }]);
    }
  }, [isOpen, user, isFetchingUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── send ─────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMsg = { id: Date.now(), text: inputMessage, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setConnectionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/groqchatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: widgetSessionId.current,
          userContext: user ? { name: user.name, location: user.address, contact: user.contact } : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.success) {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: data.response, sender: 'bot', timestamp: new Date() }]);
      } else throw new Error(data.error || 'Unknown error');
    } catch (err) {
      let txt = "Sorry, I'm having trouble connecting. ";
      if (err.message.includes('Failed to fetch')) txt += "Please check if the server is running.";
      else if (err.message.includes('500')) txt += "Server error — please try again.";
      else txt += err.message;
      setMessages(prev => [...prev, { id: Date.now() + 1, text: txt, sender: 'bot', timestamp: new Date(), isError: true }]);
    } finally { setIsLoading(false); }
  };

  // ─── clear ────────────────────────────────────────────────────────────────────
  const handleClearChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/groqchatbot/chat/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({ sessionId: widgetSessionId.current })
      });
    } catch (e) { console.error(e); }
    setMessages([{ id: Date.now(), text: buildWelcome(user), sender: 'bot', timestamp: new Date() }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Resolve user avatar — prefers uploaded photo, falls back to initials avatar
  const avatarSrc = user?.avatar?.url
    || (user?.name
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=56&background=059669&color=fff&bold=true`
      : null);

  // Chips — no emojis, text only
  const chips = [
    'Best time for planting?',
    'Crop disease prevention',
    'Increase crop yield',
    'Irrigation schedule',
    'Fertilizer recommendations',
    'Weather impact on crops',
  ];

  // ─── Closed state (chat head) ─────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className="rs-head" onClick={onClose} title="Open MAPA-Milihan AI">
        <img src={Logo} alt="MAPA-Milihan AI" />
      </div>
    );
  }

  // ─── Open widget ──────────────────────────────────────────────────────────────
  return (
    <div className="rs-w">
      <div className="rs-inner">

        {/* ── HEADER ── */}
        <div className="rs-header">
          <div className="rs-header-left">
            <div className="rs-logo-wrap">
              <div className="rs-logo-box">
                <img src={Logo} alt="MAPA-Milihan" />
              </div>
              <div className="rs-dot" />
            </div>
            <div className="rs-header-info">
              <h3>MAPA-Milihan AI</h3>
              <div className="rs-sub">AI Assistance</div>
            </div>
          </div>

          <div className="rs-actions">
            {/* Clear chat */}
            <button className="rs-ibtn" onClick={handleClearChat} title="Clear chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>

            {/* Close */}
            <button className="rs-ibtn danger" onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Error */}
        {connectionError && (
          <div className="rs-err">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zm-1 5v5h2v-5h-2zm0 6v2h2v-2h-2z"/>
            </svg>
            {connectionError}
          </div>
        )}

        {/* ── MESSAGES ── */}
        <div className="rs-msgs">
          <div className="rs-divider"><span>Today</span></div>

          {messages.map(msg => (
            <div key={msg.id} className={`rs-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="rs-bot-ico">
                  <img src={Logo} alt="bot" />
                </div>
              )}

              <div className="rs-bwrap">
                <div className={`rs-bubble ${msg.sender}${msg.isError ? ' err' : ''}`}>
                  {msg.text}
                </div>
                <span className="rs-time">{formatTime(msg.timestamp)}</span>
              </div>

              {msg.sender === 'user' && avatarSrc && (
                <div className="rs-uavatar">
                  <img src={avatarSrc} alt="You" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="rs-row bot">
              <div className="rs-bot-ico"><img src={Logo} alt="bot" /></div>
              <div className="rs-bwrap">
                <div className="rs-bubble bot">
                  <div className="rs-typing"><span/><span/><span/></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── CHIPS ── */}
        <div className="rs-chips-wrap">
          <div className="rs-chips">
            {chips.map((c, i) => (
              <button
                key={i}
                className="rs-chip"
                disabled={isLoading}
                onClick={() => { setInputMessage(c); inputRef.current?.focus(); }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── INPUT ── */}
        <div className="rs-input-area">
          <div className="rs-input-row">
            <textarea
              ref={inputRef}
              className="rs-textarea"
              rows={1}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about farming..."
              disabled={isLoading}
            />
            <button
              className="rs-send"
              onClick={handleSend}
              disabled={isLoading || !inputMessage.trim()}
              title="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#ffffff" stroke="#ffffff"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatbotWidget;