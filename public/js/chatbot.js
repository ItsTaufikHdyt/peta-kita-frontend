document.addEventListener("DOMContentLoaded", function () {
  const chatToggle = document.getElementById("chat-toggle");
  const chatClose = document.getElementById("chat-close");
  const chatbot = document.getElementById("chatbot");
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-message");
  const stopButton = document.getElementById("stop-message");
  
  let currentAbortController = null;
  let currentStopTyping = null;

  // Toggle chatbot
  chatToggle.addEventListener("click", function (e) {
    e.preventDefault();
    chatbot.classList.add("active");
  });

  // Close chatbot
  chatClose.addEventListener("click", function () {
    chatbot.classList.remove("active");
  });

  // Stop generation function
  function stopGeneration() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    
    if (currentStopTyping) {
      currentStopTyping();
      currentStopTyping = null;
    }
    
    // Hide stop button and show send button
    stopButton.style.display = "none";
    sendButton.style.display = "block";
    
    // Enable input
    userInput.disabled = false;
    userInput.focus();
  }

  // Send message function
  async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
      // Disable input while processing
      userInput.disabled = true;
      sendButton.style.display = "none";
      stopButton.style.display = "block";
      
      // Add user message
      addMessage(message, "user");
      userInput.value = "";

      // Show typing indicator
      const typingIndicator = addTypingIndicator();

      try {
        // Create new AbortController for this request
        currentAbortController = new AbortController();
        
        // Get response from OpenRouter API
        const botResponse = await window.chatbotAPI.sendToOpenRouter(message, currentAbortController.signal);

        // Remove typing indicator
        typingIndicator.remove();

        // Add bot message with typing animation
        const botMessageDiv = addMessage("", "bot");
        const messageText = botMessageDiv.querySelector("p");
        
        // Start typing animation with stop capability
        currentStopTyping = window.chatbotAPI.typeMessageWithStop(messageText, botResponse, () => {
          // Animation complete callback
          stopButton.style.display = "none";
          sendButton.style.display = "block";
          userInput.disabled = false;
          userInput.focus();
          
          // Clear current controllers
          currentAbortController = null;
          currentStopTyping = null;
        });
      } catch (error) {
        console.error("Error:", error);
        typingIndicator.remove();
        
        if (error.name === 'AbortError') {
          addMessage("Pesan dihentikan.", "bot");
        } else {
          addMessage("Maaf, terjadi kesalahan. Silakan coba lagi.", "bot");
        }
        
        // Reset state
        stopButton.style.display = "none";
        sendButton.style.display = "block";
        userInput.disabled = false;
        userInput.focus();
        
        // Clear current controllers
        currentAbortController = null;
        currentStopTyping = null;
      }
    }
  }

  // Add typing indicator
  function addTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message typing-indicator";
    typingDiv.innerHTML = `
      <div class="message-content">
        <i class="fas fa-robot"></i>
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
  }

  // Add message to chat
  function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (sender === "bot") {
      const icon = document.createElement("i");
      icon.className = "fas fa-robot";
      contentDiv.appendChild(icon);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    contentDiv.appendChild(paragraph);

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
  }

  // Send message on button click
  sendButton.addEventListener("click", sendMessage);

  // Stop generation on stop button click
  stopButton.addEventListener("click", stopGeneration);

  // Send message on Enter key
  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});
