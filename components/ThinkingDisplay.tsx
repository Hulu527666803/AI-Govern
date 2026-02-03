/**
 * ThinkingDisplay - 验证步骤的思考过程展示组件
 * 
 * 功能：
 * 1. 动态打字效果（逐字符显示）
 * 2. 5行滚动机制（满5行后自动滚动，类似终端）
 * 3. 保存完整思考历史
 * 4. 点击"..."展开查看完整历史记录
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ThinkingDisplayProps {
  content: string;        // 当前思考内容（实时更新）
  isActive: boolean;      // 是否正在思考
  history?: string[];     // 完整历史记录
  isDark: boolean;
  onComplete?: () => void; // 思考完成回调
}

export const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({
  content,
  isActive,
  history = [],
  isDark,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 动态打字效果
  useEffect(() => {
    if (!isActive || !content) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    
    // 清除之前的定时器
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    let currentIndex = displayedText.length;
    
    // 如果内容变短了（新的思考步骤），重置显示
    if (content.length < displayedText.length) {
      currentIndex = 0;
      setDisplayedText('');
    }

    typingTimerRef.current = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedText(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingTimerRef.current!);
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, 30); // 30ms 每字符

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, [content, isActive]);

  // 5行滚动逻辑
  useEffect(() => {
    const newLines = displayedText.split('\n').filter(line => line.trim() !== '');
    
    if (newLines.length > 5) {
      // 保留最后5行
      setLines(newLines.slice(-5));
    } else {
      setLines(newLines);
    }

    // 自动滚动到底部
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  // 如果不活跃且没有内容，不渲染
  if (!isActive && !history.length) {
    return null;
  }

  return (
    <div className="thinking-display-container mt-4">
      {/* 实时5行滚动区域（终端风格） */}
      {isActive && lines.length > 0 && (
        <div 
          ref={containerRef}
          className={`terminal-output p-4 rounded-lg border font-mono text-xs leading-relaxed overflow-hidden ${
            isDark 
              ? 'bg-[#0d1117] border-[#30363d] text-green-400' 
              : 'bg-gray-900 border-gray-700 text-green-300'
          }`}
          style={{ maxHeight: '120px' }}
        >
          {lines.map((line, idx) => (
            <div 
              key={`line-${idx}`}
              className="terminal-line animate-in fade-in duration-200"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="text-blue-400 mr-2">{'>'}</span>
              {line}
              {idx === lines.length - 1 && isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-green-400 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 展开/收起按钮 */}
      {history.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            isDark
              ? 'bg-[#1d1d1d] hover:bg-[#2d2d2d] text-slate-400 hover:text-slate-300 border border-[#303030]'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-200'
          }`}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              收起完整思考历史
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              查看完整思考历史 ({history.length} 条)
            </>
          )}
        </button>
      )}

      {/* 完整历史记录 */}
      {expanded && history.length > 0 && (
        <div 
          className={`mt-3 p-4 rounded-lg border space-y-2 animate-in slide-in-from-top-2 duration-300 ${
            isDark
              ? 'bg-[#0d1117]/50 border-[#30363d]'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            完整思考过程
          </div>
          {history.map((item, idx) => (
            <div 
              key={`history-${idx}`}
              className={`text-xs leading-relaxed p-2 rounded ${
                isDark
                  ? 'bg-[#1d1d1d] text-slate-300'
                  : 'bg-white text-slate-700'
              }`}
            >
              <div className={`text-[10px] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                步骤 {idx + 1}
              </div>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
