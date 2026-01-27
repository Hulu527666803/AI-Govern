import React from 'react';
import { CloudUpload, CheckCircle, Loader2 } from 'lucide-react';
import { PublishStep } from './types';

interface PublishModalProps {
  isOpen: boolean;
  step: PublishStep;
  config: { baseUrl: string; authHeader: string; namespace: string };
  progress: { percent: number; messages: string[] };
  resultJson: any;
  activeDomainName?: string;
  isDark: boolean;
  onClose: () => void;
  onConfigChange: (config: { baseUrl: string; authHeader: string; namespace: string }) => void;
  onStart: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  step,
  config,
  progress,
  resultJson,
  activeDomainName,
  isDark,
  onClose,
  onConfigChange,
  onStart
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-[600px] max-h-[80vh] overflow-y-auto rounded-xl p-6 shadow-2xl ${isDark ? 'bg-[#1f1f1f] text-gray-100' : 'bg-white text-gray-900'}`}>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CloudUpload className="w-5 h-5" /> 发布至问数系统 (M3)
        </h3>
        
        {step === 'CONFIG' && (
          <div className="space-y-4">
            <p className="text-sm opacity-70">请配置 M3 数据库连接信息。如果后台已配置环境变量，可直接点击开始。</p>
            <div>
              <label className="block text-sm mb-1">Base URL</label>
              <input 
                type="text" 
                value={config.baseUrl}
                onChange={e => onConfigChange({...config, baseUrl: e.target.value})}
                placeholder="http://10.100.30.128:8080"
                className={`w-full p-2 rounded border ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Authorization Header</label>
              <input 
                type="text" 
                value={config.authHeader}
                onChange={e => onConfigChange({...config, authHeader: e.target.value})}
                placeholder="Basic xxxxxxx"
                className={`w-full p-2 rounded border ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">命名空间 (Namespace)</label>
              <input 
                type="text" 
                value={config.namespace || activeDomainName || ''}
                onChange={e => onConfigChange({...config, namespace: e.target.value})}
                placeholder="留空则使用当前域名称"
                className={`w-full p-2 rounded border ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 rounded hover:bg-gray-700">取消</button>
              <button onClick={onStart} className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500">开始发布</button>
            </div>
          </div>
        )}
        
        {step === 'PROGRESS' && (
          <div className="space-y-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress.percent}%` }}></div>
            </div>
            <div className="text-sm text-right">{progress.percent}%</div>
            <div className={`h-40 overflow-y-auto p-2 rounded text-xs font-mono ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
              {progress.messages.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
              <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-500">关闭</button>
            </div>
          </div>
        )}

        {step === 'RESULT' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle className="w-5 h-5" /> 发布成功
            </div>
            <div className="text-sm opacity-70">以下是 M3 系统所需的元数据 JSON：</div>
            <pre className={`h-60 overflow-auto p-3 rounded text-xs font-mono ${isDark ? 'bg-black text-green-400' : 'bg-gray-100 text-green-700'}`}>
              {JSON.stringify(resultJson, null, 2)}
            </pre>
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-4 py-2 bg-blue-600 rounded text-white">关闭</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
