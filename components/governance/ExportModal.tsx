import React from 'react';
import { Download } from 'lucide-react';
import { ExportType } from './types';

interface ExportModalProps {
  isOpen: boolean;
  exportType: ExportType;
  isDark: boolean;
  onClose: () => void;
  onExportTypeChange: (type: ExportType) => void;
  onDownload: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  exportType,
  isDark,
  onClose,
  onExportTypeChange,
  onDownload
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-[400px] rounded-xl p-6 shadow-2xl ${isDark ? 'bg-[#1f1f1f] text-gray-100' : 'bg-white text-gray-900'}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" /> 导出治理成果包
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 opacity-70">选择目标数据库类型</label>
            <div className="flex flex-col gap-2">
              {(['M3', 'MYSQL', 'DM'] as ExportType[]).map(type => (
                <label key={type} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${exportType === type ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') : (isDark ? 'border-[#303030]' : 'border-gray-200')}`}>
                  <input 
                    type="radio" 
                    name="dbType" 
                    checked={exportType === type}
                    onChange={() => onExportTypeChange(type)}
                  />
                  <span>{type} 数据库</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="text-xs opacity-50 p-2 bg-gray-500/10 rounded">
            包含：<br/>
            1. 数据结构分析<br/>
            2. 关系结构分析<br/>
            3. 建表/插入 SQL 脚本 (带注释)<br/>
            4. 数据治理说明文档
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 rounded hover:bg-gray-700">取消</button>
            <button onClick={onDownload} className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-500">下载 .zip</button>
          </div>
        </div>
      </div>
    </div>
  );
};
