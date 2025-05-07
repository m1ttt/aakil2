// src/components/ChatMessage.jsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const ChatMessage = ({ message, theme }) => {
    const [showSources, setShowSources] = useState(true);
    const [showThinking, setShowThinking] = useState(false);

    const toggleSources = () => {
        setShowSources(!showSources);
    };

    const toggleThinking = () => {
        setShowThinking(!showThinking);
    };

    // Extraer el bloque "think" del contenido
    const extractThinkingBlock = (content) => {
        if (typeof content !== 'string') return { mainContent: content, thinkingContent: null };

        const thinkStartTag = "<think>";
        const thinkEndTag = "</think>";
        const startIndex = content.indexOf(thinkStartTag);
        const endIndex = content.indexOf(thinkEndTag);

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            // Extraer el contenido del bloque think
            const thinkingContent = content.substring(startIndex + thinkStartTag.length, endIndex).trim();

            // Extraer el contenido principal (excluyendo el bloque think)
            const beforeThink = content.substring(0, startIndex).trim();
            const afterThink = content.substring(endIndex + thinkEndTag.length).trim();
            const mainContent = (beforeThink + " " + afterThink).trim();

            return { mainContent, thinkingContent };
        }

        return { mainContent: content, thinkingContent: null };
    };

    // Procesar el contenido para extraer bloques de pensamiento
    const { mainContent, thinkingContent } = message.type === 'assistant'
        ? extractThinkingBlock(message.content)
        : { mainContent: message.content, thinkingContent: null };

    // Format timestamp
    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('es', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    };

    // Custom components for ReactMarkdown
    const components = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={theme === 'dark' ? vscDarkPlus : vs}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                    customStyle={{
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        padding: '0.75rem',
                        marginBottom: '0.75rem',
                        border: theme === 'dark' ? '1px solid rgb(55, 65, 81)' : '1px solid rgb(229, 231, 235)'
                    }}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code
                    className={`${inline ? 'px-1 py-0.5 rounded text-sm font-mono' : 'block p-3 rounded-md overflow-x-auto'} ${
                        theme === 'dark'
                            ? 'bg-gray-800 text-gray-200'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                    {...props}
                >
                    {children}
                </code>
            );
        },
        p({ children }) {
            return <p className="mb-2 last:mb-0" style={{ letterSpacing: '-0.01em', lineHeight: '1.4' }}>{children}</p>;
        },
        a({ node, children, href, ...props }) {
            return (
                <a  // <<< Add the opening tag here
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline`}
                    {...props}
                >
                    {children}
                </a>
            );
        },
        ul({ children }) {
            return <ul className="list-disc pl-5 mb-3" style={{ letterSpacing: '-0.01em' }}>{children}</ul>;
        },
        ol({ children }) {
            return <ol className="list-decimal pl-5 mb-3" style={{ letterSpacing: '-0.01em' }}>{children}</ol>;
        },
        li({ children }) {
            return <li className="mb-0.5" style={{ lineHeight: '1.4' }}>{children}</li>;
        },
        blockquote({ children }) {
            return (
                <blockquote
                    className={`border-l-4 pl-3 italic my-2 ${
                        theme === 'dark'
                            ? 'border-gray-600 text-gray-300'
                            : 'border-gray-300 text-gray-700'
                    }`}
                    style={{ letterSpacing: '-0.01em', lineHeight: '1.4' }}
                >
                    {children}
                </blockquote>
            );
        },
        table({ children }) {
            return (
                <div className="overflow-x-auto my-3">
                    <table className={`min-w-full border-collapse ${
                        theme === 'dark'
                            ? 'border-gray-700'
                            : 'border-gray-300'
                    }`} style={{ fontSize: '0.9em' }}>
                        {children}
                    </table>
                </div>
            );
        },
        thead({ children }) {
            return <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}>{children}</thead>;
        },
        th({ children }) {
            return (
                <th className={`py-1 px-3 text-left font-semibold ${
                    theme === 'dark'
                        ? 'border-gray-700'
                        : 'border border-gray-300'
                }`}>
                    {children}
                </th>
            );
        },
        td({ children }) {
            return (
                <td className={`py-1 px-3 ${
                    theme === 'dark'
                        ? 'border-gray-700'
                        : 'border border-gray-300'
                }`}>
                    {children}
                </td>
            );
        },
        h1({ children }) {
            return <h1 className="text-2xl font-bold mt-3 mb-2" style={{ letterSpacing: '-0.01em', lineHeight: '1.3' }}>{children}</h1>;
        },
        h2({ children }) {
            return <h2 className="text-xl font-bold mt-3 mb-2" style={{ letterSpacing: '-0.01em', lineHeight: '1.3' }}>{children}</h2>;
        },
        h3({ children }) {
            return <h3 className="text-lg font-bold mt-2 mb-1" style={{ letterSpacing: '-0.01em', lineHeight: '1.3' }}>{children}</h3>;
        },
        h4({ children }) {
            return <h4 className="text-base font-bold mt-2 mb-1" style={{ letterSpacing: '-0.01em', lineHeight: '1.3' }}>{children}</h4>;
        },
        hr() {
            return <hr className={`my-3 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`} />;
        }
    };

    return (
        <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`rounded-xl p-2.5 md:p-3 relative ${
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
                {/* Message timestamp */}
                <div className={`absolute top-2 right-3 text-xs ${
                    message.type === 'user'
                        ? 'text-purple-200'
                        : theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-500'
                }`}>
                    {formatTimestamp(message.timestamp)}
                </div>

                {message.status === 'thinking' || message.status === 'processing_rag' ? (
                    <div className="thinking-container">
                        <div className={`thinking-animation ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
                            <div className="thinking-dot"></div>
                            <div className="thinking-dot"></div>
                            <div className="thinking-dot"></div>
                        </div>
                        <div className="flex items-center">
                            <svg className={`w-5 h-5 mr-2 thinking-icon ${
                                theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                {message.status === 'processing_rag'
                                    ? 'Buscando en fuentes especializadas...'
                                    : 'Pensando...'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Message content with Markdown */}
                        <div className="whitespace-pre-wrap break-words mt-3 pr-10 chat-message-content"
                             style={{ letterSpacing: '-0.01em', lineHeight: '1.4' }}>
                            {message.type === 'user' ? (
                                mainContent
                            ) : (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={components}
                                >
                                    {mainContent}
                                </ReactMarkdown>
                            )}
                        </div>

                        {/* Thinking block - desplegable */}
                        {thinkingContent && (
                            <div className={`mt-3 ${theme === 'dark' ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                                <button
                                    onClick={toggleThinking}
                                    className={`flex items-center justify-between w-full py-2 px-1 text-sm font-medium ${
                                        theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                    } transition-colors`}
                                >
                                    <span className="flex items-center">
                                        <svg className={`w-4 h-4 mr-2 ${
                                            theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                        </svg>
                                        Proceso de pensamiento
                                    </span>
                                    <svg className={`w-5 h-5 transition-transform ${showThinking ? 'rotate-180' : ''}`}
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>

                                {showThinking && (
                                    <div className={`p-3 rounded-md text-sm mt-1 mb-2 overflow-auto max-h-96 ${
                                        theme === 'dark'
                                            ? 'bg-gray-900 border border-gray-700 text-gray-300'
                                            : 'bg-gray-50 border border-gray-200 text-gray-700'
                                    }`} style={{ whiteSpace: 'pre-wrap' }}>
                                        {thinkingContent}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Response type indicator */}
                        {message.type === 'assistant' && message.status === 'completed' && (
                            <div className={`flex items-center justify-between text-xs mt-2 pt-1.5 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-opacity-50`}>
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

                        {/* Sources (only for completed assistant messages) - Unificadas */}
                        {message.type === 'assistant' &&
                            message.status === 'completed' &&
                            message.sources &&
                            message.sources.length > 0 &&
                            showSources && (
                                <div className={`mt-3 pt-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                    {(() => {
                                        // Crear un mapa para agrupar por fuente (uri o source)
                                        const uniqueSources = new Map();

                                        // Agrupar fuentes por URI o nombre de fuente
                                        message.sources.forEach(source => {
                                            const key = source.uri || source.source;

                                            if (uniqueSources.has(key)) {
                                                // Si ya existe esta fuente, actualizar el score si el nuevo es mayor
                                                const existingSource = uniqueSources.get(key);
                                                if (source.score > existingSource.score) {
                                                    existingSource.score = source.score;
                                                }
                                            } else {
                                                // Si es nueva, agregarla al mapa
                                                uniqueSources.set(key, {...source});
                                            }
                                        });

                                        // Convertir el mapa a array para renderizar
                                        const uniqueSourcesArray = Array.from(uniqueSources.values());

                                        return (
                                            <>
                                                <p className={`text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Fuentes ({uniqueSourcesArray.length}):
                                                </p>
                                                <div className="space-y-2">
                                                    {uniqueSourcesArray.map((source, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`text-sm rounded-lg p-2 ${
                                                                theme === 'dark'
                                                                    ? 'bg-gray-900 border border-gray-800'
                                                                    : 'bg-gray-50 border border-gray-200'
                                                            }`}
                                                            style={{ fontSize: '0.85rem', letterSpacing: '-0.01em' }}
                                                        >
                                                            <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                                                                <span className="font-medium truncate">{source.source || 'Fuente desconocida'}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                    theme === 'dark'
                                                                        ? 'bg-blue-900 text-blue-200'
                                                                        : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                    {typeof source.score === 'number' ? source.score.toFixed(2) : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}
                                                               style={{ lineHeight: '1.3' }}>
                                                                {source.content || source.content_snippet}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
