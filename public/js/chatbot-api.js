// Configuration
const OPENROUTER_API_KEY =
  ""; // Replace with your actual API key
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Chat history to maintain context
let chatHistory = [];

// Bontang city information for context
const bontangContext = `
Kota Bontang adalah kota di provinsi Kalimantan Timur, Indonesia. 
Beberapa informasi penting tentang Bontang:
- Bontang adalah kota industri yang terkenal dengan industri gas dan pupuk
- Memiliki luas wilayah sekitar 497,57 km²
- Terdiri dari 3 kecamatan: Bontang Utara, Bontang Selatan, dan Bontang Barat
- Memiliki populasi sekitar 170.000 jiwa
- Merupakan kota dengan status kota administratif
- Memiliki pelabuhan yang penting untuk ekspor gas dan pupuk
- Memiliki beberapa destinasi wisata seperti Pantai Beras Basah dan Taman Kota
- Memiliki sistem informasi geografis (SIG) yang dikelola melalui PetaKita
`;

// Function to send message to Gemini API
async function sendToOpenRouter(message) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "PetaKita Assistant",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: `Anda adalah asisten PetaKita yang khusus membantu pengguna dengan informasi tentang Kota Bontang, Kalimantan Timur.                      
                        Fokus utama Anda adalah memberikan informasi tentang:
                        1. Data spasial dan peta Kota Bontang
                        2. Informasi geografis dan demografis Bontang
                        3. Layanan PetaKita untuk data spasial Bontang
                        4. Informasi tentang kecamatan, kelurahan, dan wilayah administratif Bontang
                        5. Potensi wisata dan lokasi penting di Bontang

                        Jika pengguna menanyakan informasi di luar topik Bontang, mohon arahkan kembali ke topik Bontang atau informasikan bahwa Anda hanya dapat membantu dengan informasi seputar Bontang.

${bontangContext}`,
          },
          ...chatHistory,
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    // Update chat history
    chatHistory.push(
      { role: "user", content: message },
      { role: "assistant", content: botResponse }
    );

    return botResponse;
  } catch (error) {
    console.error("Error:", error);
    return "Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi nanti.";
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

// Export functions for use in main chatbot.js
window.chatbotAPI = {
  sendToOpenRouter,
  typeMessage,
};
