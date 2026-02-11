import React from 'react';
import { useStorage } from '../../context/StorageContext';
import { Mail, Phone, MapPin, Instagram, Linkedin, Github, GraduationCap } from 'lucide-react';

export function Footer() {
    const { siteConfig, loadingConfig } = useStorage();
    const { contact, footer } = siteConfig;

    const currentYear = new Date().getFullYear();

    if (loadingConfig) return null;

    return (
        <footer className="bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 transition-colors mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand & Description */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <GraduationCap className="h-6 w-6 text-primary-600" />
                            <span className="text-lg font-bold text-secondary-900 dark:text-white">Portal PET Hub</span>
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed max-w-xs">
                            {footer.text || 'Gestão acadêmica simplificada para grupos PET.'}
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider">
                            Contato
                        </h3>
                        <ul className="space-y-3">
                            {contact.email && (
                                <li className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                                    <Mail className="h-4 w-4 mr-2" />
                                    <a href={`mailto:${contact.email}`} className="hover:text-primary-600 transition-colors">
                                        {contact.email}
                                    </a>
                                </li>
                            )}
                            {contact.phone && (
                                <li className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                                    <Phone className="h-4 w-4 mr-2" />
                                    <span>{contact.phone}</span>
                                </li>
                            )}
                            {contact.address && (
                                <li className="flex items-start text-sm text-secondary-600 dark:text-secondary-400">
                                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                                    <span>{contact.address}</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider">
                            Redes Sociais
                        </h3>
                        <div className="flex space-x-4">
                            {contact.instagram && (
                                <a
                                    href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                            {contact.linkedin && (
                                <a
                                    href={`https://linkedin.com/${contact.linkedin}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            )}
                            {contact.github && (
                                <a
                                    href={`https://github.com/${contact.github}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                                    aria-label="GitHub"
                                >
                                    <Github className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-secondary-200 dark:border-secondary-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-secondary-500 text-center md:text-left">
                        {footer.copyright || `© ${currentYear} Portal PET Hub. Todos os direitos reservados.`}
                    </p>
                    <div className="text-xs text-secondary-400">
                        v1.0.0
                    </div>
                </div>
            </div>
        </footer>
    );
}
