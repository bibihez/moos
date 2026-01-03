import React from 'react';
import { Check, Clock, Users } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantListProps {
  participants: Participant[];
  friendName: string;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  friendName,
}) => {
  const answeredCount = participants.filter((p) => p.hasAnswered).length;
  const totalCount = participants.length;

  if (totalCount === 0) {
    return (
      <div className="bg-cream-50 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-warm-400" />
        </div>
        <p className="text-warm-500 text-sm">
          No one has joined yet. Share the link with {friendName}'s friends!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-warm-500" />
          <span className="font-semibold text-warm-700">
            {totalCount} {totalCount === 1 ? 'friend' : 'friends'} joined
          </span>
        </div>
        <div className="text-sm text-warm-500">
          {answeredCount} of {totalCount} answered
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-cream-200 rounded-full h-2 mb-4">
        <div
          className="bg-soft-gold h-2 rounded-full transition-all duration-500"
          style={{ width: totalCount > 0 ? `${(answeredCount / totalCount) * 100}%` : '0%' }}
        />
      </div>

      {/* Participant list */}
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-2 px-3 bg-white rounded-xl"
          >
            <span className="text-warm-700 font-medium">{p.name}</span>
            {p.hasAnswered ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-xs">Done</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-warm-400">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Waiting</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggestion */}
      {answeredCount < 2 && (
        <p className="text-xs text-warm-400 mt-4 text-center">
          Tip: Wait for at least 2 friends to answer for better gift ideas
        </p>
      )}
    </div>
  );
};
