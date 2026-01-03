import { GiftIdea, Persona } from '../types';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-gifts`;

export async function generateGiftsAndPersona(
  friendName: string,
  budget: { min: number; max: number },
  allAnswers: Record<string, Record<number, string>>,
  participantNames: Record<string, string>
): Promise<{ gifts: GiftIdea[]; persona: Persona }> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      friendName,
      budget,
      allAnswers,
      participantNames,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate gift ideas. Please try again.');
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    gifts: data.gifts,
    persona: data.persona,
  };
}
