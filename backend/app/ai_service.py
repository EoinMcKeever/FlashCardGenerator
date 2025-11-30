from openai import OpenAI
from .config import settings
import json

def generate_flashcards(topic: str, count: int = 10):
    """
    Generate flashcards using OpenAI API based on a topic.

    Args:
        topic: The topic to generate flashcards about
        count: Number of flashcards to generate

    Returns:
        List of dictionaries with 'question' and 'answer' keys
    """
    if not settings.OPENAI_API_KEY:
        raise ValueError(
            "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file. "
            "Get your key from: https://platform.openai.com/api-keys"
        )

    if not settings.OPENAI_API_KEY.startswith('sk-'):
        raise ValueError(
            f"Invalid OpenAI API key format. Key should start with 'sk-' but got: {settings.OPENAI_API_KEY[:10]}..."
        )

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = f"""Generate {count} flashcard question-answer pairs about: {topic}

Return ONLY a JSON array with this exact format:
[
  {{"question": "Question text here?", "answer": "Answer text here"}},
  {{"question": "Another question?", "answer": "Another answer"}}
]

Rules:
- Questions should be clear and specific
- Answers should be concise but complete
- Cover different aspects of the topic
- Make questions progressively more detailed
- Return ONLY valid JSON, no other text"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that creates educational flashcards. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()

        # Try to extract JSON if there's extra text
        if content.startswith("```json"):
            content = content.split("```json")[1].split("```")[0].strip()
        elif content.startswith("```"):
            content = content.split("```")[1].split("```")[0].strip()

        flashcards = json.loads(content)

        # Validate the structure
        if not isinstance(flashcards, list):
            raise ValueError("Response is not a list")

        for card in flashcards:
            if not isinstance(card, dict) or 'question' not in card or 'answer' not in card:
                raise ValueError("Invalid flashcard format")

        return flashcards

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        error_msg = str(e)
        if "authentication" in error_msg.lower() or "api key" in error_msg.lower():
            raise ValueError(
                "OpenAI API authentication failed. Your API key may be invalid or revoked. "
                "Please verify your key at: https://platform.openai.com/api-keys"
            )
        elif "quota" in error_msg.lower() or "insufficient" in error_msg.lower():
            raise ValueError(
                "OpenAI API quota exceeded. Please check your billing and usage at: "
                "https://platform.openai.com/account/usage"
            )
        else:
            raise ValueError(f"AI generation failed: {str(e)}")
