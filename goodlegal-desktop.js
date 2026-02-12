/**
 * GoodLegal Desktop — Wix Custom Element (Web Component)
 *
 * Usage in Wix:
 *   1. Host this file (e.g. GitHub Pages, your server)
 *   2. In Wix Editor, add a Custom Element
 *   3. Set tag name: "goodlegal-desktop"
 *   4. Set script URL to where this file is hosted
 *   5. From Velo page code, set attributes:
 *      $w("#customElement1").setAttribute("paid-user", "true");
 */

class GoodLegalDesktop extends HTMLElement {

  static get observedAttributes() {
    return ['paid-user', 'user-name'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._billingRunning = false;
    this._billingSeconds = 0;
    this._billingInterval = null;
    this._clickTimer = null;
    this._selectedIcon = null;
    this._crtOn = true;
    this._isDragging = false;
    this._dragStart = { x: 0, y: 0 };
    this._welcomeDrag = false;
    this._welcomeOffset = { x: 0, y: 0 };
    this._konamiIndex = 0;
    this._konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    this._donnaClickTimer = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${this._getStyles()}</style>
      <link href="https://fonts.googleapis.com/css2?family=VT323&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
      ${this._getHTML()}
    `;
    this._initBoot();
    this._initClock();
    this._initIconClicks();
    this._initTooltips();
    this._initStartMenu();
    this._initWelcomeWindow();
    this._initDesktopInteractions();
    this._initBilling();
    this._initDonna();
    this._initKonami();
    this._initLogin();
    this._applyPaidUser();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'paid-user') {
      this._applyPaidUser();
    }
    if (name === 'user-name') {
      this._applyUserName(newVal);
    }
  }

  _applyPaidUser() {
    const isPaid = this.getAttribute('paid-user') === 'true';
    const host = this.shadowRoot.querySelector('#gl-host');
    if (host) {
      host.classList.toggle('paid-user', isPaid);
    }
  }

  _applyUserName(name) {
    const loginBtn = this._$('#login-btn');
    const accountWrapper = this._$('#account-menu-wrapper');
    const accountName = this._$('#account-name');
    if (name) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (accountWrapper) {
        accountWrapper.style.display = '';
        accountName.textContent = name;
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (accountWrapper) accountWrapper.style.display = 'none';
    }
  }

  // ==================== STYLES ====================
  _getStyles() {
    return `
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    #gl-host {
      height: 100%;
      font-family: 'Inter', sans-serif;
      background: #F2FAF9;
      color: #0B1C4D;
      cursor: default;
      user-select: none;
      overflow: hidden;
      position: relative;
    }

    /* ===== BOOT SCREEN ===== */
    #boot-screen {
      position: absolute; inset: 0; background: #000; z-index: 10000;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #4ECDC4; font-family: 'VT323', monospace; font-size: 18px;
      transition: opacity 0.5s ease;
    }
    #boot-screen.fade-out { opacity: 0; pointer-events: none; }
    #boot-logo { font-size: 48px; color: #fff; margin-bottom: 30px; letter-spacing: 4px; }
    #boot-logo span { color: #4ECDC4; }
    #boot-text { text-align: left; line-height: 1.8; min-width: 500px; }
    #boot-text .line { opacity: 0; }
    #boot-text .line.visible { opacity: 1; }
    #boot-progress { margin-top: 24px; width: 300px; height: 16px; border: 2px solid #4ECDC4; overflow: hidden; }
    #boot-progress-bar { height: 100%; width: 0%; background: #4ECDC4; transition: width 0.3s ease; }

    /* ===== CRT OVERLAY ===== */
    #crt-overlay {
      position: absolute; inset: 0; pointer-events: none; z-index: 9999;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
      opacity: 0; transition: opacity 2s ease;
    }
    #crt-overlay.active { opacity: 1; }

    /* ===== TASKBAR TOP ===== */
    #taskbar {
      height: 40px;
      background: linear-gradient(180deg, #1a3a7a 0%, #0B1C4D 100%);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 12px; box-shadow: 0 2px 8px rgba(11, 28, 77, 0.15);
      position: relative; z-index: 100;
    }
    #taskbar-left { display: flex; align-items: center; gap: 12px; }
    #start-btn {
      background: linear-gradient(180deg, #2a5aaa 0%, #0B1C4D 100%);
      border: 1px solid #4a7acc; border-bottom-color: #061030; border-right-color: #061030;
      color: white; font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700;
      padding: 3px 14px 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; letter-spacing: 1px;
    }
    #start-btn:active { border-color: #061030; border-bottom-color: #4a7acc; border-right-color: #4a7acc; }
    #start-btn .start-icon { font-size: 18px; }
    .taskbar-divider { width: 1px; height: 24px; background: #4a7acc; opacity: 0.4; }
    .taskbar-status { color: rgba(255,255,255,0.7); font-family: 'Space Mono', monospace; font-size: 11px; }
    #taskbar-right { display: flex; align-items: center; gap: 10px; }
    .taskbar-link {
      color: rgba(255,255,255,0.85); text-decoration: none; font-size: 12px;
      font-family: 'Space Mono', monospace; cursor: pointer; padding: 2px 8px;
      border: 1px solid transparent; transition: all 0.15s;
    }
    .taskbar-link:hover { color: #fff; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); }
    .taskbar-link.highlight {
      background: #4ECDC4; color: #0B1C4D; font-weight: 700; border-color: transparent;
      font-size: 13px; padding: 4px 14px; letter-spacing: 0.5px;
      box-shadow: 0 0 12px rgba(78, 205, 196, 0.4);
      animation: highlightPulse 3s ease-in-out infinite;
    }
    @keyframes highlightPulse {
      0%, 100% { box-shadow: 0 0 12px rgba(78, 205, 196, 0.4); }
      50% { box-shadow: 0 0 20px rgba(78, 205, 196, 0.7); }
    }
    .taskbar-link.highlight:hover { background: #5ee0d7; box-shadow: 0 0 24px rgba(78, 205, 196, 0.6); }
    #gl-host.paid-user .taskbar-link.highlight { display: none; }
    #clock {
      color: white; font-family: 'VT323', monospace; font-size: 18px;
      background: rgba(0,0,0,0.3); padding: 2px 10px; border: 1px inset rgba(255,255,255,0.1);
      min-width: 70px; text-align: center;
    }

    /* ===== DESKTOP ===== */
    #desktop {
      height: calc(100% - 40px - 56px);
      position: relative; overflow: hidden;
      padding: 12px 30px 12px 30px;
    }
    #desktop::before {
      content: ''; position: absolute; inset: 0;
      background-image:
        radial-gradient(circle at 20% 50%, rgba(78, 205, 196, 0.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(11, 28, 77, 0.04) 0%, transparent 50%),
        radial-gradient(circle at 60% 80%, rgba(212, 210, 0, 0.04) 0%, transparent 50%);
      animation: bgShift 20s ease-in-out infinite alternate;
    }
    @keyframes bgShift { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

    /* ===== WELCOME HEADER ===== */
    #welcome-header {
      position: relative; z-index: 2;
      margin-bottom: 8px;
      display: flex; align-items: baseline; justify-content: space-between;
      opacity: 0;
    }
    #welcome-header.revealed { opacity: 1; transition: opacity 0.6s ease 0.3s; }
    #welcome-header h1 {
      font-family: 'VT323', monospace; font-size: 32px; color: #0B1C4D; letter-spacing: 1px;
    }

    /* ===== MAIN LAYOUT ===== */
    #desktop-layout {
      position: relative; z-index: 1;
      height: calc(100% - 50px);
    }
    .icon-group { position: absolute; }

    #student-group {
      top: 0; left: 0;
      display: grid;
      grid-template-columns: repeat(2, auto);
      grid-template-rows: auto repeat(5, auto);
      grid-auto-flow: column;
      gap: 0px 16px;
    }
    #student-group .section-label {
      grid-column: 1 / -1;
      grid-row: 1;
    }

    #analytics-group {
      top: 0; left: 430px;
      display: flex; flex-direction: column;
      gap: 2px;
    }

    #pro-group {
      top: 0; right: 0;
      display: flex; flex-direction: column;
      gap: 4px; align-items: flex-end;
    }

    .section-label {
      font-family: 'VT323', monospace; font-size: 15px; color: #0B1C4D;
      opacity: 0.35; letter-spacing: 2px; text-transform: uppercase;
      margin-bottom: 4px; margin-left: 4px;
    }

    .desktop-icon {
      display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
      padding: 6px 6px 4px; border-radius: 8px; cursor: pointer; text-decoration: none;
      color: #0B1C4D; position: relative;
      transition: transform 0.15s ease, background 0.15s ease;
      border: 1px solid transparent; width: 130px; flex-shrink: 0;
      opacity: 0; transform: translateY(10px);
    }
    .desktop-icon.revealed {
      opacity: 1; transform: translateY(0);
      transition: opacity 0.35s ease, transform 0.35s ease, background 0.15s ease;
    }
    .desktop-icon:hover { background: rgba(255,255,255,0.5); border-color: rgba(11, 28, 77, 0.08); }
    .desktop-icon:active { transform: scale(0.95); background: rgba(78, 205, 196, 0.15); border-color: rgba(78, 205, 196, 0.3); }
    .desktop-icon.selected { background: rgba(78, 205, 196, 0.15); border-color: rgba(78, 205, 196, 0.3); }

    .icon-img {
      width: 68px; height: 68px; display: flex; align-items: center; justify-content: center;
      font-size: 48px; margin-bottom: 4px; position: relative;
    }
    .icon-img::after {
      content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
      width: 44px; height: 6px; background: rgba(11, 28, 77, 0.07); border-radius: 50%;
    }
    .icon-label {
      font-family: 'Space Mono', monospace; font-size: 11px; text-align: center;
      line-height: 1.3; max-width: 120px; word-wrap: break-word; color: #0B1C4D;
      text-shadow: 0 1px 2px rgba(242, 250, 249, 0.8);
    }
    .icon-badge {
      position: absolute; top: 2px; right: 2px; font-family: 'VT323', monospace;
      font-size: 12px; padding: 1px 5px; border-radius: 3px; letter-spacing: 0.5px;
    }
    .badge-free { background: #4ECDC4; color: #0B1C4D; }
    .badge-pro { background: linear-gradient(135deg, #FFB347, #ffc966); color: #0B1C4D; }

    #pro-icons { display: flex; gap: 6px; }

    /* ===== WELCOME WINDOW ===== */
    #welcome-window {
      position: absolute; top: 42%; left: 52%; transform: translate(-50%, -50%);
      width: 380px; background: #FFFFFF; border: 2px solid #0B1C4D;
      box-shadow: 4px 4px 0px #0B1C4D, 8px 8px 0px rgba(11,28,77,0.1);
      z-index: 50; opacity: 0; animation: windowAppear 0.4s ease 2.8s forwards;
    }
    @keyframes windowAppear {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    #welcome-titlebar {
      background: linear-gradient(90deg, #0B1C4D 0%, #1a3a7a 100%);
      padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; cursor: move;
    }
    #welcome-titlebar span { color: white; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; }
    #welcome-close {
      width: 20px; height: 20px; background: linear-gradient(180deg, #cc4444, #991111);
      border: 1px outset #dd6666; color: white; font-size: 14px; font-family: 'VT323', monospace;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    #welcome-close:active { border-style: inset; }
    #welcome-body {
      padding: 18px; font-family: 'Space Mono', monospace; font-size: 12px; line-height: 1.7; color: #0B1C4D;
    }
    #welcome-body h2 { font-family: 'VT323', monospace; font-size: 26px; margin-bottom: 10px; color: #0B1C4D; }
    #welcome-body p { margin-bottom: 8px; }
    #welcome-body .welcome-hint {
      color: #4ECDC4; font-size: 11px; margin-top: 12px; padding-top: 8px;
      border-top: 1px dashed rgba(11,28,77,0.15);
    }

    /* ===== BOTTOM BAR ===== */
    #bottombar {
      height: 56px;
      background: linear-gradient(180deg, #0B1C4D 0%, #061030 100%);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 14px; border-top: 1px solid #4a7acc;
      position: relative;
    }
    #bottombar-left { display: flex; align-items: center; gap: 16px; }
    .bottombar-link {
      color: rgba(255,255,255,0.5); text-decoration: none; font-family: 'Space Mono', monospace;
      font-size: 12px; letter-spacing: 0.5px; cursor: pointer; transition: color 0.15s;
    }
    .bottombar-link:hover { color: rgba(255,255,255,0.9); }
    .bottombar-sep { color: rgba(255,255,255,0.2); font-size: 12px; }
    .signature-link { font-style: italic; color: rgba(255,255,255,0.35); }
    .signature-link:hover { color: #4ECDC4; }

    /* ===== DONNA BUTTON ===== */
    #donna-btn {
      position: absolute; left: 50%; transform: translateX(-50%); bottom: 8px;
      display: flex; align-items: center; gap: 12px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      border: 2px solid #ff8a80; border-bottom-color: #c0392b; border-right-color: #c0392b;
      color: white; font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 700;
      padding: 10px 32px; cursor: pointer; border-radius: 6px;
      box-shadow: 0 4px 16px rgba(238, 90, 36, 0.4);
      text-decoration: none; transition: all 0.15s ease; z-index: 10;
      letter-spacing: 0.5px; animation: donnaPulse 3s ease-in-out infinite;
    }
    @keyframes donnaPulse {
      0%, 100% { box-shadow: 0 4px 16px rgba(238, 90, 36, 0.4); }
      50% { box-shadow: 0 4px 28px rgba(238, 90, 36, 0.6); }
    }
    #donna-btn:hover {
      background: linear-gradient(135deg, #ff8787, #ff6b3d);
      transform: translateX(-50%) translateY(-3px);
      box-shadow: 0 6px 24px rgba(238, 90, 36, 0.55);
    }
    #donna-btn:active {
      transform: translateX(-50%) translateY(0);
      box-shadow: 0 2px 8px rgba(238, 90, 36, 0.3);
    }
    #donna-btn .donna-face { font-size: 28px; }
    #donna-btn .donna-text { display: flex; flex-direction: column; }
    #donna-btn .donna-label { font-size: 15px; line-height: 1; }
    #donna-btn .donna-sub { font-size: 9px; font-weight: 400; opacity: 0.8; letter-spacing: 1.5px; margin-top: 2px; }

    /* ===== BILLING TIMER ===== */
    #billing-timer {
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      padding: 4px 10px; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 3px; transition: all 0.15s;
    }
    #billing-timer:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
    #billing-timer.running { border-color: #4ECDC4; }
    #billing-timer.running #timer-dot { background: #ff4444; animation: timerBlink 1s infinite; }
    @keyframes timerBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    #timer-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); }
    #timer-display { font-family: 'VT323', monospace; font-size: 18px; color: rgba(255,255,255,0.7); min-width: 64px; }
    #billing-timer.running #timer-display { color: #4ECDC4; }
    #timer-label { font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.4); }
    #billing-timer.running #timer-label { color: rgba(255,255,255,0.6); }

    #bottombar-right { display: flex; align-items: center; gap: 12px; }
    .system-tray-icon { font-size: 14px; opacity: 0.6; cursor: pointer; transition: opacity 0.15s; }
    .system-tray-icon:hover { opacity: 1; }

    /* ===== BILLING POPUP ===== */
    #billing-popup {
      position: absolute; bottom: 64px; right: 12px;
      background: #FFFFFF; border: 2px solid #0B1C4D; box-shadow: 3px 3px 0 #0B1C4D;
      padding: 14px 18px; font-family: 'VT323', monospace; font-size: 16px;
      color: #0B1C4D; z-index: 300; display: none; min-width: 220px;
    }
    #billing-popup.open { display: block; }
    #billing-popup .bp-title { font-size: 20px; margin-bottom: 8px; }
    #billing-popup .bp-amount { font-size: 32px; color: #4ECDC4; margin: 8px 0; }
    #billing-popup .bp-rate { font-size: 14px; color: rgba(11,28,77,0.5); }
    #billing-popup .bp-joke {
      font-size: 13px; color: rgba(11,28,77,0.4); font-style: italic;
      margin-top: 8px; border-top: 1px dashed rgba(11,28,77,0.1); padding-top: 8px;
    }

    /* ===== ACCOUNT MENU ===== */
    #account-menu-wrapper { position: relative; }
    #account-btn {
      color: rgba(255,255,255,0.85); font-family: 'Space Mono', monospace; font-size: 12px;
      cursor: pointer; padding: 2px 8px; border: 1px solid transparent; transition: all 0.15s;
      background: none; display: flex; align-items: center; gap: 6px;
    }
    #account-btn:hover { color: #fff; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); }
    #account-btn .account-arrow { font-size: 8px; opacity: 0.6; }
    #account-dropdown {
      position: absolute; top: 100%; right: 0; margin-top: 4px;
      background: #FFFFFF; border: 2px solid #0B1C4D; box-shadow: 3px 3px 0 #0B1C4D;
      min-width: 200px; z-index: 300; display: none;
      font-family: 'Space Mono', monospace;
    }
    #account-dropdown.open { display: block; }
    .account-dropdown-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 14px;
      font-size: 12px; color: #0B1C4D; cursor: pointer; text-decoration: none;
      transition: background 0.1s;
    }
    .account-dropdown-item:hover { background: #0B1C4D; color: white; }
    .account-dropdown-item .item-icon { font-size: 16px; }
    .account-dropdown-sep { height: 1px; background: #ddd; margin: 4px 8px; }

    /* ===== TOOLTIP ===== */
    .retro-tooltip {
      position: absolute; background: #FFFFCC; border: 1px solid #000;
      padding: 3px 8px; font-family: 'VT323', monospace; font-size: 14px;
      color: #000; pointer-events: none; z-index: 9998; white-space: nowrap;
      display: none; box-shadow: 1px 1px 0 #000;
    }

    /* ===== START MENU ===== */
    #start-menu {
      position: absolute; bottom: 56px; left: 0; width: 260px;
      background: #FFFFFF; border: 2px outset #ccc;
      box-shadow: 4px 4px 0 rgba(0,0,0,0.2); z-index: 200; display: none;
    }
    #start-menu.open { display: block; }
    #start-menu-header {
      background: linear-gradient(180deg, #1a3a7a, #0B1C4D);
      padding: 10px 12px; display: flex; align-items: center; gap: 10px;
    }
    #start-menu-header .avatar { width: 36px; height: 36px; background: #4ECDC4; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    #start-menu-header .user-name { color: white; font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; }
    .start-menu-items { padding: 4px 0; }
    .start-menu-item {
      display: flex; align-items: center; gap: 10px; padding: 7px 16px;
      font-family: 'Space Mono', monospace; font-size: 12px; color: #0B1C4D;
      cursor: pointer; text-decoration: none;
    }
    .start-menu-item:hover { background: #0B1C4D; color: white; }
    .start-menu-item .item-icon { font-size: 18px; }
    .start-menu-sep { height: 1px; background: #ddd; margin: 4px 8px; }

    /* ===== DECORATIONS ===== */
    .pixel-gavel {
      position: absolute; bottom: 40px; right: 40px; opacity: 0.05;
      font-size: 160px; z-index: 0; pointer-events: none; filter: grayscale(1);
      animation: gentleFloat 6s ease-in-out infinite;
    }
    @keyframes gentleFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    #selection-rect {
      position: absolute; border: 1px dashed rgba(11, 28, 77, 0.4);
      background: rgba(78, 205, 196, 0.08); pointer-events: none; z-index: 200; display: none;
    }
    @keyframes iconFlash { 0% { filter: brightness(1); } 50% { filter: brightness(1.5) saturate(1.5); } 100% { filter: brightness(1); } }
    .flash { animation: iconFlash 0.2s ease; }

    /* ===== RESPONSIVE — MOBILE (Phone OS style) ===== */
    @media (max-width: 900px) {
      #gl-host { overflow: auto; height: auto; background: #0B1C4D; }

      #taskbar {
        height: 44px; padding: 0 16px;
        background: transparent; box-shadow: none;
        position: sticky; top: 0; z-index: 100;
      }
      #taskbar-left { gap: 6px; }
      #start-btn { display: none; }
      .taskbar-status { display: none; }
      .taskbar-divider { display: none; }
      #taskbar-right { gap: 8px; }
      .taskbar-link { font-size: 10px; padding: 2px 6px; color: rgba(255,255,255,0.6); }
      .taskbar-link.highlight {
        font-size: 11px; padding: 4px 12px; border-radius: 20px;
        background: #4ECDC4; color: #0B1C4D;
      }
      #clock { font-size: 15px; padding: 0; background: transparent; border: none; color: rgba(255,255,255,0.8); }

      #account-btn { font-size: 10px; padding: 2px 6px; }
      #account-dropdown { min-width: 180px; }
      .account-dropdown-item { font-size: 11px; padding: 7px 12px; }

      #desktop {
        height: auto; min-height: calc(100vh - 44px - 80px);
        overflow: visible; padding: 8px 20px 24px;
        background: linear-gradient(170deg, #0B1C4D 0%, #0d2460 40%, #142d6b 100%);
      }
      #desktop::before {
        background-image:
          radial-gradient(circle at 30% 20%, rgba(78, 205, 196, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 70% 70%, rgba(212, 210, 0, 0.05) 0%, transparent 40%);
      }

      #welcome-header { margin-bottom: 16px; text-align: center; justify-content: center; }
      #welcome-header h1 { font-size: 18px; color: rgba(255,255,255,0.9); letter-spacing: 2px; }

      #desktop-layout {
        height: auto !important;
        position: static !important;
        display: flex !important; flex-direction: column !important; gap: 20px;
      }

      .icon-group,
      #student-group,
      #analytics-group,
      #pro-group {
        position: static !important;
        height: auto !important;
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 16px 8px !important;
        justify-items: center;
      }

      .section-label {
        grid-column: 1 / -1;
        width: auto; text-align: center;
        font-size: 11px; color: rgba(255,255,255,0.35);
        margin: 0; letter-spacing: 3px;
      }

      .desktop-icon {
        width: 72px !important; padding: 0 !important;
        border: none !important; border-radius: 0 !important;
        background: transparent !important; flex-shrink: 0;
        display: flex; flex-direction: column; align-items: center;
        gap: 6px;
      }
      .desktop-icon:hover { background: transparent !important; }
      .desktop-icon:active { transform: scale(0.9) !important; background: transparent !important; }

      .icon-img {
        width: 56px; height: 56px; font-size: 32px;
        background: rgba(255,255,255,0.12);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .icon-img::after { display: none; }

      .icon-label {
        font-size: 10px; max-width: 72px; line-height: 1.2;
        color: rgba(255,255,255,0.85); text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        font-family: 'Inter', sans-serif; font-weight: 500;
      }

      .icon-badge {
        font-size: 8px; padding: 1px 4px; top: -2px; right: 2px;
        border-radius: 6px; z-index: 2;
      }

      #pro-group { align-items: start !important; }
      #pro-icons { display: contents !important; }

      #bottombar {
        height: auto; padding: 0;
        background: transparent; border-top: none;
        flex-direction: column; align-items: center; gap: 0;
        position: sticky; bottom: 0; z-index: 100;
      }

      #donna-btn {
        position: static !important; transform: none !important;
        order: 1; padding: 10px 28px; gap: 10px;
        width: auto; margin: 8px auto 6px;
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(255,107,107,0.9), rgba(238,90,36,0.9)) !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 4px 20px rgba(238, 90, 36, 0.3);
      }
      #donna-btn:hover { transform: translateY(-2px) !important; }
      #donna-btn .donna-face { font-size: 22px; }
      #donna-btn .donna-label { font-size: 13px; }
      #donna-btn .donna-sub { font-size: 8px; }

      #bottombar-left {
        order: 2; width: 100%; justify-content: center;
        gap: 8px; flex-wrap: wrap; padding: 6px 0;
        background: rgba(11, 28, 77, 0.6);
        backdrop-filter: blur(10px);
      }
      .bottombar-link { font-size: 8px; color: rgba(255,255,255,0.35); }
      .bottombar-link:hover { color: rgba(255,255,255,0.7); }
      .bottombar-sep { font-size: 8px; color: rgba(255,255,255,0.15); }
      .signature-link { font-size: 8px; color: rgba(255,255,255,0.25); }
      .signature-link:hover { color: #4ECDC4; }

      #bottombar-right {
        order: 3; width: 100%; justify-content: center;
        gap: 8px; padding: 4px 0 6px;
        background: rgba(11, 28, 77, 0.6);
      }

      #timer-display { font-size: 14px; min-width: 50px; }
      #timer-label { font-size: 7px; }
      #billing-timer { padding: 2px 6px; gap: 4px; }

      #welcome-window {
        width: calc(100% - 40px); left: 20px !important; top: 35% !important;
        transform: translateY(-50%) !important;
        background: rgba(255,255,255,0.95); border-radius: 16px;
        border: none; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      }
      #welcome-titlebar { border-radius: 16px 16px 0 0; }
      #welcome-body { padding: 16px; }
      #welcome-body h2 { font-size: 22px; }
      #welcome-body p { font-size: 11px; }

      #boot-logo { font-size: 28px; }
      #boot-text { font-size: 13px; min-width: auto; padding: 0 16px; }
      #boot-progress { width: 200px; height: 12px; }

      .pixel-gavel { display: none; }
      #selection-rect { display: none !important; }
      #start-menu { display: none !important; }
      .system-tray-icon { font-size: 12px; }
      #crt-overlay { display: none; }
    }

    @media (max-width: 380px) {
      #desktop { padding: 6px 12px 16px; }
      #welcome-header h1 { font-size: 16px; }
      .icon-img { width: 50px; height: 50px; font-size: 28px; border-radius: 14px; }
      .desktop-icon { width: 66px !important; }
      .icon-label { font-size: 9px; max-width: 66px; }
      .taskbar-link.highlight { font-size: 10px; padding: 3px 8px; }
    }
    `;
  }

  // ==================== HTML ====================
  _getHTML() {
    return `
    <div id="gl-host">
      <!-- BOOT SCREEN -->
      <div id="boot-screen">
        <div id="boot-logo">GOOD<span>LEGAL</span></div>
        <div id="boot-text">
          <div class="line">Initialisation du systeme juridique...</div>
          <div class="line">Chargement des codes : Civil, Penal, Commerce... OK</div>
          <div class="line">Connexion base jurisprudence... OK</div>
          <div class="line">Verification IA Donna... OK</div>
          <div class="line">Chargement modules MCP... OK</div>
          <div class="line">Montage API GoodLegal v3.2... OK</div>
          <div class="line">&nbsp;</div>
          <div class="line" style="color: #fff;">Bienvenue. Le droit, simplement.</div>
        </div>
        <div id="boot-progress"><div id="boot-progress-bar"></div></div>
      </div>

      <div id="crt-overlay"></div>
      <div class="retro-tooltip" id="tooltip"></div>

      <!-- TASKBAR -->
      <div id="taskbar">
        <div id="taskbar-left">
          <button id="start-btn"><span class="start-icon">&#9878;&#65039;</span> GoodLegal</button>
          <div class="taskbar-divider"></div>
          <span class="taskbar-status">Bureau juridique</span>
        </div>
        <div id="taskbar-right">
          <a href="https://www.goodlegal.fr/a-propos" class="taskbar-link" target="_top">A propos</a>
          <a class="taskbar-link" id="login-btn" style="cursor:pointer">Se connecter</a>
          <div id="account-menu-wrapper" style="display:none">
            <button id="account-btn"><span id="account-name"></span> <span class="account-arrow">&#9660;</span></button>
            <div id="account-dropdown">
              <a class="account-dropdown-item" href="https://www.goodlegal.fr/account/my-account" target="_top"><span class="item-icon">&#128100;</span> Mon compte</a>
              <a class="account-dropdown-item" href="https://www.goodlegal.fr/account/my-subscriptions" target="_top"><span class="item-icon">&#128179;</span> Mes Abonnements</a>
              <div class="account-dropdown-sep"></div>
              <a class="account-dropdown-item" id="logout-btn" style="cursor:pointer"><span class="item-icon">&#128682;</span> Se deconnecter</a>
            </div>
          </div>
          <a href="https://www.goodlegal.fr/plans-pricing" class="taskbar-link highlight" id="taskbar-pricing" target="_top">Passer en illimite</a>
          <div id="clock">--:--</div>
        </div>
      </div>

      <!-- START MENU -->
      <div id="start-menu">
        <div id="start-menu-header">
          <div class="avatar">&#9878;&#65039;</div>
          <div class="user-name">GoodLegal</div>
        </div>
        <div class="start-menu-items">
          <a class="start-menu-item" href="https://www.goodlegal.fr/a-propos" target="_top"><span class="item-icon">&#8505;&#65039;</span> A propos</a>
          <a class="start-menu-item" href="https://api.goodlegal.fr/dashboard/" target="_top"><span class="item-icon">&#128104;&#8205;&#128187;</span> Acces developpeurs</a>
          <a class="start-menu-item" href="https://www.goodlegal.fr/plans-pricing" target="_top"><span class="item-icon">&#128142;</span> Passer en illimite</a>
          <div class="start-menu-sep"></div>
          <a class="start-menu-item" href="https://www.goodlegal.fr/mentionslegales" target="_top"><span class="item-icon">&#128203;</span> Mentions legales</a>
        </div>
      </div>

      <!-- DESKTOP -->
      <div id="desktop">
        <div id="selection-rect"></div>
        <div class="pixel-gavel">&#9878;&#65039;</div>

        <div id="welcome-header">
          <h1>Bienvenue chez GoodLegal !</h1>
        </div>

        <div id="desktop-layout">
          <!-- STUDENT TOOLS -->
          <div class="icon-group" id="student-group">
            <div class="section-label">&#128218; Outils Etudiants</div>
            <a class="desktop-icon" href="https://www.goodlegal.fr/g%C3%A9n%C3%A9rateur-de-fiches-d-arr%C3%AAt" data-tip="Generez vos fiches d'arret en un clic" target="_blank">
              <span class="icon-badge badge-free">GRATUIT</span>
              <div class="icon-img">&#128221;</div>
              <div class="icon-label">Generateur Fiches d'arret</div>
            </a>
            <a class="desktop-icon" href="https://www.goodlegal.fr/cas-pratiques" data-tip="Resolvez vos cas pratiques" target="_blank">
              <div class="icon-img">&#128194;</div>
              <div class="icon-label">Cas Pratiques</div>
            </a>
            <a class="desktop-icon" href="https://sourceverifier.legalabs.ai/resume-document" data-tip="Synthetisez vos documents juridiques" target="_blank">
              <div class="icon-img">&#129514;</div>
              <div class="icon-label">Synthetiseur de docs</div>
            </a>
            <a class="desktop-icon" href="https://www.goodlegal.fr/fiches-de-revision" data-tip="Revisez efficacement" target="_blank">
              <div class="icon-img">&#129299;</div>
              <div class="icon-label">Fiches de revision</div>
            </a>
            <a class="desktop-icon" href="https://www.goodlegal.fr/commentaires-d-arret" data-tip="Commentez les arrets comme un pro" target="_blank">
              <div class="icon-img">&#128212;</div>
              <div class="icon-label">Commentaires d'arret</div>
            </a>
            <a class="desktop-icon" href="https://www.goodlegal.fr/dissertation-juridique" data-tip="Dissertations juridiques assistees" target="_blank">
              <div class="icon-img">&#11088;</div>
              <div class="icon-label">Dissertations</div>
            </a>
            <a class="desktop-icon" href="https://data.goodlegal.fr/" data-tip="Toute notre base de fiches" target="_blank">
              <span class="icon-badge badge-free">GRATUIT</span>
              <div class="icon-img">&#128218;</div>
              <div class="icon-label">Toutes les Fiches</div>
            </a>
            <a class="desktop-icon" href="https://sourceverifier.legalabs.ai/trouver-sources" data-tip="Verifiez vos sources juridiques" target="_blank">
              <div class="icon-img">&#129488;</div>
              <div class="icon-label">Verification Sources</div>
            </a>
            <a class="desktop-icon" href="https://sourceverifier.legalabs.ai/modifier-document" data-tip="Modifiez vos documents juridiques" target="_blank">
              <div class="icon-img">&#128195;</div>
              <div class="icon-label">Modifier un Document</div>
            </a>
          </div>

          <!-- DATA & ANALYTICS -->
          <div class="icon-group" id="analytics-group">
            <div class="section-label">&#128202; Data & Analytics</div>
            <a class="desktop-icon" href="https://stats.goodlegal.fr/analytics" data-tip="Statistiques et analyses jurimetriques" target="_blank">
              <span class="icon-badge badge-free">GRATUIT</span>
              <div class="icon-img">&#9878;&#65039;</div>
              <div class="icon-label">Jurimetrie</div>
            </a>
            <a class="desktop-icon" href="https://stats.goodlegal.fr/rankings" data-tip="Classements des decisions" target="_blank">
              <span class="icon-badge badge-free">GRATUIT</span>
              <div class="icon-img">&#129351;</div>
              <div class="icon-label">Classements</div>
            </a>
            <a class="desktop-icon" href="https://eugraph.eu/?celex=32016R0679&lang=FR" data-tip="Explorez le droit europeen en graphe" target="_blank">
              <span class="icon-badge badge-free">GRATUIT</span>
              <div class="icon-img">&#127466;&#127482;</div>
              <div class="icon-label">EU Graph</div>
            </a>
          </div>

          <!-- PRO TOOLS -->
          <div class="icon-group" id="pro-group">
            <div class="section-label" style="text-align:right;">&#128295; Outils Pro</div>
            <div id="pro-icons">
              <a class="desktop-icon" href="https://www.goodlegal.fr/" data-tip="Connectez GoodLegal a Claude, Cursor, ChatGPT..." target="_blank">
                <span class="icon-badge badge-pro">PRO</span>
                <div class="icon-img">&#128268;</div>
                <div class="icon-label">MCP</div>
              </a>
              <a class="desktop-icon" href="https://api.goodlegal.fr" data-tip="API RESTful pour developpeurs" target="_blank">
                <span class="icon-badge badge-pro">PRO</span>
                <div class="icon-img">&#128273;</div>
                <div class="icon-label">API</div>
              </a>
            </div>
          </div>
        </div>

        <!-- WELCOME WINDOW -->
        <div id="welcome-window">
          <div id="welcome-titlebar">
            <span>bienvenue.txt</span>
            <button id="welcome-close">X</button>
          </div>
          <div id="welcome-body">
            <h2>Bienvenue chez GoodLegal!</h2>
            <p>Votre bureau juridique numerique. Tous vos outils, un seul endroit.</p>
            <p>Double-cliquez sur une icone pour commencer.</p>
            <div class="welcome-hint">Astuce : Rajoutez le MCP dans votre IA preferee pour acceder au datagraphe — 3 millions de fiches d'arret, 15 millions de liens.</div>
          </div>
        </div>
      </div>

      <!-- BOTTOM BAR -->
      <div id="bottombar">
        <div id="bottombar-left">
          <a href="https://www.goodlegal.fr/mentionslegales" class="bottombar-link" target="_top">Mentions legales</a>
          <a href="https://api.goodlegal.fr/dashboard/" class="bottombar-link" target="_top">Acces developpeurs</a>
          <a href="https://www.goodlegal.fr/a-propos" class="bottombar-link" target="_top">A propos</a>
          <span class="bottombar-sep">&middot;</span>
          <a href="https://www.linkedin.com/in/zacharie-la%C3%AFk-09535aab/" class="bottombar-link signature-link" target="_blank">For law with love - Zach</a>
        </div>

        <a id="donna-btn" href="https://thedonna.ai/" data-tip="Votre assistante IA juridique" target="_blank">
          <span class="donna-face">&#128105;&#8205;&#129456;</span>
          <span class="donna-text">
            <span class="donna-label">Donna AI</span>
            <span class="donna-sub">ASSISTANTE JURIDIQUE</span>
          </span>
        </a>

        <div id="bottombar-right">
          <div id="billing-timer">
            <div id="timer-dot"></div>
            <div id="timer-display">00:00:00</div>
            <div id="timer-label">FACTURER</div>
          </div>
          <div class="taskbar-divider" style="background:rgba(255,255,255,0.15);height:28px;"></div>
          <span class="system-tray-icon" id="crt-toggle" title="CRT">&#128266;</span>
          <span class="system-tray-icon">&#127760;</span>
          <div id="clock" style="font-size:16px;">--:--</div>
        </div>
      </div>

      <!-- BILLING POPUP -->
      <div id="billing-popup">
        <div class="bp-title">&#9201; Temps facture</div>
        <div class="bp-rate">Taux horaire: 500 EUR/h</div>
        <div class="bp-amount" id="billing-amount">0,00 EUR</div>
        <div class="bp-joke" id="billing-joke">Cliquez pour commencer a facturer.</div>
      </div>
    </div>
    `;
  }

  // ==================== BEHAVIORS ====================

  _$(sel) { return this.shadowRoot.querySelector(sel); }
  _$$(sel) { return this.shadowRoot.querySelectorAll(sel); }

  _initBoot() {
    const lines = this._$$('#boot-text .line');
    const bar = this._$('#boot-progress-bar');
    let idx = 0;
    const show = () => {
      if (idx < lines.length) {
        lines[idx].classList.add('visible');
        bar.style.width = ((idx + 1) / lines.length * 100) + '%';
        idx++;
        setTimeout(show, idx === lines.length ? 600 : 200 + Math.random() * 250);
      } else {
        setTimeout(() => {
          this._$('#boot-screen').classList.add('fade-out');
          this._$('#crt-overlay').classList.add('active');
          this._revealAll();
        }, 500);
      }
    };
    setTimeout(show, 400);
  }

  _revealAll() {
    this._$('#welcome-header').classList.add('revealed');
    this._$$('.desktop-icon').forEach((icon, i) => {
      setTimeout(() => icon.classList.add('revealed'), 80 + i * 50);
    });
  }

  _initClock() {
    const update = () => {
      const now = new Date();
      const t = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      this._$$('#clock').forEach(el => el.textContent = t);
    };
    update();
    setInterval(update, 10000);
  }

  _initIconClicks() {
    this._$$('.desktop-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        if (this._selectedIcon) this._selectedIcon.classList.remove('selected');
        icon.classList.add('selected');
        this._selectedIcon = icon;
        icon.classList.add('flash');
        setTimeout(() => icon.classList.remove('flash'), 200);
        if (this._clickTimer) {
          clearTimeout(this._clickTimer);
          this._clickTimer = null;
          window.open(icon.href, '_blank');
        } else {
          this._clickTimer = setTimeout(() => { this._clickTimer = null; }, 400);
        }
      });
    });
  }

  _initTooltips() {
    const tooltip = this._$('#tooltip');
    this._$$('[data-tip]').forEach(el => {
      let t;
      el.addEventListener('mouseenter', (e) => {
        t = setTimeout(() => {
          tooltip.textContent = el.dataset.tip;
          tooltip.style.display = 'block';
          const rect = this.getBoundingClientRect();
          tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
          tooltip.style.top = (e.clientY - rect.top + 16) + 'px';
        }, 600);
      });
      el.addEventListener('mousemove', (e) => {
        const rect = this.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
        tooltip.style.top = (e.clientY - rect.top + 16) + 'px';
      });
      el.addEventListener('mouseleave', () => {
        clearTimeout(t);
        tooltip.style.display = 'none';
      });
    });
  }

  _initStartMenu() {
    const btn = this._$('#start-btn');
    const menu = this._$('#start-menu');
    btn.addEventListener('click', () => menu.classList.toggle('open'));
    this.shadowRoot.addEventListener('click', (e) => {
      if (!e.target.closest('#start-btn') && !e.target.closest('#start-menu')) {
        menu.classList.remove('open');
      }
    });
  }

  _initWelcomeWindow() {
    const ww = this._$('#welcome-window');
    const tb = this._$('#welcome-titlebar');
    const close = this._$('#welcome-close');

    close.addEventListener('click', () => {
      ww.style.transition = 'transform 0.2s, opacity 0.2s';
      ww.style.transform = 'translate(-50%,-50%) scale(0.9)';
      ww.style.opacity = '0';
      setTimeout(() => ww.style.display = 'none', 200);
    });

    tb.addEventListener('mousedown', (e) => {
      this._welcomeDrag = true;
      const r = ww.getBoundingClientRect();
      this._welcomeOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
      ww.style.transition = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!this._welcomeDrag) return;
      const rect = this._$('#desktop').getBoundingClientRect();
      ww.style.left = (e.clientX - rect.left - this._welcomeOffset.x) + 'px';
      ww.style.top = (e.clientY - rect.top - this._welcomeOffset.y) + 'px';
      ww.style.transform = 'none';
    });
    document.addEventListener('mouseup', () => { this._welcomeDrag = false; });
  }

  _initDesktopInteractions() {
    const desktop = this._$('#desktop');
    const selRect = this._$('#selection-rect');

    // Deselect
    desktop.addEventListener('click', (e) => {
      if (e.target.id === 'desktop' || e.target.closest('#desktop-layout') === e.target) {
        if (this._selectedIcon) { this._selectedIcon.classList.remove('selected'); this._selectedIcon = null; }
      }
    });

    // Selection rect
    desktop.addEventListener('mousedown', (e) => {
      if (e.target.closest('.desktop-icon') || e.target.closest('#welcome-window')) return;
      this._isDragging = true;
      const rect = desktop.getBoundingClientRect();
      this._dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      selRect.style.left = this._dragStart.x + 'px';
      selRect.style.top = this._dragStart.y + 'px';
      selRect.style.width = '0';
      selRect.style.height = '0';
      selRect.style.display = 'block';
    });
    document.addEventListener('mousemove', (e) => {
      if (!this._isDragging) return;
      const rect = this._$('#desktop').getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      selRect.style.left = Math.min(x, this._dragStart.x) + 'px';
      selRect.style.top = Math.min(y, this._dragStart.y) + 'px';
      selRect.style.width = Math.abs(x - this._dragStart.x) + 'px';
      selRect.style.height = Math.abs(y - this._dragStart.y) + 'px';
    });
    document.addEventListener('mouseup', () => {
      this._isDragging = false;
      selRect.style.display = 'none';
    });

    // CRT toggle
    this._$('#crt-toggle').addEventListener('click', () => {
      this._crtOn = !this._crtOn;
      this._$('#crt-overlay').classList.toggle('active', this._crtOn);
    });
  }

  _initBilling() {
    const timer = this._$('#billing-timer');
    const popup = this._$('#billing-popup');
    const jokes = [
      "Harvey Specter approuve.",
      "Le temps c'est de l'argent... surtout le votre.",
      "Un bon avocat facture meme ses pauses cafe.",
      "Vous venez de gagner le prix d'un croissant.",
      "Objet: Etude approfondie (vrai: pause dej).",
      "A ce rythme, offrez-vous un stylo Montblanc.",
      "Votre taux horaire > salaire annuel d'un stagiaire.",
    ];

    timer.addEventListener('click', () => {
      if (!this._billingRunning) {
        this._billingRunning = true;
        timer.classList.add('running');
        this._billingInterval = setInterval(() => {
          this._billingSeconds++;
          this._updateBilling();
        }, 1000);
        this._$('#billing-joke').textContent = 'Le compteur tourne...';
        popup.classList.add('open');
      } else {
        this._billingRunning = false;
        timer.classList.remove('running');
        clearInterval(this._billingInterval);
        this._$('#billing-joke').textContent = jokes[Math.floor(Math.random() * jokes.length)];
        popup.classList.add('open');
        setTimeout(() => popup.classList.remove('open'), 4000);
      }
    });

    this.shadowRoot.addEventListener('click', (e) => {
      if (!e.target.closest('#billing-timer') && !e.target.closest('#billing-popup')) {
        popup.classList.remove('open');
      }
    });
  }

  _updateBilling() {
    const h = String(Math.floor(this._billingSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((this._billingSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(this._billingSeconds % 60).padStart(2, '0');
    this._$('#timer-display').textContent = h + ':' + m + ':' + s;
    this._$('#billing-amount').textContent = (this._billingSeconds / 3600 * 500).toFixed(2).replace('.', ',') + ' EUR';
  }

  _initDonna() {
    const btn = this._$('#donna-btn');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this._donnaClickTimer) {
        clearTimeout(this._donnaClickTimer);
        this._donnaClickTimer = null;
        window.open(btn.href, '_blank');
      } else {
        this._donnaClickTimer = setTimeout(() => { this._donnaClickTimer = null; }, 400);
      }
    });
  }

  _initLogin() {
    const loginBtn = this._$('#login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('login-click'));
      });
    }

    // Account dropdown toggle
    const accountBtn = this._$('#account-btn');
    const accountDropdown = this._$('#account-dropdown');
    if (accountBtn && accountDropdown) {
      accountBtn.addEventListener('click', () => {
        accountDropdown.classList.toggle('open');
      });
      this.shadowRoot.addEventListener('click', (e) => {
        if (!e.target.closest('#account-menu-wrapper')) {
          accountDropdown.classList.remove('open');
        }
      });
    }

    // Logout button
    const logoutBtn = this._$('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        accountDropdown.classList.remove('open');
        this.dispatchEvent(new CustomEvent('logout-click'));
      });
    }
  }

  _initKonami() {
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === this._konamiCode[this._konamiIndex]) {
        this._konamiIndex++;
        if (this._konamiIndex === this._konamiCode.length) {
          this._konamiIndex = 0;
          const host = this._$('#gl-host');
          host.style.transition = 'filter 0.5s';
          host.style.filter = 'hue-rotate(90deg) saturate(1.5)';
          setTimeout(() => { host.style.filter = 'hue-rotate(180deg) saturate(2)'; }, 1000);
          setTimeout(() => { host.style.filter = 'none'; }, 2500);
        }
      } else {
        this._konamiIndex = 0;
      }
    });
  }
}

// Register the custom element
customElements.define('goodlegal-desktop', GoodLegalDesktop);
