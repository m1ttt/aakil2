// src/components/ChatSidebar.jsx
import React, { useState, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

const ChatSidebar = ({ theme, toggleSidebar }) => {
    const {
        conversations,
        activeConversationId,
        setActiveConversationId,
        createNewConversation,
        updateConversationName,
        deleteConversation
    } = useContext(ChatContext);

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [hoveredId, setHoveredId] = useState(null);

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Same day
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        // Yesterday
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer, ' + date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        // This week or earlier
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // Start editing a conversation name
    const startEditing = (id, currentName) => {
        setEditingId(id);
        setEditName(currentName);
    };

    // Save the edited name
    const saveEdit = (id) => {
        if (editName.trim()) {
            updateConversationName(id, editName.trim());
        }
        setEditingId(null);
    };

    // Handle key press in edit input
    const handleKeyPress = (e, id) => {
        if (e.key === 'Enter') {
            saveEdit(id);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    // Confirm deletion
    const confirmDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
            deleteConversation(id);
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Sidebar header */}
            <div className={`flex justify-between items-center p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className="text-lg font-medium flex items-center">
                    <svg className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                    </svg>
                    Conversaciones
                </h2>
                <div className="flex">
                    <button
                        onClick={createNewConversation}
                        className={`mr-2 p-2 rounded-full hover-active ${
                            theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600 text-purple-300'
                                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                        } transition-colors`}
                        aria-label="Nueva conversación"
                        title="Nueva conversación"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                    </button>
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-full md:hidden hover-active ${
                            theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        } transition-colors`}
                        aria-label="Cerrar panel"
                        title="Cerrar panel"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-light">
                {conversations.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            No hay conversaciones
                        </p>
                        <button
                            onClick={createNewConversation}
                            className={`mt-2 px-4 py-2 rounded-lg ${
                                theme === 'dark'
                                    ? 'bg-purple-700 hover:bg-purple-600 text-white'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                            } transition-colors hover-active`}
                        >
                            Iniciar nueva conversación
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-1 px-2">
                        {conversations.map(conv => (
                            <li key={conv.id}
                                onMouseEnter={() => setHoveredId(conv.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <div
                                    className={`flex items-center p-3 rounded-lg cursor-pointer group ${
                                        activeConversationId === conv.id
                                            ? theme === 'dark'
                                                ? 'bg-purple-900 bg-opacity-50'
                                                : 'bg-purple-100'
                                            : theme === 'dark'
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-100'
                                    } transition-colors hover-active`}
                                    onClick={() => setActiveConversationId(conv.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        {editingId === conv.id ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onBlur={() => saveEdit(conv.id)}
                                                onKeyDown={(e) => handleKeyPress(e, conv.id)}
                                                className={`w-full px-2 py-1 rounded ${
                                                    theme === 'dark'
                                                        ? 'bg-gray-800 text-white border border-gray-600'
                                                        : 'bg-white text-gray-900 border border-gray-300'
                                                }`}
                                                autoFocus
                                            />
                                        ) : (
                                            <>
                                                <div className="flex items-center">
                                                    <svg className={`w-5 h-5 mr-2 flex-shrink-0 ${
                                                        activeConversationId === conv.id
                                                            ? theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                                                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                                    </svg>
                                                    <p className={`truncate font-medium ${
                                                        activeConversationId === conv.id
                                                            ? theme === 'dark' ? 'text-white' : 'text-purple-800'
                                                            : ''
                                                    }`}>
                                                        {conv.name}
                                                    </p>
                                                </div>
                                                <p className={`text-xs mt-1 ${
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                    {formatDate(conv.lastUpdated)} · {conv.messages.length} mensaje{conv.messages.length !== 1 ? 's' : ''}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    {!editingId && (
                                        <div className={`ml-2 flex space-x-1 ${
                                            activeConversationId === conv.id || hoveredId === conv.id
                                                ? 'opacity-100'
                                                : 'opacity-0 group-hover:opacity-100'
                                        } transition-opacity`}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditing(conv.id, conv.name);
                                                }}
                                                className={`p-1.5 rounded-full ${
                                                    theme === 'dark'
                                                        ? 'hover:bg-gray-600 text-gray-300'
                                                        : 'hover:bg-gray-200 text-gray-700'
                                                }`}
                                                aria-label="Editar"
                                                title="Editar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => confirmDelete(conv.id, e)}
                                                className={`p-1.5 rounded-full ${
                                                    theme === 'dark'
                                                        ? 'hover:bg-red-900 text-gray-300 hover:text-red-300'
                                                        : 'hover:bg-red-100 text-gray-700 hover:text-red-700'
                                                }`}
                                                aria-label="Eliminar"
                                                title="Eliminar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Sidebar footer */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        Aakil - Asistente IA avanzado
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
