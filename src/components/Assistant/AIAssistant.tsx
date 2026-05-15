import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Send, X, MessageSquare, Loader2, Volume2, Camera, Video, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../../services/geminiService';
import { dataService } from '../../services/dataService';
import IncidentReport from './IncidentReport';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Chào bạn! Tôi là TallyPort AI. Tôi có thể giúp gì cho bạn về tiến độ hàng hóa hoặc báo cáo sự cố?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch comprehensive system state for context-aware AI
      const [tickets, holds] = await Promise.all([
        dataService.getTickets(),
        dataService.getHoldProgress()
      ]);

      const totalTarget = holds.reduce((acc, h) => acc + h.ke_hoach_tan, 0);
      const totalCurrent = holds.reduce((acc, h) => acc + h.tong_hang, 0);
      const progress = ((totalCurrent / (totalTarget || 1)) * 100).toFixed(1);
      const tallyCount = tickets.filter(t => t.tally_checked).length;

      const systemState = {
        totalTarget,
        totalCurrent,
        progress,
        holds: holds.map(h => ({ 
          id: h.ham_so, 
          current: h.tong_hang, 
          target: h.ke_hoach_tan, 
          status: h.trang_thai_ham 
        })),
        tallyCount
      };
      
      const response = await geminiService.getChatResponse(userMessage, systemState);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Text to Speech
      try {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.1; // Slightly faster for professional feel
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis error:", err);
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, tôi gặp trục trặc khi truy xuất dữ liệu hệ thống. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Removed alert as per user request
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };

    recognition.start();
  };

  const handleSuggestionClick = (suggest: string) => {
    if (suggest === 'Báo cáo sự cố') {
      setIsReportModalOpen(true);
      return;
    }
    handleSend(suggest);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-[120px] md:bottom-6 right-6 w-14 h-14 bg-[#1b9aaa] text-white rounded-full flex items-center justify-center shadow-2xl z-50 hover:bg-[#1b9aaa]/90"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
        </span>
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-[180px] md:bottom-24 right-4 left-4 sm:left-auto sm:right-6 w-auto sm:w-[400px] h-[500px] sm:h-[600px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 flex flex-col overflow-hidden border border-zinc-100"
          >
            {/* Header */}
            <div className="p-6 bg-[#0d1b2a] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1b9aaa] rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">TallyPort AI</h3>
                  <p className="text-[10px] font-bold text-teal-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                    Trợ lý trực tuyến
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* Prominent Incident Report Call-to-action */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsReportModalOpen(true)}
                className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4 group hover:bg-orange-100 transition-all mb-2"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-orange-600 uppercase tracking-tight">Cần báo cáo sự cố?</h4>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">Click để chụp ảnh & gửi báo cáo ngay</p>
                </div>
              </motion.button>

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#1b9aaa] text-white rounded-tr-none' 
                      : 'bg-zinc-50 text-zinc-800 rounded-tl-none border border-zinc-100'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-50 p-4 rounded-2xl rounded-tl-none border border-zinc-100">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1b9aaa]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-zinc-50 bg-zinc-50/50">
              <div className="flex gap-2">
                <button 
                  onClick={toggleListening}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-zinc-400 border border-zinc-200'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder="Nhập nội dung hoặc dùng voice..."
                    className="w-full h-12 pl-4 pr-12 bg-white border border-zinc-200 rounded-xl text-xs font-bold focus:border-[#1b9aaa] outline-none shadow-sm"
                  />
                  <button 
                    onClick={() => handleSend(input)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#1b9aaa] hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {/* Input suggestions */}
                {[
                  "Báo cáo tiến độ",
                  "Báo cáo sự cố",
                  "Thống kê hôm nay",
                  "Xe vào cảng"
                ].map(suggest => (
                  <button 
                    key={suggest}
                    onClick={() => handleSuggestionClick(suggest)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-100 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:border-[#1b9aaa] hover:text-[#1b9aaa] transition-all"
                  >
                    {suggest}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <IncidentReport 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />
    </>
  );
}
