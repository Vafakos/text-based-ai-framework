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


def gen_outcomes(scene_text, choices):
    system_prompt = (
        "You are an AI that writes short outcomes for branching text-based games.\n"
        "Rules:\n"
        "- For each choice, write 1 concise outcome sentence.\n"
        "- Make it a hook that sets up the next scene.\n"
        "- No spoilers about future scenes.\n"
        "- Keep same order as input choices."
    )
    user_prompt = f"Scene:\n{scene_text}\n\n" "Choices:\n" + "\n".join(
        f"- {c}" for c in choices
    )
    text = _chat(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=350,
    )
    lines = [ln.strip("-• ").strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) < len(choices):
        lines += ["[Outcome unavailable]"] * (len(choices) - len(lines))
    return lines[: len(choices)]


def gen_narrative(parent_text, choice_text, outcome_text):
    system_prompt = (
        "You are an AI that writes the next scene for a branching text-based game.\n"
        "Rules:\n"
        "- Write 3–6 sentences.\n"
        "- Base it on the prior scene, the choice taken, and its immediate outcome.\n"
        "- Present tense, second person.\n"
        "- No choices yet — just narrative."
    )
    user_prompt = (
        f"Previous scene:\n{parent_text}\n\n"
        f"Choice taken: {choice_text}\n"
        f"Immediate outcome: {outcome_text}"
    )
    return _chat(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=320,
    )
