const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.get('/', (req, res) => {
  res.json({ status: 'Pertho backend is running' });
});

app.post('/ai', async (req, res) => {
  const { text, mode } = req.body;

  if (!text || !mode) {
    return res.status(400).json({ error: 'Text and mode are required' });
  }

  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text too long. Please highlight a smaller passage.' });
  }

  let prompt = '';

  if (mode === 'explain') {
    prompt = `You are Pertho, an AI study assistant. Explain the following text in simple, very clear language. Use a short analogy if helpful. Keep it under 150 words. No unnecessary introductions or filler phrases. Just the explanation. Explain it like tou are explaining to a 10 year old. Explain in simplest of forms.

Text: ${text}`;
  }

  else if (mode === 'keypoints') {
    prompt = `You are Pertho, an AI study assistant. Extract the key points from the following text. Format as a clean numbered list. Maximum 5 points. Each point should be one clear sentence. No filler phrases.

Text: ${text}`;
  }

  else if (mode === 'quiz') {
    prompt = `You are Pertho, an AI study assistant. Create 3 multiple choice questions based on the following text. 

Format each question exactly like this:
Q1. [Question]
A. [Option]
B. [Option]
C. [Option]
D. [Option]
Answer: [Correct letter]

Text: ${text}`;
  }

  else {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    res.json({ result });

  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'AI request failed. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Pertho backend running on port ${PORT}`);
});
