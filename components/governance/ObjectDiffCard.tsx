/**
 * Object Diff Card - 对象 Diff 可视化卡片
 * 
 * 功能：
 * 1. 显示对象的变更统计（added/removed/renamed/modified）
 * 2. 展示所有属性的 Diff 状态
 * 3. 支持展开/折叠
 * 4. 显示 AI 解释原因
 */

import React, { useState } from 'react';
import { ChevronDown, Plus, Minus, RefreshCw, Edit, ArrowRight } from 'lucide-react';
import { GovernedObject, AttributeDiff, DiffStatus } from './types';

interface ObjectDiffCardProps {
  object: GovernedObject;
  isDark: boolean;
}

export const ObjectDiffCard: React.FC<ObjectDiffCardProps> = ({ object, isDark }) => {
  const [expanded, setExpanded] = useState(true);  // 默认展开（详细风格）

  /**
   * 获取状态图标
   */
  const getStatusIcon = (status: DiffStatus) => {
    switch (status) {
      case 'ADDED':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'REMOVED':
        return <Minus className="w-4 h-4 text-red-500" />;
      case 'RENAMED':
        return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      case 'MODIFIED':
        return <Edit className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  /**
   * 获取状态颜色样式
   */
  const getStatusColor = (status: DiffStatus) => {
    switch (status) {
      case 'ADDED':
        return isDark 
          ? 'bg-green-500/15 text-green-400 border-green-500/30' 
          : 'bg-green-50 text-green-700 border-green-200';
      case 'REMOVED':
        return isDark 
          ? 'bg-red-500/15 text-red-400 border-red-500/30' 
          : 'bg-red-50 text-red-700 border-red-200';
      case 'RENAMED':
        return isDark 
          ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' 
          : 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'MODIFIED':
        return isDark 
          ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' 
          : 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'UNCHANGED':
        // 无变化：灰色
        return isDark 
          ? 'bg-gray-800/20 text-slate-400 border-gray-600/30' 
          : 'bg-gray-100 text-slate-600 border-gray-300';
      default:
        return isDark 
          ? 'bg-[#1d1d1d] text-slate-300 border-[#303030]' 
          : 'bg-white text-slate-700 border-gray-200';
    }
  };

  /**
   * 获取对象级别的状态颜色
   */
  const getObjectStatusColor = () => {
    if (!object.diffStatus) return '';
    
    switch (object.diffStatus) {
      case 'ADDED':
        return isDark ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-green-600';
      case 'REMOVED':
        return isDark ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-red-600';
      case 'MODIFIED':
        return isDark ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-yellow-600';
      default:
        return '';
    }
  };

  // 统计各类变更数量
  const changeStats = object.diffStats || { added: 0, removed: 0, renamed: 0, modified: 0 };
  const hasChanges = changeStats.added > 0 || changeStats.removed > 0 || changeStats.renamed > 0 || changeStats.modified > 0;

  return (
    <div 
      className={`rounded-xl border ${getObjectStatusColor()} transition-all ${
        isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-200 shadow-sm'
      } ${hasChanges ? 'hover:shadow-lg' : ''}`}
    >
      {/* 对象头部 */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1 rounded-lg transition-all ${
                isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronDown 
                className={`w-5 h-5 transition-transform ${expanded ? '' : '-rotate-90'} ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`} 
              />
            </button>
            
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {object.businessName || object.chineseName || object.name}
              </h3>
              <p className={`text-sm mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {object.name}
              </p>
            </div>
          </div>

          {/* 变更统计徽章 */}
          {hasChanges && (
            <div className="flex gap-2">
              {changeStats.added > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-green-500/15 text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  {changeStats.added}
                </span>
              )}
              {changeStats.removed > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Minus className="w-3 h-3" />
                  {changeStats.removed}
                </span>
              )}
              {changeStats.renamed > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  {changeStats.renamed}
                </span>
              )}
              {changeStats.modified > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  {changeStats.modified}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 对象描述 */}
        {object.description && (
          <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {object.description}
          </p>
        )}
      </div>

      {/* 属性列表（展开时显示） */}
      {expanded && (
        <div className={`px-5 pb-5 space-y-2 border-t ${isDark ? 'border-[#303030]' : 'border-gray-100'} pt-4`}>
          {object.attributes && object.attributes.length > 0 ? (
            object.attributes.map((attr, idx) => {
              // ✅ 判断是否为初始创建（不显示变更标记）
              const isInitialCreation = 
                attr.status === 'ADDED' && 
                attr.reason?.includes('Initial object creation');
              
              // 如果是初始创建，清除 status 避免显示绿色边框和图标
              const displayStatus = isInitialCreation ? undefined : attr.status;
              
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${getStatusColor(displayStatus)}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 状态图标 */}
                    {displayStatus && (
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(displayStatus)}
                      </div>
                    )}

                  <div className="flex-1 min-w-0">
                    {/* 字段名（支持 RENAMED 显示） */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {attr.status === 'RENAMED' && attr.originalName && (
                        <>
                          <span className={`text-sm font-mono line-through opacity-60 ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {attr.originalName}
                          </span>
                          <ArrowRight className="w-4 h-4 opacity-60" />
                        </>
                      )}
                      <span className="font-semibold font-mono text-base">
                        {attr.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                        isDark ? 'bg-black/40 text-slate-400' : 'bg-white/80 text-slate-500'
                      }`}>
                        {attr.type}
                      </span>
                      {attr.isPrimaryKey && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold">
                          PK
                        </span>
                      )}
                    </div>

                    {/* 业务名称和描述 */}
                    {(attr.businessName || attr.description) && (
                      <div className="mt-2 space-y-1">
                        {attr.businessName && (
                          <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {attr.businessName}
                          </p>
                        )}
                        {/* ✅ 修复：只有当 description 与 businessName 不同时才显示 */}
                        {attr.description && attr.description !== attr.businessName && (
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {attr.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* AI 解释原因（仅在有意义的变更时显示） */}
                    {attr.reason && 
                     attr.status && 
                     attr.status !== 'UNCHANGED' && 
                     !attr.reason.includes('Initial object creation') && (
                      <p className={`mt-2 text-xs italic opacity-60 ${
                        isDark ? 'text-slate-500' : 'text-slate-500'
                      }`}>
                        💡 {attr.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              );
            })
          ) : (
            <div className={`text-center py-6 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              该对象暂无属性
            </div>
          )}
        </div>
      )}
    </div>
  );
};
