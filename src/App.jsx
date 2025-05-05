// src/App.jsx - Expandido a pantalla completa con diseño responsive optimizado

import React, { useState, useEffect, useRef } from 'react';

// --- Configuración ---
// ¡IMPORTANTE! Reemplaza estas URLs con las tuyas o usa variables de entorno
const ASYNC_QUERY_URL = 'https://nfjr4sfn9d.execute-api.us-east-1.amazonaws.com/Aakil1/async-query';
const RESULTS_BASE_URL = 'https://nfjr4sfn9d.execute-api.us-east-1.amazonaws.com/Aakil1/results';

// --- Componente Principal ---
function App() {
    // --- Estados ---
    const [query, setQuery] = useState('');
    const [sessionId, setSessionId] = useState('web-' + Date.now());
    const [taskId, setTaskId] = useState(null);
    const [status, setStatus] = useState('IDLE');
    const [resultData, setResultData] = useState(null);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [theme, setTheme] = useState('light');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Referencias
    const intervalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Scroll al fondo de los mensajes cuando se añade uno nuevo
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Ajusta la altura del textarea según el contenido
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const maxHeight = window.innerHeight * 0.2; // 20% de la altura de la ventana
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        }
    };

    // --- Funciones ---
    const resetState = () => {
        setTaskId(null);
        setStatus('IDLE');
        setResultData(null);
        setError(null);
        stopPolling();
    };

    const handleSubmitQuery = async (e) => {
        e.preventDefault();
        if (!query.trim() || status === 'PENDING' || status === 'PROCESSING') {
            return;
        }

        resetState();
        setStatus('PENDING');
        setIsMobileMenuOpen(false); // Cierra el menú en móviles si está abierto

        // Añadir mensaje del usuario al chat
        const userMessage = {
            type: 'user',
            content: query,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        // Añadir mensaje de "pensando..." del asistente
        const pendingMessage = {
            type: 'assistant',
            status: 'thinking',
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, pendingMessage]);

        try {
            const response = await fetch(ASYNC_QUERY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query, sessionId: sessionId })
            });

            const data = await response.json();

            // Manejo de respuesta directa o asíncrona
            if (response.status === 200 && data.response) {
                // Respuesta directa (sin RAG - LLM directo)
                console.log("Respuesta directa recibida:", data);
                setStatus('COMPLETED');

                // Actualizar el mensaje pendiente con la respuesta directa
                setMessages(prev => prev.map((msg, idx) =>
                    idx === prev.length - 1 && msg.status === 'thinking'
                        ? {
                            ...msg,
                            content: data.response,
                            sources: data.sources || [],
                            status: 'completed',
                            responseType: data.responseType || 'DIRECT_LLM'
                        }
                        : msg
                ));

            } else if (response.status === 202 && data.taskId) {
                // Respuesta asíncrona (RAG)
                setTaskId(data.taskId);
                setStatus('PROCESSING');
                console.log(`Tarea RAG iniciada con taskId: ${data.taskId}`);
            } else {
                throw new Error(data.error || data.message || `Error ${response.status} al procesar la consulta.`);
            }
        } catch (err) {
            console.error("Error al enviar consulta:", err);
            setError(`Error al iniciar la solicitud: ${err.message}`);
            setStatus('FAILED');

            // Actualizar el mensaje pendiente con el error
            setMessages(prev => prev.map((msg, idx) =>
                idx === prev.length - 1 && msg.status === 'thinking'
                    ? { ...msg, content: `Error: ${err.message}`, status: 'error' }
                    : msg
            ));
        }

        // Limpiar el campo de entrada
        setQuery('');
        // Restaurar la altura del textarea
        setTimeout(adjustTextareaHeight, 0);
    };

    const pollForResult = async (currentTaskId) => {
        if (!currentTaskId) return;

        try {
            const response = await fetch(`${RESULTS_BASE_URL}/${currentTaskId}`, { method: 'GET' });
            const data = await response.json();

            if (response.ok) {
                setStatus(data.status);

                if (data.status === 'COMPLETED') {
                    console.log("Tarea completada:", data.resultData);
                    try {
                        const parsedResult = typeof data.resultData === 'string' ? JSON.parse(data.resultData) : data.resultData;
                        setResultData(parsedResult);

                        // Actualizar el mensaje pendiente con la respuesta completa
                        setMessages(prev => prev.map((msg, idx) =>
                            idx === prev.length - 1 && msg.status === 'thinking'
                                ? {
                                    ...msg,
                                    content: parsedResult.response,
                                    sources: parsedResult.sources,
                                    status: 'completed',
                                    responseType: data.responseType || 'RAG'
                                }
                                : msg
                        ));

                    } catch (parseError) {
                        console.error("Error al parsear resultData:", parseError);
                        setError("Se recibió el resultado, pero hubo un error al procesarlo.");
                        setStatus('FAILED');

                        // Actualizar el mensaje pendiente con el error
                        setMessages(prev => prev.map((msg, idx) =>
                            idx === prev.length - 1 && msg.status === 'thinking'
                                ? { ...msg, content: "Error al procesar la respuesta.", status: 'error' }
                                : msg
                        ));
                    }
                    stopPolling();
                } else if (data.status === 'FAILED') {
                    console.error("Tarea fallida en backend:", data.errorDetails);
                    setError(data.errorDetails || 'La tarea falló en el backend.');
                    stopPolling();

                    // Actualizar el mensaje pendiente con el error
                    setMessages(prev => prev.map((msg, idx) =>
                        idx === prev.length - 1 && msg.status === 'thinking'
                            ? { ...msg, content: data.errorDetails || 'La tarea falló en el backend.', status: 'error' }
                            : msg
                    ));
                }
            } else {
                throw new Error(data.error || data.message || `Error ${response.status} al obtener resultados.`);
            }
        } catch (err) {
            console.error(`Error durante el sondeo para ${currentTaskId}:`, err);
            setError(`Error al consultar el estado: ${err.message}`);
            setStatus('FAILED');
            stopPolling();

            // Actualizar el mensaje pendiente con el error
            setMessages(prev => prev.map((msg, idx) =>
                idx === prev.length - 1 && msg.status === 'thinking'
                    ? { ...msg, content: `Error: ${err.message}`, status: 'error' }
                    : msg
            ));
        }
    };

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Toggle tema claro/oscuro
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        stopPolling();

        if (taskId && (status === 'PROCESSING' || status === 'PENDING')) {
            pollForResult(taskId);
            intervalRef.current = setInterval(() => {
                pollForResult(taskId);
            }, 5000);
        }

        return () => {
            stopPolling();
        };
    }, [taskId, status]);

    // Actualiza altura del textarea cuando cambia su contenido
    useEffect(() => {
        adjustTextareaHeight();
    }, [query]);

    // Ajustar altura en cambios de tamaño de ventana
    useEffect(() => {
        const handleResize = () => {
            adjustTextareaHeight();
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // --- Renderizado del Componente a pantalla completa ---
    return (
        <div className={`flex flex-col h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            {/* Barra superior con estilo Material Design 3 - Responsive */}
            <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm transition-colors duration-300 sticky top-0 z-10`}>
                <div className="w-full px-4 py-3 md:py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                            <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                        </div>
                        <h1 className={`text-xl md:text-2xl font-medium ${theme === 'dark' ? 'text-white' : 'text-purple-600'}`}>RAG Híbrido</h1>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Indicador de estado */}
                        {(status === 'PENDING' || status === 'PROCESSING') && (
                            <div className="hidden md:flex items-center mr-2">
                                <div className="animate-pulse flex space-x-1">
                                    <div className={`h-2 w-2 rounded-full ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                                    <div className={`h-2 w-2 rounded-full ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'}`} style={{animationDelay: '300ms'}}></div>
                                    <div className={`h-2 w-2 rounded-full ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'}`} style={{animationDelay: '600ms'}}></div>
                                </div>
                                <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Procesando</span>
                            </div>
                        )}

                        {/* Botón de tema */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-300' : 'bg-purple-100 text-purple-600'}`}
                            aria-label="Cambiar tema"
                        >
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                </svg>
                            )}
                        </button>

                        {/* Botón de menú móvil */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Menú móvil desplegable */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden px-4 py-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="space-y-2">
                            {taskId && (
                                <div className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className="font-medium">ID Tarea:</span>
                                    <span className="ml-2">{taskId}</span>
                                </div>
                            )}
                            {status !== 'IDLE' && (
                                <div className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className="font-medium">Estado:</span>
                                    <span className="ml-2">{status}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Área principal a pantalla completa */}
            <main className="flex-1 flex flex-col w-full overflow-hidden" ref={chatContainerRef}>
                {/* Mensajes - expandido a pantalla completa */}
                <div className={`flex-1 overflow-y-auto p-3 md:p-6 space-y-4 ${theme === 'dark' ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                                <svg className={`w-10 h-10 md:w-12 md:h-12 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                                </svg>
                            </div>
                            <div>
                                <p className={`text-xl md:text-2xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Asistente RAG Híbrido</p>
                                <p className={`mt-2 max-w-lg mx-auto text-base md:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Puedo responder preguntas generales directamente o buscar en fuentes especializadas cuando sea necesario.
                                </p>
                            </div>

                            {/* Ejemplos de preguntas - Responsive Grid */}
                            <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-4xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <button
                                    onClick={() => setQuery("¿Qué es la criptografía simétrica?")}
                                    className={`text-left p-3 rounded-lg transition ${
                                        theme === 'dark'
                                            ? 'bg-gray-800 hover:bg-gray-700'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                                        </svg>
                                        <span className="line-clamp-1">¿Qué es la criptografía simétrica?</span>
                                    </span>
                                </button>
                                <button
                                    onClick={() => setQuery("¿Cómo funciona la arquitectura serverless?")}
                                    className={`text-left p-3 rounded-lg transition ${
                                        theme === 'dark'
                                            ? 'bg-gray-800 hover:bg-gray-700'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                        </svg>
                                        <span className="line-clamp-1">¿Cómo funciona la arquitectura serverless?</span>
                                    </span>
                                </button>
                                <button
                                    onClick={() => setQuery("¿Cuáles son las mejores prácticas de seguridad para AWS Lambda?")}
                                    className={`text-left p-3 rounded-lg transition ${
                                        theme === 'dark'
                                            ? 'bg-gray-800 hover:bg-gray-700'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                        <span className="line-clamp-1">¿Cuáles son las mejores prácticas de seguridad para AWS Lambda?</span>
                                    </span>
                                </button>
                                <button
                                    onClick={() => setQuery("Explica la integración de DynamoDB con API Gateway")}
                                    className={`text-left p-3 rounded-lg transition ${
                                        theme === 'dark'
                                            ? 'bg-gray-800 hover:bg-gray-700'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                                        </svg>
                                        <span className="line-clamp-1">Explica la integración de DynamoDB con API Gateway</span>
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-full mx-auto">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <div className={`max-w-[90%] md:max-w-[80%] rounded-xl p-3 md:p-4 ${message.type === 'user'
                                        ? theme === 'dark'
                                            ? 'bg-purple-900 text-white'
                                            : 'bg-purple-600 text-white'
                                        : message.status === 'error'
                                            ? theme === 'dark'
                                                ? 'bg-red-900 text-red-100 border border-red-800'
                                                : 'bg-red-50 border border-red-200 text-red-700'
                                            : theme === 'dark'
                                                ? 'bg-gray-800 border border-gray-700'
                                                : 'bg-white border border-gray-200 shadow-sm'
                                    } ${message.type === 'assistant' ? 'shadow-md' : ''}`}
                                    >
                                        {message.status === 'thinking' ? (
                                            <div className="flex items-center space-x-2">
                                                <div className={`flex space-x-1 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                                                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Pensando...</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="whitespace-pre-wrap break-words">{message.content}</div>

                                                {/* Indicador de tipo de respuesta */}
                                                {message.type === 'assistant' && message.status === 'completed' && (
                                                    <div className="flex items-center text-xs mt-3 pt-2 border-t border-opacity-20 border-gray-400">
                                                        {message.responseType === 'DIRECT_LLM' ? (
                                                            <span className={`flex items-center ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                                                                <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                                                </svg>
                                                                Respuesta rápida
                                                            </span>
                                                        ) : (
                                                            <span className={`flex items-center ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                                                                <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"></path>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                                </svg>
                                                                Respuesta con fuentes
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Fuentes (solo para mensajes completados del asistente) */}
                                                {message.type === 'assistant' && message.status === 'completed' && message.sources && message.sources.length > 0 && (
                                                    <div className={`mt-4 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                                        <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Fuentes:</p>
                                                        <div className="space-y-3">
                                                            {message.sources.map((source, idx) => (
                                                                <div key={idx} className={`text-sm rounded-lg p-3 ${
                                                                    theme === 'dark'
                                                                        ? 'bg-gray-900 border border-gray-800'
                                                                        : 'bg-gray-50 border border-gray-200'
                                                                }`}>
                                                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                                                        <span className="font-medium">{source.source || 'Fuente desconocida'}</span>
                                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                                            theme === 'dark'
                                                                                ? 'bg-blue-900 text-blue-200'
                                                                                : 'bg-blue-100 text-blue-800'
                                                                        }`}>
                                                                            {source.score?.toFixed(2) || 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                                                                        {source.content}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Área de entrada - optimizada para responsividad */}
                <div className={`border-t p-3 md:p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <form onSubmit={handleSubmitQuery} className="flex space-x-2 md:space-x-3 max-w-7xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitQuery(e);
                                    }
                                }}
                                rows={1}
                                className={`w-full resize-none rounded-2xl py-3 px-4 transition focus:outline-none ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                }`}
                                placeholder="Escribe tu consulta aquí..."
                                disabled={status === 'PENDING' || status === 'PROCESSING'}
                            />
                            <div className={`absolute right-4 bottom-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {status === 'PENDING' || status === 'PROCESSING'
                                    ? 'Procesando...'
                                    : window.innerWidth > 768 ? 'Presiona Enter para enviar' : ''}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!query.trim() || status === 'PENDING' || status === 'PROCESSING'}
                            className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                                !query.trim() || status === 'PENDING' || status === 'PROCESSING'
                                    ? theme === 'dark'
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : theme === 'dark'
                                        ? 'bg-purple-700 text-white hover:bg-purple-600 shadow-lg hover:shadow-xl'
                                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                            }`}
                            aria-label="Enviar mensaje"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </form>

                    {/* Estado de la tarea (visible solo en escritorio) */}
                    {taskId && (status === 'PENDING' || status === 'PROCESSING') && (
                        <div className={`hidden md:flex mt-2 text-xs items-center justify-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="mr-2">Buscando en fuentes especializadas</span>
                                <span className="mr-2">•</span>
                                <span>Estado: {status}</span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
