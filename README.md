# ⚡ NEXUS AI — Multi-Modal Chatbot

A powerful AI chatbot with **Chat, Weather, News, Image Generation, and Code** features.
Built with Python (Flask) + OpenAI GPT-4 + beautiful Glassmorphism UI.

---

## 🚀 Setup in 3 Steps

### Step 1 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 2 — Add your API Keys
Open `app.py` and replace these 3 lines:

```python
OPENAI_API_KEY  = "sk-YOUR_OPENAI_API_KEY"       # platform.openai.com
WEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY"      # openweathermap.org/api (free)
NEWS_API_KEY    = "YOUR_NEWSAPI_KEY"              # newsapi.org (free)
```

### Step 3 — Run the server
```bash
python app.py
```

Open your browser → **http://localhost:5000**

---

## 🎯 Features

| Mode | What it does | API Used |
|------|-------------|----------|
| 💬 Chat | Full GPT-4 conversation with memory | OpenAI GPT-4o |
| 🌦 Weather | Real-time weather + AI summary | OpenWeatherMap + GPT |
| 📡 News | Latest headlines by topic | NewsAPI.org |
| 🎨 Image Gen | Text-to-image generation | DALL-E 3 |
| ⚙️ Code | Write & debug code in any language | GPT-4o |

---

## 🔑 Free API Keys

1. **OpenAI** → https://platform.openai.com/api-keys  
   (Paid — $5 credit is enough to start)

2. **OpenWeatherMap** → https://openweathermap.org/api  
   (Free tier: 60 calls/min)

3. **NewsAPI** → https://newsapi.org/register  
   (Free tier: 100 calls/day)

---

## 📁 Project Structure

```
nexus-ai/
├── app.py              ← Flask backend (all API logic)
├── requirements.txt    ← Python dependencies
├── templates/
│   └── index.html      ← Frontend UI (glassmorphism)
└── README.md
```

---

## 💡 Tips

- The chatbot remembers last 20 messages in the conversation
- Press **Enter** to send, **Shift+Enter** for new line
- Click **⟳ CLEAR** to reset conversation memory
- Switch modes using the left sidebar
