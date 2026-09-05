import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { toggleTheme, isDark } = useTheme();

  const iconSizes = {
    sm: 14,
    md: 17,
    lg: 20
  };

  const padSizes = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2 rounded-xl',
    lg: 'p-2.5 rounded-2xl'
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`${padSizes[size]} border transition-all duration-300 relative group cursor-pointer flex items-center justify-center shadow-sm ${
        isDark
          ? 'bg-[#12101e] border-purple-900/50 text-amber-400 hover:text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/10 hover:shadow-amber-500/10'
          : 'bg-white border-purple-200 text-purple-700 hover:text-purple-900 hover:border-purple-400 hover:bg-purple-50 hover:shadow-purple-500/10'
      } ${className}`}
    >
      <div className="relative z-10 transition-transform duration-500 group-hover:scale-115 group-hover:rotate-45">
        {isDark ? (
          <Sun size={iconSizes[size]} className="text-amber-400" />
        ) : (
          <Moon size={iconSizes[size]} className="text-purple-600" />
        )}
      </div>
    </button>
  );
};
