# AI-Powered Flashcard Generation Setup

This guide will help you set up the AI flashcard generation feature using OpenAI's API.

## Getting an OpenAI API Key

1. **Create an OpenAI Account**
   - Go to https://platform.openai.com/signup
   - Sign up for a new account or log in if you already have one

2. **Get Your API Key**
   - Navigate to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Give it a name (e.g., "FlashCard Generator")
   - Copy the API key immediately (you won't be able to see it again)

3. **Add Credits** (if needed)
   - Go to https://platform.openai.com/account/billing
   - Add a payment method
   - Note: New accounts may get free credits to start

## Setting Up the API Key

### Option 1: Using .env file (Recommended)

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. Restart Docker containers:
   ```bash
   sudo docker-compose down
   sudo docker-compose up --build
   ```

### Option 2: Environment Variable

Export the API key before starting Docker:

```bash
export OPENAI_API_KEY=sk-your-actual-api-key-here
sudo docker-compose up --build
```

### Option 3: Direct in docker-compose.yml (Not Recommended for Production)

Edit `docker-compose.yml` and replace the backend environment variable:

```yaml
environment:
  OPENAI_API_KEY: sk-your-actual-api-key-here
```

**Warning**: Don't commit your actual API key to version control!

## Using AI Generation

Once configured, you can generate flashcards:

1. **Create a Deck** with a descriptive topic
   - Example: "React Hooks"
   - Example: "Python Data Structures"
   - Example: "US History Civil War"

2. **Click "Generate with AI"** button in the deck view

3. The system will:
   - Send the topic to OpenAI's GPT-3.5-turbo model
   - Generate 10 question-answer pairs
   - Automatically add them to your deck
   - Display a success message

## How It Works

The AI generation uses OpenAI's GPT-3.5-turbo model with this process:

1. **Topic Analysis**: Takes your deck's topic
2. **Prompt Engineering**: Creates a structured prompt asking for flashcards
3. **AI Generation**: OpenAI generates relevant questions and answers
4. **JSON Parsing**: Extracts the flashcards from the response
5. **Database Storage**: Saves them to your deck

## Cost Estimate

Using GPT-3.5-turbo is very affordable:

- **Cost per request**: ~$0.001 - $0.002 (10 flashcards)
- **100 generations**: ~$0.10 - $0.20
- **1000 generations**: ~$1.00 - $2.00

Pricing details: https://openai.com/pricing

## Troubleshooting

### "OpenAI API key not configured"

**Problem**: The API key is not set
**Solution**: Follow the setup steps above to add your API key

### "Failed to generate flashcards"

**Possible causes**:
1. Invalid API key
2. No credits/billing set up
3. Rate limit exceeded
4. Network issues

**Solutions**:
- Verify your API key is correct
- Check your OpenAI account has credits
- Wait a moment and try again
- Check backend logs: `docker-compose logs backend`

### Rate Limits

OpenAI has rate limits based on your account tier:
- **Free tier**: Lower limits
- **Paid tier**: Higher limits

If you hit rate limits, wait a few minutes before trying again.

## Advanced Configuration

### Change Model

Edit `backend/app/ai_service.py` and modify the model:

```python
model="gpt-4"  # More expensive but better quality
model="gpt-3.5-turbo"  # Default, good balance
```

### Change Number of Cards

In `frontend/src/components/DeckView.jsx`:

```javascript
await decksAPI.generateFlashcards(deckId, 20);  // Generate 20 instead of 10
```

Or modify the backend endpoint to accept a parameter.

### Customize Prompts

Edit `backend/app/ai_service.py` to customize how flashcards are generated:

```python
prompt = f"""Generate {count} flashcard question-answer pairs about: {topic}

Focus on:
- Key concepts and definitions
- Practical examples
- Common misconceptions
...
"""
```

## Privacy & Security

- **API Key Security**: Never commit your API key to version control
- **Data Privacy**: Your topics are sent to OpenAI for processing
- **Cost Control**: Monitor your OpenAI usage dashboard
- **Rate Limiting**: Consider adding rate limits in production

## Alternative AI Providers

The code can be adapted to use other AI providers:

- **Anthropic Claude**: Better for detailed explanations
- **Google Gemini**: Free tier available
- **Ollama**: Run models locally (no API costs)

Contact documentation for provider-specific integration.

## Support

For issues:
- OpenAI API: https://help.openai.com/
- Application issues: Check project README
