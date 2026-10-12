import React from 'react';
import { 
  Gamepad2, 
  Wrench, 
  MessageCircle, 
  Music, 
  Camera, 
  BookOpen, 
  Globe, 
  Code2, 
  Wallet, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { APKApp } from '../types';

interface Props {
  app: APKApp;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AppIconRenderer: React.FC<Props> = ({ app, size = 'md', className = '' }) => {
  // Google Play Store standard Squircle rounding (rounded-[22%])
  const sizeMap = {
    sm: 'w-10 h-10 rounded-[22%] text-lg',
    md: 'w-14 h-14 rounded-[22%] text-xl shadow-sm',
    lg: 'w-20 h-20 rounded-[22%] text-3xl shadow-md',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 rounded-[22%] text-4xl shadow-lg',
  };

  const iconSizeMap = {
    sm: 20,
    md: 28,
    lg: 40,
    xl: 54,
  };

  // If app has a real uploaded icon logo image
  if (app.iconUrl) {
    return (
      <div className={`relative shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-black/5 dark:border-white/10 ${sizeMap[size]} ${className}`}>
        <img 
          src={app.iconUrl} 
          alt={app.name} 
          className="w-full h-full object-cover select-none" 
          loading="lazy" 
        />
      </div>
    );
  }

  const renderIcon = () => {
    const iconProps = { 
      size: iconSizeMap[size], 
      className: 'text-white drop-shadow-md stroke-[2]' 
    };

    switch (app.iconSvgType) {
      case 'game':
        return <Gamepad2 {...iconProps} />;
      case 'tool':
        return <Wrench {...iconProps} />;
      case 'chat':
        return <MessageCircle {...iconProps} />;
      case 'music':
        return <Music {...iconProps} />;
      case 'camera':
        return <Camera {...iconProps} />;
      case 'book':
        return <BookOpen {...iconProps} />;
      case 'globe':
        return <Globe {...iconProps} />;
      case 'code':
        return <Code2 {...iconProps} />;
      case 'wallet':
        return <Wallet {...iconProps} />;
      case 'shield':
        return <ShieldCheck {...iconProps} />;
      default:
        return <Smartphone {...iconProps} />;
    }
  };

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center bg-gradient-to-br ${app.iconBg || 'from-emerald-500 to-teal-700'} shadow-sm border border-black/5 dark:border-white/10 select-none overflow-hidden ${sizeMap[size]} ${className}`}
    >
      {/* Subtle glossy sheen */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/25 pointer-events-none" />
      <div className="relative z-10 flex items-center justify-center">
        {renderIcon()}
      </div>
    </div>
  );
};
