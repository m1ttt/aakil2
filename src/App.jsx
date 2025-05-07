// src/App.jsx - Main application component
import React, { useState, useEffect } from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatMain from './components/ChatMain';
import { ChatProvider } from './context/ChatContext';
import './App.css';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(300); // Default width
    const [theme, setTheme] = useState('light');
    const [isDragging, setIsDragging] = useState(false);

    // Toggle theme
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Handle mouse down on the resizer
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Handle mouse move for resizing
    const handleMouseMove = (e) => {
        if (!isDragging) return;

        // Calculate new width based on mouse position
        const newWidth = e.clientX;

        // Limit the width between min and max values
        if (newWidth >= 200 && newWidth <= 500) {
            setSidebarWidth(newWidth);
        }
    };

    // Handle mouse up to stop resizing
    const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Clean up event listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <ChatProvider>
            <div
                className={`flex h-screen w-full overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
                } transition-colors duration-300`}
            >
                {/* Chat sidebar - conditionally rendered and sized */}
                <div
                    className={`sidebar-container h-full ${
                        isSidebarOpen ? 'flex' : 'hidden'
                    } flex-col bg-opacity-95 z-20 transition-all ease-in-out duration-300 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    } border-r ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    } shadow-md`}
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <ChatSidebar
                        theme={theme}
                        toggleSidebar={toggleSidebar}
                    />
                </div>

                {/* Resizer */}
                {isSidebarOpen && (
                    <div
                        className={`h-full w-1 cursor-col-resize ${
                            theme === 'dark' ? 'bg-gray-700 hover:bg-purple-700' : 'bg-gray-200 hover:bg-purple-500'
                        } transition-colors duration-200 z-30 ${
                            isDragging ? (theme === 'dark' ? 'bg-purple-700' : 'bg-purple-500') : ''
                        }`}
                        onMouseDown={handleMouseDown}
                    />
                )}

                {/* Main content area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <ChatMain
                        theme={theme}
                        toggleTheme={toggleTheme}
                        toggleSidebar={toggleSidebar}
                        isSidebarOpen={isSidebarOpen}
                    />
                </div>
            </div>
        </ChatProvider>
    );
}

export default App;
