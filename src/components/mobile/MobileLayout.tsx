import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

/**
 * MobileLayout ensures that the content respects the device safe areas (notches/home indicators).
 * It uses the 'safe-area-pt' and 'safe-area-pb' classes defined in index.css.
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, showBottomNav = true }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background app-native-container">
      <div className="safe-area-pt bg-slate-900" /> {/* Status bar background matching splash */}
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {showBottomNav && (
        <div className="safe-area-pb bg-white border-t border-slate-100" />
      )}
    </div>
  );
};
