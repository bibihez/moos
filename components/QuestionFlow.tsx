import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Question } from '../types';
import { Send, User as UserIcon, Bot } from 'lucide-react';

interface QuestionFlowProps {
    friendName: string;
    questions: Question[];
    onComplete: (answers: Record<number, string>) => void;
}

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
}

export const QuestionFlow: React.FC<QuestionFlowProps> = ({ friendName, questions, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        addBotMessage(`Hi! Let's find the perfect gift for ${friendName}. I have 6 quick questions.`);
        setTimeout(() => {
            askQuestion(0);
        }, 1000);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const addBotMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text }]);
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    };

    const askQuestion = (index: number) => {
        if (index >= questions.length) {
            finish();
            return;
        }
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const q = questions[index];
            // Replace [name] in question text
            const text = q.text.replace('[name]', friendName);
            addBotMessage(text);
        }, 1200);
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const answer = inputValue.trim();
        addUserMessage(answer);
        setInputValue('');

        // Save answer
        const qId = questions[currentQuestionIndex].id;
        setAnswers(prev => ({ ...prev, [qId]: answer }));

        // Move to next
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        askQuestion(nextIndex);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const finish = () => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            addBotMessage("Thanks! That's super helpful. I'll combine this with everyone else's answers to find some gems.");
            setTimeout(() => {
                onComplete(answers);
            }, 2000);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-cream-200 overflow-hidden">
            {/* Header */}
            <div className="bg-cream-100 p-4 border-b border-cream-200 flex items-center shadow-sm">
                <div className="w-8 h-8 bg-soft-gold rounded-full flex items-center justify-center mr-3">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-warm-700">Moos Assistant</h3>
                    <p className="text-xs text-warm-500">Helping {friendName}</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-soft-gold text-white rounded-br-none shadow-md'
                                    : 'bg-white text-warm-700 border border-cream-200 rounded-bl-none shadow-sm'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-cream-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-1 items-center">
                            <div className="w-2 h-2 bg-warm-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-warm-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-warm-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-cream-200">
                <div className="flex items-end space-x-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer..."
                        className="flex-1 resize-none border border-cream-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-soft-gold focus:border-transparent min-h-[50px] max-h-[120px] text-warm-700 placeholder-warm-300 bg-cream-50"
                        rows={2}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="bg-soft-gold text-white p-3 rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-center text-xs text-warm-300 mt-2">
                    Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
                </p>
            </div>
        </div>
    );
};
