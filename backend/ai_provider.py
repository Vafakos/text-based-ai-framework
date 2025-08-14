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
