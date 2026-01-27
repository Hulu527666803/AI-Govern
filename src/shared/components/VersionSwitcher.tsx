/**
 * 版本切换组件
 * 允许用户在 v1 和 v2 之间切换
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield } from 'lucide-react';
import { AppVersion, VERSION_CONFIGS } from '../types/version';
import { versionStorage } from '../utils/versionStorage';

interface VersionSwitcherProps {
  currentVersion: AppVersion;
  className?: string;
}

export const VersionSwitcher: React.FC<VersionSwitcherProps> = ({
  currentVersion,
  className = '',
}) => {
  const navigate = useNavigate();
  const currentConfig = VERSION_CONFIGS[currentVersion];
  const otherVersion: AppVersion = currentVersion === 'v1' ? 'v2' : 'v1';
  const otherConfig = VERSION_CONFIGS[otherVersion];

  const handleSwitch = () => {
    versionStorage.setPreferred(otherVersion);
    navigate(`/${otherVersion}`);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 当前版本标识 */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        {currentVersion === 'v1' ? (
          <Shield className="w-4 h-4 text-blue-400" />
        ) : (
          <Zap className="w-4 h-4 text-purple-400" />
        )}
        <span className="text-xs font-medium text-gray-300">
          {currentConfig.displayName}
        </span>
      </div>

      {/* 切换按钮 */}
      <button
        onClick={handleSwitch}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200
          ${
            otherVersion === 'v2'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }
        `}
        title={otherConfig.description}
      >
        {otherVersion === 'v2' ? '🚀 ' : '← '}
        {otherVersion === 'v2' ? '尝试新版' : '返回经典版'}
      </button>
    </div>
  );
};
