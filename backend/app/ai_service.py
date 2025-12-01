from openai import OpenAI
from .config import settings
import json
from typing import List

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

    prompt = f"""Generate {count} flashcards base questions/answers pairs with hints about {topic}

Return ONLY a JSON array with this exact format:
[
  {{"question": "Question text here?", "answer": "Answer text here", "hint": "Helpful hint here"}},
  {{"question": "Another question?", "answer": "Another answer", "hint": "Another hint"}}
]

Rules:
- Questions should be clear and specific
- Answers should be concise but complete
- Hints should provide guidance without giving away the full answer
- Cover different aspects of the topic
- Make questions progressively more detailed
- Return ONLY valid JSON, no other text"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"You are an expert with 20 years experience on {topic}, create educational flashcards for a student who is new to {topic} that is trying to master {topic}, explain the topic in as much detail as possible. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=16000
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
            if not isinstance(card, dict) or 'question' not in card or 'answer' not in card or 'hint' not in card:
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


def generate_flashcards_from_pdfs(pdf_content: str, user_instructions: str, count: int = 100):
    """
    Generate flashcards from PDF content with user instructions.

    Args:
        pdf_content: Extracted and processed content from PDFs
        user_instructions: User's learning goals and instructions
        count: Number of flashcards to generate

    Returns:
        List of dictionaries with 'question', 'answer', and 'hint' keys
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

    # Truncate PDF content if too long to fit in context
    max_content_length = 50000  # Adjust based on model limits
    truncated_content = pdf_content[:max_content_length]
    if len(pdf_content) > max_content_length:
        truncated_content += "\n\n[... content truncated due to length ...]"

    system_prompt = """You are an expert educator and subject matter specialist with deep knowledge across mathematics, science, engineering, and humanities. Your role is to:

1. Analyze the provided document content thoroughly
2. Understand the user's learning goals and instructions
3. Identify prerequisite knowledge needed to understand the material
4. Create comprehensive flashcards that cover:
   - Core concepts from the documents
   - Foundational/prerequisite knowledge not in the documents but essential for understanding
   - Progressive difficulty levels
   - Practical applications and examples

Always respond with valid JSON only. Create flashcards that promote deep understanding and mastery."""

    user_prompt = f"""Based on the following document content and user instructions, generate {count} educational flashcards.

USER INSTRUCTIONS:
{user_instructions}

DOCUMENT CONTENT:
{truncated_content}

Generate flashcards that:
1. Cover the key concepts in the documents
2. Include prerequisite knowledge the user needs to understand the material (even if not explicitly in the documents)
3. Progress from foundational to advanced concepts
4. Include practical examples and applications
5. Have clear questions, comprehensive answers, and helpful hints

Return ONLY a JSON array with this exact format:
[
  {{"question": "Question text here?", "answer": "Detailed answer here", "hint": "Helpful hint without giving away the answer"}},
  {{"question": "Another question?", "answer": "Another detailed answer", "hint": "Another helpful hint"}}
]

Rules:
- Questions should be clear, specific, and test understanding
- Answers should be comprehensive but concise
- Hints should guide thinking without revealing the answer
- Include both factual recall and conceptual understanding questions
- Cover prerequisite concepts if the user needs them to understand the material
- Return ONLY valid JSON, no other text or formatting"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=16000
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
            if not isinstance(card, dict) or 'question' not in card or 'answer' not in card or 'hint' not in card:
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
