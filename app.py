import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from google import genai

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# Gemini Client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY environment variable is not set!")
    client = None
else:
    client = genai.Client(api_key=api_key)

# --- Frontend Routes ---
@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(".", path)

# --- AI Assistant Endpoint ---
@app.route("/api/ai-assistant", methods=["POST"])
def ai_assistant():
    if not client:
        return jsonify({"success": False, "error": "Gemini API key not configured."}), 500

    data = request.json or {}
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"success": False, "error": "No query provided."}), 400

    system_prompt = (
        "You are Noor, a helpful and knowledgeable assistant for Muslims planning their Umrah journey. "
        "Answer questions about travel logistics, spiritual practices, hotels, flights, visa requirements, "
        "and cultural tips for Makkah and Madinah. Keep responses warm, respectful, and practical. "
        "If the question is off-topic, politely redirect to Umrah-related topics."
    )

    prompt = f"{system_prompt}\n\nUser question: {query}"

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return jsonify({"success": True, "response": response.text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
