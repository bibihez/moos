import { GiftIdea, Persona } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const N8N_RECOMMENDATIONS_URL = 'https://bibihez.app.n8n.cloud/webhook/moos-recommendations';

const CORE_QUESTIONS = [
  { id: 1, text: "What has [name] been talking about or obsessing over lately?" },
  { id: 2, text: "What's something they keep saying they'll do but haven't yet?" },
  { id: 3, text: "What's a small thing that makes them unreasonably happy?" },
  { id: 4, text: "What do they complain about?" },
  { id: 5, text: "What would they never buy for themselves but secretly want?" },
  { id: 6, text: "Anything else we should know to find the perfect gift?" }
];

// Format answers for prompts
function formatAnswersForPrompt(
  friendName: string,
  allAnswers: Record<string, Record<number, string>>,
  participantNames: Record<string, string>
): string {
  return Object.entries(allAnswers)
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
}

// Generate persona using OpenRouter (quick, no web search needed)
async function generatePersona(
  friendName: string,
  formattedAnswers: string,
  apiKey: string
): Promise<Persona> {
  const personaPrompt = `Based on what ${friendName}'s friends shared about them, create a fun persona:

${formattedAnswers}

Respond ONLY with valid JSON:
{
  "vibe": "A 2-4 word creative title (e.g., 'The Creative Adventurer')",
  "description": "2-3 sentences about who they are",
  "traits": ["Trait1", "Trait2", "Trait3", "Trait4"]
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
      messages: [{ role: 'user', content: personaPrompt }],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate persona');
  }

  const data = await response.json();
  let jsonString = data.choices?.[0]?.message?.content?.trim() || '';
  if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
  if (jsonString.startsWith('```')) jsonString = jsonString.slice(3);
  if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);

  const parsed = JSON.parse(jsonString.trim());
  return {
    vibe: parsed.vibe,
    description: parsed.description,
    traits: parsed.traits,
    imageUrl: '',
  };
}

// Generate gifts using n8n workflow with Jina AI web search
async function generateGiftsWithWebSearch(
  friendName: string,
  budget: { min: number; max: number },
  formattedAnswers: string
): Promise<GiftIdea[]> {
  console.log('Calling n8n workflow for gift recommendations with web search...');

  const response = await fetch(N8N_RECOMMENDATIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      friendName,
      budget: `€${budget.min} - €${budget.max}`,
      insights: formattedAnswers,
      chatInput: `Find 8-10 gift ideas for ${friendName} within €${budget.min}-€${budget.max} budget.

Here's what their friends say about them:
${formattedAnswers}

Search for REAL products with actual purchase links. Return as JSON array.`,
    }),
  });

  if (!response.ok) {
    throw new Error('n8n workflow failed');
  }

  const data = await response.json();
  console.log('n8n response:', data);

  // Parse the response - n8n AI Agent returns in 'output' field
  let giftsData = data.output || data.gifts || data;

  // If it's a string, try to parse as JSON
  if (typeof giftsData === 'string') {
    let jsonString = giftsData.trim();
    if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
    if (jsonString.startsWith('```')) jsonString = jsonString.slice(3);
    if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);
    giftsData = JSON.parse(jsonString.trim());
  }

  // Handle if it's wrapped in an object
  if (giftsData.gifts) {
    giftsData = giftsData.gifts;
  }

  return giftsData.map((g: { name: string; priceEstimate?: string; price?: string; reason: string; url?: string }, index: number) => ({
    id: `gift-${index + 1}`,
    name: g.name,
    priceEstimate: g.priceEstimate || g.price || '€50',
    reason: g.reason + (g.url ? ` [Buy here](${g.url})` : ''),
    votes: 0,
  }));
}

// Fallback: Generate gifts without web search
async function generateGiftsFallback(
  friendName: string,
  budget: { min: number; max: number },
  formattedAnswers: string,
  apiKey: string
): Promise<GiftIdea[]> {
  console.log('Using fallback gift generation (no web search)...');

  const giftPrompt = `Find 10 gift ideas for ${friendName} within €${budget.min}-€${budget.max} budget.

${formattedAnswers}

Respond ONLY with valid JSON array:
[{"name": "Gift Name", "priceEstimate": "€50", "reason": "Why it fits them"}]`;

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
      messages: [{ role: 'user', content: giftPrompt }],
      temperature: 0.8,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate gifts');
  }

  const data = await response.json();
  let jsonString = data.choices?.[0]?.message?.content?.trim() || '';
  if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
  if (jsonString.startsWith('```')) jsonString = jsonString.slice(3);
  if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);

  const parsed = JSON.parse(jsonString.trim());
  return parsed.map((g: { name: string; priceEstimate: string; reason: string }, index: number) => ({
    id: `gift-${index + 1}`,
    name: g.name,
    priceEstimate: g.priceEstimate,
    reason: g.reason,
    votes: 0,
  }));
}

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

  const formattedAnswers = formatAnswersForPrompt(friendName, allAnswers, participantNames);

  // Generate persona (quick, no web search)
  const persona = await generatePersona(friendName, formattedAnswers, apiKey);

  // Try n8n workflow with web search, fallback to direct API if it fails
  let gifts: GiftIdea[];
  try {
    gifts = await generateGiftsWithWebSearch(friendName, budget, formattedAnswers);
  } catch (error) {
    console.warn('n8n workflow failed, using fallback:', error);
    gifts = await generateGiftsFallback(friendName, budget, formattedAnswers, apiKey);
  }

  return { gifts, persona };
}
