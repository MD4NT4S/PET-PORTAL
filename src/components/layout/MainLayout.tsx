import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    LifeBuoy,
    UserCheck,
    BarChart2,
    Calendar,
    FileText,
    Heart,
    Settings,
    Menu,
    X,
    Sun,
    Moon,
    GraduationCap,
    LogOut,
    Box
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useStorage } from '../../context/StorageContext';
import { useNavigate } from 'react-router-dom';
import { Footer } from './Footer';
import { ProfileSettings } from '../member/ProfileSettings';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('pet-theme');
        return saved ? saved === 'dark' : true;
    });
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const location = useLocation();
    const { currentUser, logoutUser, isAdmin, members } = useStorage();
    const navigate = useNavigate();

    // Get current member to show photo if available
    const currentMember = members.find(m => m.name === currentUser);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('pet-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('pet-theme', 'light');
        }
    }, [isDarkMode]);

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Home' },
        { to: '/ouvidoria', icon: MessageSquare, label: 'Ouvidoria' },
        { to: '/ajuda', icon: LifeBuoy, label: 'Central de Ajuda' },
        { to: '/autoavaliacao', icon: UserCheck, label: 'Autoavaliação' },
        { to: '/dashboard', icon: BarChart2, label: 'Transparência' },
        { to: '/calendario', icon: Calendar, label: 'Calendário' },
        { to: '/conhecimento', icon: FileText, label: 'Base de Conhecimento' },
        { to: '/feedback', icon: Heart, label: 'Feedback 360' },
        { to: '/infraestrutura', icon: Box, label: 'Infraestrutura' },
        ...(isAdmin ? [{ to: '/admin', icon: Settings, label: 'Admin' }] : []),
    ];

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex transition-colors duration-200">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center h-16 px-6 border-b border-secondary-200 dark:border-secondary-800">
                    <img src="/logo.png" alt="PET Hub Logo" className="h-8 w-8 mr-2" />
                    <span className="text-xl font-bold dark:text-white">Portal PET - CAP</span>
                    <button
                        className="ml-auto lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-6 w-6 text-secondary-500" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.to;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                                        : "text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                                )}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                {item.label}
                            </NavLink>
                        );
                    })}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sair
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 flex items-center justify-between px-4 lg:px-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>

                    <div className="ml-auto flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            title="Alternar tema"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        <div
                            className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-medium text-sm cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all overflow-hidden"
                            onClick={() => setIsProfileOpen(true)}
                            title="Editar Perfil"
                        >
                            {currentMember?.photoUrl ? (
                                <img src={currentMember.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                currentUser ? currentUser.charAt(0).toUpperCase() : '?'
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto flex flex-col">
                    <div className="flex-1 p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                            <Outlet />
                        </div>
                    </div>
                    <Footer />
                </main>
            </div>

            <ProfileSettings isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
    );
}
