document.addEventListener("DOMContentLoaded", () => {
  const chatToggle = document.getElementById("chat-toggle");
  const chatClose = document.getElementById("chat-close");
  const chatbot = document.getElementById("chatbot");
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-message");
  const stopButton = document.getElementById("stop-message");
  const chatForm = document.getElementById("chat-form");

  let currentAbortController = null;
  let currentStopTyping = null;
  let busy = false; // cegah double-submit

  // Shim sederhana agar tidak error bila window.chatbotAPI belum didefinisikan
  if (!window.chatbotAPI) {
    window.chatbotAPI = {
      async sendToOpenRouter(text, _signal) {
        // fallback demo
        await new Promise(r => setTimeout(r, 600));
        return `Anda bertanya: "${text}". (Contoh respons; hubungkan ke API Anda)`;
      },
      // mengetik karakter per karakter, bisa dihentikan
      typeMessageWithStop(targetEl, fullText, onDone) {
        let i = 0, stopped = false;
        targetEl.textContent = "";
        (function tick() {
          if (stopped) return;
          if (i < fullText.length) {
            targetEl.textContent += fullText.charAt(i++);
            // scroll ke bawah saat mengetik
            chatMessages.scrollTop = chatMessages.scrollHeight;
            setTimeout(tick, 12); // kecepatan ketik
          } else {
            onDone && onDone();
          }
        })();
        return function stop() { stopped = true; onDone && onDone(); };
      }
    };
  }

  function openChat() {
    chatbot.classList.add("is-open");
    chatbot.setAttribute("aria-hidden", "false");
    chatToggle.setAttribute("aria-expanded", "true");
    // focus input setelah animasi singkat
    setTimeout(() => userInput.focus(), 200);
  }

  function closeChat() {
    stopGeneration(); // hentikan yang sedang jalan kalau ada
    chatbot.classList.remove("is-open");
    chatbot.setAttribute("aria-hidden", "true");
    chatToggle.setAttribute("aria-expanded", "false");
  }

  // Toggle
  chatToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = chatbot.classList.contains("is-open");
    if (isOpen) closeChat(); else openChat();
  });

  // Close button
  chatClose.addEventListener("click", closeChat);

  // ESC untuk menutup
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatbot.classList.contains("is-open")) {
      closeChat();
    }
  });

  // Hentikan respons yang sedang berjalan
  function stopGeneration() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    if (currentStopTyping) {
      currentStopTyping();
      currentStopTyping = null;
    }
    stopButton.style.display = "none";
    sendButton.style.display = "block";
    userInput.disabled = false;
    busy = false;
    userInput.focus();
  }

  // Event tombol stop
  stopButton.addEventListener("click", stopGeneration);

  // Tambahkan pesan ke UI
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
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
  }

  // Indikator mengetik
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
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
  }

  async function sendMessage(message) {
    if (busy) return; // cegah spam klik
    const text = (message ?? userInput.value).trim();
    if (!text) return;

    busy = true;
    userInput.disabled = true;
    sendButton.style.display = "none";
    stopButton.style.display = "block";

    // tampilkan pesan user
    addMessage(text, "user");
    userInput.value = "";

    // indikator mengetik
    const typingIndicator = addTypingIndicator();

    try {
      currentAbortController = new AbortController();

      // panggil API
      const botResponse = await window.chatbotAPI.sendToOpenRouter(
        text,
        currentAbortController.signal
      );

      // hapus indikator
      typingIndicator.remove();

      // tampilkan bot message dengan animasi ketik
      const botMessageDiv = addMessage("", "bot");
      const messageText = botMessageDiv.querySelector("p");

      currentStopTyping = window.chatbotAPI.typeMessageWithStop(
        messageText,
        botResponse,
        () => {
          stopButton.style.display = "none";
          sendButton.style.display = "block";
          userInput.disabled = false;
          busy = false;
          userInput.focus();
          currentAbortController = null;
          currentStopTyping = null;
        }
      );
    } catch (error) {
      console.error("Error:", error);
      typingIndicator.remove();

      if (error?.name === "AbortError") {
        addMessage("Pesan dihentikan.", "bot");
      } else {
        addMessage("Maaf, terjadi kesalahan. Silakan coba lagi.", "bot");
      }

      stopButton.style.display = "none";
      sendButton.style.display = "block";
      userInput.disabled = false;
      busy = false;
      userInput.focus();
      currentAbortController = null;
      currentStopTyping = null;
    }
  }

  // Kirim via submit (klik kirim/Enter)
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });

  // Enter pada input: gunakan keydown agar lintas browser konsisten
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
