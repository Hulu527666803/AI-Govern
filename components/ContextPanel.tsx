import React, { useState, useEffect } from 'react';
import { Clock, Trash2, History, ChevronDown, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { useSession } from '../hooks/useSession';

interface ContextPanelProps {
  theme?: 'light' | 'dark';
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ theme = 'dark' }) => {
  const { sessionId, contextHistory, isLoading, loadContextHistory, clearContext } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isExpanded && sessionId) {
      loadContextHistory();
    }
  }, [isExpanded, sessionId, loadContextHistory]);

  const toggleItemExpand = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleClearContext = async () => {
    if (window.confirm('确定要清除所有上下文历史吗？这将开始一个新的会话。')) {
      await clearContext();
      setIsExpanded(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-100 shadow-sm'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-black/40' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <History size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              上下文历史
            </span>
            <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {contextHistory.length} 条记录
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contextHistory.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearContext();
              }}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
              title="清除上下文"
            >
              <Trash2 size={14} />
            </button>
          )}
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className={`border-t max-h-96 overflow-y-auto ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
          {isLoading ? (
            <div className="p-6 text-center">
              <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                加载中...
              </div>
            </div>
          ) : contextHistory.length === 0 ? (
            <div className="p-6 text-center">
              <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                暂无上下文历史
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#303030]">
              {contextHistory.map((item) => {
                const isItemExpanded = expandedItems.has(item.id);
                return (
                  <div key={item.id} className={`transition-colors ${isDark ? 'hover:bg-black/40' : 'hover:bg-gray-50'}`}>
                    <button
                      onClick={() => toggleItemExpand(item.id)}
                      className="w-full px-4 py-3 flex items-start gap-3 text-left"
                    >
                      <div className={`shrink-0 p-1.5 rounded-lg mt-0.5 ${isDark ? 'bg-[#1d1d1d] text-blue-400' : 'bg-gray-50 text-blue-600'}`}>
                        {isItemExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                            {item.taskType}
                          </span>
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Clock size={10} />
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                        <p className={`text-xs font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {item.taskDescription}
                        </p>
                        {item.modelUsed && (
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Sparkles size={10} />
                            <span>{item.modelUsed}</span>
                          </div>
                        )}
                      </div>
                    </button>
                    
                    {isItemExpanded && (
                      <div className={`px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200`}>
                        {item.outputData && (
                          <div className={`p-3 rounded-lg border ${isDark ? 'bg-black/40 border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              治理结果摘要
                            </div>
                            <div className="space-y-1.5">
                              {item.outputData.objects?.length > 0 && (
                                <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  <FileText size={12} />
                                  <span>业务对象: {item.outputData.objects.length} 个</span>
                                </div>
                              )}
                              {item.outputData.relationships?.length > 0 && (
                                <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  <span>关系: {item.outputData.relationships.length} 个</span>
                                </div>
                              )}
                              {item.outputData.terms?.length > 0 && (
                                <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  <span>术语: {item.outputData.terms.length} 个</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
