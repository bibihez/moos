import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Layout } from './Layout';
import { Card } from './Card';
import { Button } from './Button';

interface ParticipantThankYouProps {
  friendName: string;
  participantName: string;
  onCheckStatus: () => void;
  isLoading?: boolean;
}

export const ParticipantThankYou: React.FC<ParticipantThankYouProps> = ({
  friendName,
  participantName,
  onCheckStatus,
  isLoading = false
}) => {
  return (
    <Layout>
      <Card className="text-center">
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-fade-in">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Thank You Message */}
          <div className="space-y-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-warm-700">
              Thank you, {participantName}!
            </h2>
            <p className="text-warm-500 text-lg">
              Your intel has been received.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-cream-100 rounded-2xl p-5 w-full animate-fade-in-up">
            <p className="text-warm-600 text-sm leading-relaxed">
              Your answers will help find the perfect gift for{' '}
              <span className="font-semibold text-warm-700">{friendName}</span>.
              Once everyone has answered, the organizer will generate gift ideas
              and you'll be able to vote on your favorites.
            </p>
          </div>

          {/* Next Steps */}
          <div className="flex items-center gap-3 text-warm-500 animate-fade-in-up">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Check back later to vote on gift ideas</span>
          </div>

          {/* Check Status Button */}
          <Button
            variant="secondary"
            onClick={onCheckStatus}
            isLoading={isLoading}
            className="mt-4"
          >
            Check if voting is open
          </Button>
        </div>
      </Card>
    </Layout>
  );
};
