import React, { useState, useEffect, useRef } from 'react';
import './App.css';

if (process.env.REACT_APP_OPENAI_API_KEY && !window.OPENAI_API_KEY) {
    window.OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
}

// PUBLIC_INTERFACE
/**
 * Character profiles config: Add more as desired
 */
const CHARACTERS = [
  {
    id: 'sherlock_holmes',
    name: 'Sherlock Holmes',
    bio: 'The legendary consulting detective from Baker Street, known for his sharp wit and deductive reasoning.',
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Paget_holmes.png',
    theme: {
      primary: '#4B0082',
      secondary: '#8A2BE2',
      accent: '#FFD700',
      background: '#F4F1FB',
      bubbleUser: '#4B0082',
      bubbleBot: '#E2DEEF',
      text: '#221142',
      headerBar: '#4B0082',
      headerText: '#FFD700',
    },
    prompt: 'You are Sherlock Holmes, the master detective. Respond with sharp, logical analysis and a hint of British wit.',
    tts_voice: 'en-GB',
  },
  {
    id: 'dracula',
    name: 'Count Dracula',
    bio: 'The infamous vampire count from Transylvania. Mysterious, aristocratic, and alluringly sinister.',
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Dracula_1897_edition_cover.png',
    theme: {
      primary: '#4B0082',
      secondary: '#8A2BE2',
      accent: '#FFD700',
      background: '#18152a',
      bubbleUser: '#8A2BE2',
      bubbleBot: '#342353',
      text: '#FFD700',
      headerBar: '#18152a',
      headerText: '#FFD700',
    },
    prompt: 'You are Count Dracula. Respond elegantly, with old-world charm and subtle menace.',
    tts_voice: 'en-GB',
  },
  {
    id: 'elizabeth_bennet',
    name: 'Elizabeth Bennet',
    bio: 'The witty, independent heroine of "Pride and Prejudice." Clever, thoughtful, and unfailingly polite.',
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Elizabeth_Bennet.png',
    theme: {
      primary: '#8A2BE2',
      secondary: '#4B0082',
      accent: '#FFD700',
      background: '#FDF6ED',
      bubbleUser: '#FFD700',
      bubbleBot: '#fff',
      text: '#4B0082',
      headerBar: '#FDF6ED',
      headerText: '#8A2BE2',
    },
    prompt: 'You are Elizabeth Bennet, intelligent and spirited. Respond with wit and Regency-era manners.',
    tts_voice: 'en-GB',
  },
];

/**
 * Helper for dark/lighter style detection
 */
function isColorDark(hexColor) {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '');
  const bigint = parseInt(hex, 16);
  // Formula: 0.2126*R + 0.7152*G + 0.0722*B
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 140;
}

/**
 * Main LiteraryChatBot App
 */
// PUBLIC_INTERFACE
function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [chat, setChat] = useState([
    {
      sender: selectedChar.name,
      text: `Greetings, I am ${selectedChar.name}. ${selectedChar.bio}`,
      isBot: true,
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, selectedChar]);

  // Reset chat when character changes
  useEffect(() => {
    setChat([
      {
        sender: selectedChar.name,
        text: `Greetings, I am ${selectedChar.name}. ${selectedChar.bio}`,
        isBot: true,
      },
    ]);
    setUserInput('');
  }, [selectedChar]);

  // TTS: Play last bot message when enabled
  useEffect(() => {
    if (
      ttsEnabled &&
      chat.length > 0 &&
      chat[chat.length - 1].isBot
    ) {
      speakText(chat[chat.length - 1].text, selectedChar.tts_voice);
    }
    // eslint-disable-next-line
  }, [chat, ttsEnabled, selectedChar]);

  // PUBLIC_INTERFACE
  function handleCharacterSelect(charId) {
    const found = CHARACTERS.find((c) => c.id === charId);
    if (found) setSelectedChar(found);
  }

  // PUBLIC_INTERFACE
  async function handleSendMessage(e) {
    if (e) e.preventDefault();
    const message = userInput.trim();
    if (!message) return;
    const userMsg = { sender: 'You', text: message, isBot: false };
    setChat((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);
    try {
      const botReply = await fetchOpenAIReply(selectedChar, [
        ...chat.map((m) => ({
          role: m.isBot ? "assistant" : "user",
          content: m.text,
        })),
        {
          role: "user",
          content: message,
        },
      ]);
      setChat((prev) => [
        ...prev,
        { sender: selectedChar.name, text: botReply, isBot: true },
      ]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        {
          sender: selectedChar.name,
          text: 'Sorry, I could not fetch a response at this time.',
          isBot: true,
        },
      ]);
    }
    setIsLoading(false);
  }

  // PUBLIC_INTERFACE
  function handleInputChange(e) {
    setUserInput(e.target.value)
  }

  // PUBLIC_INTERFACE
  function handleTtsToggle() {
    setTtsEnabled((p) => !p);
  }

  // PUBLIC_INTERFACE
  function speakText(text, langHint) {
    if (window.speechSynthesis) {
      const utter = new window.SpeechSynthesisUtterance(text);
      // Try to select matching voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang?.startsWith(langHint));
      if (preferred) utter.voice = preferred;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  }

  // PUBLIC_INTERFACE
  async function fetchOpenAIReply(character, fullMessages) {
    // For demo: expects window.OPENAI_API_KEY to be set! (Or swap with a backend/proxy if present in prod.)
    // Otherwise, swap this function with a backend endpoint as needed.
    //
    // Set your API KEY: window.OPENAI_API_KEY = "<YOUR_API_KEY_HERE>";
    const OPENAI_API_KEY = window.OPENAI_API_KEY || "";
    const endpoint = "https://api.openai.com/v1/chat/completions";
    const promptSystem = character.prompt;
    const messages = [
      { role: "system", content: promptSystem },
      ...fullMessages,
    ];

    const body = {
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 160,
      temperature: 0.85,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }
    const data = await response.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  }

  // Dynamic theme: Apply style vars based on selected char theme
  useEffect(() => {
    const theming = selectedChar.theme;
    if (!theming) return;
    const root = document.documentElement;
    root.style.setProperty('--cb-primary', theming.primary);
    root.style.setProperty('--cb-secondary', theming.secondary);
    root.style.setProperty('--cb-accent', theming.accent);
    root.style.setProperty('--cb-bg', theming.background);
    root.style.setProperty('--cb-bubble-user', theming.bubbleUser);
    root.style.setProperty('--cb-bubble-bot', theming.bubbleBot);
    root.style.setProperty('--cb-text', theming.text);
    root.style.setProperty('--cb-header-bar', theming.headerBar);
    root.style.setProperty('--cb-header-text', theming.headerText);
  }, [selectedChar]);


  return (
    <div className="app" style={{ background: 'var(--cb-bg, #fff)', color: 'var(--cb-text, #444)' }}>
      {/* Header Bar */}
      <nav
        className="navbar"
        style={{
          background: 'var(--cb-header-bar, #fff)',
          color: 'var(--cb-header-text, #4B0082)',
          borderBottom: '2px solid var(--cb-secondary, #8A2BE2)',
          position: 'sticky',
          top: 0,
        }}
      >
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo" style={{
              color: 'var(--cb-header-text, #FFD700)',
              fontWeight: 700,
              fontFamily: 'serif',
            }}>
              <span className="logo-symbol" style={{ color: 'var(--cb-accent, #FFD700)', fontWeight: 900, marginRight: 4 }}>✍️</span>
              LiteraryChatBot
            </div>
            <div>
              <button
                className="btn"
                style={{
                  background: ttsEnabled ? 'var(--cb-accent, #FFD700)' : 'var(--cb-secondary, #8A2BE2)',
                  color: ttsEnabled ? '#333' : '#fff',
                  fontWeight: 500,
                  marginRight: 6,
                  transition: 'background 0.16s',
                }}
                onClick={handleTtsToggle}
                title="Enable or disable text-to-speech for bot replies"
              >
                {ttsEnabled ? "🔊 TTS On" : "🔈 TTS Off"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Character Selector and Profile */}
        <div className="container" style={{ paddingTop: 32, maxWidth: 980 }}>
          <section className="character-select" style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1.2rem',
            marginTop: 18,
            marginBottom: 34,
            background: 'rgba(255,255,255,0.09)',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 3px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontWeight: 600, fontSize: '1.07rem', marginRight: 14, color: 'var(--cb-secondary, #8A2BE2)' }}>
              Choose a Literary Character:
            </div>
            <div style={{ display: 'flex', gap: 17 }}>
              {CHARACTERS.map((ch) => (
                <button
                  className="btn"
                  key={ch.id}
                  style={{
                    background: selectedChar.id === ch.id ? 'var(--cb-primary, #4B0082)' : 'var(--cb-secondary, #8A2BE2)',
                    color: selectedChar.id === ch.id ? '#FFD700' : '#fff',
                    fontWeight: selectedChar.id === ch.id ? 700 : 500,
                    outline: selectedChar.id === ch.id ? '3px solid var(--cb-accent, #FFD700)' : '',
                    minWidth: 110,
                  }}
                  onClick={() => handleCharacterSelect(ch.id)}
                >
                  {ch.name}
                </button>
              ))}
            </div>
          </section>
          
          <section
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 24,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            {/* Character Portrait and Bio */}
            <div
              style={{
                flex: '0 0 140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 8,
              }}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                src={selectedChar.portrait}
                style={{
                  width: 90,
                  height: 110,
                  objectFit: 'cover',
                  borderRadius: 11,
                  border: '2.5px solid var(--cb-primary, #4B0082)',
                  marginBottom: 14,
                  boxShadow: '0 2px 9px rgba(0,0,0,0.08)',
                  background: '#fff'
                }}
                alt={`${selectedChar.name} portrait`}
              />
              <div style={{
                textAlign: "center",
                fontWeight: 600,
                color: 'var(--cb-primary, #4B0082)'
              }}>{selectedChar.name}</div>
              <div style={{
                color: 'var(--cb-secondary, #8A2BE2)',
                fontSize: '.96em',
                marginTop: 5,
              }}>{selectedChar.bio}</div>
            </div>

            {/* Chat UI */}
            <div
              style={{
                flex: '1 1 410px',
                background: 'rgba(255,255,255,0.13)',
                borderRadius: 14,
                boxShadow: '0 4px 24px rgba(0,0,0,0.051)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 330,
                maxHeight: 510,
                height: 430,
                padding: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: 19,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 11,
                  background: 'var(--cb-bg, #fff)',
                }}
              >
                {chat.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.isBot ? 'flex-start' : 'flex-end',
                      display: 'flex',
                      flexDirection: msg.isBot ? 'row' : 'row-reverse',
                      alignItems: 'flex-end',
                      gap: 9,
                    }}
                  >
                    {/* Only bot message gets image */}
                    {msg.isBot && (
                      <img
                        src={selectedChar.portrait}
                        alt={`${selectedChar.name} avatar`}
                        style={{
                          width: 31,
                          height: 38,
                          objectFit: 'cover',
                          borderRadius: 8,
                          background: '#fff',
                          border: '1.5px solid var(--cb-primary, #4B0082)',
                          marginBottom: 3,
                        }}
                      />
                    )}
                    <div
                      style={{
                        padding: '11.5px 14px',
                        borderRadius: 12,
                        background: msg.isBot
                          ? 'var(--cb-bubble-bot, #E2DEEF)'
                          : 'var(--cb-bubble-user, #4B0082)',
                        color: msg.isBot
                          ? (isColorDark(selectedChar.theme.bubbleBot)
                              ? '#FFD700'
                              : selectedChar.theme.text)
                          : '#fff',
                        maxWidth: 300,
                        fontSize: '1.02rem',
                        boxShadow: msg.isBot
                          ? '0 0 6px rgba(75,0,130,0.09)'
                          : '0 2px 14px rgba(75,0,130,0.07)',
                        textAlign: 'left',
                        wordBreak: 'break-word',
                        borderBottomLeftRadius: msg.isBot ? 5 : 15,
                        borderBottomRightRadius: msg.isBot ? 12 : 5,
                        marginLeft: msg.isBot ? 0 : 22,
                        marginRight: msg.isBot ? 22 : 0,
                        letterSpacing: '.005em'
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {/* For scroll anchor */}
                <div ref={chatEndRef}></div>
              </div>
              {/* Input Box */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: 11,
                  borderTop: '2.5px solid var(--cb-secondary, #8A2BE2)',
                  background: 'var(--cb-bg, #fff)',
                }}
              >
                <input
                  type="text"
                  value={userInput}
                  onChange={handleInputChange}
                  placeholder={`Type your message to ${selectedChar.name}...`}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    fontSize: '1.05rem',
                    padding: '10px 13px',
                    borderRadius: 7,
                    border: '1px solid var(--cb-secondary, #8A2BE2)',
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--cb-primary, #4B0082)',
                    fontWeight: 500,
                  }}
                  autoFocus
                  autoComplete="off"
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: isLoading
                      ? '#aaa'
                      : 'var(--cb-accent, #FFD700)',
                    color: isLoading
                      ? '#fff'
                      : (isColorDark(selectedChar.theme.accent)
                          ? '#fff'
                          : '#4B0082'),
                    fontWeight: 600,
                    minWidth: 77,
                  }}
                >
                  {isLoading ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </section>
          {/* Explanation/Tip Footer */}
          <div
            style={{
              textAlign: 'right',
              fontSize: '.93em',
              color: 'var(--cb-secondary, #8A2BE2)',
              opacity: 0.88,
              marginTop: 24,
              marginBottom: 36,
            }}
          >
            Tip: {selectedChar.name} will respond in-character, powered by OpenAI 🪄
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;