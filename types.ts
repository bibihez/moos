export interface Persona {
  vibe: string;
  description: string;
  traits: string[];
  imageUrl: string;
}

export enum AppView {
  LANDING = 'LANDING',
  CREATE_BIRTHDAY = 'CREATE_BIRTHDAY',
  PARTICIPANT_JOIN = 'PARTICIPANT_JOIN',
  PARTICIPANT_QUESTIONS = 'PARTICIPANT_QUESTIONS',
  PARTICIPANT_THANK_YOU = 'PARTICIPANT_THANK_YOU',
  ORGANIZER_DASHBOARD = 'ORGANIZER_DASHBOARD',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS',
  PAYMENT = 'PAYMENT'
}

export interface Birthday {
  id: string;
  friendName: string;
  date: string;
  budgetMin: number;
  budgetMax: number;
  organizerName: string;
  organizerEmail: string;
  organizerIban?: string;
  organizerToken?: string;
  status: 'collecting' | 'voting' | 'completed';
  persona?: Persona;
}

export interface Participant {
  id: string;
  name: string;
  hasPaid: boolean;
  hasAnswered: boolean;
  answeredAt?: string;
}

export interface GiftIdea {
  id: string;
  name: string;
  priceEstimate: string;
  reason: string;
  votes: number;
  purchaseLink?: string;
  imageUrl?: string;
}

export interface Question {
  id: number;
  text: string;
  helper?: string;
}

export const CORE_QUESTIONS: Question[] = [
  { id: 1, text: "What has [name] been talking about or obsessing over lately?", helper: "Think about topics, hobbies, or specific items." },
  { id: 2, text: "What's something they keep saying they'll do but haven't yet?", helper: "A trip? A project? A skill to learn?" },
  { id: 3, text: "What's a small thing that makes them unreasonably happy?", helper: "A specific snack, a type of pen, a sound?" },
  { id: 4, text: "What do they complain about?", helper: "Problems we can solve with a gadget or tool." },
  { id: 5, text: "What would they never buy for themselves but secretly want?", helper: "Something too luxurious or 'silly' to justify." },
  { id: 6, text: "Anything else we should know to find the perfect gift?", helper: "Any clear 'do not buy' list?" }
];
