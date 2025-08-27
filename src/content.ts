import type { PanelState, LoggerFunction } from './types';
import { STYLE_HOST_ID } from './types';
import { StringProcessor } from './utils/string-processor';
import { SettingsManager } from './utils/settings-manager';

class ContentScript {
  private panel: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private panelState: PanelState = {
    isVisible: false,
    lastText: ""
  };
  private hideTimer: number | null = null;
  private debounceTimer: number | null = null;
  private log: LoggerFunction = () => {};

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.initializeSettings();
    this.setupEventListeners();
    this.setupMessageListener();
  }

  private async initializeSettings(): Promise<void> {
    try {
      const settings = await SettingsManager.loadSettings();
      SettingsManager.updateLogger(settings.enableDebug);
      this.log = SettingsManager.getLogger();
      this.log('🚀 [CONTENT SCRIPT] Initialized');
      this.log('🔧 [SETTINGS] Loaded:', settings);

      SettingsManager.onSettingsChanged((newSettings) => {
        SettingsManager.updateLogger(newSettings.enableDebug);
        this.log = SettingsManager.getLogger();
        this.log('🔧 [SETTINGS] Updated:', newSettings);

        if (!newSettings.enablePopup && this.panelState.isVisible) {
          this.hidePanel();
        }
      });
    } catch (error) {
      console.error('Failed to initialize settings:', error);
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_UPDATED') {
        // Update SettingsManager's internal state first
        SettingsManager.saveSettings(message.settings);
        
        // Update logger with new settings
        const oldLog = this.log;
        SettingsManager.updateLogger(message.settings.enableDebug);
        this.log = SettingsManager.getLogger();
        
        // Use the new logger to show the update
        this.log('🔧 [SETTINGS] Updated via message:', message.settings);
        
        // If debug was just enabled, show a test message
        if (message.settings.enableDebug && oldLog !== this.log) {
          this.log('✅ [DEBUG] Debug logging enabled');
        }

        if (!message.settings.enablePopup && this.panelState.isVisible) {
          this.hidePanel();
        }
      }
    });
  }

  private ensurePanel(): HTMLElement {
    if (this.panel) return this.panel;

    this.injectStyles();
    this.createPanelStructure();
    this.attachEventListeners();

    return this.panel!;
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_HOST_ID + "-styles")) return;

    const style = document.createElement("style");
    style.id = STYLE_HOST_ID + "-styles";
    style.textContent = `
      #${STYLE_HOST_ID} .ijsr-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 2147483646 !important;
        backdrop-filter: blur(2px) !important;
      }
      
      #${STYLE_HOST_ID} .ijsr-overlay.hidden {
        display: none !important;
      }

      #${STYLE_HOST_ID} .ijsr-panel {
        box-sizing: border-box !important;
        position: fixed !important;
        pointer-events: auto !important;
      }

      #${STYLE_HOST_ID} .ijsr-card {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        background: #1e2024 !important;
        color: #ffffff !important;
        border: 1px solid #404040 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        overflow: hidden !important;
        width: 80vw !important;
        max-width: 800px !important;
        height: 80vh !important;
        max-height: 600px !important;
        display: flex !important;
        flex-direction: column !important;
      }

      #${STYLE_HOST_ID} .ijsr-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        padding: 12px 16px !important;
        background: #2a2d33 !important;
        border-bottom: 1px solid #404040 !important;
      }

      #${STYLE_HOST_ID} .ijsr-title {
        font-size: 12px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        opacity: 0.8 !important;
      }

      #${STYLE_HOST_ID} .ijsr-actions {
        display: flex !important;
        gap: 6px !important;
      }

      #${STYLE_HOST_ID} .ijsr-btn {
        font: inherit !important;
        font-size: 12px !important;
        color: #ffffff !important;
        background: #3a3d43 !important;
        border: 1px solid #555555 !important;
        border-radius: 4px !important;
        padding: 6px 12px !important;
        cursor: pointer !important;
        transition: background-color 0.2s !important;
      }

      #${STYLE_HOST_ID} .ijsr-btn:hover {
        background: #4a4d53 !important;
      }

      #${STYLE_HOST_ID} .ijsr-body {
        margin: 0 !important;
        padding: 12px 16px !important;
        line-height: 1.5 !important;
        font-size: 13px !important;
        white-space: pre !important;
        overflow-y: auto !important;
        overflow-x: auto !important;
        flex: 1 !important;
        height: calc(100% - 50px) !important;
        scrollbar-width: thin !important;
        scrollbar-color: #555555 #2a2d33 !important;
      }

      #${STYLE_HOST_ID} .ijsr-body::-webkit-scrollbar {
        width: 8px !important;
      }

      #${STYLE_HOST_ID} .ijsr-body::-webkit-scrollbar-track {
        background: #2a2d33 !important;
        border-radius: 4px !important;
      }

      #${STYLE_HOST_ID} .ijsr-body::-webkit-scrollbar-thumb {
        background: #555555 !important;
        border-radius: 4px !important;
      }

      #${STYLE_HOST_ID} .ijsr-body::-webkit-scrollbar-thumb:hover {
        background: #666666 !important;
      }

      #${STYLE_HOST_ID} .ijsr-body.wrap {
        white-space: pre-wrap !important;
        word-break: break-word !important;
      }

      #${STYLE_HOST_ID} .ijsr-natural-break {
        display: block !important;
        margin-bottom: 0.3em !important;
      }

      #${STYLE_HOST_ID} .ijsr-flash {
        position: fixed !important;
        left: 50% !important;
        top: 12px !important;
        transform: translateX(-50%) !important;
        background: rgba(0, 0, 0, 0.8) !important;
        color: #fff !important;
        border-radius: 8px !important;
        padding: 6px 10px !important;
        font-size: 12px !important;
        z-index: 2147483647 !important;
      }
    `;
    document.head.appendChild(style);
  }

  private createPanelStructure(): void {
    const host = document.createElement("div");
    host.id = STYLE_HOST_ID;
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.pointerEvents = "none";

    this.overlay = document.createElement("div");
    this.overlay.className = "ijsr-overlay hidden";

    this.panel = document.createElement("div");
    this.panel.className = "ijsr-panel";
    this.panel.style.position = "fixed";
    this.panel.style.pointerEvents = "auto";
    this.panel.style.display = "none";

    this.panel.innerHTML = `
      <div class="ijsr-card">
        <div class="ijsr-header">
          <span class="ijsr-title">String Preview</span>
          <div class="ijsr-actions">
            <button class="ijsr-btn" data-action="wrap">Wrap: ON</button>
            <button class="ijsr-btn" data-action="copy">Copy</button>
            <button class="ijsr-btn" data-action="close">✕</button>
          </div>
        </div>
        <pre class="ijsr-body"></pre>
      </div>
    `;

    host.appendChild(this.overlay);
    this.overlay.appendChild(this.panel);
    document.documentElement.appendChild(host);
  }

  private attachEventListeners(): void {
    if (!this.overlay || !this.panel) return;

    this.overlay.addEventListener("click", (e: MouseEvent) => {
      this.log("🔍 [OVERLAY CLICK]", {
        target: e.target,
        currentTarget: e.currentTarget,
        isOverlay: e.target === this.overlay
      });

      if (e.target === this.overlay) {
        this.log("✅ [OVERLAY CLICK] Clicking overlay background, closing panel");
        this.hidePanel();
      }
    });

    this.panel.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      this.log("✋ [STOP PROPAGATION] Event stopped at panel level");

      const btn = (e.target as Element).closest(".ijsr-btn") as HTMLButtonElement;
      if (btn) {
        const action = btn.getAttribute("data-action");
        this.log("🔘 [BUTTON CLICK]", { action });
        
        switch (action) {
          case "close":
            this.hidePanel();
            break;
          case "copy":
            this.copyBody();
            break;
          case "wrap":
            this.toggleWrap(btn);
            break;
        }
      }
    });

    this.panel.addEventListener("mouseup", (e: MouseEvent) => {
      this.log("🖱️ [PANEL MOUSEUP] Preventing handleSelection trigger");
      e.stopPropagation();
    });
  }

  private setPanelPosition(): void {
    if (!this.panel) return;
    
    this.panel.style.position = "fixed";
    this.panel.style.left = "50%";
    this.panel.style.top = "50%";
    this.panel.style.transform = "translate(-50%, -50%)";
    this.panel.style.zIndex = "2147483647";
  }

  private preprocessText(text: string): string {
    // Escape HTML to prevent XSS
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    // Replace natural line breaks with spans that have extra spacing
    return escaped.replace(/\n/g, '<span class="ijsr-natural-break"></span>');
  }

  private showPanel(text: string): void {
    this.ensurePanel();
    const body = this.panel!.querySelector(".ijsr-body") as HTMLElement;
    body.innerHTML = this.preprocessText(text);

    const wrapBtn = this.panel!.querySelector('[data-action="wrap"]') as HTMLButtonElement;
    if (!body.classList.contains("wrap")) {
      body.classList.add("wrap");
      wrapBtn.textContent = "Wrap: ON";
    }

    this.panel!.style.display = "block";
    this.overlay!.classList.remove("hidden");
    this.setPanelPosition();
    this.panelState.isVisible = true;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private hidePanel(): void {
    this.log("❌ [HIDE PANEL] Called");
    if (!this.panel) return;
    
    this.panel.style.display = "none";
    this.overlay!.classList.add("hidden");
    this.panelState.isVisible = false;
  }

  private toggleWrap(btn: HTMLButtonElement): void {
    const body = this.panel!.querySelector(".ijsr-body") as HTMLElement;
    body.classList.toggle("wrap");
    const on = body.classList.contains("wrap");
    btn.textContent = `Wrap: ${on ? "ON" : "OFF"}`;
  }

  private async copyBody(): Promise<void> {
    const body = this.panel!.querySelector(".ijsr-body") as HTMLElement;
    try {
      // Use innerText to get the rendered text content without HTML tags
      await navigator.clipboard.writeText(body.innerText || "");
      this.flash("Copied!");
    } catch (e) {
      this.flash("Copy failed");
    }
  }

  private flash(msg: string): void {
    const el = document.createElement("div");
    el.className = "ijsr-flash";
    el.textContent = msg;
    document.getElementById(STYLE_HOST_ID)!.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  private handleSelection(): void {
    this.log("🖱️ [HANDLE SELECTION] Called");

    const settings = SettingsManager.getCurrentSettings();
    if (!settings.enablePopup) {
      this.log("🚫 [POPUP DISABLED] Popup rendering is disabled in settings");
      this.hidePanel();
      return;
    }

    const sel = window.getSelection();
    this.log("🔍 [SELECTION DEBUG]", {
      hasSelection: !!sel,
      isCollapsed: sel?.isCollapsed,
      rangeCount: sel?.rangeCount,
      toString: sel?.toString(),
      type: sel?.type
    });
    
    if (!sel) {
      this.log("📝 [SELECTION] No selection object, hiding panel");
      this.hidePanel();
      return;
    }
    
    const raw = sel.toString();
    if (sel.isCollapsed && raw.trim() === '') {
      this.log("📝 [SELECTION] No selection, hiding panel");
      this.hidePanel();
      return;
    }
    this.log("📝 [SELECTED TEXT]", { raw, length: raw.length });
    const result = StringProcessor.processSelectedText(raw);

    if (!result) {
      this.log("🚫 [DECODE] No decoded content, hiding panel", { raw });
      this.hidePanel();
      return;
    }

    this.log("✅ [DECODED]", { method: result.method, decoded: result.decoded });

    if (result.decoded === this.panelState.lastText && this.panelState.isVisible) {
      return;
    }

    this.panelState.lastText = result.decoded;
    this.showPanel(result.decoded);
  }

  private debouncedHandleSelection = (e: Event): void => {
    if (this.panelState.isVisible) {
      const clickedElement = e.target as Element;
      const isInsidePanel = !!(
        clickedElement.closest('.ijsr-panel') ||
        clickedElement.closest('.ijsr-overlay') ||
        clickedElement.closest(`#${STYLE_HOST_ID}`)
      );

      if (isInsidePanel) {
        this.log("🚫 [DEBOUNCED SELECTION] Click inside panel, ignoring selection handling");
        return;
      }
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.handleSelection(), 80);
  };

  private handleDocumentClick = (e: Event): void => {
    if (!this.panelState.isVisible) return;

    const clickedElement = e.target as Element;
    const isInsideExtension = !!clickedElement.closest(`#${STYLE_HOST_ID}`);
    
    this.log("🌐 [DOCUMENT CLICK]", {
      target: clickedElement.tagName,
      targetClass: clickedElement.className,
      isInsideExtension,
      panelVisible: this.panelState.isVisible
    });

    if (!isInsideExtension) {
      this.log("✅ [DOCUMENT CLICK] Clicking outside extension, closing panel");
      this.hidePanel();
    }
  };

  private handleSelectionChange = (): void => {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.log("🔄 [SELECTION CHANGE] Checking selection");

      if (this.panelState.isVisible) {
        this.log("🚫 [SELECTION CHANGE] Panel is open, ignoring selection change");
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        this.log("📝 [SELECTION CHANGE] Selection collapsed, hiding panel");
        this.hidePanel();
      }
    }, 120);
  };

  private handleScroll = (): void => {
    if (!this.panelState.isVisible) return;
    
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = setTimeout(() => this.hidePanel(), 400);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      this.log("⌨️ [ESCAPE KEY] Hiding panel");
      this.hidePanel();
    }
  };

  private setupEventListeners(): void {
    document.addEventListener("mouseup", this.debouncedHandleSelection, true);
    document.addEventListener("keyup", this.handleKeyUp, true);
    document.addEventListener("selectionchange", this.handleSelectionChange, true);
    document.addEventListener("click", this.handleDocumentClick, true);
    window.addEventListener("scroll", this.handleScroll, { passive: true });
  }
}

new ContentScript();