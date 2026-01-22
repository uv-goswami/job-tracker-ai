import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { useJobContext } from '../context/JobContext';

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const { updateFilters } = useJobContext();

  const send = async () => {
    if (!query) return;
    const msg = query;
    setQuery("");
    setHistory(prev => [...prev, { role: 'user', text: msg }]);
    
    try {
      const res = await axios.post('/api/chat', { message: msg });
      const { reply, action, params } = res.data;
      
      setHistory(prev => [...prev, { role: 'ai', text: reply }]);
      
      if (action === 'FILTER' && params) {
        updateFilters(params);
        setHistory(prev => [...prev, { role: 'system', text: "✓ Filters applied automatically." }]);
      }

    } catch (e) {
      setHistory(prev => [...prev, { role: 'ai', text: "Error connecting to AI." }]);
    }
  };

  return (
    <div className="chat-widget">
      {!open && (
        <button onClick={() => setOpen(true)} className="chat-btn">
            <MessageSquare size={24} />
        </button>
      )}
      
      {open && (
        <div className="chat-window">
            <div className="chat-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14}/> Job Assistant
                </span>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>×</button>
            </div>
            
            <div className="chat-body">
                {history.map((h, i) => (
                    <div key={i} className={`chat-msg ${
                        h.role === 'user' ? 'msg-user' : 
                        h.role === 'system' ? 'msg-sys' : 
                        'msg-ai'
                    }`}>
                        {h.text}
                    </div>
                ))}
            </div>

            <div className="chat-footer">
                <input 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="e.g. 'Remote React jobs'..."
                />
                <button onClick={send}><Send size={16} /></button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;