// Inline Escaped String Renderer — content script (MV3)
// Listens for text selections, detects escaped sequences or quoted string literals,
// and shows a floating overlay with the decoded/pretty text.

(function () {
    let panel;
    let shadowRoot;
    let lastText = "";
    let lastPoint = { x: 0, y: 0 };
    let hideTimer = null;

    const STYLE_HOST_ID = "inline-json-string-renderer-host";

    function ensurePanel() {
        if (panel) return panel;

        const host = document.createElement("div");
        host.id = STYLE_HOST_ID;
        host.style.position = "fixed";
        host.style.zIndex = 2147483647; // above everything
        host.style.top = "0";
        host.style.left = "0";
        host.style.width = "0";
        host.style.height = "0";
        host.style.pointerEvents = "none"; // allow clicks to pass unless over the panel

        shadowRoot = host.attachShadow({ mode: "open" });

        panel = document.createElement("div");
        panel.className = "ijsr-panel";
        panel.style.position = "fixed";
        panel.style.pointerEvents = "auto"; // enable interaction
        panel.style.display = "none";

        // Panel chrome
        panel.innerHTML = `
        <div class="ijsr-card">
          <div class="ijsr-header">
            <span class="ijsr-title">Decoded preview</span>
            <div class="ijsr-actions">
              <button class="ijsr-btn" data-action="wrap">Wrap: ON</button>
              <button class="ijsr-btn" data-action="copy">Copy</button>
              <button class="ijsr-btn" data-action="close">✕</button>
            </div>
          </div>
          <pre class="ijsr-body"></pre>
        </div>
      `;

        // Close, copy, wrap buttons
        panel.addEventListener("click", (e) => {
            const btn = e.target.closest(".ijsr-btn");
            if (!btn) return;
            const action = btn.getAttribute("data-action");
            if (action === "close") hidePanel();
            if (action === "copy") copyBody();
            if (action === "wrap") toggleWrap(btn);
        });

        shadowRoot.appendChild(panel);
        document.documentElement.appendChild(host);
        return panel;
    }

    function setPanelPosition(x, y) {
        // Default position slightly offset from selection end
        const margin = 10;
        const maxW = Math.min(window.innerWidth - 20, 640);
        const maxH = Math.min(window.innerHeight - 20, 400);

        panel.style.maxWidth = maxW + "px";
        panel.style.maxHeight = maxH + "px";

        // Position with viewport constraints
        let px = x + margin;
        let py = y + margin;

        const rect = panel.getBoundingClientRect();
        const w = rect.width || 400; // estimate on first open
        const h = rect.height || 220;

        if (px + w > window.innerWidth - 10) px = window.innerWidth - w - 10;
        if (py + h > window.innerHeight - 10) py = window.innerHeight - h - 10;

        panel.style.left = px + "px";
        panel.style.top = py + "px";
    }

    function showPanel(text, point) {
        ensurePanel();
        const body = shadowRoot.querySelector(".ijsr-body");
        body.textContent = text; // preserve newlines

        const wrapBtn = shadowRoot.querySelector('[data-action="wrap"]');
        // Ensure wrap is ON by default
        if (!body.classList.contains("wrap")) {
            body.classList.add("wrap");
            wrapBtn.textContent = "Wrap: ON";
        }

        panel.style.display = "block";
        lastPoint = point || lastPoint;
        setPanelPosition(lastPoint.x, lastPoint.y);

        clearTimeout(hideTimer);
    }

    function hidePanel() {
        if (!panel) return;
        panel.style.display = "none";
    }

    function toggleWrap(btn) {
        const body = shadowRoot.querySelector(".ijsr-body");
        body.classList.toggle("wrap");
        const on = body.classList.contains("wrap");
        btn.textContent = `Wrap: ${on ? "ON" : "OFF"}`;
    }

    async function copyBody() {
        const body = shadowRoot.querySelector(".ijsr-body");
        try {
            await navigator.clipboard.writeText(body.textContent || "");
            flash("Copied!");
        } catch (e) {
            flash("Copy failed");
        }
    }

    function flash(msg) {
        const el = document.createElement("div");
        el.className = "ijsr-flash";
        el.textContent = msg;
        shadowRoot.appendChild(el);
        setTimeout(() => el.remove(), 900);
    }

    // --- Decoding helpers ----------------------------------------------------

    function hasEscapeSequences(str) {
        // Detect common JSON escape sequences
        return /\\[nrt"\\/]|\\u[0-9a-fA-F]{4}/.test(str);
    }

    function decodeEscapesLoose(str) {
        // Safely decode typical JSON string escape sequences even if the input
        // isn't surrounded by quotes. We wrap it in quotes and JSON.parse it.
        try {
            const wrapped = '"' + str.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"") + '"';
            return JSON.parse(wrapped);
        } catch (e) {
            // Fallback manual replacements for robustness
            return str
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "\r")
                .replace(/\\t/g, "\t")
                .replace(/\\\"/g, '"')
                .replace(/\\\\/g, "\\");
        }
    }

    function extractQuotedJSONString(str) {
        // Returns the **longest** JSON string literal found in the text, or null.
        // Matches escaped quotes and unicode sequences
        let best = null;
        const regex = /"((?:\\.|[^"\\])*)"/g;
        let m;
        while ((m = regex.exec(str)) !== null) {
            const candidate = m[0]; // includes quotes
            if (!hasEscapeSequences(candidate)) continue;
            if (!best || candidate.length > best.length) best = candidate;
        }
        return best; // e.g., "foo\nbar"
    }

    function tryDecodeSelection(rawText) {
        const t = rawText.trim();
        if (!t) return null;

        // Case 1: the selection itself is a quoted JSON string
        if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
            try {
                // Normalize to double-quoted for JSON.parse
                const doubleQuoted = t.startsWith("'") ? '"' + t.slice(1, -1).replace(/\\"/g, '\\"').replace(/"/g, '\\"') + '"' : t;
                const decoded = JSON.parse(doubleQuoted);
                if (typeof decoded === "string" && /[\n\r\t]|\u[0-9a-fA-F]{4}/.test(decoded)) {
                    return decoded;
                }
                // Even if no special chars post-decode, still useful to show
                if (typeof decoded === "string") return decoded;
            } catch (_) { }
        }

        // Case 2: the selection contains a quoted JSON string literal somewhere
        const quoted = extractQuotedJSONString(t);
        if (quoted) {
            try {
                const decoded = JSON.parse(quoted);
                return decoded;
            } catch (_) {
                // If strict parse fails, try loose method
                return decodeEscapesLoose(quoted.slice(1, -1));
            }
        }

        // Case 3: decode loose if it just includes escapes like \n or \t
        if (hasEscapeSequences(t)) {
            return decodeEscapesLoose(t);
        }

        return null;
    }

    // --- Selection handling ---------------------------------------------------

    function handleSelection(e) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
            hidePanel();
            return;
        }
        const raw = sel.toString();
        const decoded = tryDecodeSelection(raw);

        if (decoded == null) {
            hidePanel();
            return;
        }

        // Avoid flicker for the same text
        if (decoded === lastText && panel && panel.style.display === "block") {
            // only reposition near the cursor
            setPanelPosition(e.pageX || lastPoint.x, e.pageY || lastPoint.y);
            return;
        }

        lastText = decoded;
        showPanel(decoded, { x: e.pageX || 0, y: e.pageY || 0 });
    }

    // Debounce to avoid excessive work while selecting
    let debounceTimer = null;
    function debouncedHandleSelection(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => handleSelection(e), 80);
    }

    document.addEventListener("mouseup", debouncedHandleSelection, true);
    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") hidePanel();
    }, true);
    document.addEventListener("selectionchange", () => {
        // Update position as user drags selection; we don't open until mouseup
        // but this lets us hide when selection disappears via clicks
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) hidePanel();
        }, 120);
    }, true);

    // Hide panel if user scrolls far away
    window.addEventListener("scroll", () => {
        if (!panel || panel.style.display === "none") return;
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => hidePanel(), 400);
    }, { passive: true });
})();