import { GiftIdea, Persona, CORE_QUESTIONS } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
  persona: {
    vibe: string;
    description: string;
    traits: string[];
  };
  gifts: {
    name: string;
    priceEstimate: string;
    reason: string;
  }[];
}

export async function generateGiftsAndPersona(
  friendName: string,
  budget: { min: number; max: number },
  allAnswers: Record<string, Record<number, string>>,
  participantNames: Record<string, string>
): Promise<{ gifts: GiftIdea[]; persona: Persona }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('Gemini API key not configured. Please add your API key to .env.local');
  }

  // Format the answers for the prompt
  const formattedAnswers = Object.entries(allAnswers)
    .map(([participantId, answers]) => {
      const name = participantNames[participantId] || 'A friend';
      const answerLines = CORE_QUESTIONS.map((q) => {
        const answer = answers[q.id];
        if (!answer) return null;
        const questionText = q.text.replace('[name]', friendName);
        return `  Q: ${questionText}\n  A: ${answer}`;
      })
        .filter(Boolean)
        .join('\n\n');
      return `### ${name} says:\n${answerLines}`;
    })
    .join('\n\n');

  const prompt = `You are helping a group of friends find the perfect birthday gift for ${friendName}.

Budget range: €${budget.min} - €${budget.max}

Here's what ${friendName}'s friends shared about them:

${formattedAnswers}

Based on these insights, generate:

1. A "Vibe" persona for ${friendName}:
   - A 2-4 word creative title capturing their essence (e.g., "The Creative Adventurer", "The Cozy Homebody")
   - A 2-3 sentence description of who they are based on the answers
   - 4 personality traits as short labels

2. Exactly 10 gift ideas within the €${budget.min}-€${budget.max} budget:
   - Each gift should have a name, price estimate (as a string like "€50" or "€40-60"), and a 1-sentence reason why it fits ${friendName}
   - Make the gifts specific and thoughtful, not generic
   - Mix practical and fun options
   - Reference specific things from the friend answers when possible

Respond ONLY with valid JSON in this exact format:
{
  "persona": {
    "vibe": "The Creative Title",
    "description": "2-3 sentences about who they are...",
    "traits": ["Trait1", "Trait2", "Trait3", "Trait4"]
  },
  "gifts": [
    {
      "name": "Specific Gift Name",
      "priceEstimate": "€50",
      "reason": "Why this fits them based on what friends said."
    }
  ]
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error('Failed to generate gift ideas. Please try again.');
  }

  const data = await response.json();

  // Extract the text content from Gemini response
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('No response from AI. Please try again.');
  }

  // Parse the JSON from the response (handle potential markdown code blocks)
  let jsonString = textContent.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7);
  }
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3);
  }

  const parsed: GeminiResponse = JSON.parse(jsonString.trim());

  // Transform to our types
  const gifts: GiftIdea[] = parsed.gifts.map((g, index) => ({
    id: `gift-${index + 1}`,
    name: g.name,
    priceEstimate: g.priceEstimate,
    reason: g.reason,
    votes: 0,
  }));

  const persona: Persona = {
    vibe: parsed.persona.vibe,
    description: parsed.persona.description,
    traits: parsed.persona.traits,
    imageUrl: '', // We don't generate images
  };

  return { gifts, persona };
}
