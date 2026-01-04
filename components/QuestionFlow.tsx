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

// n8n webhook URL for the Moos AI agent
const N8N_WEBHOOK_URL = 'https://bibihez.app.n8n.cloud/webhook/426ea6b1-48d0-4e66-91a1-4cd6367d002e';

// Generate a unique session ID for each conversation
const generateSessionId = () => `moos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const QuestionFlow: React.FC<QuestionFlowProps> = ({ friendName, onComplete }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [exchangeCount, setExchangeCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    // Unique session ID for this conversation - created once per component mount
    const sessionIdRef = useRef<string>(generateSessionId());

    // Track conversation for final export
    const conversationRef = useRef<{ role: string; content: string }[]>([]);

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
        conversationRef.current.push({ role: 'assistant', content: text });
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
        conversationRef.current.push({ role: 'user', content: text });
    };

    const callMoosAgent = async (message: string, isFirstMessage: boolean = false): Promise<string> => {
        console.log('Calling Moos agent with sessionId:', sessionIdRef.current);

        const payload = {
            sessionId: sessionIdRef.current,
            chatInput: isFirstMessage
                ? `My friend's name is ${friendName}. Please introduce yourself and start asking questions about them.`
                : message,
            friendName: friendName,
        };

        console.log('Payload:', payload);

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('n8n webhook error:', response.status, errorText);
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        console.log('Moos agent response:', data);

        // n8n AI Agent returns the response in the output field
        return data.output || data.response || data.text || 'Sorry, I had a hiccup. Could you repeat that?';
    };

    const startConversation = async () => {
        setIsTyping(true);
        try {
            const response = await callMoosAgent('', true);
            addBotMessage(response);
        } catch (error) {
            console.error('Error starting conversation:', error);
            const fallbackMessage = `Hi! I'm Moos, here to help find the perfect gift for ${friendName}! 🎁 Tell me, what's something ${friendName} has been really into lately?`;
            addBotMessage(fallbackMessage);
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
            const response = await callMoosAgent(userMessage);
            addBotMessage(response);

            // Check if conversation should end
            const isComplete = newExchangeCount >= 5 ||
                response.toLowerCase().includes('everything i need') ||
                response.toLowerCase().includes('have enough') ||
                response.toLowerCase().includes("that's all i need");

            if (isComplete) {
                setTimeout(() => {
                    const conversationText = conversationRef.current
                        .filter(m => m.role === 'user')
                        .map(m => m.content)
                        .join('\n\n');

                    onComplete({
                        1: conversationText,
                        999: JSON.stringify(conversationRef.current)
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
        const conversationText = conversationRef.current
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n\n');

        onComplete({
            1: conversationText || 'No specific answers provided',
            999: JSON.stringify(conversationRef.current)
        });
    };

    return (
        <div className="flex flex-col h-[100dvh] sm:h-[600px] w-full max-w-lg mx-auto bg-white sm:rounded-3xl shadow-xl sm:border border-cream-200 overflow-hidden">
            {/* Header */}
            <div className="bg-cream-100 p-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-cream-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-8 sm:h-8 bg-soft-gold rounded-full flex items-center justify-center mr-3">
                        <Bot className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-warm-700 text-base sm:text-sm">Moos Assistant</h3>
                        <p className="text-sm sm:text-xs text-warm-500">Helping {friendName}</p>
                    </div>
                </div>
                {exchangeCount >= 2 && (
                    <button
                        onClick={handleSkip}
                        className="text-sm sm:text-xs text-warm-400 hover:text-warm-600 underline py-2 px-3 -mr-2 min-h-[44px] flex items-center"
                    >
                        I'm done
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 sm:space-y-4 bg-gray-50 overscroll-contain">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-3 rounded-2xl text-base sm:text-sm leading-relaxed ${msg.sender === 'user'
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
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-cream-200">
                <div className="flex items-end space-x-3">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer..."
                        className="flex-1 resize-none border border-cream-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-soft-gold focus:border-transparent min-h-[52px] max-h-[120px] text-base sm:text-sm text-warm-700 placeholder-warm-300 bg-cream-50"
                        rows={2}
                        disabled={isTyping}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-soft-gold text-white p-3 rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md min-w-[48px] min-h-[48px] flex items-center justify-center"
                    >
                        <Send className="w-6 h-6 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
