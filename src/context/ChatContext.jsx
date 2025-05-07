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


export const ChatProvider = ({ children }) => {
    // States
    const [query, setQuery] = useState('');
    const [conversations, setConversations] = useState([
        { id: 'current', name: 'Nueva conversación', messages: [], lastUpdated: new Date().toISOString() }
    ]);
    const [activeConversationId, setActiveConversationId] = useState('current');
    const [sessionId, setSessionId] = useState('web-' + Date.now());
    const [taskId, setTaskId] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, PENDING, PROCESSING, COMPLETED, FAILED
    const [resultData, setResultData] = useState(null);
    const [error, setError] = useState(null);
    const [useRAG, setUseRAG] = useState(true); // User can toggle this via UI

    // References
    const intervalRef = useRef(null);

    // Get active conversation
    const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

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
        // setUseRAG(true); // Optionally reset RAG preference for new conversations
    };

    // Update conversation name
    const updateConversationName = (id, name) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === id ? { ...conv, name } : conv
            )
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
                            idx === messageIndex ? { ...msg, ...updates } : msg
                        ),
                        lastUpdated: new Date().toISOString() // Also update lastUpdated time here
                    }
                    : conv
            ).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        );
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
                updateMessage(pendingMessageIndex, {
                    content: finalResponseText,
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
                startPolling(data.taskId, pendingMessageIndex);
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

    // Poll for results
    const pollForResult = async (currentTaskId, messageIndex) => {
        if (!currentTaskId) return;
        console.log(`Polling for taskId: ${currentTaskId}, messageIndex: ${messageIndex}`);

        try {
            const response = await fetch(`${RESULTS_BASE_URL}/${currentTaskId}`, { method: 'GET' });
            const data = await response.json();
            console.log(`Poll response for ${currentTaskId}:`, data);

            // Update global status based on polling response
            // setStatus(data.status); // This might be too broad, let specific handlers do it.

            if (response.ok) {
                if (data.status === 'COMPLETED') {
                    stopPolling();
                    setStatus('COMPLETED'); // Global status
                    const parsedResult = typeof data.resultData === 'string' ? JSON.parse(data.resultData) : data.resultData;

                    if (!parsedResult || typeof parsedResult.response === 'undefined') {
                        throw new Error("El formato de resultData de RAG no es el esperado o no contiene 'response'.");
                    }
                    setResultData(parsedResult); // Store full result if needed
                    updateMessage(messageIndex, {
                        content: parsedResult.response,
                        sources: parsedResult.sources || [],
                        status: 'completed',
                        responseType: parsedResult.responseType || 'RAG'
                    });
                } else if (data.status === 'FAILED') {
                    stopPolling();
                    setStatus('FAILED'); // Global status
                    const errorDetails = data.errorDetails || 'La tarea RAG falló en el backend.';
                    setError(errorDetails);
                    updateMessage(messageIndex, {
                        content: errorDetails,
                        status: 'error',
                        responseType: 'ERROR'
                    });
                } else if (data.status === 'PROCESSING' || data.status === 'PENDING') {
                    setStatus(data.status); // Keep global status updated
                    // Message is already showing "processing..."
                    // No need to update message content here, just continue polling.
                }
            } else {
                throw new Error(data.error || data.message || `Error ${response.status} al obtener resultados del polling.`);
            }
        } catch (err) {
            console.error(`Error polling for ${currentTaskId}:`, err);
            // Don't stop polling on intermittent network errors, but log them.
            // If it's a persistent error, it might be caught by max retries or timeout elsewhere.
            // For now, we'll mark the message as error if polling itself fails critically.
            // However, if the task is still genuinely processing, this might be premature.
            // A more robust solution would have retry logic for polling.
            setError(`Error al verificar el estado: ${err.message}`);
            // To avoid overwriting a "PROCESSING" state with a temporary poll error:
            // Only set to FAILED if the error is definitive or after retries.
            // For now, if a poll request fails, we might want to just log it and let the next poll try.
            // However, if stopPolling() is called, we need to reflect that.
            // Let's update the message only if we decide to stop polling due to this error.
            // For now, we keep polling unless it's a definitive FAILED status from backend.
        }
    };

    const startPolling = (currentTaskId, messageIndex) => {
        stopPolling(); // Clear any existing interval
        pollForResult(currentTaskId, messageIndex); // Initial immediate poll

        intervalRef.current = setInterval(() => {
            // Only continue polling if the global status suggests the task might still be active
            if (status === 'PROCESSING' || status === 'PENDING') {
                pollForResult(currentTaskId, messageIndex);
            } else {
                stopPolling(); // Stop if global status is COMPLETED or FAILED
            }
        }, 5000); // Poll every 5 seconds
    };

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log("Polling stopped.");
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, []);

    // Effect to sort conversations whenever they change.
    // This is now handled within addMessage and updateMessage to ensure sorting happens right after modification.
    // useEffect(() => {
    //     setConversations(prev => [...prev].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)));
    // }, [conversations.map(c => c.lastUpdated).join(',')]); // Simple dependency to re-run on relevant changes

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
        useRAG,      // Expose RAG state
        setUseRAG    // Expose RAG setter
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};
