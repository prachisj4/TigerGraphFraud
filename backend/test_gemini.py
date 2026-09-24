import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-3.6-flash"


def test_gemini_connection():
    if not GEMINI_API_KEY:
        print("Gemini connection: FAILED")
        print("Reason: GEMINI_API_KEY missing in backend/.env")
        return False, "GEMINI_API_KEY missing in backend/.env"

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)
        res = client.models.generate_content(
            model=MODEL_NAME, contents="Ping connection test"
        )
        if res and res.text:
            print("Gemini connection: SUCCESS")
            print(f"Model: {MODEL_NAME}")
            return True, MODEL_NAME
        else:
            print("Gemini connection: FAILED")
            print("Reason: Empty response from Gemini API")
            return False, "Empty response from Gemini API"
    except Exception as e:
        print("Gemini connection: FAILED")
        print(f"Reason: {str(e)}")
        return False, str(e)


if __name__ == "__main__":
    test_gemini_connection()
