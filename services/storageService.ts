import { Birthday, GiftIdea, Participant, Persona } from '../types';

// localStorage keys
const KEYS = {
  BIRTHDAYS: 'moos_birthdays',
  PARTICIPANTS: 'moos_participants',
  ANSWERS: 'moos_answers',
  VOTES: 'moos_votes',
  GIFT_IDEAS: 'moos_gift_ideas',
  OWNED: 'owned_birthdays',
};

// Helper functions for localStorage
function getStore<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStore<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Types for stored data
type BirthdayStore = Record<string, Birthday>;
type ParticipantStore = Record<string, Participant[]>;
type AnswerStore = Record<string, Record<string, Record<number, string>>>;
type VoteStore = Record<string, Record<string, number>>;
type GiftStore = Record<string, GiftIdea[]>;

export const storageService = {
  // Birthday CRUD
  async createBirthday(data: Omit<Birthday, 'id' | 'status'>): Promise<Birthday> {
    const id = 'bday-' + Math.random().toString(36).substr(2, 9);
    const birthday: Birthday = {
      ...data,
      id,
      status: 'collecting',
    };

    const store = getStore<BirthdayStore>(KEYS.BIRTHDAYS, {});
    store[id] = birthday;
    setStore(KEYS.BIRTHDAYS, store);

    // Mark as owned
    const owned = getStore<string[]>(KEYS.OWNED, []);
    owned.push(id);
    setStore(KEYS.OWNED, owned);

    return birthday;
  },

  async getBirthday(id: string): Promise<Birthday> {
    const store = getStore<BirthdayStore>(KEYS.BIRTHDAYS, {});
    const birthday = store[id];
    if (!birthday) {
      throw new Error('Birthday not found');
    }
    return birthday;
  },

  async updateBirthday(id: string, updates: Partial<Birthday>): Promise<Birthday> {
    const store = getStore<BirthdayStore>(KEYS.BIRTHDAYS, {});
    if (!store[id]) {
      throw new Error('Birthday not found');
    }
    store[id] = { ...store[id], ...updates };
    setStore(KEYS.BIRTHDAYS, store);
    return store[id];
  },

  // Participant management
  async joinBirthday(birthdayId: string, participantName: string): Promise<Participant> {
    const participant: Participant = {
      id: 'part-' + Math.random().toString(36).substr(2, 9),
      name: participantName,
      hasPaid: false,
      hasAnswered: false,
    };

    const store = getStore<ParticipantStore>(KEYS.PARTICIPANTS, {});
    if (!store[birthdayId]) {
      store[birthdayId] = [];
    }
    store[birthdayId].push(participant);
    setStore(KEYS.PARTICIPANTS, store);

    return participant;
  },

  async getParticipants(birthdayId: string): Promise<Participant[]> {
    const store = getStore<ParticipantStore>(KEYS.PARTICIPANTS, {});
    return store[birthdayId] || [];
  },

  // Answer management
  async submitAnswers(
    birthdayId: string,
    participantId: string,
    answers: Record<number, string>
  ): Promise<void> {
    // Store answers
    const answerStore = getStore<AnswerStore>(KEYS.ANSWERS, {});
    if (!answerStore[birthdayId]) {
      answerStore[birthdayId] = {};
    }
    answerStore[birthdayId][participantId] = answers;
    setStore(KEYS.ANSWERS, answerStore);

    // Mark participant as answered
    const participantStore = getStore<ParticipantStore>(KEYS.PARTICIPANTS, {});
    const participants = participantStore[birthdayId] || [];
    const idx = participants.findIndex((p) => p.id === participantId);
    if (idx >= 0) {
      participants[idx].hasAnswered = true;
      participants[idx].answeredAt = new Date().toISOString();
      participantStore[birthdayId] = participants;
      setStore(KEYS.PARTICIPANTS, participantStore);
    }
  },

  async getAllAnswers(birthdayId: string): Promise<Record<string, Record<number, string>>> {
    const store = getStore<AnswerStore>(KEYS.ANSWERS, {});
    return store[birthdayId] || {};
  },

  // Gift ideas management
  async saveGiftIdeas(birthdayId: string, gifts: GiftIdea[]): Promise<void> {
    const store = getStore<GiftStore>(KEYS.GIFT_IDEAS, {});
    store[birthdayId] = gifts;
    setStore(KEYS.GIFT_IDEAS, store);
  },

  async getGiftIdeas(birthdayId: string): Promise<GiftIdea[]> {
    const store = getStore<GiftStore>(KEYS.GIFT_IDEAS, {});
    return store[birthdayId] || [];
  },

  // Voting
  async submitVote(birthdayId: string, giftIds: string[]): Promise<void> {
    const store = getStore<VoteStore>(KEYS.VOTES, {});
    if (!store[birthdayId]) {
      store[birthdayId] = {};
    }
    giftIds.forEach((id) => {
      store[birthdayId][id] = (store[birthdayId][id] || 0) + 1;
    });
    setStore(KEYS.VOTES, store);
  },

  async getVoteResults(birthdayId: string): Promise<Record<string, number>> {
    const store = getStore<VoteStore>(KEYS.VOTES, {});
    return store[birthdayId] || {};
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

  // Ownership check
  isOwner(birthdayId: string): boolean {
    const owned = getStore<string[]>(KEYS.OWNED, []);
    return owned.includes(birthdayId);
  },

  // Get birthday without throwing (returns null if not found)
  getBirthdayOrNull(id: string): Birthday | null {
    const store = getStore<BirthdayStore>(KEYS.BIRTHDAYS, {});
    return store[id] || null;
  },

  // Create birthday from URL-encoded data (for guests visiting shared links)
  createBirthdayFromUrl(
    id: string,
    data: { fn: string; on: string; bMin: number; bMax: number; s: string }
  ): Birthday {
    const birthday: Birthday = {
      id,
      friendName: data.fn,
      organizerName: data.on,
      budgetMin: data.bMin,
      budgetMax: data.bMax,
      status: data.s as Birthday['status'],
      date: '',
      organizerEmail: '',
    };

    // Save to guest's localStorage for subsequent visits
    const store = getStore<BirthdayStore>(KEYS.BIRTHDAYS, {});
    store[id] = birthday;
    setStore(KEYS.BIRTHDAYS, store);

    return birthday;
  },
};
