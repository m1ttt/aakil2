// src/components/ChatMain.jsx
import React, { useContext, useRef, useEffect } from 'react';
import { ChatContext } from '../context/ChatContext';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

const ChatMain = ({ theme, toggleTheme, toggleSidebar, isSidebarOpen }) => {
    const {
        activeConversation,
        status,
        taskId
    } = useContext(ChatContext);

    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages]);

    return (
        <>
            {/* Header with controls */}
            <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm transition-colors duration-300 sticky top-0 z-10`}>
                <div className="w-full px-4 py-3 md:py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        {/* Toggle sidebar button */}
                        <button
                            onClick={toggleSidebar}
                            className={`p-2 rounded-full mr-3 ${
                                theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            } transition-colors`}
                            aria-label={isSidebarOpen ? "Ocultar panel" : "Mostrar panel"}
                            title={isSidebarOpen ? "Ocultar panel" : "Mostrar panel"}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                {isSidebarOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                )}
                            </svg>
                        </button>

                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                            <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                        </div>
                        <h1 className={`text-xl md:text-2xl font-medium ${theme === 'dark' ? 'text-white' : 'text-purple-600'}`}>RAG Híbrido</h1>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Status indicator */}
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

                        {/* Theme button */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full ${
                                theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300'
                                    : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                            } transition-colors`}
                            aria-label="Cambiar tema"
                            title="Cambiar tema"
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
                    </div>
                </div>
            </header>

            {/* Messages area */}
            <div className={`flex-1 overflow-y-auto p-3 md:p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="max-w-5xl mx-auto">
                    {(!activeConversation || activeConversation.messages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4 py-20">
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

                            {/* Example questions - Responsive Grid */}
                            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                <ExampleQuestion
                                    theme={theme}
                                    text="¿Qué es la criptografía simétrica?"
                                    icon={
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                                        </svg>
                                    }
                                />
                                <ExampleQuestion
                                    theme={theme}
                                    text="¿Cómo funciona la arquitectura serverless?"
                                    icon={
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                        </svg>
                                    }
                                />
                                <ExampleQuestion
                                    theme={theme}
                                    text="¿Cuáles son las mejores prácticas de seguridad para AWS Lambda?"
                                    icon={
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                    }
                                />
                                <ExampleQuestion
                                    theme={theme}
                                    text="Explica la integración de DynamoDB con API Gateway"
                                    icon={
                                        <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                                        </svg>
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 w-full">
                            {activeConversation.messages.map((message, index) => (
                                <ChatMessage
                                    key={index}
                                    message={message}
                                    theme={theme}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Task status (visible only on processing) */}
            {taskId && (status === 'PENDING' || status === 'PROCESSING') && (
                <div className={`hidden md:flex py-2 px-4 items-center justify-center ${
                    theme === 'dark' ? 'bg-gray-800 text-gray-300 border-t border-gray-700' : 'bg-gray-100 text-gray-600 border-t border-gray-200'
                }`}>
                    <div className="flex items-center text-sm">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="mr-2">Buscando en fuentes especializadas</span>
                        <span className="mr-2">•</span>
                        <span>ID: {taskId}</span>
                        <span className="mx-2">•</span>
                        <span>Estado: {status}</span>
                    </div>
                </div>
            )}

            {/* Input area */}
            <ChatInput theme={theme} />
        </>
    );
};

// Example question component
const ExampleQuestion = ({ theme, text, icon }) => {
    const { handleSubmitQuery } = useContext(ChatContext);

    return (
        <button
            onClick={() => handleSubmitQuery(text)}
            className={`text-left p-3 rounded-lg transition-colors ${
                theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
            } shadow-sm`}
        >
      <span className="flex items-center">
        {icon}
          <span className="line-clamp-1">{text}</span>
      </span>
        </button>
    );
};

export default ChatMain;
