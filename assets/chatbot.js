/* =========================================================
   PARAGOS — Chat support widget (Gemini via Cloudflare Worker)
   Loaded by main.js on every page. See /worker for the proxy.
   ========================================================= */

"use strict";

(function () {

  // Paste your deployed Worker URL here (see worker/README.md)
  const CHATBOT_ENDPOINT = "https://paragos-chat.paragos.workers.dev";

  const MAX_CONTEXT_CHARS = 12000;
  const HISTORY_KEY = "paragos:chat_history";
  const GREETING =
    "Hi! I'm the PARAGOS assistant. Ask me about destinations, stays, offers or bookings.";

  const data = (typeof PARAGOS_DATA !== "undefined") ? PARAGOS_DATA : {};

  /* ---------- helpers ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30)));
    } catch (e) { /* storage unavailable */ }
  }

  function buildContext() {
    const parts = [];
    const skip = ["image", "imageUrl", "photo"];
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key]) && data[key].length) {
        const json = JSON.stringify(
          data[key],
          (k, v) => (skip.includes(k) ? undefined : v)
        );
        parts.push(key.toUpperCase() + ": " + json);
      }
    });
    return parts.join("\n").slice(0, MAX_CONTEXT_CHARS);
  }

  // Offline fallback: keyword match against local FAQs
  function faqFallback(question) {
    const words = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    let best = null;
    let bestScore = 0;

    (data.faqs || []).forEach(item => {
      const q = String(item.question || item.q || item.title || "");
      const a = String(item.answer || item.a || item.content || item.description || "");
      const haystack = (q + " " + a).toLowerCase();
      const score = words.filter(w => haystack.includes(w)).length;
      if (score > bestScore) { bestScore = score; best = a; }
    });

    return best ||
      "I can't reach the assistant right now. Please visit our Support page and we'll help you out.";
  }

  async function askAI(history) {
    if (!CHATBOT_ENDPOINT) throw new Error("no endpoint");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(CHATBOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context: buildContext() }),
        signal: controller.signal
      });

      if (response.status === 429) {
        return "I'm getting a lot of questions right now. Please try again in a minute.";
      }
      if (!response.ok) throw new Error("bad status " + response.status);

      const result = await response.json();
      return result.reply || "Sorry, I couldn't come up with an answer.";
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- UI ---------- */

  function init() {
    if (document.getElementById("pgChat")) return;

    const history = loadHistory();
    let busy = false;

    const root = el("div", "pg-chat");
    root.id = "pgChat";

    const toggle = el("button", "pg-chat__toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Open chat support");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "💬";

    const panel = el("div", "pg-chat__panel");
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "PARAGOS chat support");

    const header = el("div", "pg-chat__header");
    header.appendChild(el("strong", "", "PARAGOS Support"));
    const close = el("button", "pg-chat__close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close chat");
    header.appendChild(close);

    const log = el("div", "pg-chat__log");
    log.setAttribute("aria-live", "polite");

    const form = el("form", "pg-chat__form");
    const input = el("input", "pg-chat__input");
    input.type = "text";
    input.maxLength = 500;
    input.placeholder = "Type your question…";
    input.setAttribute("aria-label", "Your message");
    const send = el("button", "pg-chat__send", "Send");
    send.type = "submit";
    form.append(input, send);

    panel.append(header, log, form);
    root.append(panel, toggle);
    document.body.appendChild(root);

    function addBubble(role, text) {
      const bubble = el("div", "pg-chat__msg pg-chat__msg--" + role, text);
      log.appendChild(bubble);
      log.scrollTop = log.scrollHeight;
      return bubble;
    }

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) input.focus();
    }

    addBubble("assistant", GREETING);
    history.forEach(m => addBubble(m.role, m.text));

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    close.addEventListener("click", () => { setOpen(false); toggle.focus(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !panel.hidden) setOpen(false);
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || busy) return;

      busy = true;
      send.disabled = true;
      input.value = "";

      history.push({ role: "user", text });
      addBubble("user", text);
      const typing = addBubble("assistant", "…");
      typing.classList.add("pg-chat__msg--typing");

      let reply;
      try {
        reply = await askAI(history);
      } catch (err) {
        reply = faqFallback(text);
      }

      typing.textContent = reply;
      typing.classList.remove("pg-chat__msg--typing");
      history.push({ role: "assistant", text: reply });
      saveHistory(history);
      log.scrollTop = log.scrollHeight;

      busy = false;
      send.disabled = false;
      input.focus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
