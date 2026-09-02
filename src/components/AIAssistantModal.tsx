import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  lang?: 'en' | 'ta';
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  lang = 'en',
  onClose
}) => {
  const [reportText, setReportText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([]);

  const fetchAiReport = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/swms/ai-audit', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setReportText(data.report);
        } else if (data.error) {
          setErrorMsg(data.error);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMsg(errorData.error || `Server responded with status ${res.status}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg("Failed to connect to Gemini AI report service: " + errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !reportText && !isLoading) {
      fetchAiReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQ = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setChatInput('');

    // Simulate SBM AI expert response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: lang === 'ta'
            ? `[தூய்மை பாரதம் AI பதில்]: "${userQ}" பற்றிய கேள்விக்கு, 100% கதவு சேகரிப்பு, குறுகிய தெருக்களுக்கு சிறிய வாகனங்கள், மற்றும் கழிவு பிரித்தெடுத்தல் விழிப்புணர்வை உறுதிப்படுத்த பரிந்துரைக்கிறோம்.`
            : `[SBM Intelligence Response]: For "${userQ}", under Swachh Bharat Mission (SBM) guidelines, we recommend ensuring 100% door-to-door QR code coverage, deploying BOVs for narrow streets, and conducting wet/dry segregation awareness campaigns for non-compliant doors.`
        }
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-900 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-900 text-white -m-6 mb-2 p-5 rounded-t-2xl flex items-center justify-between flex-shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {lang === 'ta' ? 'ஜெமினி AI தூய்மை பாரதம் தணிக்கை' : 'Gemini AI SBM Sanitary Inspector Audit'}
              </h3>
              <p className="text-xs text-blue-200">
                {lang === 'ta' ? 'திடக் கழிவு மேலாண்மை நேரலை கள ஆய்வு அறிக்கை' : 'Automated Solid Waste Management field analysis & operational report'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content Box */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pt-2">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-blue-950 font-bold">
                {lang === 'ta' ? 'ஜெமினி AI மூலம் நேரலை சேகரிப்புத் தரவு பகுப்பாய்வு செய்யப்படுகிறது...' : 'Analyzing Live Ward Collection Data with Gemini AI...'}
              </p>
              <p className="text-xs text-slate-500">
                {lang === 'ta' ? 'கதவு சேகரிப்பு%, குப்பை பிரிப்பு, மற்றும் தெரு நிலுவைகளை மதிப்பீடு செய்கிறது' : 'Evaluating door coverage, waste segregation %, and street bottlenecks'}
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <p>{errorMsg}</p>
              <button
                onClick={fetchAiReport}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
              >
                {lang === 'ta' ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry AI Report'}
              </button>
            </div>
          ) : (
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-blue-200/80 pb-2">
                <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {lang === 'ta' ? 'தினசரி செயல்பாட்டு தணிக்கை அறிக்கை' : 'SBM Daily Operational Audit Report'}
                </span>
                <button
                  onClick={fetchAiReport}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  {lang === 'ta' ? 'புதுப்பிக்கவும்' : 'Refresh Audit'}
                </button>
              </div>

              <div className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                {reportText}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white ml-8 shadow-sm font-medium'
                      : 'bg-slate-100 text-slate-800 border border-slate-200 mr-8 font-normal'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Ask AI Form */}
        <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-slate-200 flex-shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={lang === 'ta' ? 'AI ஆய்வாளரிடம் கேள்விகளைக் கேட்கவும்...' : 'Ask AI Inspector about SBM guidelines, route optimization...'}
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
