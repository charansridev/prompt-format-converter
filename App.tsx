import React, { useState, useCallback, useEffect } from 'react';
import { SYSTEM_INSTRUCTION, CONTEXT_STYLES } from './constants';
import { convertPrompt } from './services/geminiService';
import { CodeBlock } from './components/CodeBlock';
import { CustomFormatModal } from './components/CustomFormatModal';
import { FormattedOutput, CustomFormat } from './types';
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
  const [customFormats, setCustomFormats] = useState<CustomFormat[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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

  const handleAddCustomFormat = (name: string, instructions: string) => {
    const newFormat = { name, instructions };
    setCustomFormats(prev => [...prev, newFormat]);
    setSelectedFormats(prev => ({...prev, [name]: true}));
    setIsModalOpen(false);
  };
  
  const handleRemoveCustomFormat = (nameToRemove: string) => {
    setCustomFormats(prev => prev.filter(f => f.name !== nameToRemove));
    setSelectedFormats(prev => {
      const newSelected = {...prev};
      delete newSelected[nameToRemove];
      return newSelected;
    });
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
    // Fallback for custom formats that might not match the regex perfectly
    if (outputs.length === 0 && response.includes('```')) {
      const genericRegex = /🧩\s(.*?)\n💡\s(.*?)\n```(\w*)\n([\s\S]*?)```/g;
      while ((match = genericRegex.exec(response)) !== null) {
        outputs.push({
          title: match[1],
          description: match[2],
          language: match[3].toLowerCase() || 'text',
          code: match[4].trim(),
        });
      }
    }
    return outputs;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const activePredefinedFormats = availableFormats.filter(f => selectedFormats[f]);
    const activeCustomFormats = customFormats.filter(f => selectedFormats[f.name]);
    const allActiveFormatNames = [...activePredefinedFormats, ...activeCustomFormats.map(f => f.name)];

    if (!prompt.trim() || isLoading || allActiveFormatNames.length === 0) return;

    setIsLoading(true);
    setError(null);
    setFormattedOutputs([]);

    try {
      const formatList = allActiveFormatNames.map((format, index) => {
        const displayName = formatDisplayNames[format] || format;
        return `${index + 1}. ${displayName}`;
      }).join('\n');
      
      let customInstructionsBlock = '';
      if (activeCustomFormats.length > 0) {
        const instructionsList = activeCustomFormats
          .map(f => `*   For the "${f.name}" format: ${f.instructions}`)
          .join('\n');
        customInstructionsBlock = `\n\n**Custom Format Instructions:**\nProvide specific outputs for the custom formats listed below, following these user-defined rules:\n${instructionsList}`;
      }

      const fullPrompt = `Convert the following text prompt into ${allActiveFormatNames.length} different structured data prompt formats:\n\n${formatList}\n\nFor each format:\n\n* Provide the format name using the 🧩 emoji as a header. For predefined formats, include their full name in parentheses (e.g., 🧩 JSON (JavaScript Object Notation)). For custom formats, just use the name (e.g., 🧩 My Custom Format).\n* Include a short 1-line description of when this format is best used, prefixed with the 💡 emoji.\n* Ensure proper syntax and indentation within a code block.\n* Preserve the **core logic** and **key attributes** from the text prompt.${customInstructionsBlock}\n\n**Context Style:**\nApply a **${contextStyle}** tone and context to all generated formats.\n\n**Input:**\n"${prompt}"`;
      
      const responseText = await convertPrompt(fullPrompt);
      const parsedData = parseGeminiResponse(responseText);
      setFormattedOutputs(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, selectedFormats, contextStyle, customFormats]);
  
  const handleExampleClick = () => {
    setPrompt("I have three users: (1, Alice, admin), (2, Bob, user), (3, Charlie, guest). Convert this data into structured formats.");
  };

  const hasSelectedFormats = Object.values(selectedFormats).some(v => v);

  return (
    <>
      <CustomFormatModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddFormat={handleAddCustomFormat}
        existingFormats={[...availableFormats, ...customFormats.map(f => f.name)]}
      />
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
                  <div className="flex flex-wrap gap-3 items-center">
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
                    {customFormats.map((format) => (
                      <label key={format.name} className="flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedFormats[format.name] || false}
                          onChange={() => handleFormatToggle(format.name)}
                          className="sr-only peer"
                        />
                        <div className="flex items-center gap-2 pl-4 pr-2 py-2 text-sm font-semibold rounded-full transition-colors duration-200 peer-checked:bg-green-600 peer-checked:text-white bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 peer-checked:dark:bg-green-500 peer-checked:dark:text-white">
                          <span>{format.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveCustomFormat(format.name);
                            }}
                            className="text-white/70 hover:text-white disabled:text-gray-500"
                            aria-label={`Remove ${format.name} format`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      + Add Custom
                    </button>
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
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow" role="alert">
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
    </>
  );
};

export default App;
