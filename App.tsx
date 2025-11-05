import React, { useState, useCallback, useEffect } from 'react';
import { SYSTEM_INSTRUCTION, CONTEXT_STYLES } from './constants';
import { convertPrompt } from './services/geminiService';
import { CodeBlock } from './components/CodeBlock';
import { FormattedOutput } from './types';
import { ThemeToggle } from './components/ThemeToggle';

const availableFormats = ['JSON', 'TOON', 'YAML', 'CSV', 'XML', 'TOML'];

const formatDisplayNames: Record<string, string> = {
  'JSON': "JSON (JavaScript Object Notation)",
  'TOON': "TOON (Token-Oriented Object Notation)",
  'YAML': "YAML (YAML Ain’t Markup Language)",
  'CSV': "CSV (Comma-Separated Values)",
  'XML': "XML (eXtensible Markup Language)",
  'TOML': "TOML (Tom's Obvious Minimal Language)"
};

type SelectedFormats = Record<string, boolean>;
type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    return 'dark';
  }
  return 'light';
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [formattedOutputs, setFormattedOutputs] = useState<FormattedOutput[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<SelectedFormats>(
    availableFormats.reduce((acc, format) => ({ ...acc, [format]: true }), {})
  );
  const [contextStyle, setContextStyle] = useState<string>(CONTEXT_STYLES[0]);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleFormatToggle = (format: string) => {
    setSelectedFormats(prev => ({
      ...prev,
      [format]: !prev[format],
    }));
  };

  const parseGeminiResponse = (response: string): FormattedOutput[] => {
    const outputs: FormattedOutput[] = [];
    const regex = /🧩\s(.*?)\s\((.*?)\)\n💡\s(.*?)\n```(\w*)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(response)) !== null) {
      outputs.push({
        title: `${match[1]} (${match[2]})`,
        description: match[3],
        language: match[4].toLowerCase() || 'text',
        code: match[5].trim(),
      });
    }
    return outputs;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const activeFormats = Object.entries(selectedFormats)
      .filter(([, isSelected]) => isSelected)
      .map(([format]) => format);

    if (!prompt.trim() || isLoading || activeFormats.length === 0) return;

    setIsLoading(true);
    setError(null);
    setFormattedOutputs([]);

    try {
      const formatList = activeFormats.map((format, index) => {
        const displayName = formatDisplayNames[format] || format;
        return `${index + 1}. ${displayName}`;
      }).join('\n');

      const fullPrompt = `Convert the following text prompt into ${activeFormats.length} different structured data prompt formats:\n\n${formatList}\n\nFor each format:\n\n* Include a short 1-line description of when this format is best used.\n* Ensure proper syntax and indentation.\n* If the input describes entities, represent them as objects, rows, or tags depending on the format’s structure.\n* Preserve the **core logic** and **key attributes** from the text prompt.\n\n**Context Style:**\nApply a **${contextStyle}** tone and context to all generated formats.\n\n**Input:**\n"${prompt}"`;
      
      const responseText = await convertPrompt(fullPrompt);
      const parsedData = parseGeminiResponse(responseText);
      setFormattedOutputs(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, selectedFormats, contextStyle]);
  
  const handleExampleClick = () => {
    setPrompt("I have three users: (1, Alice, admin), (2, Bob, user), (3, Charlie, guest). Convert this data into structured formats.");
  };

  const hasSelectedFormats = Object.values(selectedFormats).some(v => v);

  return (
    <div className="min-h-screen font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        <header className="text-center relative">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400 dark:from-blue-400 dark:to-teal-300">
            🧩 Prompt Format Converter
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Instantly convert natural language prompts into multiple structured data formats.
          </p>
          <div className="absolute top-0 right-0">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </header>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  1. Select output formats
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableFormats.map((format) => (
                    <label key={format} className="flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedFormats[format] || false}
                        onChange={() => handleFormatToggle(format)}
                        className="sr-only peer"
                      />
                      <div className="px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 peer-checked:bg-blue-600 peer-checked:text-white bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 peer-checked:dark:bg-blue-500 peer-checked:dark:text-white">
                        {format}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="context-style" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  2. Select context style
                </label>
                <select
                  id="context-style"
                  value={contextStyle}
                  onChange={(e) => setContextStyle(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {CONTEXT_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="prompt-input" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                3. Enter your prompt
              </label>
              <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Generate a product list: Laptop ($1200), Phone ($800), Tablet ($600)"
                className="w-full h-32 p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                rows={4}
              />
              <button
                type="button"
                onClick={handleExampleClick}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Use an example prompt
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <button
                type="submit"
                disabled={isLoading || !prompt.trim() || !hasSelectedFormats}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Converting...
                  </div>
                ) : (
                  'Convert Prompt'
                )}
              </button>
              {!hasSelectedFormats && (
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                   Please select at least one format.
                 </p>
              )}
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-gray-200 dark:bg-gray-700 border-l-4 border-gray-500 text-gray-700 dark:text-gray-300 p-4 rounded-md shadow" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {formattedOutputs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formattedOutputs.map((output, index) => (
              <CodeBlock
                key={index}
                title={output.title}
                description={output.description}
                language={output.language}
                code={output.code}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
