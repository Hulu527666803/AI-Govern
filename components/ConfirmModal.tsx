/**
 * ConfirmModal - 通用确认弹窗组件
 * 用于替代浏览器的 alert/confirm，提供统一的弹窗样式
 */

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ModalType = 'success' | 'warning' | 'error' | 'info' | 'confirm';

interface ConfirmModalProps {
  isOpen: boolean;
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  theme?: 'light' | 'dark';
  showCancel?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  theme = 'dark',
  showCancel = true,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      case 'confirm':
        return <AlertCircle className="w-12 h-12 text-blue-500" />;
      default:
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return isDark ? 'bg-green-500/20' : 'bg-green-100';
      case 'warning':
        return isDark ? 'bg-yellow-500/20' : 'bg-yellow-100';
      case 'error':
        return isDark ? 'bg-red-500/20' : 'bg-red-100';
      case 'confirm':
        return isDark ? 'bg-blue-500/20' : 'bg-blue-100';
      default:
        return isDark ? 'bg-blue-500/20' : 'bg-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={onCancel}
      ></div>
      
      {/* 主弹窗 */}
      <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 ${
        isDark ? 'bg-[#141414] border border-[#303030]' : 'bg-white border border-gray-200'
      }`}>
        {/* 头部 */}
        <div className={`px-8 py-6 border-b ${isDark ? 'border-[#303030]' : 'border-gray-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div className="flex-1 pt-2">
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {message}
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-slate-500 hover:text-white hover:bg-[#252525]' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-gray-100'
                }`}
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className={`px-8 py-6 ${isDark ? 'bg-[#1d1d1d]' : 'bg-gray-50'}`}>
          <div className={`flex gap-3 ${!showCancel ? 'justify-center' : ''}`}>
            {showCancel && onCancel && (
              <button
                onClick={onCancel}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  isDark 
                    ? 'bg-[#252525] text-slate-300 hover:bg-[#303030] border border-[#303030]' 
                    : 'bg-gray-200 text-slate-600 hover:bg-gray-300 border border-gray-300'
                }`}
              >
                {cancelText}
              </button>
            )}
            
            {onConfirm && (
              <button
                onClick={onConfirm}
                className={`${showCancel ? 'flex-1' : 'px-12'} py-3 rounded-xl font-bold transition-all shadow-lg ${
                  type === 'error' || type === 'warning'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
