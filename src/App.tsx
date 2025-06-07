import React, { useState, useEffect } from 'react';
import { Search, Volume2, BookOpen, Loader2, AlertCircle } from 'lucide-react';

interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface Phonetic {
  text?: string;
  audio?: string;
}

interface WordData {
  word: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  origin?: string;
}

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const searchWord = async (word: string) => {
    if (!word.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error('Word not found');
      }

      const data = await response.json();
      setWordData(data[0]);
      
      // Add to search history
      setSearchHistory(prev => {
        const updated = [word, ...prev.filter(item => item !== word)].slice(0, 5);
        return updated;
      });
    } catch (err) {
      setError('Word not found. Please check the spelling and try again.');
      setWordData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchWord(searchTerm);
  };

  const pronounceWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      // Fallback to speech synthesis if audio fails
      pronounceWord(wordData?.word || '');
    });
  };

  const getPartOfSpeechColor = (pos: string) => {
    const colors: { [key: string]: string } = {
      'noun': 'bg-blue-100 text-blue-800',
      'verb': 'bg-green-100 text-green-800',
      'adjective': 'bg-purple-100 text-purple-800',
      'adverb': 'bg-orange-100 text-orange-800',
      'pronoun': 'bg-pink-100 text-pink-800',
      'preposition': 'bg-indigo-100 text-indigo-800',
      'conjunction': 'bg-yellow-100 text-yellow-800',
      'interjection': 'bg-red-100 text-red-800',
    };
    return colors[pos.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    // Load search history from localStorage
    const saved = localStorage.getItem('dictionaryHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save search history to localStorage
    localStorage.setItem('dictionaryHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-white mr-3" />
            <h1 className="text-5xl font-bold text-white">WordWise</h1>
          </div>
          <p className="text-xl text-gray-300">Discover meanings and master pronunciations</p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter an English word..."
                className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-transparent bg-white/10 backdrop-blur-md text-white placeholder-gray-300 focus:outline-none focus:border-white/30 focus:bg-white/20 transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-300 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(term);
                      searchWord(term);
                    }}
                    className="px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full text-sm hover:bg-white/20 transition-all duration-300"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Word Result */}
        {wordData && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              {/* Word Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">{wordData.word}</h2>
                  {wordData.phonetics.length > 0 && wordData.phonetics[0].text && (
                    <p className="text-xl text-gray-300 font-mono">{wordData.phonetics[0].text}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  {wordData.phonetics.find(p => p.audio) && (
                    <button
                      onClick={() => {
                        const audioPhonetic = wordData.phonetics.find(p => p.audio);
                        if (audioPhonetic?.audio) {
                          playAudio(audioPhonetic.audio);
                        }
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span className="hidden sm:inline">Play Audio</span>
                    </button>
                  )}
                  <button
                    onClick={() => pronounceWord(wordData.word)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span className="hidden sm:inline">Pronounce</span>
                  </button>
                </div>
              </div>

              {/* Origin */}
              {wordData.origin && (
                <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">Origin</h3>
                  <p className="text-gray-300">{wordData.origin}</p>
                </div>
              )}

              {/* Meanings */}
              <div className="space-y-8">
                {wordData.meanings.map((meaning, meaningIndex) => (
                  <div key={meaningIndex} className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPartOfSpeechColor(meaning.partOfSpeech)}`}>
                        {meaning.partOfSpeech}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {meaning.definitions.map((definition, defIndex) => (
                        <div key={defIndex} className="pl-6 border-l-2 border-white/20">
                          <p className="text-gray-200 text-lg leading-relaxed mb-2">
                            <span className="text-white font-medium">{defIndex + 1}.</span> {definition.definition}
                          </p>
                          
                          {definition.example && (
                            <p className="text-gray-400 italic text-base mb-3">
                              <span className="font-medium">Example:</span> "{definition.example}"
                            </p>
                          )}

                          {definition.synonyms && definition.synonyms.length > 0 && (
                            <div className="mb-2">
                              <span className="text-green-400 font-medium text-sm">Synonyms: </span>
                              <span className="text-gray-300 text-sm">
                                {definition.synonyms.slice(0, 5).join(', ')}
                              </span>
                            </div>
                          )}

                          {definition.antonyms && definition.antonyms.length > 0 && (
                            <div>
                              <span className="text-red-400 font-medium text-sm">Antonyms: </span>
                              <span className="text-gray-300 text-sm">
                                {definition.antonyms.slice(0, 5).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-400">
            Powered by{' '}
            <a 
              href="https://dictionaryapi.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
            >
              Free Dictionary API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;