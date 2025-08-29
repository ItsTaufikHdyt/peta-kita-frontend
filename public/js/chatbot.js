/* PETAKITA Chatbot – Enhanced
   - Persist chat (localStorage)
   - Focus trap & ESC
   - Abort fetch + hentikan typewriter
   - Autoscroll cerdas
   - Fallback API (window.chatbotAPI) tetap kompatibel
*/
document.addEventListener("DOMContentLoaded", () => {
  const chatToggle   = document.getElementById("chat-toggle");
  const chatClose    = document.getElementById("chat-close");
  const chatbot      = document.getElementById("chatbot");
  const chatMessages = document.getElementById("chat-messages");
  const userInput    = document.getElementById("user-input");
  const sendButton   = document.getElementById("send-message");
  const stopButton   = document.getElementById("stop-message");
  const chatForm     = document.getElementById("chat-form");

  const STORAGE_KEY = "petakita_chat_history_v1";
  let currentAbortController = null;
  let currentStopTyping = null;
  let busy = false;            // cegah double-submit
  let focusTrapHandler = null; // untuk melepas saat close

  /* ========= Helper: storage ========= */
  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveHistory(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-200))); } catch {}
  }
  function clearHistory() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

  let history = loadHistory();

  /* ========= Fallback API ========= */
  if (!window.chatbotAPI) {
    window.chatbotAPI = {
      // Non-stream fallback
      async sendToOpenRouter(text, _signal) {
        await new Promise(r => setTimeout(r, 600));
        return `Anda bertanya: "${text}". (Contoh respons; hubungkan ke API Anda)`;
      },
      // Pengetikan bertahap, bisa dihentikan
      typeMessageWithStop(targetEl, fullText, onDone) {
        // Hormati prefers-reduced-motion: langsung tampil
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          targetEl.textContent = fullText;
          onDone && onDone();
          return () => {};
        }
        let i = 0, stopped = false;
        targetEl.textContent = "";
        (function tick(){
          if (stopped) return;
          if (i < fullText.length) {
            targetEl.textContent += fullText.charAt(i++);
            smartScrollToBottom();
            setTimeout(tick, 12);
          } else {
            onDone && onDone();
          }
        })();
        return function stop(){ stopped = true; onDone && onDone(); };
      }
    };
  }

  /* ========= Aksesibilitas & focus trap ========= */
  function getFocusable(container){
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null || el === document.activeElement);
  }
  function enableFocusTrap(container){
    function handler(e){
      if (e.key !== "Tab") return;
      const focusables = getFocusable(container);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", handler);
    focusTrapHandler = handler;
  }
  function disableFocusTrap(){
    if (focusTrapHandler) {
      document.removeEventListener("keydown", focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  /* ========= Open/Close ========= */
  function openChat() {
    chatbot.classList.add("is-open");
    chatbot.setAttribute("aria-hidden", "false");
    chatToggle.setAttribute("aria-expanded", "true");
    enableFocusTrap(chatbot);
    setTimeout(() => userInput.focus(), 200);
  }
  function closeChat() {
    stopGeneration();
    chatbot.classList.remove("is-open");
    chatbot.setAttribute("aria-hidden", "true");
    chatToggle.setAttribute("aria-expanded", "false");
    disableFocusTrap();
  }

  // Toggle tombol & tombol close
  chatToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = chatbot.classList.contains("is-open");
    isOpen ? closeChat() : openChat();
  });
  chatClose.addEventListener("click", closeChat);

  // Close dengan ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatbot.classList.contains("is-open")) closeChat();
  });

  // Close saat klik di luar dialog (opsional – aman)
  document.addEventListener("click", (e) => {
    if (!chatbot.classList.contains("is-open")) return;
    const inside = chatbot.contains(e.target) || chatToggle.contains(e.target);
    if (!inside) closeChat();
  });

  /* ========= Scroll management ========= */
  function isNearBottom(){
    const t = chatMessages;
    return (t.scrollHeight - t.scrollTop - t.clientHeight) < 80;
  }
  function smartScrollToBottom(force = false){
    if (force || isNearBottom()) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  /* ========= UI Helpers ========= */
  function setBusyState(flag){
    busy = flag;
    userInput.disabled = flag;
    sendButton.style.display = flag ? "none" : "block";
    stopButton.style.display = flag ? "block" : "none";
  }

  function stopGeneration() {
    if (currentAbortController) { currentAbortController.abort(); currentAbortController = null; }
    if (currentStopTyping) { currentStopTyping(); currentStopTyping = null; }
    setBusyState(false);
    userInput.focus();
  }
  stopButton.addEventListener("click", stopGeneration);

  function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (sender === "bot") {
      const icon = document.createElement("i");
      icon.className = "fas fa-robot";
      icon.setAttribute("aria-hidden", "true");
      contentDiv.appendChild(icon);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = text; // aman dari XSS
    contentDiv.appendChild(paragraph);

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    smartScrollToBottom(true);
    return messageDiv;
  }

  function addTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message typing-indicator";
    typingDiv.innerHTML = `
      <div class="message-content">
        <i class="fas fa-robot" aria-hidden="true"></i>
        <div class="typing-dots" aria-label="Asisten sedang mengetik" role="status">
          <span></span><span></span><span></span>
        </div>
      </div>`;
    chatMessages.appendChild(typingDiv);
    smartScrollToBottom(true);
    return typingDiv;
  }

  /* ========= Render ulang dari history ========= */
  function renderHistory(){
    chatMessages.innerHTML = "";
    history.forEach(item => addMessage(item.text, item.sender));
    smartScrollToBottom(true);
  }
  renderHistory();

  /* ========= Kirim pesan ========= */
  async function sendMessage(message) {
    if (busy) return;
    const text = (message ?? userInput.value).trim();
    if (!text) return;

    setBusyState(true);

    // tampilkan pesan user + simpan history
    addMessage(text, "user");
    history.push({ sender: "user", text, ts: Date.now() });
    saveHistory(history);
    userInput.value = "";

    const typingIndicator = addTypingIndicator();

    try {
      currentAbortController = new AbortController();

      // Dukungan optional untuk streaming token
      let botText = "";
      if (typeof window.chatbotAPI.streamToOpenRouter === "function") {
        await window.chatbotAPI.streamToOpenRouter(
          text,
          token => {
            if (typingIndicator.isConnected) typingIndicator.remove();
            if (!botText) {
              // membuat container bot pertama kali
              const botDiv = addMessage("", "bot");
              const p = botDiv.querySelector("p");
              p.textContent = token;
            } else {
              const lastBot = chatMessages.querySelector(".message.bot-message:last-of-type p");
              if (lastBot) lastBot.textContent += token;
            }
            botText += token;
            smartScrollToBottom();
          },
          currentAbortController.signal
        );
      } else {
        // Non-stream fallback
        const resp = await window.chatbotAPI.sendToOpenRouter(text, currentAbortController.signal);
        botText = String(resp ?? "");
      }

      // Bersihkan indikator
      if (typingIndicator.isConnected) typingIndicator.remove();

      // Tampilkan jawaban bot (typewriter jika tidak streaming)
      if (botText) {
        const botMessageDiv = addMessage("", "bot");
        const messageText = botMessageDiv.querySelector("p");
        currentStopTyping = window.chatbotAPI.typeMessageWithStop(
          messageText,
          botText,
          finalize
        );
      } else {
        // jika sudah di-stream semua
        finalize();
      }

    } catch (error) {
      console.error("Chatbot error:", error);
      if (typingIndicator.isConnected) typingIndicator.remove();

      if (error?.name === "AbortError") {
        addMessage("Pesan dihentikan.", "bot");
      } else {
        addMessage("Maaf, terjadi kesalahan. Silakan coba lagi.", "bot");
      }
      finalize(true);
    }

    function finalize(errorHappened = false){
      // simpan history terakhir (ambil teks bot terakhir)
      const lastBot = chatMessages.querySelector(".message.bot-message:last-of-type p");
      if (lastBot && lastBot.textContent) {
        history.push({ sender: "bot", text: lastBot.textContent, ts: Date.now() });
        saveHistory(history);
      }
      currentAbortController = null;
      currentStopTyping = null;
      setBusyState(false);
      if (!errorHappened) userInput.focus();
    }
  }

  // Submit & Enter
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  /* Opsional: buka otomatis jika URL mengandung #chat */
  if (location.hash === "#chat") openChat();

  /* API kecil untuk kontrol eksternal (opsional) */
  window.petakitaChat = {
    open: openChat,
    close: closeChat,
    clear: () => { clearHistory(); history = []; renderHistory(); }
  };
});

