// ===== GEMINI API-NYCKEL =====
const GEMINI_API_KEY = "DIN_API_NYCKEL_HÄR";

// ===== HÄMTA ELEMENT =====
const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const transcript = document.getElementById("transcript");
const summarizeBtn = document.getElementById("summarizeBtn");
const summary = document.getElementById("summary");

// ===== VARIABLER =====
let recognition;
let isRecording = false;
let fullTranscript = "";

// ===== STARTA RÖSTINSPELNING =====
if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
        }
        transcript.textContent = text;
        fullTranscript = text;
    };

    recognition.onerror = (event) => {
        statusText.textContent = "❌ Fel: " + event.error;
    };

    recognition.onend = () => {
        if (isRecording) {
            recognition.start();
        }
    };
} else {
    statusText.textContent = "❌ Använd Chrome! Din webbläsare stöder inte röstinspelning.";
}

// ===== KLICK PÅ INSPELNINGSKNAPPEN =====
recordBtn.addEventListener("click", () => {
    if (!isRecording) {
        fullTranscript = "";
        transcript.textContent = "Lyssnar...";
        recognition.start();
        isRecording = true;
        recordBtn.classList.add("recording");
        statusText.textContent = "🔴 Spelar in... Tryck för att stoppa";
    } else {
        recognition.stop();
        isRecording = false;
        recordBtn.classList.remove("recording");
        statusText.textContent = "✅ Inspelning klar!";
        if (fullTranscript.length > 0) {
            summarizeBtn.disabled = false;
        }
    }
});

// ===== SAMMANFATTA MED GEMINI =====
summarizeBtn.addEventListener("click", async () => {
    if (!fullTranscript) return;

    summary.textContent = "⏳ Sammanfattar...";
    summarizeBtn.disabled = true;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Du är en hjälpsam assistent. Sammanfatta följande text till tydliga och korta punkter på svenska. Gör det enkelt att förstå.\n\nText:\n"${fullTranscript}"`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (data.candidates && data.candidates[0]) {
            const aiText = data.candidates[0].content.parts[0].text;
            summary.textContent = aiText;
        } else {
            summary.textContent = "❌ Inget svar från Gemini. Kolla din API-nyckel.";
        }
    } catch (error) {
        summary.textContent = "❌ Något gick fel: " + error.message;
        console.error(error);
    }
});