"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { DemoNotice } from "../components/DemoNotice";

type Engine = 'chatgpt' | 'claude' | 'perplexity' | 'gemini';

interface PromptData {
  id: string;
  query: string;
  engines: Engine[];
  lastChecked: string;
  status: 'cited' | 'not cited';
}

const initialPrompts: PromptData[] = [
  { id: '1', query: "best AI visibility tracking tool", engines: ['chatgpt', 'claude', 'perplexity', 'gemini'], lastChecked: "09 Jun 2026", status: 'not cited' },
  { id: '2', query: "AI citation tracker for content marketers", engines: ['chatgpt', 'perplexity'], lastChecked: "08 Jun 2026", status: 'cited' },
  { id: '3', query: "monitor brand presence in Claude and Gemini", engines: ['claude', 'gemini'], lastChecked: "08 Jun 2026", status: 'not cited' },
  { id: '4', query: "alternatives to Promptwatch", engines: ['chatgpt', 'gemini'], lastChecked: "07 Jun 2026", status: 'cited' },
  { id: '5', query: "GEO platforms comparison", engines: ['chatgpt', 'perplexity'], lastChecked: "07 Jun 2026", status: 'not cited' },
  { id: '6', query: "how to track if my brand shows up in Claude", engines: ['claude', 'chatgpt', 'gemini'], lastChecked: "06 Jun 2026", status: 'not cited' },
  { id: '7', query: "AI search analytics 2026", engines: ['chatgpt', 'claude', 'perplexity', 'gemini'], lastChecked: "06 Jun 2026", status: 'cited' },
  { id: '8', query: "ChatGPT optimization platforms 2026", engines: ['chatgpt', 'perplexity'], lastChecked: "05 Jun 2026", status: 'not cited' },
  { id: '9', query: "Perplexity SEO tools", engines: ['perplexity', 'claude'], lastChecked: "05 Jun 2026", status: 'cited' },
  { id: '10', query: "track competitor mentions in ChatGPT", engines: ['chatgpt'], lastChecked: "04 Jun 2026", status: 'not cited' }
];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptData[]>(initialPrompts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (isModalOpen && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      dialog.current.querySelector<HTMLInputElement>("#example-prompt")?.focus();
    }
    if (!isModalOpen && dialog.current?.open) dialog.current.close();
  }, [isModalOpen]);
  const [newPromptText, setNewPromptText] = useState('');
  const [selectedEngines, setSelectedEngines] = useState<Record<Engine, boolean>>({
    chatgpt: true,
    claude: true,
    perplexity: true,
    gemini: true
  });

  const getEngineColor = (engine: Engine) => {
    switch (engine) {
      case 'chatgpt': return 'text-[#10A37F]';
      case 'claude': return 'text-[#D4A843]';
      case 'perplexity': return 'text-[#1FB8CD]';
      case 'gemini': return 'text-[#4285F4]';
      default: return 'text-[#0A0A0A]';
    }
  };

  const handleAddPrompt = () => {
    if (!newPromptText.trim()) return;

    const activeEngines = (Object.keys(selectedEngines) as Engine[]).filter(e => selectedEngines[e as Engine]) as Engine[];
    if (activeEngines.length === 0) return;

    const newPrompt: PromptData = {
      id: Date.now().toString(),
      query: newPromptText,
      engines: activeEngines,
      lastChecked: "09 Jun 2026",
      status: 'not cited'
    };

    setPrompts([newPrompt, ...prompts]);
    setIsModalOpen(false);
    setNewPromptText('');
    setSelectedEngines({ chatgpt: true, claude: true, perplexity: true, gemini: true });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.target === e.currentTarget && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="dashboard-page">
      <DemoNotice />
      <div className="flex justify-between items-end mb-2">
        <h1 className="dashboard-title">
          PROMPTS
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#333333] transition-colors rounded-none text-white text-sm font-medium px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ADD EXAMPLE PROMPT
        </button>
      </div>
      <div className="font-dm-mono text-xs text-[#6B6560] mb-8 uppercase tracking-wider">
        {prompts.length} EXAMPLE PROMPTS · {new Set(prompts.flatMap(p => p.engines)).size} EXAMPLE ENGINES
      </div>

      {prompts.length === 0 ? (
        <div className="border border-[#E0DDD8] p-16 flex flex-col items-center justify-center text-center">
          <h2 className="font-barlow-condensed text-xl font-bold mb-2">NO EXAMPLE PROMPTS</h2>
          <p className="font-dm-sans text-sm text-[#6B6560] mb-6">Add an example prompt to explore this preview. No monitoring is performed.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#333333] transition-colors rounded-none text-white text-sm font-medium px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            ADD EXAMPLE PROMPT
          </button>
        </div>
      ) : (
        <div role="region" aria-label="Example prompts table, scroll horizontally on small screens" tabIndex={0} className="w-full overflow-x-auto">
          <table className="w-full text-left border border-[#E0DDD8] border-collapse min-w-[800px]">
            <caption className="sr-only">Example prompts, engines, dates and simulated citation statuses; no real monitoring</caption>
            <thead>
              <tr className="border-b border-[#E0DDD8]">
                <th className="py-3 px-4 w-[50%] text-xs font-semibold tracking-widest text-[#E63946] uppercase">PROMPT</th>
                <th className="py-3 px-4 w-[20%] text-xs font-semibold tracking-widest text-[#E63946] uppercase">ENGINES</th>
                <th className="py-3 px-4 w-[15%] text-xs font-semibold tracking-widest text-[#E63946] uppercase">LAST CHECKED</th>
                <th className="py-3 px-4 w-[15%] text-xs font-semibold tracking-widest text-[#E63946] uppercase">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p.id} className="border-b border-[#E0DDD8] hover:bg-[#FAF9F7] transition-colors">
                  <td className="py-4 px-4 text-sm font-medium truncate max-w-xs">{p.query}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-nowrap gap-1">
                      {p.engines.map(engine => (
                        <span key={engine} className={`text-[11px] border border-[#E0DDD8] px-1.5 py-0.5 capitalize bg-white ${getEngineColor(engine)}`}>
                          {engine}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-dm-mono text-xs text-[#6B6560] whitespace-nowrap">{p.lastChecked}</td>
                  <td className="py-4 px-4">
                    {p.status === 'cited' ? (
                      <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2 py-0.5 text-xs whitespace-nowrap rounded-none">
                        <Check className="w-3 h-3" /> Cited
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] px-2 py-0.5 text-xs whitespace-nowrap rounded-none">
                        <X className="w-3 h-3" /> Not Cited
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        <dialog ref={dialog} aria-labelledby="example-prompt-title" onClose={() => setIsModalOpen(false)}
          className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto border border-black bg-white p-0 text-black backdrop:bg-black/40"
          onClick={handleBackdropClick}
        >
          <div className="relative p-6 md:p-8">
            <button 
              type="button" aria-label="Close example prompt"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 flex min-h-11 min-w-11 items-center justify-center text-[#6B6560] hover:text-[#0A0A0A]"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="example-prompt-title" className="pr-10 font-condensed font-bold text-2xl uppercase mb-1">ADD EXAMPLE PROMPT</h2>
            <p className="font-dm-sans text-sm text-[#6B6560] mb-6">Enter an example query to preview the layout. It will not be sent to any AI engine.</p>
            
            <label htmlFor="example-prompt" className="mb-2 block text-sm font-medium">Example query</label>
            <input id="example-prompt"
              type="text"
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              placeholder="e.g. best AI visibility tracking tool"
              className="w-full border border-[#0A0A0A] rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] mb-6"
            />
            
            <fieldset className="mb-8">
              <legend className="block text-xs font-semibold tracking-widest text-[#E63946] uppercase mb-3">SELECT EXAMPLE ENGINES</legend>
              <div className="flex flex-col gap-3">
                {(['chatgpt', 'claude', 'perplexity', 'gemini'] as Engine[]).map(engine => (
                  <label key={engine} className="flex min-h-11 items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedEngines[engine]}
                      onChange={(e) => setSelectedEngines({...selectedEngines, [engine]: e.target.checked})}
                      className="w-4 h-4 rounded-none border-[#0A0A0A] text-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] cursor-pointer accent-[#0A0A0A]"
                    />
                    <span className={`text-sm capitalize font-medium ${getEngineColor(engine)}`}>{engine}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="border border-[#0A0A0A] text-[#0A0A0A] hover:bg-gray-50 transition-colors rounded-none text-sm font-medium px-4 py-2"
              >
                CANCEL
              </button>
              <button 
                onClick={handleAddPrompt}
                disabled={!newPromptText.trim() || !Object.values(selectedEngines).some(Boolean)}
                className="bg-[#0A0A0A] border border-[#0A0A0A] text-white hover:bg-[#333333] transition-colors rounded-none text-sm font-medium px-4 py-2"
              >
                ADD EXAMPLE PROMPT
              </button>
            </div>
          </div>
        </dialog>
    </div>
  );
}
