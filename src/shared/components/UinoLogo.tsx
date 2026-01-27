/**
 * Uino Logo 组件
 * 显示系统标识，可点击返回首页
 */

import React from 'react';

interface UinoLogoProps {
  theme?: 'light' | 'dark';
  onClick?: () => void;
}

export const UinoLogo: React.FC<UinoLogoProps> = ({ 
  theme = 'dark',
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div 
      className="flex items-center group cursor-pointer" 
      onClick={handleClick}
    >
      <div className="relative flex items-center justify-center">
        <img
          src="/img/system_icon.png"
          alt="System Logo"
          className="object-contain transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          style={{ width: '108px', height: '24px' }}
          onError={(e) => {
            console.error('Logo image failed to load from /img/system_icon.png');
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* 品牌装饰光晕 */}
        <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
};
