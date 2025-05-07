// src/components/ChatMessage.jsx
import React, { useState } from 'react';

const ChatMessage = ({ message, theme }) => {
    const [showSources, setShowSources] = useState(true);

    const toggleSources = () => {
        setShowSources(!showSources);
    };

    return (
        <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`rounded-xl p-3 md:p-4 ${
                    message.type === 'user'
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
                } 
        ${message.type === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[90%] md:max-w-[80%]'} 
        ${message.type === 'assistant' ? 'shadow-md' : ''}`}
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

                        {/* Response type indicator */}
                        {message.type === 'assistant' && message.status === 'completed' && (
                            <div className={`flex items-center justify-between text-xs mt-3 pt-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-opacity-50`}>
                                <div>
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

                                {/* Sources toggle if there are sources */}
                                {message.sources && message.sources.length > 0 && (
                                    <button
                                        onClick={toggleSources}
                                        className={`flex items-center ${
                                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                                        } transition-colors`}
                                    >
                                        {showSources ? 'Ocultar fuentes' : 'Mostrar fuentes'}
                                        <svg className={`w-3 h-3 ml-1 transform transition-transform ${showSources ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Sources (only for completed assistant messages) */}
                        {message.type === 'assistant' &&
                            message.status === 'completed' &&
                            message.sources &&
                            message.sources.length > 0 &&
                            showSources && (
                                <div className={`mt-4 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Fuentes ({message.sources.length}):
                                    </p>
                                    <div className="space-y-3">
                                        {message.sources.map((source, idx) => (
                                            <div
                                                key={idx}
                                                className={`text-sm rounded-lg p-3 ${
                                                    theme === 'dark'
                                                        ? 'bg-gray-900 border border-gray-800'
                                                        : 'bg-gray-50 border border-gray-200'
                                                }`}
                                            >
                                                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                                    <span className="font-medium truncate">{source.source || 'Fuente desconocida'}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        theme === 'dark'
                                                            ? 'bg-blue-900 text-blue-200'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                            {typeof source.score === 'number' ? source.score.toFixed(2) : 'N/A'}
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
    );
};

export default ChatMessage;
