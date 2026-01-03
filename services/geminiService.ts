import { GiftIdea, Persona } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const CORE_QUESTIONS = [
  { id: 1, text: "What has [name] been talking about or obsessing over lately?" },
  { id: 2, text: "What's something they keep saying they'll do but haven't yet?" },
  { id: 3, text: "What's a small thing that makes them unreasonably happy?" },
  { id: 4, text: "What do they complain about?" },
  { id: 5, text: "What would they never buy for themselves but secretly want?" },
  { id: 6, text: "Anything else we should know to find the perfect gift?" }
];

export async function generateGiftsAndPersona(
  friendName: string,
  budget: { min: number; max: number },
  allAnswers: Record<string, Record<number, string>>,
  participantNames: Record<string, string>
): Promise<{ gifts: GiftIdea[]; persona: Persona }> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Format the answers for the prompt
  const formattedAnswers = Object.entries(allAnswers)
    .map(([participantId, answers]: [string, Record<number, string>]) => {
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

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Moos Gift Finder',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter API error:', errorData);
    throw new Error(errorData.error?.message || 'Failed to generate gift ideas. Please try again.');
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content;

  if (!textContent) {
    throw new Error('No response from AI');
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonString = textContent.trim();
  if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
  if (jsonString.startsWith('```')) jsonString = jsonString.slice(3);
  if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);

  const parsed = JSON.parse(jsonString.trim());

  // Transform to our types
  const gifts: GiftIdea[] = parsed.gifts.map((g: { name: string; priceEstimate: string; reason: string }, index: number) => ({
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
    imageUrl: '',
  };

  return { gifts, persona };
}
