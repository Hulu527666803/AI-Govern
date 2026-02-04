import React, { useState, useEffect } from 'react';
import { Package, Play, RefreshCw, Upload, Terminal, Trash2 } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
}

interface SkillsManagerProps {
  isDark?: boolean;
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({ isDark = false }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/skills/list');
      const data = await res.json();
      if (data.success) {
        setSkills(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch skills', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await fetch('/api/skills/upload', {
          method: 'POST',
          body: formData,
        });
        fetchSkills(); // Refresh list
      } catch (err) {
        alert('Upload failed');
      }
    }
  };

  const handleExecute = async (skillId: string) => {
    setExecutionResult('Executing...');
    try {
      const res = await fetch(`/api/skills/execute/${skillId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Date.now() }) // Example params
      });
      const data = await res.json();
      setExecutionResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setExecutionResult(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (skillId: string) => {
    if (!confirm('确定要卸载该技能吗？')) return;
    try {
      const res = await fetch(`/api/skills/${skillId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchSkills();
      else setExecutionResult(`删除失败: ${data.message || res.statusText}`);
    } catch (err: any) {
      setExecutionResult(`删除失败: ${err.message}`);
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>技能插件管理</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSkills} className={`p-1.5 rounded-lg hover:bg-gray-100 ${isDark ? 'hover:bg-[#303030]' : ''}`}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <label className={`cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 ${isDark ? 'hover:bg-[#303030]' : ''}`}>
            <Upload size={14} />
            <input type="file" className="hidden" accept=".zip" onChange={handleUpload} />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {skills.map(skill => (
          <div key={skill.id} className={`p-3 rounded-lg border flex items-center justify-between ${isDark ? 'border-[#303030] bg-black/20' : 'border-gray-100 bg-gray-50'}`}>
            <div>
              <div className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{skill.name} <span className="opacity-50 text-[10px]">v{skill.version}</span></div>
              <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{skill.description}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleExecute(skill.id)} className={`p-1.5 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20`} title="执行"><Play size={12} /></button>
              <button onClick={() => handleDelete(skill.id)} className={`p-1.5 rounded ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-500'}`} title="卸载"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        
        {skills.length === 0 && !isLoading && (
          <div className="text-center py-4 text-xs opacity-50">暂无安装的技能</div>
        )}
      </div>

      {executionResult && (
        <div className={`mt-4 p-3 rounded-lg border font-mono text-[10px] overflow-auto max-h-32 ${isDark ? 'bg-black border-[#303030] text-green-400' : 'bg-gray-900 text-green-400'}`}>
          <div className="flex items-center gap-2 mb-1 opacity-50 border-b border-white/10 pb-1">
            <Terminal size={10} /> 
            <span>Console Output</span>
          </div>
          <pre>{executionResult}</pre>
        </div>
      )}
    </div>
  );
};
