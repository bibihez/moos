import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { MoosMascot } from './components/MoosMascot';
import { QuestionFlow } from './components/QuestionFlow';
import { GiftVoting } from './components/GiftVoting';
import { PersonaReveal } from './components/PersonaReveal';
import { ParticipantThankYou } from './components/ParticipantThankYou';
import { ParticipantList } from './components/ParticipantList';
import { VotingResults } from './components/VotingResults';
import { AppView, Birthday, CORE_QUESTIONS, GiftIdea, Participant, Persona } from './types';
import { storageService } from './services/storageService';
import { generateGiftsAndPersona } from './services/geminiService';
import { Gift, Share2, Sparkles, AlertCircle, MessageCircle } from 'lucide-react';

export default function App() {
  const [view, setViewInternal] = useState<AppView>(AppView.LANDING);

  // View Transition Wrapper
  const setView = (newView: AppView) => {
    if (!document.startViewTransition) {
      setViewInternal(newView);
      return;
    }
    document.startViewTransition(() => {
      setViewInternal(newView);
    });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [currentBirthday, setCurrentBirthday] = useState<Birthday | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [giftIdeas, setGiftIdeas] = useState<GiftIdea[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Form States
  const [createForm, setCreateForm] = useState({
    friendName: '',
    date: '',
    budgetMin: '30',
    budgetMax: '100',
    organizerName: '',
    organizerEmail: ''
  });

  // --- Real-time participant updates ---
  useEffect(() => {
    if (!currentBirthday || view !== AppView.ORGANIZER_DASHBOARD) return;

    const unsubscribe = storageService.subscribeToParticipants(
      currentBirthday.id,
      (updatedParticipants) => {
        setParticipants(updatedParticipants);
      }
    );

    return () => unsubscribe();
  }, [currentBirthday?.id, view]);

  // --- Routing & Init ---
  useEffect(() => {
    // Check hash for "b/{id}" with optional "?token={organizer_token}" for cross-device organizer access
    const checkHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/b/')) {
        // Split hash from query string
        const [hashPath, queryString] = hash.split('?');
        const bId = hashPath.split('#/b/')[1];

        if (bId) {
          setIsLoading(true);
          try {
            // Check for organizer token in URL (for cross-device access)
            if (queryString) {
              const params = new URLSearchParams(queryString);
              const token = params.get('token');
              if (token) {
                storageService.saveTokenFromUrl(bId, token);
              }
            }

            // Fetch birthday from Supabase
            const birthday = await storageService.getBirthdayOrNull(bId);

            if (!birthday) {
              throw new Error('Birthday not found');
            }

            setCurrentBirthday(birthday);

            // Determine view based on status and ownership
            const isOrganizer = storageService.isOwner(bId, birthday.organizerToken);

            if (isOrganizer) {
              // Fetch participants for the dashboard
              const parts = await storageService.getParticipants(bId);
              setParticipants(parts);
              setView(AppView.ORGANIZER_DASHBOARD);
            } else if (birthday.status === 'collecting') {
              setView(AppView.PARTICIPANT_JOIN);
            } else if (birthday.status === 'voting') {
              const gifts = await storageService.getGiftIdeas(bId);
              setGiftIdeas(gifts);
              setView(AppView.VOTING);
            } else if (birthday.status === 'completed') {
              const gifts = await storageService.getGiftIdeasWithVotes(bId);
              setGiftIdeas(gifts);
              setView(AppView.RESULTS);
            }
          } catch (e) {
            setError("Could not find this birthday. It might have expired.");
            setView(AppView.LANDING);
          } finally {
            setIsLoading(false);
          }
        }
      }
    };
    checkHash();
  }, []);

  // --- Handlers ---

  const handleCreateBirthday = async () => {
    if (!createForm.friendName || !createForm.date || !createForm.organizerEmail) {
      setError("Please fill in the essentials!");
      return;
    }

    setIsLoading(true);
    try {
      const newBirthday = await storageService.createBirthday({
        friendName: createForm.friendName,
        date: createForm.date,
        budgetMin: Number(createForm.budgetMin),
        budgetMax: Number(createForm.budgetMax),
        organizerName: createForm.organizerName,
        organizerEmail: createForm.organizerEmail
      });
      setCurrentBirthday(newBirthday);

      // Auto-add organizer as participant (but not answered yet)
      const organizerParticipant = await storageService.joinBirthday(
        newBirthday.id,
        createForm.organizerName
      );
      setParticipantId(organizerParticipant.id);
      setParticipantName(createForm.organizerName);
      setParticipants([organizerParticipant]);

      setView(AppView.ORGANIZER_DASHBOARD);
      // Update URL without reload
      window.history.pushState(null, '', `#/b/${newBirthday.id}`);
    } catch (e) {
      setError("Failed to create the birthday event.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!participantName.trim()) {
      setError("We need your name to know who's answering!");
      return;
    }
    if (!currentBirthday) return;

    setIsLoading(true);
    try {
      const p = await storageService.joinBirthday(currentBirthday.id, participantName);
      setParticipantId(p.id);
      setView(AppView.PARTICIPANT_QUESTIONS);
    } catch (e) {
      setError("Could not join.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionsComplete = async (answers: Record<number, string>) => {
    if (!currentBirthday || !participantId) return;

    setIsLoading(true);
    try {
      await storageService.submitAnswers(currentBirthday.id, participantId, answers);

      // Check if user is organizer
      const isOrganizer = storageService.isOwner(currentBirthday.id);

      if (isOrganizer) {
        // Refresh participants list to show updated status
        const parts = await storageService.getParticipants(currentBirthday.id);
        setParticipants(parts);
        setView(AppView.ORGANIZER_DASHBOARD);
      } else {
        setView(AppView.PARTICIPANT_THANK_YOU);
      }
    } catch (e) {
      setError("Error saving answers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAI = async () => {
    if (!currentBirthday) return;
    setIsLoading(true);
    try {
      // Get all participant answers
      const allAnswers = await storageService.getAllAnswers(currentBirthday.id);
      const participants = await storageService.getParticipants(currentBirthday.id);

      // Create a map of participant IDs to names
      const participantNames: Record<string, string> = {};
      participants.forEach((p) => {
        participantNames[p.id] = p.name;
      });

      // Generate gifts using Gemini
      const { gifts, persona } = await generateGiftsAndPersona(
        currentBirthday.friendName,
        { min: currentBirthday.budgetMin, max: currentBirthday.budgetMax },
        allAnswers,
        participantNames
      );

      // Save the gifts
      await storageService.saveGiftIdeas(currentBirthday.id, gifts);

      // Update birthday status
      const updatedBirthday = await storageService.updateBirthday(currentBirthday.id, {
        status: 'voting',
        persona,
      });

      setGiftIdeas(gifts);
      setCurrentBirthday(updatedBirthday);
      setView(AppView.VOTING);
    } catch (e) {
      console.error('AI generation error:', e);
      setError(e instanceof Error ? e.message : "AI is taking a nap. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteSubmit = async (selectedIds: string[]) => {
    if (!currentBirthday) return;
    setIsLoading(true);
    try {
      await storageService.submitVote(currentBirthday.id, selectedIds);
      // Get updated gifts with vote counts and go to results
      const giftsWithVotes = await storageService.getGiftIdeasWithVotes(currentBirthday.id);
      setGiftIdeas(giftsWithVotes);
      setView(AppView.RESULTS);
    } catch (e) {
      setError("Voting failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!currentBirthday) return;
    setIsLoading(true);
    try {
      const birthday = await storageService.getBirthday(currentBirthday.id);
      setCurrentBirthday(birthday);

      if (birthday.status === 'voting') {
        const gifts = await storageService.getGiftIdeas(birthday.id);
        setGiftIdeas(gifts);
        setView(AppView.VOTING);
      } else if (birthday.status === 'completed') {
        const gifts = await storageService.getGiftIdeasWithVotes(birthday.id);
        setGiftIdeas(gifts);
        setView(AppView.RESULTS);
      }
      // If still 'collecting', stay on thank you screen
    } catch (e) {
      setError("Could not check status.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = (includeOrganizerToken: boolean = false) => {
    if (!currentBirthday) return;

    let url = `${window.location.origin}/#/b/${currentBirthday.id}`;

    // Include organizer token for cross-device organizer access
    if (includeOrganizerToken && currentBirthday.organizerToken) {
      url += `?token=${currentBirthday.organizerToken}`;
    }

    navigator.clipboard.writeText(url);
    alert(includeOrganizerToken
      ? "Organizer link copied! Use this on other devices to manage the birthday."
      : "Link copied to clipboard!");
  };

  // --- Renderers ---

  const renderLanding = () => (
    <Layout title="">
      <Card className="flex flex-col space-y-6 pt-2">
        <div className="flex justify-center mb-2">
          <MoosMascot size={140} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-warm-800">Moos</h2>
          <p className="text-warm-500 text-sm px-4">
            Turn your friend group into gift-finding geniuses.<br />
            <span className="text-soft-gold font-bold">No login required.</span>
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Input
            label="Birthday Person's Name"
            placeholder="e.g. Sarah"
            value={createForm.friendName}
            onChange={e => setCreateForm({ ...createForm, friendName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">Birthday Date</label>
              <input
                type="date"
                value={createForm.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ ...createForm, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:ring-2 focus:ring-soft-gold text-warm-700"
              />
            </div>
            <Input
              label="Organizer (You)"
              placeholder="Your Name"
              value={createForm.organizerName}
              onChange={e => setCreateForm({ ...createForm, organizerName: e.target.value })}
            />
          </div>

          <div className="bg-cream-100 p-4 rounded-xl space-y-3">
            <label className="text-xs font-bold text-warm-500 uppercase">Budget Range (€)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={createForm.budgetMin}
                onChange={e => setCreateForm({ ...createForm, budgetMin: e.target.value })}
                className="w-full p-2 rounded-lg border border-cream-200 text-center font-bold text-warm-700"
              />
              <span className="text-warm-400">-</span>
              <input
                type="number"
                value={createForm.budgetMax}
                onChange={e => setCreateForm({ ...createForm, budgetMax: e.target.value })}
                className="w-full p-2 rounded-lg border border-cream-200 text-center font-bold text-warm-700"
              />
            </div>
          </div>

          <Input
            label="Organizer Email"
            type="email"
            placeholder="To send you the final plan"
            value={createForm.organizerEmail}
            onChange={e => setCreateForm({ ...createForm, organizerEmail: e.target.value })}
          />
        </div>

        {error && <div className="text-red-500 text-sm text-center font-bold">{error}</div>}

        <Button onClick={handleCreateBirthday} isLoading={isLoading}>
          Create Birthday Event
        </Button>
      </Card>
    </Layout>
  );

  const refreshParticipants = async () => {
    if (!currentBirthday) return;
    const parts = await storageService.getParticipants(currentBirthday.id);
    setParticipants(parts);
  };

  const renderDashboard = () => (
    <Layout title={currentBirthday?.friendName + "'s Birthday"}>
      <div className="space-y-6">
        <Card className="space-y-6 text-center py-6">
          <div className="w-14 h-14 bg-cream-100 rounded-full flex items-center justify-center mx-auto">
            <Share2 className="w-7 h-7 text-soft-gold" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-warm-800">Invite the Crew</h3>
            <p className="text-warm-500 text-sm mt-1">
              Share this link with everyone who knows {currentBirthday?.friendName} well.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 bg-cream-50 p-3 rounded-xl border border-dashed border-warm-300">
              <span className="flex-1 text-xs text-warm-400 truncate">
                {window.location.origin}/#/b/{currentBirthday?.id}
              </span>
              <button onClick={() => copyLink(false)} className="text-soft-gold font-bold text-sm hover:text-gold-600">
                Copy
              </button>
            </div>
            <button
              onClick={() => copyLink(true)}
              className="text-xs text-warm-400 hover:text-warm-600 underline"
            >
              Copy organizer link (for your other devices)
            </button>
          </div>
        </Card>

        {/* Participant Tracking */}
        <Card className="py-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-warm-700">Who's Joined</h4>
            <button
              onClick={refreshParticipants}
              className="text-xs text-soft-gold hover:text-warm-700 font-medium"
            >
              Refresh
            </button>
          </div>
          <ParticipantList
            participants={participants}
            friendName={currentBirthday?.friendName || ''}
          />
        </Card>

        {/* Organizer's own input */}
        {(() => {
          const organizerParticipant = participants.find(p => p.name === currentBirthday?.organizerName);
          const hasOrganizerAnswered = organizerParticipant?.hasAnswered;

          return (
            <Card className="py-5">
              <div className="text-center space-y-4">
                <p className="text-xs text-warm-400 uppercase tracking-wider font-bold">Your Input</p>
                {hasOrganizerAnswered ? (
                  <p className="text-sm text-green-600 font-medium">
                    You've shared your thoughts about {currentBirthday?.friendName}!
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-warm-600">
                      Share what you know about {currentBirthday?.friendName} to help the AI.
                    </p>
                    <Button onClick={() => setView(AppView.PARTICIPANT_QUESTIONS)} variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Answer Questions
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })()}

        {/* AI Generation */}
        {(() => {
          const answeredCount = participants.filter(p => p.hasAnswered).length;
          const canGenerate = answeredCount >= 1;

          return (
            <Card className="py-6">
              <div className="text-center space-y-4">
                <p className="text-xs text-warm-400 uppercase tracking-wider font-bold">Generate Gifts</p>
                {answeredCount === 0 ? (
                  <p className="text-sm text-warm-500">
                    Waiting for at least 1 person to answer questions...
                  </p>
                ) : (
                  <p className="text-sm text-warm-600">
                    {answeredCount} {answeredCount === 1 ? 'person has' : 'people have'} answered. Ready to generate!
                  </p>
                )}
                {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
                <Button
                  onClick={handleTriggerAI}
                  isLoading={isLoading}
                  disabled={!canGenerate}
                  className={canGenerate ? "bg-warm-800 hover:bg-warm-900" : "bg-gray-300 cursor-not-allowed"}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate 10 Gift Ideas
                </Button>
              </div>
            </Card>
          );
        })()}
      </div>
    </Layout>
  );

  const renderJoin = () => (
    <Layout title="">
      <Card className="text-center py-10 space-y-6">
        <Gift className="w-16 h-16 text-soft-gold mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-warm-800">Join {currentBirthday?.friendName}'s Birthday</h2>
          <p className="text-warm-500 mt-2">Help us find the perfect gift.</p>
        </div>

        <div className="pt-4 text-left">
          <Input
            label="Your Name"
            placeholder="Who are you?"
            value={participantName}
            onChange={e => setParticipantName(e.target.value)}
          />
        </div>

        <Button onClick={handleJoin} isLoading={isLoading}>
          Start Questions
        </Button>
      </Card>
    </Layout>
  );

  const renderQuestions = () => (
    <div className="min-h-screen bg-cream-50 p-4 pt-8">
      {currentBirthday && (
        <QuestionFlow
          friendName={currentBirthday.friendName}
          questions={CORE_QUESTIONS}
          onComplete={handleQuestionsComplete}
        />
      )}
    </div>
  );

  const renderThankYou = () => (
    currentBirthday && (
      <ParticipantThankYou
        friendName={currentBirthday.friendName}
        participantName={participantName}
        onCheckStatus={handleCheckStatus}
        isLoading={isLoading}
      />
    )
  );

  const renderVoting = () => (
    <Layout title="">
      <div className="space-y-12">
        {currentBirthday?.persona && (
          <PersonaReveal persona={currentBirthday.persona} />
        )}

        <GiftVoting
          gifts={giftIdeas}
          onVoteSubmit={handleVoteSubmit}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );

  const renderResults = () => (
    <Layout title="">
      {currentBirthday && (
        <VotingResults
          gifts={giftIdeas}
          friendName={currentBirthday.friendName}
          onContinueToPayment={() => setView(AppView.PAYMENT)}
        />
      )}
    </Layout>
  );

  const [ibanInput, setIbanInput] = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleSaveIban = async () => {
    if (!currentBirthday || !ibanInput.trim()) return;
    try {
      await storageService.updateIban(currentBirthday.id, ibanInput.trim());
      setCurrentBirthday({ ...currentBirthday, organizerIban: ibanInput.trim() });
    } catch (e) {
      setError("Failed to save IBAN");
    }
  };

  const handleMarkAsPaid = async () => {
    if (!participantId) return;
    setMarkingPaid(true);
    try {
      await storageService.markAsPaid(participantId);
      alert("Thanks! You've been marked as paid.");
    } catch (e) {
      setError("Failed to mark as paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  const renderPayment = () => {
    const isOrganizer = currentBirthday ? storageService.isOwner(currentBirthday.id) : false;

    return (
      <Layout title="Payment Info">
        <Card className="text-center space-y-6 py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-warm-800">Votes Submitted!</h2>
          <p className="text-warm-600">
            The organizer ({currentBirthday?.organizerName}) will review the votes and secure the gift.
          </p>

          <div className="bg-white border border-cream-200 p-6 rounded-2xl shadow-sm text-left space-y-3">
            <h4 className="font-bold text-warm-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" /> Payment Details
            </h4>

            {currentBirthday?.organizerIban ? (
              <>
                <p className="text-sm text-warm-500">Please send your share to:</p>
                <div className="font-mono bg-cream-50 p-3 rounded-lg text-warm-800 text-sm">
                  {currentBirthday.organizerIban}<br />
                  {currentBirthday.organizerName}
                </div>
                <p className="text-xs text-warm-400">Mention "{currentBirthday?.friendName}" in description.</p>
              </>
            ) : isOrganizer ? (
              <div className="space-y-3">
                <p className="text-sm text-warm-500">Add your IBAN so friends can send their share:</p>
                <input
                  type="text"
                  placeholder="e.g. BE12 3456 7890 1234"
                  value={ibanInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIbanInput(e.target.value)}
                  className="w-full p-3 rounded-lg border border-cream-200 text-warm-700 font-mono text-sm"
                />
                <Button onClick={handleSaveIban} variant="outline" className="w-full">
                  Save IBAN
                </Button>
              </div>
            ) : (
              <p className="text-sm text-warm-500 italic">
                The organizer hasn't added payment details yet. Check back later!
              </p>
            )}
          </div>

          {!isOrganizer && currentBirthday?.organizerIban && (
            <Button
              onClick={handleMarkAsPaid}
              isLoading={markingPaid}
              variant="secondary"
            >
              I've Paid My Share
            </Button>
          )}

          <Button variant="outline" onClick={() => setView(AppView.LANDING)}>
            Back to Home
          </Button>
        </Card>
      </Layout>
    );
  };

  return (
    <main className="font-sans antialiased text-warm-700 selection:bg-soft-gold selection:text-white min-h-screen">
      {view === AppView.LANDING && renderLanding()}
      {view === AppView.ORGANIZER_DASHBOARD && renderDashboard()}
      {view === AppView.PARTICIPANT_JOIN && renderJoin()}
      {view === AppView.PARTICIPANT_QUESTIONS && renderQuestions()}
      {view === AppView.PARTICIPANT_THANK_YOU && renderThankYou()}
      {view === AppView.VOTING && renderVoting()}
      {view === AppView.RESULTS && renderResults()}
      {view === AppView.PAYMENT && renderPayment()}
    </main>
  );
}