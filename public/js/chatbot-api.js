// Function to send message to the Laravel backend (which handles OpenRouter API call)
// Initialize chat history from localStorage or as an empty array
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

// Function to send message to the Laravel backend (which handles OpenRouter API call)
async function sendToOpenRouter(message, signal) {
  try {
    const response = await fetch('http://localhost/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message, // Send user message to the backend
      }),
      signal: signal, // Allow for request abortion
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    const botResponse = data.response;

    // Update chat history
    chatHistory.push(
      { role: "user", content: message },
      { role: "assistant", content: botResponse }
    );

    // Store the updated chat history in localStorage
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

    return botResponse;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error; // Re-throw abort errors to handle them in the UI
    }
    console.error("Error:", error);
    return "Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi nanti."; // Display friendly error message
  }
}


// Function to handle typing animation
function typeMessage(element, text, callback) {
  let i = 0;
  element.textContent = "";

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, 30);
    } else if (callback) {
      callback();
    }
  }

  type();
}

// Function to handle typing animation with stop capability
function typeMessageWithStop(element, text, callback) {
  let i = 0;
  element.textContent = "";
  let isStopped = false;
  
  function type() {
    if (isStopped) return;
    
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, 30);
    } else if (callback) {
      callback();
    }
  }
  
  type();
  
  // Return a function to stop the typing animation
  return function stopTyping() {
    isStopped = true;
    if (element.textContent.length < text.length) {
      element.textContent += "...";
    }
    if (callback) {
      callback();
    }
  };
}

// Export functions for use in main chatbot.js
window.chatbotAPI = {
  sendToOpenRouter,
  typeMessage,
  typeMessageWithStop,
};
