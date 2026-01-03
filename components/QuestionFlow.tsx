import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot } from 'lucide-react';

interface QuestionFlowProps {
    friendName: string;
    questions: { id: number; text: string }[]; // kept for compatibility but not used
    onComplete: (answers: Record<number, string>) => void;
}

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const QuestionFlow: React.FC<QuestionFlowProps> = ({ friendName, onComplete }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [exchangeCount, setExchangeCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    const systemPrompt = `You are Moos, a friendly gift-finding assistant helping friends find the perfect birthday gift for ${friendName}.

Your goal is to have a natural, warm conversation to learn about ${friendName}'s personality, interests, and what would make them happy.

Guidelines:
- Be conversational and friendly, like chatting with a friend
- Ask ONE question at a time
- React to their answers with brief acknowledgments before asking the next question
- Explore topics like: hobbies, recent obsessions, things they complain about, guilty pleasures, things they'd never buy themselves
- After 5-6 exchanges, wrap up naturally by saying you have enough info
- Keep responses concise (2-3 sentences max)
- Use casual language, occasional emojis are fine

Start by introducing yourself briefly and asking your first question about ${friendName}.`;

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Initialize conversation
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        startConversation();
    }, []);

    const addBotMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text }]);
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    };

    const callAI = async (history: ChatMessage[]): Promise<string> => {
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

        if (!apiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        console.log('Calling OpenRouter with history:', history.length, 'messages');

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Moos Gift Finder',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: history,
                temperature: 0.9,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', response.status, errorData);
            throw new Error(errorData?.error?.message || 'Failed to get AI response');
        }

        const data = await response.json();
        console.log('OpenRouter response:', data);
        return data.choices?.[0]?.message?.content || 'Sorry, I had a hiccup. Could you repeat that?';
    };

    const startConversation = async () => {
        setIsTyping(true);
        try {
            const initialHistory: ChatMessage[] = [
                { role: 'system', content: systemPrompt }
            ];

            const response = await callAI(initialHistory);

            setChatHistory([
                ...initialHistory,
                { role: 'assistant', content: response }
            ]);

            addBotMessage(response);
        } catch (error) {
            console.error('Error starting conversation:', error);
            addBotMessage(`Hi! I'm Moos, here to help find the perfect gift for ${friendName}! 🎁 Tell me, what's something ${friendName} has been really into lately?`);
            setChatHistory([
                { role: 'system', content: systemPrompt },
                { role: 'assistant', content: `Hi! I'm Moos, here to help find the perfect gift for ${friendName}! 🎁 Tell me, what's something ${friendName} has been really into lately?` }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMessage = inputValue.trim();
        addUserMessage(userMessage);
        setInputValue('');
        setIsTyping(true);

        const newExchangeCount = exchangeCount + 1;
        setExchangeCount(newExchangeCount);

        try {
            // Build updated history
            const updatedHistory: ChatMessage[] = [
                ...chatHistory,
                { role: 'user', content: userMessage }
            ];

            // If we've had enough exchanges, tell AI to wrap up
            if (newExchangeCount >= 5) {
                updatedHistory[0] = {
                    role: 'system',
                    content: systemPrompt + '\n\nIMPORTANT: You now have enough information. Thank the user warmly and say you have great ideas for gifts. End with something like "Thanks so much! I have everything I need to find some perfect gifts for [name]!"'
                };
            }

            const response = await callAI(updatedHistory);

            setChatHistory([
                ...updatedHistory,
                { role: 'assistant', content: response }
            ]);

            addBotMessage(response);

            // Check if conversation should end (after 5+ exchanges or AI indicates completion)
            const isComplete = newExchangeCount >= 5 ||
                response.toLowerCase().includes('everything i need') ||
                response.toLowerCase().includes('have enough') ||
                response.toLowerCase().includes("that's all i need");

            if (isComplete) {
                setTimeout(() => {
                    // Convert chat history to answers format for compatibility
                    const conversationText = chatHistory
                        .filter(m => m.role === 'user')
                        .map(m => m.content)
                        .join('\n\n');

                    // Store the full conversation as a single "answer" for gift generation
                    onComplete({
                        1: conversationText,
                        // Also pass the full chat for richer context
                        999: JSON.stringify(chatHistory.filter(m => m.role !== 'system'))
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Error in conversation:', error);
            addBotMessage("Oops, I had a little hiccup! Could you try saying that again?");
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSkip = () => {
        // Allow user to skip/end early
        const conversationText = chatHistory
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n\n');

        onComplete({
            1: conversationText || 'No specific answers provided',
            999: JSON.stringify(chatHistory.filter(m => m.role !== 'system'))
        });
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-cream-200 overflow-hidden">
            {/* Header */}
            <div className="bg-cream-100 p-4 border-b border-cream-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-soft-gold rounded-full flex items-center justify-center mr-3">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-warm-700">Moos Assistant</h3>
                        <p className="text-xs text-warm-500">Helping {friendName}</p>
                    </div>
                </div>
                {exchangeCount >= 2 && (
                    <button
                        onClick={handleSkip}
                        className="text-xs text-warm-400 hover:text-warm-600 underline"
                    >
                        I'm done
                    </button>
                )}
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
                        disabled={isTyping}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-soft-gold text-white p-3 rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
