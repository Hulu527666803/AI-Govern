/**
 * TimelineViewer - 时间轴查看器
 * 
 * 功能：
 * 1. 垂直时间轴展示所有 checkpoint
 * 2. 点击节点查看详情
 * 3. 支持版本对比和恢复
 */

import React, { useState, useEffect } from 'react';
import { Clock, GitBranch, Database, RefreshCw, X, Loader2, CheckCircle } from 'lucide-react';
import { listCheckpoints, getCheckpointState, restoreCheckpoint, Checkpoint, CheckpointState } from '../services/checkpointService';

interface TimelineViewerProps {
  sessionId: string;
  onClose: () => void;
  onRestore?: (state: CheckpointState) => void;
  isDark?: boolean;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ sessionId, onClose, onRestore, isDark = true }) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [checkpointState, setCheckpointState] = useState<CheckpointState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadCheckpoints();
  }, [sessionId]);

  const loadCheckpoints = async () => {
    setLoading(true);
    try {
      const data = await listCheckpoints(sessionId);
      setCheckpoints(data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckpointClick = async (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setLoadingState(true);
    try {
      const state = await getCheckpointState(sessionId, checkpoint.checkpointId);
      setCheckpointState(state);
    } catch (error) {
      console.error('加载版本状态失败:', error);
    } finally {
      setLoadingState(false);
    }
  };

  const handleRestore = async (checkpointId: string) => {
    if (!confirm('确定要恢复到此版本吗？这将覆盖当前状态。')) {
      return;
    }

    setRestoring(true);
    try {
      const restoredState = await restoreCheckpoint(sessionId, checkpointId);
      if (onRestore) {
        onRestore(restoredState);
      }
      alert('版本恢复成功！');
      onClose();
    } catch (error) {
      console.error('恢复版本失败:', error);
      alert('恢复版本失败: ' + (error as Error).message);
    } finally {
      setRestoring(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getNodeIcon = (nodeName: string) => {
    if (nodeName === 'reviewer') return '⏸️';
    if (nodeName?.includes('Analyzer')) return '🔍';
    if (nodeName?.includes('Extractor')) return '📚';
    if (nodeName?.includes('Builder')) return '🔗';
    return '●';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-6xl h-[90vh] flex ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-2xl`}>
        {/* 左侧：时间轴列表 */}
        <div className={`w-1/2 border-r ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-y-auto`}>
          <div className={`sticky top-0 z-10 p-4 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  时间旅行
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-1 rounded hover:${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              会话: {sessionId.slice(0, 20)}...
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : checkpoints.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                暂无历史记录
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {checkpoints.map((checkpoint, index) => (
                <div
                  key={checkpoint.checkpointId}
                  onClick={() => handleCheckpointClick(checkpoint)}
                  className={`relative pl-8 pb-6 cursor-pointer transition-all ${
                    selectedCheckpoint?.checkpointId === checkpoint.checkpointId
                      ? isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                      : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                  } rounded-lg p-3`}
                >
                  {/* 时间轴线 */}
                  {index < checkpoints.length - 1 && (
                    <div className={`absolute left-[19px] top-8 w-0.5 h-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                  )}

                  {/* 节点圆点 */}
                  <div className={`absolute left-3 top-3 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    index === 0
                      ? 'bg-green-500 text-white'
                      : isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-400 text-white'
                  }`}>
                    {index === 0 ? '✓' : getNodeIcon(checkpoint.summary.currentNode || '')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {checkpoint.summary.currentNode || 'Unknown Node'}
                        {index === 0 && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-green-500 text-white rounded">
                            当前
                          </span>
                        )}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Step {checkpoint.step}
                      </span>
                    </div>

                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {formatTimestamp(checkpoint.timestamp)}
                    </div>

                    <div className={`flex gap-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                      <span>🗂️ {checkpoint.summary.objectCount} 对象</span>
                      {checkpoint.summary.relationshipCount > 0 && (
                        <span>🔗 {checkpoint.summary.relationshipCount} 关系</span>
                      )}
                      {checkpoint.summary.termCount > 0 && (
                        <span>📚 {checkpoint.summary.termCount} 术语</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：详情面板 */}
        <div className="w-1/2 overflow-y-auto">
          {!selectedCheckpoint ? (
            <div className="flex flex-col items-center justify-center h-full">
              <GitBranch className={`w-16 h-16 mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                点击左侧节点查看详情
              </p>
            </div>
          ) : loadingState ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : checkpointState ? (
            <div className="p-6 space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  版本详情
                </h3>
                <div className={`space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>时间:</span>
                    <span>{formatTimestamp(checkpointState.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>步骤:</span>
                    <span>Step {checkpointState.step}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>节点:</span>
                    <span>{checkpointState.state.currentNode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  数据统计
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {checkpointState.state.objects.length}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>对象</div>
                  </div>
                  <div className={`p-3 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {checkpointState.state.relationships.length}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>关系</div>
                  </div>
                  <div className={`p-3 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      {checkpointState.state.terms.length}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>术语</div>
                  </div>
                  <div className={`p-3 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                      {checkpointState.state.executedNodes.length}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>已执行节点</div>
                  </div>
                </div>
              </div>

              {checkpointState.state.objects.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    对象列表
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {checkpointState.state.objects.map((obj: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}
                      >
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
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

              <button
                onClick={() => handleRestore(checkpointState.checkpointId)}
                disabled={restoring}
                className={`w-full py-2 px-4 rounded font-medium flex items-center justify-center gap-2 transition-colors ${
                  restoring
                    ? 'bg-slate-400 cursor-not-allowed'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {restoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    恢复中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    恢复到此版本
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
