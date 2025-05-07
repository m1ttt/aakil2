// src/context/ChatContext.jsx
import React, { createContext, useState, useRef, useEffect } from 'react';

// Create the context
export const ChatContext = createContext();

// API URLs
const ASYNC_QUERY_URL = 'https://nfjr4sfn9d.execute-api.us-east-1.amazonaws.com/Aakil1/async-query';
const RESULTS_BASE_URL = 'https://nfjr4sfn9d.execute-api.us-east-1.amazonaws.com/Aakil1/results';

// Helper function to remove the <think> block
const removeThinkingBlock = (responseText) => {
    if (typeof responseText !== 'string') {
        return responseText;
    }
    const thinkStartTag = "<think>";
    const thinkEndTag = "</think>";
    const startIndex = responseText.indexOf(thinkStartTag);
    const endIndex = responseText.indexOf(thinkEndTag);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        // Extract content before <think> and after </think>
        const beforeThink = responseText.substring(0, startIndex);
        const afterThink = responseText.substring(endIndex + thinkEndTag.length);
        // Return combined content, trimming whitespace that might be left
        return (beforeThink.trim() + " " + afterThink.trim()).trim();
    }
    return responseText;
};

// Helper to format code blocks correctly for markdown
const formatForMarkdown = (text) => {
    if (typeof text !== 'string') return text;

    // Check if we already have proper markdown code blocks
    if (text.includes('```')) return text;

    // Add proper markdown code blocks for standard <code> tags
    let formattedText = text.replace(/<code>([\s\S]*?)<\/code>/g, (match, codeContent) => {
        // Detect language from content or default to text
        let language = 'text';
        if (codeContent.includes('function') || codeContent.includes('const ') || codeContent.includes('var ')) {
            language = 'javascript';
        } else if (codeContent.includes('import pandas') || codeContent.includes('def ')) {
            language = 'python';
        } else if (codeContent.includes('<html>') || codeContent.includes('<div>')) {
            language = 'html';
        } else if (codeContent.includes('SELECT ') || codeContent.includes('FROM ')) {
            language = 'sql';
        }

        return `\`\`\`${language}\n${codeContent}\n\`\`\``;
    });

    return formattedText;
};

export const ChatProvider = ({ children }) => {
    // States
    const [query, setQuery] = useState('');
    const [conversations, setConversations] = useState(() => {
        // Try to load conversations from localStorage
        const savedConversations = localStorage.getItem('aakil-conversations');
        if (savedConversations) {
            try {
                return JSON.parse(savedConversations);
            } catch (e) {
                console.error("Failed to parse saved conversations:", e);
            }
        }
        // Default if no saved conversations
        return [
            { id: 'current', name: 'Nueva conversación', messages: [], lastUpdated: new Date().toISOString() }
        ];
    });

    const [activeConversationId, setActiveConversationId] = useState(() => {
        // Try to load active conversation ID from localStorage
        const savedId = localStorage.getItem('aakil-active-conversation');
        if (savedId) {
            return savedId;
        }
        return 'current';
    });

    const [sessionId, setSessionId] = useState('web-' + Date.now());
    const [taskId, setTaskId] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, PENDING, PROCESSING, COMPLETED, FAILED
    const [resultData, setResultData] = useState(null);
    const [error, setError] = useState(null);
    const [useRAG, setUseRAG] = useState(true); // User can toggle this via UI

    // Referencias globales para polling
    const pollingRef = useRef({
        active: false,
        taskId: null,
        timer: null,
        messageIndex: null,
        originalQuery: null,
        retryCount: 0,
        maxRetries: 30  // 5 minutos a 3 segundos por intento
    });

    // Get active conversation
    const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

    // Save conversations to localStorage when they change
    useEffect(() => {
        localStorage.setItem('aakil-conversations', JSON.stringify(conversations));
    }, [conversations]);

    // Save active conversation ID to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('aakil-active-conversation', activeConversationId);
    }, [activeConversationId]);

    // Reset state for a new query
    const resetQueryState = () => {
        setTaskId(null);
        setStatus('IDLE');
        setResultData(null);
        setError(null);
        stopPolling();
    };

    // Create a new conversation
    const createNewConversation = () => {
        const newId = 'conv-' + Date.now();
        const newConversation = {
            id: newId,
            name: 'Nueva conversación', // Default name
            messages: [],
            lastUpdated: new Date().toISOString()
        };
        setConversations(prev => [newConversation, ...prev].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)));
        setActiveConversationId(newId);
        resetQueryState();
    };

    // Update conversation name
    const updateConversationName = (id, name) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === id ? { ...conv, name, lastUpdated: new Date().toISOString() } : conv
            ).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        );
    };

    // Delete conversation
    const deleteConversation = (id) => {
        const remainingConversations = conversations.filter(conv => conv.id !== id);
        setConversations(remainingConversations);

        if (id === activeConversationId) {
            if (remainingConversations.length > 0) {
                setActiveConversationId(remainingConversations[0].id); // Select the most recent
            } else {
                createNewConversation(); // Create a new one if all are deleted
            }
        }
    };

    // Add message to current conversation
    const addMessage = (message) => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv.id === activeConversationId) {
                    const updatedMessages = [...conv.messages, message];
                    let newName = conv.name;
                    // Update conversation name if it's the default and this is the first user message
                    if (conv.name === 'Nueva conversación' && message.type === 'user' && conv.messages.length === 0) {
                        newName = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
                    }
                    return {
                        ...conv,
                        messages: updatedMessages,
                        lastUpdated: new Date().toISOString(),
                        name: newName
                    };
                }
                return conv;
            }).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        );
    };

    // Update message in current conversation
    const updateMessage = (messageIndex, updates) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === activeConversationId
                    ? {
                        ...conv,
                        messages: conv.messages.map((msg, idx) =>
                            idx === messageIndex ? {
                                ...msg,
                                ...updates,
                                // If updating content, format it for Markdown if needed
                                ...(updates.content ? { content: formatForMarkdown(updates.content) } : {})
                            } : msg
                        ),
                        lastUpdated: new Date().toISOString() // Also update lastUpdated time here
                    }
                    : conv
            ).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        );
    };

    // Detener polling existente
    const stopPolling = () => {
        if (pollingRef.current.timer) {
            clearInterval(pollingRef.current.timer);
            pollingRef.current.timer = null;
        }
        pollingRef.current.active = false;
        pollingRef.current.taskId = null;
        pollingRef.current.messageIndex = null;
        pollingRef.current.originalQuery = null;
        pollingRef.current.retryCount = 0;
        console.log("Polling stopped");
    };

    // Poll for results - versión simple
    const pollForResult = async () => {
        // Si no hay polling activo, salir
        if (!pollingRef.current.active || !pollingRef.current.taskId) return;

        const currentTaskId = pollingRef.current.taskId;
        const messageIndex = pollingRef.current.messageIndex;

        try {
            console.log(`Making poll request for ${currentTaskId}`);
            const response = await fetch(`${RESULTS_BASE_URL}/${currentTaskId}`, { method: 'GET' });
            const data = await response.json();
            console.log(`Poll response for ${currentTaskId}:`, data);

            // Incrementar contador de reintentos
            pollingRef.current.retryCount++;

            // Comprobar si hemos excedido los reintentos máximos
            if (pollingRef.current.retryCount > pollingRef.current.maxRetries) {
                console.log("Maximum retry count exceeded, stopping polling");
                stopPolling();
                setStatus('FAILED');
                updateMessage(messageIndex, {
                    content: "La solicitud ha excedido el tiempo máximo de espera. Por favor, inténtalo de nuevo.",
                    status: 'error',
                    responseType: 'ERROR'
                });
                return;
            }

            if (response.ok) {
                if (data.status === 'COMPLETED') {
                    console.log("Task COMPLETED, processing result");
                    stopPolling();
                    setStatus('COMPLETED');

                    const parsedResult = typeof data.resultData === 'string' ? JSON.parse(data.resultData) : data.resultData;
                    console.log("Parsed result:", parsedResult);

                    if (!parsedResult || typeof parsedResult.response === 'undefined') {
                        throw new Error("El formato de resultData de RAG no es el esperado o no contiene 'response'.");
                    }

                    setResultData(parsedResult);

                    // Format response for markdown rendering
                    const formattedResponse = formatForMarkdown(parsedResult.response);

                    updateMessage(messageIndex, {
                        content: formattedResponse,
                        sources: parsedResult.sources || [],
                        status: 'completed',
                        responseType: parsedResult.responseType || 'RAG'
                    });
                } else if (data.status === 'FAILED') {
                    console.log("Task FAILED");
                    stopPolling();
                    setStatus('FAILED');
                    const errorDetails = data.errorDetails || 'La tarea RAG falló en el backend.';
                    setError(errorDetails);
                    updateMessage(messageIndex, {
                        content: errorDetails,
                        status: 'error',
                        responseType: 'ERROR'
                    });
                } else if (data.status === 'PROCESSING' || data.status === 'PENDING') {
                    console.log(`Task still ${data.status}, continuing polling`);
                    setStatus(data.status);
                    // Continuar polling automáticamente en el intervalo
                }
            } else {
                console.error(`Error response from API: ${response.status}`);
                // No detenemos el polling por errores temporales, permitimos reintentos
            }
        } catch (err) {
            console.error(`Error polling for ${currentTaskId}:`, err);
            // No detenemos el polling por errores de red, permitimos reintentos
        }
    };

    // Iniciar polling simplificado
    const startPolling = (taskId, messageIndex, originalQuery) => {
        // Detener cualquier polling existente
        stopPolling();

        console.log(`Starting polling for task ${taskId}`);

        // Configurar el polling
        pollingRef.current.active = true;
        pollingRef.current.taskId = taskId;
        pollingRef.current.messageIndex = messageIndex;
        pollingRef.current.originalQuery = originalQuery;
        pollingRef.current.retryCount = 0;

        // Primera llamada inmediata
        pollForResult();

        // Configurar el intervalo para llamadas periódicas
        pollingRef.current.timer = setInterval(pollForResult, 3000);
    };

    // Handle submit query
    const handleSubmitQuery = async (queryText, ragEnabled = useRAG) => {
        if (!queryText.trim() || status === 'PENDING' || status === 'PROCESSING') {
            return;
        }

        resetQueryState();
        setStatus('PENDING');

        const userMessage = {
            type: 'user',
            content: queryText,
            timestamp: new Date().toISOString()
        };
        addMessage(userMessage); // This will also update lastUpdated and sort

        // Get the index for the pending message correctly after user message is added
        let pendingMessageIndex;
        setConversations(prev => {
            const activeConv = prev.find(c => c.id === activeConversationId);
            pendingMessageIndex = activeConv ? activeConv.messages.length : 0;
            return prev;
        });

        const pendingMessage = {
            type: 'assistant',
            content: '', // Content will be filled by API response or processing message
            status: 'thinking', // Initial visual state, will be updated
            timestamp: new Date().toISOString(),
            responseType: ragEnabled ? 'RAG_PENDING' : 'DIRECT_LLM_PENDING' // Tentative type
        };
        addMessage(pendingMessage);

        try {
            const payload = {
                query: queryText,
                sessionId: sessionId,
                useRAG: ragEnabled
            };
            console.log("Sending payload to ASYNC_QUERY_URL:", payload);

            const response = await fetch(ASYNC_QUERY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log("Response from ASYNC_QUERY_URL:", data, "Status:", response.status);

            if (response.status === 200 && data.response) { // Direct response (simulating useRAG: false)
                setStatus('COMPLETED');
                const finalResponseText = removeThinkingBlock(data.response);
                const formattedResponse = formatForMarkdown(finalResponseText);

                updateMessage(pendingMessageIndex, {
                    content: formattedResponse,
                    sources: data.sources || [],
                    status: 'completed',
                    responseType: data.responseType || 'DIRECT_LLM'
                });
            } else if (response.status === 202 && data.taskId) { // Async response (simulating useRAG: true)
                setTaskId(data.taskId);
                setStatus('PROCESSING');
                // Update the pending message to show it's processing via RAG
                updateMessage(pendingMessageIndex, {
                    content: data.message || "Tu consulta está siendo procesada con fuentes especializadas. Recibirás el resultado en breve.",
                    status: 'processing_rag', // Custom status for UI if needed, or keep 'thinking'
                    responseType: data.responseType || 'RAG_PENDING',
                    taskId: data.taskId // Store taskId with the message if useful
                });
                startPolling(data.taskId, pendingMessageIndex, queryText);
            } else {
                const errorMessage = data.error || data.message || `Error ${response.status} al procesar la consulta.`;
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error("Error in handleSubmitQuery:", err);
            setError(err.message);
            setStatus('FAILED');
            updateMessage(pendingMessageIndex, {
                content: `Error: ${err.message}`,
                status: 'error',
                responseType: 'ERROR'
            });
        }
        setQuery(''); // Clear input field
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log("Component unmounting, but polling will continue if active");
            // No detenemos el polling aquí para permitir que continúe incluso cuando los componentes se desmontan
        };
    }, []);

    const contextValue = {
        query,
        setQuery,
        conversations,
        activeConversation,
        activeConversationId,
        setActiveConversationId,
        status,
        error,
        taskId,
        handleSubmitQuery,
        createNewConversation,
        updateConversationName,
        deleteConversation,
        useRAG,
        setUseRAG
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};
