import React from 'react';
import { MoosMascot } from './MoosMascot';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideLogo?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, hideLogo = false }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-[max(3rem,env(safe-area-inset-bottom))] px-3 sm:px-4 relative overflow-hidden">
      {/* Floating background elements for extra depth - optional, sticking to CSS for performance first */}
      <div className="w-full max-w-md flex flex-col items-center space-y-6">

        {/* Logo Section */}
        {!hideLogo && (
          <div className="flex flex-col items-center mb-2 animate-fade-in-down">
            <MoosMascot size={90} className="mb-2" />
            <h1 className="text-3xl font-extrabold text-warm-700 tracking-tight">Moos</h1>
          </div>
        )}

        {/* Dynamic Title if provided */}
        {title && (
          <h2 className="text-xl font-bold text-warm-700 text-center animate-fade-in px-4">
            {title}
          </h2>
        )}

        {/* Main Content Card Wrapper */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
