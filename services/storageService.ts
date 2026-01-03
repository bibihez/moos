import { Birthday, GiftIdea, Participant, Persona } from '../types';
import { supabase } from './supabaseClient';

// Local storage key for organizer tokens (to identify ownership across sessions)
const OWNED_TOKENS_KEY = 'moos_owned_tokens';

// Helper to get owned tokens from localStorage
function getOwnedTokens(): Record<string, string> {
  try {
    const item = localStorage.getItem(OWNED_TOKENS_KEY);
    return item ? JSON.parse(item) : {};
  } catch {
    return {};
  }
}

// Helper to save owned token
function saveOwnedToken(birthdayId: string, token: string): void {
  const tokens = getOwnedTokens();
  tokens[birthdayId] = token;
  localStorage.setItem(OWNED_TOKENS_KEY, JSON.stringify(tokens));
}

// Map database row to Birthday interface
function mapBirthdayFromDb(row: any): Birthday {
  return {
    id: row.id,
    friendName: row.friend_name,
    date: row.date || '',
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    organizerName: row.organizer_name,
    organizerEmail: row.organizer_email,
    organizerIban: row.organizer_iban || undefined,
    organizerToken: row.organizer_token,
    status: row.status,
    persona: row.persona_vibe ? {
      vibe: row.persona_vibe,
      description: row.persona_description || '',
      traits: row.persona_traits || [],
      imageUrl: '',
    } : undefined,
  };
}

// Map database row to Participant interface
function mapParticipantFromDb(row: any): Participant {
  return {
    id: row.id,
    name: row.name,
    hasPaid: row.has_paid || false,
    hasAnswered: row.has_answered || false,
    answeredAt: row.answered_at || undefined,
  };
}

// Map database row to GiftIdea interface
function mapGiftFromDb(row: any, voteCount: number = 0): GiftIdea {
  return {
    id: row.id,
    name: row.name,
    priceEstimate: row.price_estimate,
    reason: row.reason,
    votes: voteCount,
  };
}

export const storageService = {
  // Birthday CRUD
  async createBirthday(data: Omit<Birthday, 'id' | 'status'>): Promise<Birthday> {
    const { data: birthday, error } = await supabase
      .from('moos_birthdays')
      .insert({
        friend_name: data.friendName,
        date: data.date || null,
        budget_min: data.budgetMin,
        budget_max: data.budgetMax,
        organizer_name: data.organizerName,
        organizer_email: data.organizerEmail,
        status: 'collecting',
      })
      .select()
      .single();

    if (error || !birthday) {
      throw new Error('Failed to create birthday: ' + (error?.message || 'Unknown error'));
    }

    // Save organizer token locally for ownership verification
    saveOwnedToken(birthday.id, birthday.organizer_token);

    return mapBirthdayFromDb(birthday);
  },

  async getBirthday(id: string): Promise<Birthday> {
    const { data: birthday, error } = await supabase
      .from('moos_birthdays')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !birthday) {
      throw new Error('Birthday not found');
    }

    return mapBirthdayFromDb(birthday);
  },

  async updateBirthday(id: string, updates: Partial<Birthday>): Promise<Birthday> {
    const dbUpdates: any = {};

    if (updates.friendName !== undefined) dbUpdates.friend_name = updates.friendName;
    if (updates.date !== undefined) dbUpdates.date = updates.date || null;
    if (updates.budgetMin !== undefined) dbUpdates.budget_min = updates.budgetMin;
    if (updates.budgetMax !== undefined) dbUpdates.budget_max = updates.budgetMax;
    if (updates.organizerName !== undefined) dbUpdates.organizer_name = updates.organizerName;
    if (updates.organizerEmail !== undefined) dbUpdates.organizer_email = updates.organizerEmail;
    if (updates.organizerIban !== undefined) dbUpdates.organizer_iban = updates.organizerIban;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.persona !== undefined) {
      dbUpdates.persona_vibe = updates.persona.vibe;
      dbUpdates.persona_description = updates.persona.description;
      dbUpdates.persona_traits = updates.persona.traits;
    }

    dbUpdates.updated_at = new Date().toISOString();

    const { data: birthday, error } = await supabase
      .from('moos_birthdays')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !birthday) {
      throw new Error('Failed to update birthday: ' + (error?.message || 'Unknown error'));
    }

    return mapBirthdayFromDb(birthday);
  },

  // Participant management
  async joinBirthday(birthdayId: string, participantName: string, isOrganizer: boolean = false): Promise<Participant> {
    const { data: participant, error } = await supabase
      .from('moos_participants')
      .insert({
        birthday_id: birthdayId,
        name: participantName,
        is_organizer: isOrganizer,
        has_answered: false,
        has_paid: false,
      })
      .select()
      .single();

    if (error || !participant) {
      throw new Error('Failed to join birthday: ' + (error?.message || 'Unknown error'));
    }

    return mapParticipantFromDb(participant);
  },

  async getParticipants(birthdayId: string): Promise<Participant[]> {
    const { data: participants, error } = await supabase
      .from('moos_participants')
      .select('*')
      .eq('birthday_id', birthdayId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('Failed to get participants: ' + error.message);
    }

    return (participants || []).map(mapParticipantFromDb);
  },

  // Answer management
  async submitAnswers(
    birthdayId: string,
    participantId: string,
    answers: Record<number, string>
  ): Promise<void> {
    // Insert all answers
    const answerRows = Object.entries(answers).map(([questionId, answerText]) => ({
      birthday_id: birthdayId,
      participant_id: participantId,
      question_id: parseInt(questionId),
      answer_text: answerText,
    }));

    const { error: answerError } = await supabase
      .from('moos_answers')
      .upsert(answerRows, { onConflict: 'birthday_id,participant_id,question_id' });

    if (answerError) {
      throw new Error('Failed to submit answers: ' + answerError.message);
    }

    // Mark participant as answered
    const { error: updateError } = await supabase
      .from('moos_participants')
      .update({
        has_answered: true,
        answered_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    if (updateError) {
      throw new Error('Failed to update participant: ' + updateError.message);
    }
  },

  async getAllAnswers(birthdayId: string): Promise<Record<string, Record<number, string>>> {
    const { data: answers, error } = await supabase
      .from('moos_answers')
      .select('participant_id, question_id, answer_text')
      .eq('birthday_id', birthdayId);

    if (error) {
      throw new Error('Failed to get answers: ' + error.message);
    }

    // Group by participant
    const result: Record<string, Record<number, string>> = {};
    for (const answer of answers || []) {
      if (!result[answer.participant_id]) {
        result[answer.participant_id] = {};
      }
      result[answer.participant_id][answer.question_id] = answer.answer_text;
    }

    return result;
  },

  // Gift ideas management
  async saveGiftIdeas(birthdayId: string, gifts: GiftIdea[]): Promise<void> {
    // Delete existing gift ideas for this birthday
    await supabase
      .from('moos_gift_ideas')
      .delete()
      .eq('birthday_id', birthdayId);

    // Insert new gift ideas
    const giftRows = gifts.map((gift, index) => ({
      id: gift.id,
      birthday_id: birthdayId,
      name: gift.name,
      price_estimate: gift.priceEstimate,
      reason: gift.reason,
      sort_order: index,
    }));

    const { error } = await supabase
      .from('moos_gift_ideas')
      .insert(giftRows);

    if (error) {
      throw new Error('Failed to save gift ideas: ' + error.message);
    }
  },

  async getGiftIdeas(birthdayId: string): Promise<GiftIdea[]> {
    const { data: gifts, error } = await supabase
      .from('moos_gift_ideas')
      .select('*')
      .eq('birthday_id', birthdayId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error('Failed to get gift ideas: ' + error.message);
    }

    return (gifts || []).map(g => mapGiftFromDb(g, 0));
  },

  // Voting
  async submitVote(birthdayId: string, giftIds: string[], voterIdentifier?: string): Promise<void> {
    const voterId = voterIdentifier || 'anon-' + Math.random().toString(36).substr(2, 9);

    const voteRows = giftIds.map(giftId => ({
      birthday_id: birthdayId,
      gift_id: giftId,
      voter_identifier: voterId,
    }));

    const { error } = await supabase
      .from('moos_votes')
      .upsert(voteRows, { onConflict: 'birthday_id,gift_id,voter_identifier' });

    if (error) {
      throw new Error('Failed to submit votes: ' + error.message);
    }
  },

  async getVoteResults(birthdayId: string): Promise<Record<string, number>> {
    const { data: votes, error } = await supabase
      .from('moos_votes')
      .select('gift_id')
      .eq('birthday_id', birthdayId);

    if (error) {
      throw new Error('Failed to get vote results: ' + error.message);
    }

    // Count votes per gift
    const result: Record<string, number> = {};
    for (const vote of votes || []) {
      result[vote.gift_id] = (result[vote.gift_id] || 0) + 1;
    }

    return result;
  },

  async getGiftIdeasWithVotes(birthdayId: string): Promise<GiftIdea[]> {
    const gifts = await this.getGiftIdeas(birthdayId);
    const votes = await this.getVoteResults(birthdayId);

    return gifts
      .map((g) => ({
        ...g,
        votes: votes[g.id] || 0,
      }))
      .sort((a, b) => b.votes - a.votes);
  },

  // Ownership check - now uses token comparison
  isOwner(birthdayId: string, birthdayToken?: string): boolean {
    const tokens = getOwnedTokens();
    const localToken = tokens[birthdayId];

    // Check if we have the token locally
    if (localToken) return true;

    // Check if token was passed (e.g., from URL)
    if (birthdayToken && localToken === birthdayToken) return true;

    return false;
  },

  // Save token from URL (for when organizer opens link on different device)
  saveTokenFromUrl(birthdayId: string, token: string): void {
    saveOwnedToken(birthdayId, token);
  },

  // Get birthday without throwing (returns null if not found)
  async getBirthdayOrNull(id: string): Promise<Birthday | null> {
    try {
      return await this.getBirthday(id);
    } catch {
      return null;
    }
  },

  // Mark participant as paid
  async markAsPaid(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('moos_participants')
      .update({
        has_paid: true,
        paid_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    if (error) {
      throw new Error('Failed to mark as paid: ' + error.message);
    }
  },

  // Update IBAN for birthday
  async updateIban(birthdayId: string, iban: string): Promise<void> {
    const { error } = await supabase
      .from('moos_birthdays')
      .update({ organizer_iban: iban })
      .eq('id', birthdayId);

    if (error) {
      throw new Error('Failed to update IBAN: ' + error.message);
    }
  },

  // Real-time subscription for participants
  subscribeToParticipants(
    birthdayId: string,
    callback: (participants: Participant[]) => void
  ): () => void {
    const channel = supabase
      .channel(`participants:${birthdayId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moos_participants',
          filter: `birthday_id=eq.${birthdayId}`,
        },
        async () => {
          // Refetch all participants when changes occur
          const participants = await this.getParticipants(birthdayId);
          callback(participants);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
