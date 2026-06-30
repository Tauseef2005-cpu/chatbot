const API = "/api";
let currentMode = "chat";
let conversationHistory = []; // Track user's session history in memory (UI display)

// Generate Background Particles dynamically
window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("particles");
  const colors = ["#00d4ff", "#a855f7", "#ff2d78"];
  
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 3 + 2; // 2px to 5px
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = `${Math.random() * 100}vw`;
    p.style.animationDuration = `${Math.random() * 15 + 10}s`; // 10s to 25s
    p.style.animationDelay = `${Math.random() * -20}s`; // Stagger start
    container.appendChild(p);
  }

  // Magnetic Cursor Glow following mouse (Effect 2)
  const glow = document.createElement("div");
  glow.id = "magnetic-glow";
  document.body.appendChild(glow);

  document.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
    glow.style.opacity = "1";
  });

  document.addEventListener("mouseleave", () => {
    glow.style.opacity = "0";
  });
});

// Toggle Mobile Sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open");
}

// Close Sidebar on mobile when clicking mode
function closeSidebarIfMobile() {
  if (window.innerWidth <= 768) {
    document.getElementById("sidebar").classList.remove("open");
  }
}

// Set Mode function
function setMode(mode) {
  currentMode = mode;
  
  // Update sidebar state
  document.querySelectorAll(".mode-btn[data-mode]").forEach(btn => {
    btn.classList.remove("active");
  });
  const activeBtn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  // Show/hide correct mode panel
  document.querySelectorAll(".mode-panel").forEach(panel => {
    panel.classList.remove("visible");
  });
  const activePanel = document.getElementById(`panel-${mode}`);
  if (activePanel) activePanel.classList.add("visible");

  // Update text input placeholder
  const txt = document.getElementById("chat-input");
  const placeholders = {
    chat: "Ask NEXUS anything...",
    weather: "Ask about weather or enter a city above...",
    news: "Ask about news or enter a topic above...",
    image: "Describe what you want to generate...",
    code: "Describe the coding task..."
  };
  txt.placeholder = placeholders[mode] || "Ask NEXUS anything...";
  closeSidebarIfMobile();
}

// Shortcut quick prompt
function quickPrompt(text) {
  setMode("chat");
  document.getElementById("chat-input").value = text;
  send();
}

// Enter to Send key handler
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

// Auto resize text area
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
}

// Show custom toast notification
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `⚠️ <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Helper functions for parsing content
function addMessage(role, content) {
  // Hide welcome screen
  const welcome = document.getElementById("welcome");
  if (welcome) welcome.style.display = "none";

  const msgs = document.getElementById("messages");
  
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${role}`;

  const avatar = document.createElement("div");
  avatar.className = `avatar ${role}`;
  avatar.textContent = role === "ai" ? "⚡" : "👤";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (content instanceof HTMLElement) {
    bubble.appendChild(content);
  } else {
    // Parse Markdown using marked.js
    bubble.innerHTML = marked.parse(content);
    
    // Post-process code blocks
    bubble.querySelectorAll("pre").forEach(pre => {
      pre.style.position = "relative";
      const code = pre.querySelector("code");
      if (code) {
        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.textContent = "copy";
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(code.textContent).then(() => {
            btn.textContent = "copied!";
            setTimeout(() => { btn.textContent = "copy"; }, 1500);
          });
        });
        pre.appendChild(btn);
        hljs.highlightElement(code);
      }
    });
  }

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  msgs.appendChild(msgDiv);

  // Auto scroll
  msgs.scrollTo({
    top: msgs.scrollHeight,
    behavior: "smooth"
  });

  return bubble;
}

// Typing indicator
function addTyping() {
  removeTyping();
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "msg ai";
  div.id = "typing-indicator";

  const avatar = document.createElement("div");
  avatar.className = "avatar ai";
  avatar.textContent = "⚡";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing-indicator-container";
  bubble.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;

  div.appendChild(avatar);
  div.appendChild(bubble);
  msgs.appendChild(div);

  msgs.scrollTo({
    top: msgs.scrollHeight,
    behavior: "smooth"
  });
}

// Remove typing indicator
function removeTyping() {
  document.getElementById("typing-indicator")?.remove();
}

// Build Weather Response Card
function buildWeatherCard(data) {
  const card = document.createElement("div");
  card.className = "weather-card";
  
  const iconUrl = data.icon ? `https://openweathermap.org/img/wn/${data.icon}@2x.png` : "";

  card.innerHTML = `
    <div class="weather-top">
      <div>
        <div class="weather-city">${data.city}, ${data.country}</div>
        <div class="weather-desc">${data.description}</div>
      </div>
      <div class="weather-temp-wrap">
        ${iconUrl ? `<img class="weather-icon" src="${iconUrl}" />` : ""}
        <div class="weather-temp">${data.temp}°C</div>
      </div>
    </div>
    <div class="weather-grid">
      <div class="weather-stat">
        <div class="val">${data.feels_like}°C</div>
        <div class="key">Feels Like</div>
      </div>
      <div class="weather-stat">
        <div class="val">${data.humidity}%</div>
        <div class="key">Humidity</div>
      </div>
      <div class="weather-stat">
        <div class="val">${data.wind_speed} m/s</div>
        <div class="key">Wind</div>
      </div>
      <div class="weather-stat">
        <div class="val">${data.visibility} km</div>
        <div class="key">Visibility</div>
      </div>
    </div>
    ${data.ai_summary ? `<div class="weather-summary">💬 <i>${data.ai_summary}</i></div>` : ""}
  `;
  return card;
}

// Build News Response Cards
function buildNewsCard(topic, articles) {
  const container = document.createElement("div");
  container.className = "news-container";

  const header = document.createElement("div");
  header.className = "news-header";
  header.textContent = `📡 LIVE — ${topic.toUpperCase()}`;
  container.appendChild(header);

  if (!articles || articles.length === 0) {
    const fallback = document.createElement("p");
    fallback.style.color = "var(--muted)";
    fallback.textContent = "No recent headlines found for this topic.";
    container.appendChild(fallback);
    return container;
  }

  articles.forEach(art => {
    const item = document.createElement("a");
    item.className = "news-card-item";
    item.href = art.url;
    item.target = "_blank";
    item.innerHTML = `
      <div class="news-item-title">${art.title}</div>
      <div class="news-item-meta">${art.source} • ${art.published}</div>
      <div class="news-item-desc">${art.description || ""}</div>
    `;
    container.appendChild(item);
  });

  return container;
}

// Clear Chat
function clearChat() {
  const msgs = document.getElementById("messages");
  msgs.innerHTML = "";
  
  const welcome = document.createElement("div");
  welcome.id = "welcome";
  welcome.className = "welcome-panel";
  welcome.innerHTML = `
    <div class="welcome-title holographic-shimmer">NEXUS AI</div>
    <p class="welcome-subtitle">Session cleared. Choose a mode below or begin chatting.</p>
    <div class="quick-chips-wrap">
      <button class="chip-btn" onclick="quickPrompt('What can you do?')">✨ What can you do?</button>
      <button class="chip-btn" onclick="quickPrompt('Write a Python web scraper')">🐍 Python code</button>
      <button class="chip-btn" onclick="setMode('weather')">🌤 Check weather</button>
      <button class="chip-btn" onclick="setMode('news')">📰 Latest news</button>
      <button class="chip-btn" onclick="setMode('image')">🎨 Generate image</button>
      <button class="chip-btn" onclick="quickPrompt('Explain transformers in AI')">🤖 Explain AI</button>
    </div>
  `;
  msgs.appendChild(welcome);

  fetch(`${API}/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }).catch(err => console.error("Error calling server clear:", err));
}

// Send logic choosing endpoint + body
async function send() {
  const mainInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const text = mainInput.value.trim();

  let endpoint = "/chat";
  let body = {};

  if (currentMode === "weather") {
    const city = document.getElementById("weather-city").value.trim();
    const citySearch = city || text;
    if (!citySearch) {
      showToast("Please enter a city name in the input field above.");
      return;
    }
    endpoint = "/weather";
    body = { city: citySearch };
    
    // Append visual user message
    addMessage("user", `🌦 Weather request for: **${citySearch}**`);
    document.getElementById("weather-city").value = "";
  } 
  else if (currentMode === "news") {
    const topic = document.getElementById("news-topic").value.trim();
    const topicSearch = topic || text || "technology";
    endpoint = "/news";
    body = { topic: topicSearch };

    addMessage("user", `📡 Requesting headlines for: **${topicSearch}**`);
    document.getElementById("news-topic").value = "";
  } 
  else if (currentMode === "image") {
    const promptVal = document.getElementById("image-prompt").value.trim();
    const promptSearch = promptVal || text;
    if (!promptSearch) {
      showToast("Please write a detailed prompt describing the image.");
      return;
    }
    endpoint = "/image";
    body = { prompt: promptSearch };

    addMessage("user", `🎨 Generating image for: *${promptSearch}*`);
    document.getElementById("image-prompt").value = "";
  } 
  else if (currentMode === "code") {
    if (!text) {
      showToast("Please describe the code block or task you need help with.");
      return;
    }
    const lang = document.getElementById("code-lang").value;
    endpoint = "/code";
    body = { task: text, language: lang };

    addMessage("user", `⚙️ [${lang.toUpperCase()}] ${text}`);
  } 
  else {
    // Chat mode
    if (!text) return;
    endpoint = "/chat";
    body = { message: text };

    addMessage("user", text);
  }

  // Reset main input textarea
  mainInput.value = "";
  mainInput.style.height = "auto";

  // Disable inputs during processing
  sendBtn.disabled = true;
  addTyping();

  try {
    const response = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    removeTyping();

    if (data.error) {
      showToast(data.error);
      return;
    }

    if (data.type === "weather") {
      addMessage("ai", buildWeatherCard(data.data));
    } 
    else if (data.type === "news") {
      addMessage("ai", buildNewsCard(data.topic, data.articles));
    } 
    else if (data.type === "image") {
      const wrapper = document.createElement("div");
      wrapper.className = "image-result-wrap";
      
      const img = document.createElement("img");
      img.src = data.url;
      img.className = "gen-image";
      img.alt = data.prompt;
      
      const caption = document.createElement("div");
      caption.className = "image-caption";
      caption.textContent = `✨ Generated by DALL·E 3`;

      wrapper.appendChild(img);
      wrapper.appendChild(caption);
      addMessage("ai", wrapper);
    } 
    else if (data.type === "code") {
      addMessage("ai", data.reply);
    } 
    else {
      addMessage("ai", data.reply || "Connection successful, but empty response.");
    }

  } catch (error) {
    removeTyping();
    showToast("Backend connection failed. Ensure server.py/app.py is running on port 5000.");
    console.error("Fetch Error:", error);
  } finally {
    sendBtn.disabled = false;
  }
}
