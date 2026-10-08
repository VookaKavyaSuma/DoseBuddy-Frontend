import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    sendChatMessageApi, 
    fetchChatHistoryApi, 
    clearChatHistoryApi, 
    uploadPrescriptionPdfApi 
} from '../services/api';
import './FloatingChatbot.css';

export default function FloatingChatbot() {
    const { user } = useAuth();
    const isCaregiver = user?.role === 'CAREGIVER';

    // State for widget visibility
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [showTooltip, setShowTooltip] = useState(true);

    // Persistent conversationId from localStorage (as in PDF roadmap)
    const [conversationId, setConversationId] = useState(() => {
        let stored = localStorage.getItem('dosebuddy_conversation_id');
        if (!stored) {
            stored = 'dose_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now());
            localStorage.setItem('dosebuddy_conversation_id', stored);
        }
        return stored;
    });

    // Chat state
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // PDF RAG state
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadedDocName, setUploadedDocName] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setHasUnread(false);
            setShowTooltip(false);
        }
    }, [messages, isOpen, loading]);

    // Load initial chat history on mount or conversationId change
    useEffect(() => {
        let isMounted = true;
        const loadHistory = async () => {
            try {
                const history = await fetchChatHistoryApi(conversationId);
                if (isMounted && Array.isArray(history) && history.length > 0) {
                    setMessages(history);
                }
            } catch (err) {
                console.warn('Could not load chat history:', err);
            }
        };
        loadHistory();
        return () => { isMounted = false; };
    }, [conversationId]);

    // Dismiss tooltip after 8 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTooltip(false);
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    // Send chat message
    const handleSendMessage = async (textToSend) => {
        const query = (textToSend || message).trim();
        if (!query || loading) return;

        const userMsg = {
            role: 'user',
            content: query,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setMessage('');
        setLoading(true);

        try {
            const data = await sendChatMessageApi(query, conversationId);
            const aiText = data.response || data.message || 'I am here to assist with your medications.';

            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    content: aiText,
                    timestamp: new Date().toISOString()
                }
            ]);

            if (!isOpen) {
                setHasUnread(true);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    content: `⚠️ **Notice:** ${error.message || 'Unable to reach backend service.'}\n\nPlease check if your Spring Boot server is running on port 8080.`,
                    timestamp: new Date().toISOString(),
                    isError: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Reset / Start fresh conversation
    const handleResetConversation = async () => {
        if (window.confirm('Start a fresh conversation? This will clear current chat history.')) {
            await clearChatHistoryApi(conversationId);
            const newId = 'dose_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now());
            localStorage.setItem('dosebuddy_conversation_id', newId);
            setConversationId(newId);
            setMessages([]);
            setUploadedDocName(null);
            setUploadStatus(null);
        }
    };

    // Prescription PDF Upload (RAG)
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setUploadStatus({ type: 'error', text: 'Please select a PDF document.' });
                return;
            }
            setSelectedFile(file);
            setUploadStatus({ type: 'info', text: `Selected: ${file.name}` });
        }
    };

    const handleUploadPdf = async () => {
        if (!selectedFile || uploading) return;

        setUploading(true);
        setUploadStatus({ type: 'info', text: 'Uploading & analyzing prescription...' });

        try {
            const result = await uploadPrescriptionPdfApi(selectedFile, conversationId);
            setUploadedDocName(result.fileName || selectedFile.name);
            setUploadStatus({
                type: 'success',
                text: `✅ ${result.fileName || selectedFile.name} analyzed (${result.chunks || 1} chunks in memory)`
            });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Add system confirmation message in chat
            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    content: `📄 **Prescription Ingested:** I have read and indexed **${result.fileName || 'your document'}** (${result.characters || 0} characters). You can now ask me any questions about medication dosages, timings, or warnings in this document!`,
                    timestamp: new Date().toISOString()
                }
            ]);
        } catch (error) {
            setUploadStatus({
                type: 'error',
                text: error.message || 'Failed to upload document.'
            });
        } finally {
            setUploading(false);
        }
    };

    // Copy message to clipboard
    const handleCopy = (text, idx) => {
        navigator.clipboard?.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Text-to-speech for accessibility (especially helpful for seniors)
    const handleSpeak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            // Clean markdown syntax for speech
            const cleanText = text.replace(/[*#_`]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Example quick prompts
    const starterPrompts = [
        '💊 Explain my active medication schedules',
        '⏰ What should I do if I miss a dose of Metformin?',
        '⚠️ Check interactions between Amlodipine and NSAIDs',
        '💧 Tips for remembering pill times with meals'
    ];

    return (
        <div className="dosebuddy-chatbot-root">
            {/* FLOATING AI BUTTON IN THE BOTTOM */}
            <div className="fab-container">
                {showTooltip && !isOpen && (
                    <div className="fab-tooltip" onClick={() => setIsOpen(true)}>
                        <div className="tooltip-badge">✨ DoseBuddy AI</div>
                        <p>Have questions about your medicines or dosage? Ask AI!</p>
                        <button className="tooltip-close" onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}>✕</button>
                    </div>
                )}

                <button 
                    id="dosebuddy-fab-btn"
                    className={`fab-btn ${isOpen ? 'open' : ''} ${hasUnread ? 'has-unread' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Open DoseBuddy AI Chatbot"
                    title="DoseBuddy AI Medication Assistant"
                >
                    <span className="fab-pulse-ring"></span>
                    <span className="fab-icon-box">
                        {isOpen ? (
                            <span className="fab-close-icon">✕</span>
                        ) : (
                            <>
                                <span className="fab-icon">💊</span>
                                <span className="fab-sparkle">✨</span>
                            </>
                        )}
                    </span>
                    {!isOpen && <span className="fab-label">DoseBuddy AI</span>}
                    {hasUnread && <span className="fab-badge">1</span>}
                </button>
            </div>

            {/* EXPANDABLE CHATBOT WINDOW */}
            {isOpen && (
                <div className={`chat-window ${isExpanded ? 'expanded' : ''}`}>
                    {/* CHAT HEADER */}
                    <header className="chat-win-header">
                        <div className="header-left">
                            <div className="assistant-avatar">
                                <span className="avatar-icon">💊</span>
                                <span className="online-indicator" title="Memory Active"></span>
                            </div>
                            <div className="header-titles">
                                <div className="title-row">
                                    <h3>DoseBuddy AI</h3>
                                    <span className="version-pill">Spring AI • Gemini</span>
                                </div>
                                <span className="header-sub">
                                    {isCaregiver ? 'Caregiver Assistant & Dosage Advisor' : 'Patient Medication & Health Companion'}
                                </span>
                            </div>
                        </div>

                        <div className="header-actions">
                            <button 
                                className="action-btn"
                                onClick={handleResetConversation}
                                title="Reset conversation memory"
                            >
                                🔄
                            </button>
                            <button 
                                className="action-btn"
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? 'Restore widget size' : 'Expand window'}
                            >
                                {isExpanded ? '🗗' : '⛶'}
                            </button>
                            <button 
                                className="action-btn close"
                                onClick={() => setIsOpen(false)}
                                title="Minimize chat"
                            >
                                ✕
                            </button>
                        </div>
                    </header>

                    {/* CONTEXT BAR */}
                    <div className="chat-context-bar">
                        <div className="context-item">
                            <span className="context-dot active"></span>
                            <span>Memory Active</span>
                        </div>
                        <div className="context-item user-info">
                            <span>👤 {user?.fullName || (isCaregiver ? 'Caregiver' : 'Patient')}</span>
                        </div>
                        {uploadedDocName && (
                            <div className="context-item doc-tag" title="RAG Document Ingested">
                                <span>📄 {uploadedDocName.length > 18 ? uploadedDocName.substring(0, 15) + '...' : uploadedDocName}</span>
                            </div>
                        )}
                    </div>

                    {/* MESSAGES CONTAINER */}
                    <div className="chat-win-body">
                        {messages.length === 0 ? (
                            <div className="chat-welcome">
                                <div className="welcome-glow-icon">💊</div>
                                <h4>How can I help with your medications?</h4>
                                <p>
                                    I remember our conversation and can answer questions about dosages,
                                    food warnings, missed pills, or your uploaded prescriptions.
                                </p>

                                <div className="starter-chips">
                                    <span className="chips-title">SUGGESTED QUESTIONS:</span>
                                    {starterPrompts.map((promptText, i) => (
                                        <button 
                                            key={i} 
                                            className="starter-chip-btn"
                                            onClick={() => handleSendMessage(promptText)}
                                        >
                                            {promptText}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="messages-stream">
                                {messages.map((msg, index) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div 
                                            key={index} 
                                            className={`message-bubble-row ${isUser ? 'user-side' : 'ai-side'}`}
                                        >
                                            <div className="bubble-avatar">
                                                {isUser ? '👤' : '💊'}
                                            </div>

                                            <div className="bubble-content-wrap">
                                                <div className="bubble-meta">
                                                    <span className="sender-name">{isUser ? 'You' : 'DoseBuddy AI'}</span>
                                                    <span className="bubble-time">
                                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>

                                                <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'} ${msg.isError ? 'error-bubble' : ''}`}>
                                                    <div className="bubble-text">
                                                        {msg.content.split('\n').map((line, lIdx) => {
                                                            if (!line.trim()) return <div key={lIdx} className="line-break"></div>;
                                                            return <p key={lIdx}>{line}</p>;
                                                        })}
                                                    </div>

                                                    {!isUser && (
                                                        <div className="bubble-actions">
                                                            <button 
                                                                className="bubble-action-btn"
                                                                onClick={() => handleCopy(msg.content, index)}
                                                                title="Copy message"
                                                            >
                                                                {copiedIndex === index ? '✓ Copied' : '📋 Copy'}
                                                            </button>
                                                            <button 
                                                                className="bubble-action-btn"
                                                                onClick={() => handleSpeak(msg.content)}
                                                                title="Listen to instruction"
                                                            >
                                                                🔊 Listen
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {loading && (
                                    <div className="message-bubble-row ai-side thinking-row">
                                        <div className="bubble-avatar">💊</div>
                                        <div className="bubble-content-wrap">
                                            <div className="thinking-bubble">
                                                <span className="thinking-dot"></span>
                                                <span className="thinking-dot"></span>
                                                <span className="thinking-dot"></span>
                                                <span className="thinking-text">DoseBuddy AI is analyzing...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* PDF UPLOAD / RAG STATUS BANNER */}
                    {uploadStatus && (
                        <div className={`upload-status-bar ${uploadStatus.type}`}>
                            <span>{uploadStatus.text}</span>
                            {selectedFile && !uploading && (
                                <button className="upload-confirm-btn" onClick={handleUploadPdf}>
                                    Upload & Ingest
                                </button>
                            )}
                            <button className="upload-dismiss-btn" onClick={() => setUploadStatus(null)}>✕</button>
                        </div>
                    )}

                    {/* INPUT AREA */}
                    <div className="chat-win-footer">
                        {/* Hidden file input for prescription PDF */}
                        <input 
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                        <div className="input-box-row">
                            <button 
                                type="button"
                                className="attach-doc-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload Prescription or Medical Document (PDF)"
                                disabled={uploading || loading}
                            >
                                📎
                            </button>

                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about medications, dosages, or upload PDF..."
                                disabled={loading}
                            />

                            <button 
                                className="send-msg-btn"
                                onClick={() => handleSendMessage()}
                                disabled={!message.trim() || loading}
                                title="Send message"
                            >
                                {loading ? (
                                    <span className="spinner-ring"></span>
                                ) : (
                                    <span className="send-arrow">➤</span>
                                )}
                            </button>
                        </div>

                        <div className="disclaimer-text">
                            ⚠️ DoseBuddy AI is for adherence guidance. Always follow doctor directions.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
