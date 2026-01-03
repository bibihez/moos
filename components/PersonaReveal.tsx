import React from 'react';
import { Persona } from '../types';
import { Card } from './Card';
import { Sparkles, Quote } from 'lucide-react';

interface PersonaRevealProps {
    persona: Persona;
}

export const PersonaReveal: React.FC<PersonaRevealProps> = ({ persona }) => {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2 mb-4">
                <div className="inline-flex items-center space-x-2 bg-soft-gold/10 text-soft-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Vibe Check</span>
                </div>
                <h2 className="text-3xl font-bold text-warm-800">{persona.vibe}</h2>
            </div>

            <Card className="overflow-hidden p-0 border-none shadow-premium bg-white/40 backdrop-blur-md">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/5 relative">
                        <img
                            src={persona.imageUrl}
                            alt="AI Persona"
                            className="w-full h-full object-cover min-h-[300px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>

                    <div className="md:w-3/5 p-8 flex flex-col justify-center space-y-6">
                        <div className="relative">
                            <Quote className="w-8 h-8 text-cream-200 absolute -top-4 -left-4 -z-10" />
                            <p className="text-lg text-warm-700 leading-relaxed italic">
                                {persona.description}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-cream-100">
                            <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mb-3">Key Personality Traits</p>
                            <div className="flex flex-wrap gap-2">
                                {persona.traits.map((trait, i) => (
                                    <span
                                        key={i}
                                        className="bg-cream-100 text-warm-600 px-3 py-1.5 rounded-xl text-sm font-medium border border-cream-200/50"
                                    >
                                        #{trait}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="text-center pt-4">
                <p className="text-sm text-warm-500 font-medium">
                    Based on these vibes, here's what the crew thinks would be perfect...
                </p>
            </div>
        </div>
    );
};
