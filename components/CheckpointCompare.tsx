/**
 * CheckpointCompare - 版本对比组件
 * 
 * 功能：
 * 1. 并排显示两个版本的对象列表
 * 2. 高亮差异（新增、删除、修改）
 * 3. 详细字段级对比
 */

import React, { useState, useEffect } from 'react';
import { GitCompare, X, Plus, Minus, Edit, Loader2 } from 'lucide-react';
import { compareCheckpoints, CheckpointDiff } from '../services/checkpointService';

interface CheckpointCompareProps {
  sessionId: string;
  checkpointId1: string;
  checkpointId2: string;
  onClose: () => void;
  isDark?: boolean;
}

export const CheckpointCompare: React.FC<CheckpointCompareProps> = ({
  sessionId,
  checkpointId1,
  checkpointId2,
  onClose,
  isDark = true,
}) => {
  const [diff, setDiff] = useState<CheckpointDiff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiff();
  }, [sessionId, checkpointId1, checkpointId2]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const data = await compareCheckpoints(sessionId, checkpointId1, checkpointId2);
      setDiff(data);
    } catch (error) {
      console.error('对比版本失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className={`p-8 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className={`mt-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            正在对比版本...
          </p>
        </div>
      </div>
    );
  }

  if (!diff) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-6xl h-[90vh] flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-2xl`}>
        {/* 头部 */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-500" />
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                版本对比
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded hover:${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}
            >
              <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            </button>
          </div>

          <div className={`mt-3 flex items-center gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>版本1:</span>
              <span className="font-mono">{diff.checkpoint1.id.slice(0, 8)}</span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                (Step {diff.checkpoint1.step})
              </span>
            </div>
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>vs</span>
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>版本2:</span>
              <span className="font-mono">{diff.checkpoint2.id.slice(0, 8)}</span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                (Step {diff.checkpoint2.step})
              </span>
            </div>
          </div>
        </div>

        {/* 统计摘要 */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-3 rounded ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <div className="flex items-center gap-2 text-green-600">
                <Plus className="w-4 h-4" />
                <span className="font-semibold">新增</span>
              </div>
              <div className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                对象: {diff.objectsDiff.summary.addedCount} | 
                关系: {diff.relationshipsDiff.summary.addedCount} | 
                术语: {diff.termsDiff.summary.addedCount}
              </div>
            </div>

            <div className={`p-3 rounded ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 text-red-600">
                <Minus className="w-4 h-4" />
                <span className="font-semibold">删除</span>
              </div>
              <div className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                对象: {diff.objectsDiff.summary.removedCount} | 
                关系: {diff.relationshipsDiff.summary.removedCount} | 
                术语: {diff.termsDiff.summary.removedCount}
              </div>
            </div>

            <div className={`p-3 rounded ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
              <div className="flex items-center gap-2 text-yellow-600">
                <Edit className="w-4 h-4" />
                <span className="font-semibold">修改</span>
              </div>
              <div className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                对象: {diff.objectsDiff.summary.modifiedCount} | 
                关系: {diff.relationshipsDiff.summary.modifiedCount} | 
                术语: {diff.termsDiff.summary.modifiedCount}
              </div>
            </div>
          </div>
        </div>

        {/* 详细差异 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 对象差异 */}
          {(diff.objectsDiff.added.length > 0 || 
            diff.objectsDiff.removed.length > 0 || 
            diff.objectsDiff.modified.length > 0) && (
            <div className="mb-6">
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                对象差异
              </h3>

              {diff.objectsDiff.added.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <Plus className="w-3 h-3" />
                    新增对象 ({diff.objectsDiff.added.length})
                  </h4>
                  <div className="space-y-2">
                    {diff.objectsDiff.added.map((obj: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded border-l-4 border-green-500 ${
                          isDark ? 'bg-green-900/20' : 'bg-green-50'
                        }`}
                      >
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {obj.businessName || obj.name}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {obj.attributes?.length || 0} 个字段
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.objectsDiff.removed.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    <Minus className="w-3 h-3" />
                    删除对象 ({diff.objectsDiff.removed.length})
                  </h4>
                  <div className="space-y-2">
                    {diff.objectsDiff.removed.map((obj: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded border-l-4 border-red-500 ${
                          isDark ? 'bg-red-900/20' : 'bg-red-50'
                        }`}
                      >
                        <div className={`text-sm font-medium line-through ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {obj.businessName || obj.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.objectsDiff.modified.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    <Edit className="w-3 h-3" />
                    修改对象 ({diff.objectsDiff.modified.length})
                  </h4>
                  <div className="space-y-2">
                    {diff.objectsDiff.modified.map((item: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded border-l-4 border-yellow-500 ${
                          isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'
                        }`}
                      >
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.after.businessName || item.after.name}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          字段: {item.before.attributes?.length || 0} → {item.after.attributes?.length || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 术语差异 */}
          {(diff.termsDiff.added.length > 0 || diff.termsDiff.removed.length > 0) && (
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                术语差异
              </h3>

              {diff.termsDiff.added.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <Plus className="w-3 h-3" />
                    新增术语 ({diff.termsDiff.added.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {diff.termsDiff.added.map((term: any, index: number) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-xs ${
                          isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {term.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
