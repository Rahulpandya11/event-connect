import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'var(--muted-100)',
      }}
    >
      {theme === 'light' ? (
        <Moon className="w-3.5 h-3.5" style={{ color: 'var(--gold-bright)' }} />
      ) : (
        <Sun className="w-3.5 h-3.5" style={{ color: 'var(--gold-bright)' }} />
      )}
    </button>
  );
};
