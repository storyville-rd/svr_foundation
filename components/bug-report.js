(function () {
  "use strict";

  var script = document.currentScript;
  var appKey = script.getAttribute("data-app");
  if (!appKey) {
    console.error("[BugReport] missing data-app attribute on script tag");
    return;
  }

  // Where reports are sent. Order: data-endpoint attribute, then the script's own origin when it is served by the
  // services Worker (the legacy /w.js embed), otherwise the shared services Worker below (CDN-hosted copy).
  var DEFAULT_ENDPOINT = "https://svr-services.carissa-4f6.workers.dev";
  var scriptOrigin = new URL(script.src).origin;
  var onCdn = /(^|\.)jsdelivr\.net$|(^|\.)githubusercontent\.com$|(^|\.)unpkg\.com$/.test(new URL(script.src).hostname);
  var origin = (script.getAttribute("data-endpoint") || (onCdn ? DEFAULT_ENDPOINT : scriptOrigin)).replace(/\/+$/, "");
  var build = script.getAttribute("data-build") || (window.__BUILD__ || undefined);
  var position = script.getAttribute("data-position") || "bottom-right";
  var turnstileSiteKey = script.getAttribute("data-turnstile-key") || null;
  var label = script.getAttribute("data-label") || "Report a Bug";
  var offsetBottom = parseInt(script.getAttribute("data-offset-bottom"), 10);
  if (!isFinite(offsetBottom) || offsetBottom < 0) offsetBottom = 20;

  var RING_SIZE = 25;
  var errors = [];
  var network = [];
  var userContext = {};
  var userIdentity = {};

  function pushCapped(arr, item) {
    arr.push(item);
    if (arr.length > RING_SIZE) arr.shift();
  }

  // Installed immediately at load — the whole point is capturing whatever happened
  // before the user ever clicks the button.
  window.addEventListener("error", function (e) {
    pushCapped(errors, {
      t: Date.now(),
      type: "onerror",
      msg: e.message || "",
      stack: (e.error && e.error.stack) || "",
      src: e.filename || "",
      line: e.lineno || 0,
      col: e.colno || 0,
    });
  });

  window.addEventListener("unhandledrejection", function (e) {
    var reason = e.reason;
    pushCapped(errors, {
      t: Date.now(),
      type: "unhandledrejection",
      msg: reason && reason.message ? reason.message : String(reason),
      stack: reason && reason.stack ? reason.stack : "",
      src: "",
      line: 0,
      col: 0,
    });
  });

  var origFetch = window.fetch;
  if (typeof origFetch === "function") {
    window.fetch = function (input, init) {
      var start = Date.now();
      var method = (init && init.method) || (input && input.method) || "GET";
      var url = typeof input === "string" ? input : input && input.url;
      return origFetch.apply(window, arguments).then(
        function (res) {
          try {
            if (res && res.status >= 400) {
              pushCapped(network, { t: start, method: method, url: url, status: res.status, ms: Date.now() - start });
            }
          } finally {
            return res;
          }
        },
        function (err) {
          try {
            pushCapped(network, { t: start, method: method, url: url, status: 0, ms: Date.now() - start });
          } finally {
            throw err;
          }
        }
      );
    };
  }

  var OrigXHR = window.XMLHttpRequest;
  if (OrigXHR) {
    var origOpen = OrigXHR.prototype.open;
    var origSend = OrigXHR.prototype.send;
    OrigXHR.prototype.open = function (method, url) {
      this.__br = { method: method, url: url, start: 0 };
      return origOpen.apply(this, arguments);
    };
    OrigXHR.prototype.send = function () {
      if (this.__br) {
        this.__br.start = Date.now();
        var self = this;
        this.addEventListener("loadend", function () {
          try {
            if (self.status >= 400) {
              pushCapped(network, {
                t: self.__br.start,
                method: self.__br.method,
                url: self.__br.url,
                status: self.status,
                ms: Date.now() - self.__br.start,
              });
            }
          } catch (e) {
            /* never let instrumentation break the host app */
          }
        });
      }
      return origSend.apply(this, arguments);
    };
  }

  // Storyville RD design system, scoped to this widget's shadow root. Colours come from the page's real --svr-*
  // role tokens (custom properties inherit into the shadow root, so the widget follows the page's theme and any
  // brand update with no code here). The literal values are fallbacks for pages that don't load the brand CSS:
  // light by default, dark when the page (data-theme) or device is dark. A data-theme attribute on the script tag
  // forces a theme and ignores the page's tokens. Fonts are Bebas Neue / Source Sans 3 when the page loads them,
  // else the brand fallbacks (Arial / Calibri). No shadows or gradients, per the guidelines.
  var STYLES = `
:host{all:initial;
--f-bg:#FAF8F5;--f-text:#211D1B;--f-heading:#211D1B;--f-accent:#A72F2F;--f-fill:#A72F2F;--f-on-accent:#FAF8F5;
--f-muted:#655C57;--f-strong:#857C77;--f-overlay:rgba(33,29,27,.55);
--f-danger:#9B1C3A;--f-success:#23695C;--f-success-bg:#E1EEEA;
--bg:var(--svr-color-bg,var(--f-bg));--text:var(--svr-color-text,var(--f-text));--heading:var(--svr-color-heading,var(--f-heading));
--accent:var(--svr-color-accent,var(--f-accent));--fill:var(--svr-color-accent-fill,var(--f-fill));
--on-accent:var(--svr-color-on-accent,var(--f-on-accent));--muted:var(--svr-color-text-muted,var(--f-muted));
--strong:var(--svr-color-border-strong,var(--f-strong));--overlay:var(--svr-color-overlay,var(--f-overlay));
--danger:var(--svr-color-danger,var(--f-danger));--success:var(--svr-color-success,var(--f-success));
--success-bg:var(--svr-color-success-subtle,var(--f-success-bg))}
:host([data-theme=dark]){--f-bg:#211D1B;--f-text:#D4CECC;--f-heading:#FAF8F5;--f-accent:#E07B72;
--f-muted:#A39A95;--f-strong:#8C837E;--f-overlay:rgba(12,10,9,.72);
--f-danger:#F08BA0;--f-success:#76C2B0;--f-success-bg:#1A322D}
:host([data-forced]){--bg:var(--f-bg);--text:var(--f-text);--heading:var(--f-heading);--accent:var(--f-accent);--fill:var(--f-fill);
--on-accent:var(--f-on-accent);--muted:var(--f-muted);--strong:var(--f-strong);--overlay:var(--f-overlay);
--danger:var(--f-danger);--success:var(--f-success);--success-bg:var(--f-success-bg)}
*{box-sizing:border-box;font-family:var(--svr-font-body,"Source Sans 3",Calibri,sans-serif)}
.br-btn{position:fixed;z-index:2147483000;width:44px;height:44px;display:grid;place-items:center;padding:0;
background:var(--fill);color:var(--on-accent);border:2px solid var(--bg);border-radius:2px;cursor:pointer;
transition:background-color .15s,color .15s}
.br-btn svg{width:22px;height:22px}
.br-btn:hover{background:var(--heading);color:var(--bg)}
.br-btn.left{left:16px}.br-btn.right{right:16px}
.br-btn:focus-visible,.br-actions button:focus-visible{outline:2px solid var(--heading);outline-offset:2px}
.br-overlay{position:fixed;inset:0;background:var(--overlay);z-index:2147483001;
display:flex;align-items:center;justify-content:center;padding:16px}
.br-modal{background:var(--bg);color:var(--text);border:1px solid var(--strong);border-top:3px solid var(--accent);
border-radius:4px;padding:24px;width:100%;max-width:440px;max-height:90vh;overflow:auto;font-size:15px;line-height:1.5}
.br-modal h2{margin:0 0 16px;font-family:var(--svr-font-display,"Bebas Neue",Arial,sans-serif);font-weight:400;font-size:32px;line-height:1.1;
letter-spacing:.01em;color:var(--heading)}
.br-field{margin-bottom:16px}
.br-field>label{display:block;font-size:14px;font-weight:700;color:var(--heading);margin-bottom:4px}
.br-field textarea,.br-field input[type=email]{width:100%;min-height:40px;padding:9px 12px;font-size:15px;line-height:1.4;
color:var(--text);background:var(--bg);border:1px solid var(--strong);border-radius:2px;resize:vertical}
.br-field textarea{min-height:96px}
.br-field textarea::placeholder,.br-field input::placeholder{color:var(--muted);opacity:1}
.br-field textarea:hover,.br-field input[type=email]:hover{border-color:var(--heading)}
.br-field textarea:focus-visible,.br-field input[type=email]:focus-visible{outline:2px solid var(--heading);outline-offset:1px;border-color:var(--heading)}
.br-radio-group{display:flex;flex-direction:column;gap:8px}
.br-radio-group label,.br-checkbox label{display:flex;align-items:flex-start;gap:8px;margin:0;font-size:15px;font-weight:400;
line-height:1.35;color:var(--text);cursor:pointer}
.br-checkbox{display:flex;align-items:flex-start;gap:8px}
.br-radio-group input,.br-checkbox input{appearance:none;-webkit-appearance:none;margin:0;padding:0;flex:none;width:20px;height:20px;
display:inline-grid;place-content:center;background:var(--bg);border:2px solid var(--strong);border-radius:2px;cursor:pointer}
.br-radio-group input{border-radius:50%}
.br-checkbox input::before,.br-radio-group input::before{content:"";width:10px;height:10px;transform:scale(0);background:var(--on-accent);
clip-path:polygon(14% 44%,0 65%,50% 100%,100% 16%,80% 0,43% 62%)}
.br-radio-group input::before{width:8px;height:8px;border-radius:50%;clip-path:none}
.br-checkbox input:checked,.br-radio-group input:checked{background:var(--fill);border-color:var(--fill)}
.br-checkbox input:checked::before,.br-radio-group input:checked::before{transform:scale(1)}
.br-checkbox input:hover,.br-radio-group input:hover{border-color:var(--heading)}
.br-checkbox input:focus-visible,.br-radio-group input:focus-visible{outline:2px solid var(--heading);outline-offset:2px}
.br-hint{margin-top:4px;font-size:13px;line-height:1.4;color:var(--muted)}
.br-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:24px}
.br-actions button{min-height:44px;padding:12px 24px;font-size:15px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
line-height:1.2;background:transparent;color:var(--accent);border:2px solid var(--accent);border-radius:2px;cursor:pointer;
transition:background-color .15s,color .15s,border-color .15s}
.br-actions button:hover{background:var(--fill);border-color:var(--fill);color:var(--on-accent)}
.br-actions .br-submit{background:var(--fill);border-color:var(--fill);color:var(--on-accent)}
.br-actions .br-submit:hover{background:var(--heading);border-color:var(--heading);color:var(--bg)}
.br-actions button:disabled{background:var(--strong);border-color:var(--strong);color:var(--bg);cursor:not-allowed}
.br-error{margin-top:8px;font-size:13px;line-height:1.4;font-weight:700;color:var(--danger)}
.br-success{padding:16px 24px;background:var(--success-bg);border:1px solid var(--success);border-radius:4px;color:var(--text)}
.br-success b{display:block;margin-bottom:4px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--success)}
.br-hp{display:none}
@media (forced-colors:active){.br-btn,.br-actions button{border:2px solid ButtonText}}
@media (prefers-reduced-motion:reduce){.br-btn,.br-actions button{transition:none}}
`;

  var host = document.createElement("div");
  document.documentElement.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var styleEl = document.createElement("style");
  styleEl.textContent = STYLES;
  root.appendChild(styleEl);

  // Theme: follow the host page's data-theme (Storyville apps set it on <html>), else the device setting.
  // Override per embed with data-theme="light" or "dark" on the script tag.
  var forcedTheme = script.getAttribute("data-theme");
  function currentTheme() {
    if (forcedTheme === "light" || forcedTheme === "dark") return forcedTheme;
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function syncTheme() {
    host.setAttribute("data-theme", currentTheme());
    if (forcedTheme === "light" || forcedTheme === "dark") host.setAttribute("data-forced", "");
  }
  syncTheme();
  try {
    new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncTheme);
  } catch (e) {
    /* older browsers: the theme is still read when the page loads and again each time the modal opens */
  }

  // Lucide "bug" icon (ISC licence).
  var BUG_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>' +
    '<path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/>' +
    '<path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>' +
    '<path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>';

  var button = document.createElement("button");
  button.className = "br-btn " + (position.indexOf("left") !== -1 ? "left" : "right");
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = BUG_ICON;
  button.style.bottom = "calc(" + offsetBottom + "px + env(safe-area-inset-bottom, 0px))";
  root.appendChild(button);

  var overlay = null;
  var lastFocused = null;

  function normalizedRoute() {
    return location.pathname;
  }

  function buildEnvelope(form) {
    return {
      v: 1,
      app: appKey,
      build: build,
      reporter: {
        email: form.email || undefined,
        name: userIdentity.name || undefined,
        role: userIdentity.role || undefined,
      },
      severity: form.severity,
      always: form.always,
      description: form.description,
      expected: form.expected || undefined,
      context: {
        url: location.href,
        referrer: document.referrer || undefined,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        ua: navigator.userAgent,
        lang: navigator.language,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        online: navigator.onLine,
        ts: new Date().toISOString(),
      },
      diagnostics: {
        errors: errors.slice(),
        network: network.slice(),
        app: userContext,
      },
      hp: form.hp,
      turnstileToken: form.turnstileToken,
    };
  }

  function trapFocus(e) {
    if (!overlay) return;
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.key !== "Tab") return;
    var focusable = overlay.querySelectorAll("button, input, textarea, [tabindex]");
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function closeModal() {
    if (!overlay) return;
    root.removeChild(overlay);
    overlay = null;
    document.removeEventListener("keydown", trapFocus, true);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  var turnstileScriptPromise = null;
  var turnstileWidgetId = null;

  function loadTurnstile(modal) {
    turnstileWidgetId = null;
    var container = modal.querySelector(".cf-turnstile");
    if (!container) return;

    if (!turnstileScriptPromise) {
      turnstileScriptPromise = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    turnstileScriptPromise
      .then(function () {
        if (window.turnstile && container.isConnected) {
          turnstileWidgetId = window.turnstile.render(container, { sitekey: turnstileSiteKey, theme: currentTheme() });
        }
      })
      .catch(function () {
        /* Turnstile failed to load; the Worker will reject the submission and the user sees that error. */
      });
  }

  function openModal() {
    if (overlay) return;
    lastFocused = document.activeElement;

    overlay = document.createElement("div");
    overlay.className = "br-overlay";

    var modal = document.createElement("div");
    modal.className = "br-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "br-title");

    modal.innerHTML =
      '<h2 id="br-title">' + label + "</h2>" +
      '<form novalidate>' +
      '<div class="br-field">' +
      '<label for="br-description">What happened?</label>' +
      '<textarea id="br-description" required placeholder="e.g. Clicking Save on the proposal page shows a spinner forever and nothing saves"></textarea>' +
      "</div>" +
      '<div class="br-field">' +
      '<label for="br-expected">What did you expect to happen? (optional)</label>' +
      '<textarea id="br-expected"></textarea>' +
      "</div>" +
      '<div class="br-field">' +
      '<label id="br-severity-label">How bad is it?</label>' +
      '<div class="br-radio-group" role="radiogroup" aria-labelledby="br-severity-label">' +
      '<label><input type="radio" name="br-severity" value="blocked" checked> I can\'t continue</label>' +
      '<label><input type="radio" name="br-severity" value="annoying"> It\'s annoying but I can work around it</label>' +
      '<label><input type="radio" name="br-severity" value="cosmetic"> Cosmetic</label>' +
      "</div>" +
      "</div>" +
      '<div class="br-field br-checkbox">' +
      '<input type="checkbox" id="br-always">' +
      '<label for="br-always">This happens every time</label>' +
      "</div>" +
      '<div class="br-field">' +
      '<label for="br-email">Email (optional)</label>' +
      '<input type="email" id="br-email" placeholder="leave your email if you\'d like an update">' +
      '<div class="br-hint">Please don’t include passwords or personal information.</div>' +
      "</div>" +
      '<input class="br-hp" type="text" id="br-hp" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      (turnstileSiteKey ? '<div class="br-field cf-turnstile" data-sitekey="' + turnstileSiteKey + '"></div>' : "") +
      '<div class="br-error" id="br-error" hidden></div>' +
      '<div class="br-actions">' +
      '<button type="button" class="br-cancel">Cancel</button>' +
      '<button type="submit" class="br-submit">Send report</button>' +
      "</div>" +
      "</form>";

    overlay.appendChild(modal);
    root.appendChild(overlay);

    if (turnstileSiteKey) loadTurnstile(modal);

    document.addEventListener("keydown", trapFocus, true);

    var descriptionEl = modal.querySelector("#br-description");
    descriptionEl.focus();

    modal.querySelector(".br-cancel").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    modal.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      submitForm(modal);
    });
  }

  function showError(modal, message) {
    var el = modal.querySelector("#br-error");
    el.textContent = "Error: " + message; // the word, not just the colour, carries the meaning
    el.hidden = false;
  }

  function submitForm(modal) {
    var description = modal.querySelector("#br-description").value.trim();
    if (!description) {
      showError(modal, "Please describe what happened.");
      return;
    }
    var severityInput = modal.querySelector('input[name="br-severity"]:checked');
    var form = {
      description: description,
      expected: modal.querySelector("#br-expected").value.trim(),
      severity: severityInput ? severityInput.value : "annoying",
      always: modal.querySelector("#br-always").checked,
      email: modal.querySelector("#br-email").value.trim(),
      hp: modal.querySelector("#br-hp").value,
      turnstileToken:
        turnstileSiteKey && window.turnstile && turnstileWidgetId !== null
          ? window.turnstile.getResponse(turnstileWidgetId)
          : undefined,
    };

    var submitBtn = modal.querySelector(".br-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var envelope = buildEnvelope(form);

    fetch(origin + "/r/" + encodeURIComponent(appKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () {
            return {};
          }).then(function (data) {
            throw new Error((data && data.error) || "Something went wrong (" + res.status + ")");
          });
        }
        return res.json();
      })
      .then(function (data) {
        modal.innerHTML = '<div class="br-success" role="status"><b>Success</b>Thanks, we got your report (id: ' + data.id + "). We'll take a look.</div>";
        setTimeout(closeModal, 2000);
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send report";
        showError(modal, err.message || "Failed to send report. Please try again.");
      });
  }

  button.addEventListener("click", openModal);

  window.BugReport = {
    open: openModal,
    close: closeModal,
    setContext: function (obj) {
      userContext = Object.assign({}, userContext, obj);
    },
    setUser: function (user) {
      userIdentity = Object.assign({}, userIdentity, user);
    },
  };
})();
