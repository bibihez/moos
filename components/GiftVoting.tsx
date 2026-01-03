import React, { useState } from 'react';
import { GiftIdea } from '../types';
import { Button } from './Button';
import { Heart, ExternalLink, CheckCircle } from 'lucide-react';
import { Card } from './Card';

interface GiftVotingProps {
    gifts: GiftIdea[];
    onVoteSubmit: (selectedGiftIds: string[]) => void;
    isLoading?: boolean;
}

export const GiftVoting: React.FC<GiftVotingProps> = ({ gifts, onVoteSubmit, isLoading }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleVote = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            if (next.size >= 3) {
                alert("You can only choose up to 3 favorites!");
                return;
            }
            next.add(id);
        }
        setSelectedIds(next);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 pb-20">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-warm-700">Vote for the Best</h2>
                <p className="text-warm-500">Select your top 3 favorites. We'll get the winner.</p>
            </div>

            <div className="grid gap-4">
                {gifts.map(gift => {
                    const isSelected = selectedIds.has(gift.id);
                    return (
                        <div
                            key={gift.id}
                            onClick={() => toggleVote(gift.id)}
                            className={`
                relative bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md
                ${isSelected ? 'border-soft-gold shadow-float bg-orange-50' : 'border-transparent shadow-soft hover:border-cream-200'}
              `}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-bold text-lg text-warm-800">{gift.name}</h3>
                                        <span className="bg-cream-100 text-warm-600 text-xs px-2 py-1 rounded-full font-medium">
                                            {gift.priceEstimate}
                                        </span>
                                    </div>
                                    <p className="text-sm text-warm-600 leading-relaxed">{gift.reason}</p>
                                </div>

                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${isSelected ? 'bg-soft-gold text-white' : 'bg-cream-100 text-warm-300'}
                `}>
                                    {isSelected ? <CheckCircle className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 p-4 shadow-lg-up">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <span className="text-sm font-bold text-warm-500">
                        {selectedIds.size} / 3 selected
                    </span>
                    <Button
                        onClick={() => onVoteSubmit(Array.from(selectedIds))}
                        disabled={selectedIds.size === 0}
                        isLoading={isLoading}
                        className="!w-auto px-8"
                    >
                        Submit Votes
                    </Button>
                </div>
            </div>
        </div>
    );
};
