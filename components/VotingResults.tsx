import React from 'react';
import { Crown, Trophy, Gift } from 'lucide-react';
import { GiftIdea } from '../types';
import { Card } from './Card';
import { Button } from './Button';

interface VotingResultsProps {
  gifts: GiftIdea[];
  friendName: string;
  onContinueToPayment: () => void;
}

export const VotingResults: React.FC<VotingResultsProps> = ({
  gifts,
  friendName,
  onContinueToPayment,
}) => {
  const totalVotes = gifts.reduce((sum, g) => sum + g.votes, 0);
  const winner = gifts[0]; // Already sorted by votes (highest first)

  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-soft-gold/20 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-soft-gold" />
        </div>
        <h2 className="text-2xl font-bold text-warm-800">The Votes Are In!</h2>
        <p className="text-warm-500">
          Here's what everyone thinks {friendName} would love
        </p>
      </div>

      {/* Winner Card */}
      {winner && winner.votes > 0 && (
        <div className="relative bg-gradient-to-br from-soft-gold/10 to-soft-gold/5 border-2 border-soft-gold rounded-2xl p-5 overflow-hidden">
          <div className="absolute top-3 right-3">
            <div className="bg-soft-gold text-warm-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              WINNER
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-soft-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-soft-gold" />
              </div>
              <div>
                <h3 className="font-bold text-warm-800 text-lg">{winner.name}</h3>
                <p className="text-soft-gold font-semibold">{winner.priceEstimate}</p>
              </div>
            </div>
            <p className="text-warm-600 text-sm">{winner.reason}</p>

            {/* Vote count */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 bg-soft-gold/20 rounded-full h-3">
                <div
                  className="bg-soft-gold h-3 rounded-full transition-all duration-500"
                  style={{ width: totalVotes > 0 ? `${(winner.votes / totalVotes) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-semibold text-warm-700">
                {winner.votes} {winner.votes === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Other Results */}
      {gifts.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider">
            Other Options
          </h4>
          <div className="space-y-2">
            {gifts.slice(1).map((gift, index) => (
              <div
                key={gift.id}
                className="flex items-center justify-between py-3 px-4 bg-cream-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-warm-400 font-bold text-sm">#{index + 2}</span>
                  <div>
                    <p className="font-medium text-warm-700">{gift.name}</p>
                    <p className="text-xs text-warm-500">{gift.priceEstimate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-cream-200 rounded-full h-2">
                    <div
                      className="bg-warm-400 h-2 rounded-full"
                      style={{ width: totalVotes > 0 ? `${(gift.votes / totalVotes) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-warm-500 w-12 text-right">
                    {gift.votes} {gift.votes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No votes state */}
      {totalVotes === 0 && (
        <div className="text-center py-6 text-warm-500">
          <p>No votes yet. Share the link so friends can vote!</p>
        </div>
      )}

      {/* Continue Button */}
      <Button onClick={onContinueToPayment} className="mt-4">
        Continue to Payment Info
      </Button>
    </Card>
  );
};
