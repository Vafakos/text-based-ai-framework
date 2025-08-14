import os
import time
from openai import OpenAI


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=API_KEY)


def _chat(messages, temperature=0.5, max_tokens=350, seed=1234, retries=2):
    last_err = None
    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                temperature=temperature,
                max_tokens=max_tokens,
                seed=seed,
                messages=messages,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            last_err = e
            print(f"[AI Provider] Error: {e} (attempt {attempt+1})")
            time.sleep(0.8 * (attempt + 1))
    raise last_err


def gen_intro(title, genre, setting, tone, main_character, goal):
    system_prompt = (
        "You are an AI that generates opening scenes for branching text-based games.\n"
        "Rules:\n"
        "- Write 3–6 sentences.\n"
        "- Use vivid but compact language.\n"
        "- Present tense, second person.\n"
        "- Do NOT include choices yet."
    )
    user_prompt = (
        f"Game Title: {title}\n"
        f"Genre: {genre}\n"
        f"Setting: {setting}\n"
        f"Tone: {tone}\n"
        f"Main Character: {main_character}\n"
        f"Goal: {goal}"
    )
    return _chat(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=300,
    )
