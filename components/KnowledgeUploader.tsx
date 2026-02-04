import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { httpClient } from '../services/httpClient';

interface KnowledgeUploaderProps {
  domainId?: string;
  onUploadSuccess?: (filePath: string) => void;
  isDark?: boolean;
}

export const KnowledgeUploader: React.FC<KnowledgeUploaderProps> = ({ 
  domainId = 'default', 
  onUploadSuccess,
  isDark = false 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatus('idle');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domainId', domainId);

    try {
      // 使用 fetch 而不是 httpClient，因为需要处理 FormData
      // 但为了保持一致性，如果 httpClient 支持 FormData 更好
      // 这里假设直接调用 API
      const response = await fetch('/api/upload/knowledge', {
        method: 'POST',
        body: formData,
        // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data boundary
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('上传成功，正在后台解析知识...');
        if (onUploadSuccess) {
          onUploadSuccess(data.data.filePath);
        }
      } else {
        throw new Error(data.message || '上传失败');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || '上传过程中发生错误');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <FileText className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>知识库导入</h3>
      </div>
      
      <div className="space-y-3">
        <div className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDark ? 'border-[#303030] hover:border-blue-500/50' : 'border-gray-200 hover:border-blue-400'
        }`}>
          <input
            type="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".txt,.md,.sql,.json"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className={`w-6 h-6 mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {file ? file.name : '点击或拖拽文件到此处'}
            </p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              支持 SQL, Markdown, TXT, JSON
            </p>
          </div>
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isUploading 
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:opacity-90'
            } ${
              isDark 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-600 text-white'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                上传解析中...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                开始导入
              </>
            )}
          </button>
        )}

        {status === 'success' && (
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            <CheckCircle className="w-3 h-3" />
            {message}
          </div>
        )}

        {status === 'error' && (
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            <AlertCircle className="w-3 h-3" />
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
