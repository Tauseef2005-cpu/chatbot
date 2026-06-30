"""
NEXUS AI - 100% FREE Multi-Modal Chatbot
Uses multiple free AI providers with automatic fallback:
  1. Google Gemini (free tier)
  2. DuckDuckGo AI Chat (free, no key)
  3. Pollinations.ai text (free, no key)
Image generation: Pollinations.ai (free, no key)
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import json
from datetime import datetime
from urllib.parse import quote

app = Flask(__name__)
CORS(app)

from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# Conversation memory
conversation_history = []

SYSTEM_PROMPT = """You are NEXUS — an ultra-intelligent AI assistant. You can:
- Answer any question with deep expertise
- Write, debug, and explain code in any language
- Analyze and explain concepts clearly
- Help with weather, news, creative writing, math, science, and more
Be concise, helpful, and use markdown formatting. Use ```language ... ``` fences for code."""


def call_gemini(messages_text):
    """Try Google Gemini API (free tier)."""
    if not GEMINI_API_KEY:
        print("[Gemini] Failed: GEMINI_API_KEY is missing from environment.")
        return None
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=messages_text,
        )
        return response.text
    except Exception as e:
        print(f"[Gemini] Failed: {e}")
        return None


def call_pollinations_text(messages_text):
    """Use Pollinations.ai text generation (100% free, no API key)."""
    try:
        payload = {
            "model": "openai",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": messages_text}
            ],
            "seed": 42
        }
        res = requests.post(
            "https://text.pollinations.ai/",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        res.raise_for_status()
        return res.text
    except Exception as e:
        print(f"[Pollinations] Failed: {e}")
        return None


def get_ai_response(user_message):
    """Try multiple free AI providers with automatic fallback."""
    # Provider 1: Gemini
    result = call_gemini(user_message)
    if result:
        return result, "Gemini 2.0 Flash"

    # Provider 2: Pollinations.ai text (free, no key)
    result = call_pollinations_text(user_message)
    if result:
        return result, "Pollinations AI"

    return None, None


# ─────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    conversation_history.append({"role": "user", "content": user_message})

    # Build context from recent messages
    context = "\n".join(
        f"{'User' if m['role']=='user' else 'Assistant'}: {m['content']}"
        for m in conversation_history[-10:]
    )

    reply, provider = get_ai_response(context)

    if reply:
        conversation_history.append({"role": "assistant", "content": reply})
        return jsonify({"reply": reply, "type": "chat", "provider": provider})
    else:
        if not GEMINI_API_KEY:
            return jsonify({
                "error": "GEMINI_API_KEY is not configured in the environment. Please set it in your .env file."
            }), 500
        return jsonify({
            "error": "All AI providers are currently unavailable. Please try again in a minute."
        }), 503


@app.route("/api/weather", methods=["POST"])
def weather():
    if not WEATHER_API_KEY:
        return jsonify({"error": "Weather API key is not configured. Please set WEATHER_API_KEY in your environment."}), 500

    data = request.json
    city = data.get("city", "").strip()
    if not city:
        return jsonify({"error": "City name required"}), 400

    try:
        res = requests.get(
            "http://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "appid": WEATHER_API_KEY, "units": "metric"},
            timeout=10
        )
        res.raise_for_status()
        wd = res.json()

        weather_info = {
            "city": wd["name"],
            "country": wd["sys"]["country"],
            "temp": round(wd["main"]["temp"]),
            "feels_like": round(wd["main"]["feels_like"]),
            "humidity": wd["main"]["humidity"],
            "description": wd["weather"][0]["description"].title(),
            "icon": wd["weather"][0]["icon"],
            "wind_speed": wd["wind"]["speed"],
            "visibility": wd.get("visibility", 0) // 1000,
            "pressure": wd["main"]["pressure"],
        }

        # AI summary (try free providers)
        summary_text, _ = get_ai_response(
            f"Give a friendly 2-sentence weather summary for: {json.dumps(weather_info)}"
        )
        weather_info["ai_summary"] = summary_text or (
            f"Currently {weather_info['description']} in {weather_info['city']} "
            f"at {weather_info['temp']}C with {weather_info['humidity']}% humidity."
        )

        return jsonify({"type": "weather", "data": weather_info})

    except requests.exceptions.HTTPError:
        return jsonify({"error": f"City '{city}' not found. Try another name."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/news", methods=["POST"])
def news():
    if not NEWS_API_KEY:
        return jsonify({"error": "News API key is not configured. Please set NEWS_API_KEY in your environment."}), 500

    data = request.json
    topic = data.get("topic", "technology").strip()

    try:
        res = requests.get(
            "https://newsapi.org/v2/everything",
            params={"q": topic, "apiKey": NEWS_API_KEY, "pageSize": 5,
                    "sortBy": "publishedAt", "language": "en"},
            timeout=10
        )
        res.raise_for_status()
        articles = res.json().get("articles", [])

        news_items = [
            {
                "title": a.get("title", "No title"),
                "source": a.get("source", {}).get("name", "Unknown"),
                "url": a.get("url", "#"),
                "published": a.get("publishedAt", "")[:10],
                "description": a.get("description", "")
            }
            for a in articles[:5]
        ]
        return jsonify({"type": "news", "topic": topic, "articles": news_items})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/image", methods=["POST"])
def generate_image():
    """100% FREE image generation via Pollinations.ai"""
    data = request.json
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400

    try:
        encoded_prompt = quote(prompt)
        image_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width=1024&height=1024&nologo=true&enhance=true&seed={hash(prompt) % 99999}"
        )
        return jsonify({"type": "image", "url": image_url, "prompt": prompt})

    except Exception as e:
        return jsonify({"error": f"Image generation failed: {str(e)}"}), 500


@app.route("/api/code", methods=["POST"])
def code_assistant():
    data = request.json
    task = data.get("task", "").strip()
    language = data.get("language", "python").strip()
    if not task:
        return jsonify({"error": "Task required"}), 400

    code_prompt = (
        f"You are an expert {language} developer. "
        f"Write clean, well-commented, production-ready code. "
        f"Use markdown code fences with the language name. "
        f"Explain briefly after the code block.\n\nTask: {task}"
    )

    reply, provider = get_ai_response(code_prompt)
    if reply:
        return jsonify({"type": "code", "reply": reply, "language": language})
    else:
        if not GEMINI_API_KEY:
            return jsonify({
                "error": "GEMINI_API_KEY is not configured in the environment. Please set it in your .env file."
            }), 500
        return jsonify({"error": "AI providers unavailable. Try again in a minute."}), 503


@app.route("/api/clear", methods=["POST"])
def clear_history():
    global conversation_history
    conversation_history = []
    return jsonify({"status": "cleared"})


if __name__ == "__main__":
    print("=" * 50)
    print("  NEXUS AI - 100% FREE Multi-Modal Chatbot")
    print("  Chat:  Gemini -> Pollinations (fallback)")
    print("  Image: Pollinations.ai (no key needed)")
    print("=" * 50)
    print("Starting on http://localhost:5000")
    app.run(debug=True, port=5000)
