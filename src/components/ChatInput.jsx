// src/components/ChatInput.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { ChatContext } from '../context/ChatContext';

const ChatInput = ({ theme }) => {
    const {
        query,
        setQuery,
        handleSubmitQuery,
        status,
        useRAG,      // Obtener useRAG del contexto
        setUseRAG    // Obtener setUseRAG del contexto
    } = useContext(ChatContext);
    const textareaRef = useRef(null);

    // Adjust textarea height based on content
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to shrink if text is deleted
            const maxHeight = Math.max(window.innerHeight * 0.15, 80); // Max height: 15% of window height or 80px min
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        }
    };

    // Update textarea height when content changes or on initial render
    useEffect(() => {
        adjustTextareaHeight();
    }, [query]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => {
            adjustTextareaHeight();
        };

        window.addEventListener('resize', handleResize);
        adjustTextareaHeight(); // Adjust on initial mount too

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Handle form submission
    const onSubmit = (e) => {
        e.preventDefault();
        if (!query.trim() || status === 'PENDING' || status === 'PROCESSING') {
            return;
        }
        // Pasar el estado actual de useRAG a handleSubmitQuery
        handleSubmitQuery(query, useRAG);
        // No es necesario limpiar el query aquí si handleSubmitQuery lo hace.
        // Si handleSubmitQuery no limpia el query, entonces setQuery('') iría aquí.
        // En el ChatContext modificado, setQuery('') ya está en handleSubmitQuery.
    };

    // Handle key press (Enter to submit, Shift+Enter for new line)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    return (
        <div className={`border-t p-3 md:p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* RAG Toggle Switch */}
            <div className="flex items-center justify-end mb-2.5 pr-1 text-xs">
                <label
                    htmlFor="useRAGToggle"
                    className={`cursor-pointer select-none ${
                        theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    } transition-colors`}
                >
                    Usar fuentes especializadas (RAG):
                </label>
                <div className="relative inline-block w-10 ml-2 align-middle select-none transition duration-200 ease-in">
                    <input
                        type="checkbox"
                        name="useRAGToggle"
                        id="useRAGToggle"
                        checked={useRAG}
                        onChange={(e) => setUseRAG(e.target.checked)}
                        disabled={status === 'PENDING' || status === 'PROCESSING'}
                        className={`toggle-checkbox absolute block w-5 h-5 rounded-full ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        } appearance-none cursor-pointer transition-transform duration-150 ease-linear peer`}
                        style={{ top: '2px', left: useRAG ? '22px' : '2px' }}
                    />
                    <label
                        htmlFor="useRAGToggle"
                        className={`toggle-label block overflow-hidden h-[22px] w-[42px] rounded-full ${
                            useRAG
                                ? (theme === 'dark' ? 'bg-purple-700' : 'bg-purple-600')
                                : (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')
                        } cursor-pointer transition-colors duration-150 ease-linear`}
                    ></label>
                </div>
            </div>

            <form onSubmit={onSubmit} className="flex items-end space-x-2 md:space-x-3 max-w-5xl mx-auto">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={1} // Start with 1 row, will auto-adjust
                        className={`w-full resize-none rounded-2xl py-3 pl-4 pr-12 text-sm md:text-base transition focus:outline-none ${
                            theme === 'dark'
                                ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500'
                                : 'bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500'
                        }`}
                        placeholder="Escribe tu consulta aquí... (Shift+Enter para nueva línea)"
                        disabled={status === 'PENDING' || status === 'PROCESSING'}
                    />
                    <div className={`absolute right-4 bottom-3 text-xs hidden sm:block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {status === 'PENDING' || status === 'PROCESSING'
                            ? 'Procesando...'
                            : 'Enter para enviar'}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!query.trim() || status === 'PENDING' || status === 'PROCESSING'}
                    className={`p-3 rounded-full flex-shrink-0 transition-all transform active:scale-90 focus:outline-none focus:ring-2 ${
                        !query.trim() || status === 'PENDING' || status === 'PROCESSING'
                            ? theme === 'dark'
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed focus:ring-gray-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed focus:ring-gray-300'
                            : theme === 'dark'
                                ? 'bg-purple-700 text-white hover:bg-purple-600 shadow-md hover:shadow-lg focus:ring-purple-500'
                                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg focus:ring-purple-500'
                    }`}
                    aria-label="Enviar mensaje"
                >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
