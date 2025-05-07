// src/App.jsx - Main application component
import React, { useState, useEffect } from 'react'; // Asegúrate que useEffect esté importado
import ChatSidebar from './components/ChatSidebar';
import ChatMain from './components/ChatMain';
import { ChatProvider } from './context/ChatContext';
import './App.css';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [sidebarWidth, setSidebarWidth] = useState(window.innerWidth >= 1024 ? 320 : 280); // Responsive default width
    const [theme, setTheme] = useState(
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
    );
    const [isDragging, setIsDragging] = useState(false);

    // ADDED: Log para montaje y desmontaje de App.jsx
    useEffect(() => {
        console.log("App.jsx: Componente MONTADO");
        return () => {
            console.log("App.jsx: Componente DESMONTANDOSE!");
        };
    }, []); // Array vacío para que se ejecute solo al montar y desmontar

    // Toggle theme
    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('aakil-theme', newTheme);
            if (newTheme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            return newTheme;
        });
    };

    // Load saved theme on initial render
    useEffect(() => {
        const savedTheme = localStorage.getItem('aakil-theme');
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.body.classList.add('dark');
            }
        } else { // Si no hay tema guardado, aplicar el detectado o default al body
            if (theme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
    }, [theme]); // Dependencia en theme para aplicar al body si cambia por detección inicial

    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Handle mouse down on the resizer
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        // Los listeners se añaden aquí para que solo estén activos durante el drag
    };

    // Handle mouse move for resizing
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const newWidth = e.clientX;
        if (newWidth >= 240 && newWidth <= 500) { // Limitar el ancho
            setSidebarWidth(newWidth);
        }
    };

    // Handle mouse up to stop resizing
    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    };

    // Efecto para añadir/quitar listeners de mousemove y mouseup
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        // Cleanup: asegurar que se quitan los listeners si el componente se desmonta mientras isDragging es true
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]); // Dependencia en isDragging

    // Handle window resize for auto-closing sidebar on small screens
    useEffect(() => {
        const handleWindowResize = () => {
            if (window.innerWidth < 768 && isSidebarOpen) {
                setIsSidebarOpen(false);
            } else if (window.innerWidth >= 768 && !isSidebarOpen && !isDragging) {
                // Opcional: Reabrir sidebar en pantallas grandes si se redimensiona y no estaba abierta
                // Podrías querer una lógica más específica aquí, o basarte en un estado guardado
                // setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleWindowResize);
        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, [isSidebarOpen, isDragging]); // Añadido isDragging para evitar comportamientos extraños durante el resize del sidebar

    return (
        <ChatProvider>
            <div
                className={`flex h-screen w-full overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-900 text-white dark' : 'bg-gray-50 text-gray-900'
                } transition-colors duration-300`}
            >
                {/* Backdrop for mobile sidebar */}
                {isSidebarOpen && window.innerWidth < 768 && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" // Asegurar que solo aparezca en móviles
                        onClick={toggleSidebar}
                    ></div>
                )}

                {/* Chat sidebar - conditionally rendered and sized */}
                <div
                    className={`sidebar-container h-full ${
                        isSidebarOpen ? 'flex' : 'hidden'
                    } md:flex flex-col bg-opacity-95 ${window.innerWidth < 768 ? 'fixed z-40' : 'relative z-10'} 
                    transition-all ease-in-out duration-300 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    } border-r ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    } shadow-lg md:shadow-md`} // Sombra más pronunciada en móvil
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <ChatSidebar
                        theme={theme}
                        toggleSidebar={toggleSidebar} // Pasar para el botón de cerrar en el sidebar
                    />
                </div>

                {/* Resizer - debería ocultarse en móvil o si el sidebar está cerrado */}
                {isSidebarOpen && window.innerWidth >= 768 && (
                    <div
                        className={`h-full w-1.5 cursor-col-resize select-none ${
                            theme === 'dark' ? 'bg-gray-700 hover:bg-purple-700' : 'bg-gray-300 hover:bg-purple-500'
                        } transition-colors duration-200 z-30 ${
                            isDragging ? (theme === 'dark' ? 'bg-purple-700' : 'bg-purple-500') : ''
                        }`}
                        onMouseDown={handleMouseDown}
                        title="Arrastra para redimensionar"
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
