/**
 * Interrupt Confirm Modal - 人机协同确认弹窗
 * 
 * 功能：
 * 1. 显示 AI 识别的对象列表
 * 2. 支持内联编辑对象名称
 * 3. 提供"确认"和"修改"按钮
 */

import React, { useState } from 'react';
import { Check, Edit3, X, AlertCircle } from 'lucide-react';

interface InterruptObject {
  name: string;
  chineseName: string;
  description?: string;
  attributes: number;
}

interface InterruptConfirmModalProps {
  type: string;
  message: string;
  data: {
    objects: InterruptObject[];
  };
  onConfirm: () => void;
  onModify: (modifiedObjects: InterruptObject[]) => void;
  onCancel: () => void;
  theme?: 'light' | 'dark';
}

export const InterruptConfirmModal: React.FC<InterruptConfirmModalProps> = ({
  type,
  message,
  data,
  onConfirm,
  onModify,
  onCancel,
  theme = 'light',
}) => {
  const [editedObjects, setEditedObjects] = useState<InterruptObject[]>(data.objects || []);
  const [isModified, setIsModified] = useState(false);
  const isDark = theme === 'dark';

  const handleObjectEdit = (idx: number, field: keyof InterruptObject, value: string) => {
    const updated = [...editedObjects];
    (updated[idx] as any)[field] = value;
    setEditedObjects(updated);
    setIsModified(true);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={onCancel}
      ></div>
      
      {/* 主弹窗 */}
      <div className={`relative w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 ${
        isDark ? 'bg-[#141414] border border-[#303030]' : 'bg-white border border-gray-200'
      }`}>
        {/* 头部 */}
        <div className={`px-8 py-6 border-b ${isDark ? 'border-[#303030] bg-[#1d1d1d]' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                🤖 AI 需要您的确认
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {message}
              </p>
              {type === 'object_review' && (
                <div className={`mt-3 flex items-center gap-2 text-xs font-bold ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  <Edit3 className="w-3 h-3" />
                  <span>您可以直接点击对象名称进行修改</span>
                </div>
              )}
            </div>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-slate-500 hover:text-white hover:bg-[#252525]' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-gray-100'
              }`}
              title="取消"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 对象列表 */}
        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {editedObjects.map((obj, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                  isDark 
                    ? 'bg-[#1d1d1d] border-[#303030] hover:border-blue-500/50' 
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* 对象标签和中文名 */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    对象 {idx + 1}
                  </span>
                  <input
                    className={`flex-1 font-bold text-lg bg-transparent border-b-2 outline-none transition-colors px-2 py-1 ${
                      isDark 
                        ? 'text-white border-transparent hover:border-blue-500 focus:border-blue-500' 
                        : 'text-slate-900 border-transparent hover:border-blue-500 focus:border-blue-500'
                    }`}
                    value={obj.chineseName}
                    onChange={(e) => handleObjectEdit(idx, 'chineseName', e.target.value)}
                    placeholder="对象中文名"
                  />
                </div>

                {/* 对象详情 */}
                <div className={`space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold opacity-60">英文名:</span>
                    <span className={`font-mono px-2 py-0.5 rounded ${
                      isDark ? 'bg-black/40' : 'bg-white'
                    }`}>
                      {obj.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold opacity-60">属性数:</span>
                    <span className={`font-mono px-2 py-0.5 rounded ${
                      isDark ? 'bg-black/40 text-green-400' : 'bg-white text-green-600'
                    }`}>
                      {obj.attributes}
                    </span>
                  </div>
                  {obj.description && (
                    <div className="mt-2 pt-2 border-t border-gray-200/20">
                      <p className="text-xs leading-relaxed">{obj.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {editedObjects.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <p>未识别出任何对象</p>
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className={`px-8 py-6 border-t ${isDark ? 'border-[#303030] bg-[#1d1d1d]' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={editedObjects.length === 0}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                editedObjects.length === 0
                  ? (isDark ? 'bg-[#252525] text-slate-600 cursor-not-allowed' : 'bg-gray-200 text-slate-400 cursor-not-allowed')
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              <Check className="w-5 h-5" />
              确认无误，继续分析
            </button>
            
            <button
              onClick={() => onModify(editedObjects)}
              disabled={!isModified || editedObjects.length === 0}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                !isModified || editedObjects.length === 0
                  ? (isDark ? 'bg-[#252525] text-slate-600 cursor-not-allowed' : 'bg-gray-200 text-slate-400 cursor-not-allowed')
                  : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
              }`}
            >
              <Edit3 className="w-5 h-5" />
              应用修改并继续
            </button>
          </div>

          {isModified && (
            <div className={`mt-3 text-xs text-center ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              ⚠️ 您已修改了对象信息，请点击"应用修改并继续"以保存更改
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
