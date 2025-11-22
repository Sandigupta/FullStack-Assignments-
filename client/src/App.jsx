import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import LanguageSelector from './components/LanguageSelector';
import CodeOutput from './components/CodeOutput';
import HistoryPanel from './components/HistoryPanel';
import dotenv from 'dotenv';
dotenv.config();
const API_URL = process.env.REACT_APP_API_URL;

function App() {
    const [theme, setTheme] = useState('light');
    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load history and theme from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('code-copilot-history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));

        const savedTheme = localStorage.getItem('code-copilot-theme');
        if (savedTheme) setTheme(savedTheme);
    }, []);

    // Save history and theme to localStorage
    useEffect(() => {
        localStorage.setItem('code-copilot-history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('code-copilot-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setCode(''); // Clear previous code

        try {
            const response = await fetch(`${API_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, language }),
            });

            const data = await response.json();

            if (data.code) {
                setCode(data.code);

                // Add to history
                const newEntry = {
                    id: Date.now(),
                    prompt,
                    language,
                    code: data.code,
                    timestamp: Date.now(),
                    favorite: false,
                };
                setHistory(prev => [newEntry, ...prev]);
            }
        } catch (error) {
            console.error('Error generating code:', error);
            setCode('// Error: Failed to generate code. Please ensure the backend server is running.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleHistorySelect = (item) => {
        setPrompt(item.prompt);
        setLanguage(item.language);
        setCode(item.code);
        if (window.innerWidth < 1024) setShowHistory(false); // Close on mobile select
    };

    const handleDeleteHistory = (id) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const handleToggleFavorite = (id) => {
        setHistory(prev => prev.map(item =>
            item.id === id ? { ...item, favorite: !item.favorite } : item
        ));
    };

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-secondary-bg transition-colors duration-200">
            <Header theme={theme} toggleTheme={toggleTheme} toggleHistory={() => setShowHistory(!showHistory)} />

            <main className="flex-1 flex overflow-hidden relative">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto lg:overflow-hidden">

                    {/* Left Panel: Input & Settings */}
                    <div className="flex flex-col gap-6 w-full lg:w-1/3 min-w-[300px]">
                        <div className="bg-primary-bg p-6 rounded-2xl shadow-sm border border-border flex-1 flex flex-col gap-6">
                            <LanguageSelector
                                selectedLanguage={language}
                                onSelect={setLanguage}
                            />
                            <div className="flex-1">
                                <PromptInput
                                    prompt={prompt}
                                    setPrompt={setPrompt}
                                    onGenerate={handleGenerate}
                                    isGenerating={isGenerating}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Output */}
                    <div className="flex-1 min-w-[300px] h-[500px] lg:h-auto">
                        <div className="bg-primary-bg p-6 rounded-2xl shadow-sm border border-border h-full">
                            <CodeOutput
                                code={code}
                                language={language}
                                theme={theme}
                                isGenerating={isGenerating}
                            />
                        </div>
                    </div>

                </div>

                {/* Mobile History Backdrop */}
                {showHistory && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setShowHistory(false)}
                    />
                )}

                {/* History Panel */}
                <div className={`
          fixed inset-y-0 right-0 z-30 w-80 bg-primary-bg shadow-2xl transform transition-transform duration-300 ease-in-out
          lg:relative lg:transform-none lg:shadow-none lg:border-l lg:border-border lg:h-full
          ${showHistory ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
                    <HistoryPanel
                        history={history}
                        onSelect={handleHistorySelect}
                        onDelete={handleDeleteHistory}
                        onToggleFavorite={handleToggleFavorite}
                    />
                </div>
            </main>
        </div>
    );
}

export default App;
