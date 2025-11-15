import React, { useState, useRef, useEffect } from 'react';
import Modal from './common/Modal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { generateEnhancedContext } from '../services/geminiService';
import { Sparkles, Send, LoaderCircle, User, Bot } from 'lucide-react';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

type Message = {
    role: 'user' | 'model';
    content: string;
};

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
    const { businesses, activeBusinessId, pricedItems, recipes, menuItems, suppliers, staffMembers, overheads, calculateRecipeCostBreakdown } = useData();
    const { currency, formatCurrency } = useCurrency();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeBusiness = businesses.find(b => b.id === activeBusinessId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
      // Reset messages when modal is opened
      if(isOpen) {
        setMessages([]);
      }
    }, [isOpen]);

    const summarizeBusinessData = () => {
        let summary = `## Business Overview\n`;
        summary += `- Business Name: ${activeBusiness?.name}\n`;
        summary += `- Currency: ${currency}\n\n`;

        summary += `## Data Summary\n`;
        summary += `- Priced Items: ${pricedItems.length}\n`;
        summary += `- Recipes: ${recipes.length}\n`;
        summary += `- Menu Items: ${menuItems.length}\n`;
        summary += `- Suppliers: ${suppliers.length}\n`;
        summary += `- Staff Members: ${staffMembers.length}\n`;
        summary += `- Overhead Costs: ${overheads.length}\n\n`;

        summary += `## Top 5 Most Expensive Priced Items\n`;
        [...pricedItems].sort((a, b) => b.unitCost - a.unitCost).slice(0, 5).forEach(item => {
            summary += `- ${item.name}: ${formatCurrency(item.unitCost)} per ${item.unit}\n`;
        });
        summary += `\n`;

        summary += `## Menu Items & Profitability\n`;
        menuItems.slice(0, 10).forEach(item => {
            const recipe = recipes.find(r => r.id === item.recipeId);
            const { costPerServing } = calculateRecipeCostBreakdown(recipe);
            const profit = item.salePrice - costPerServing;
            summary += `- ${item.name}: Sells for ${formatCurrency(item.salePrice)}, costs ${formatCurrency(costPerServing)}, profit ${formatCurrency(profit)}\n`;
        });
        summary += `\n`;

        return summary;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const dataSummary = summarizeBusinessData();
        const response = await generateEnhancedContext(input, dataSummary);

        const modelMessage: Message = { role: 'model', content: response };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    const handleExampleClick = (prompt: string) => {
        setInput(prompt);
    };

    const examplePrompts = [
        "What's my most profitable menu item?",
        "Which recipes use 'Chicken Breast (Halal)'?",
        "List my suppliers.",
        "Summarize my overhead costs.",
    ];
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant">
            <div className="flex flex-col h-[65vh]">
                <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center p-4">
                            <Sparkles size={40} className="mx-auto text-[var(--color-primary)]" />
                            <h3 className="mt-2 font-semibold text-lg">Ask me anything about your business</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">Here are some examples to get you started:</p>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {examplePrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleExampleClick(prompt)}
                                        className="p-3 bg-[var(--color-input)] rounded-lg hover:bg-[var(--color-border)] text-left"
                                    >
                                        "{prompt}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center"><Bot size={18} className="text-[var(--color-primary)]"/></div>}
                                <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-input)]'}`}>
                                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                                </div>
                                {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-input)] flex items-center justify-center"><User size={18} className="text-[var(--color-text-secondary)]"/></div>}
                            </div>
                        ))
                    )}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center"><Bot size={18} className="text-[var(--color-primary)]"/></div>
                            <div className="max-w-md p-3 rounded-lg bg-[var(--color-input)] flex items-center space-x-2">
                                <LoaderCircle size={16} className="animate-spin text-[var(--color-text-muted)]"/>
                                <span className="text-sm text-[var(--color-text-muted)]">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="mt-4 flex items-center gap-2 pt-4 border-t border-[var(--color-border)]">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question about your data..."
                        className="ican-input flex-1"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className={`ican-btn ican-btn-primary p-3 ${!input.trim() || isLoading ? 'ican-btn-disabled' : ''}`}>
                       {isLoading ? <LoaderCircle size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AIAssistant;
