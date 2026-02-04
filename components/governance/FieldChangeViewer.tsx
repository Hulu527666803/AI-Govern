import React from 'react';
import { FieldChangeRecord } from '../../types';
import { FileDiff, ArrowRight, Database, Type } from 'lucide-react';

interface FieldChangeViewerProps {
  record: FieldChangeRecord;
  isDark: boolean;
}

export const FieldChangeViewer: React.FC<FieldChangeViewerProps> = ({ record, isDark }) => {
  if (!record) return null;

  const { renames, dictTxtFields, enumTxtFields, sqlDerivedFields } = record;
  const hasData = (renames?.length || 0) > 0 || (dictTxtFields?.length || 0) > 0 || (enumTxtFields?.length || 0) > 0 || (sqlDerivedFields?.length || 0) > 0;

  if (!hasData) {
    return (
      <div className={`p-8 border rounded-[28px] text-center ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-100'}`}>
        <FileDiff className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>暂无字段变更记录</p>
        <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          未检测到同名字段冲突、字典/枚举字段或 SQL 衍生字段
        </p>
      </div>
    );
  }

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className={`mb-8 last:mb-0`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
          <Icon size={16} />
        </div>
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
      </div>
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#1d1d1d]/50 border-[#303030]' : 'bg-white border-gray-200'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
      {renames && renames.length > 0 && (
        <Section title="同名字段更名 (a)" icon={Type}>
          <div className={`grid grid-cols-4 gap-4 px-4 py-3 border-b text-[10px] font-bold uppercase tracking-wider opacity-60 ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
            <div>对象</div>
            <div>原字段</div>
            <div>新字段</div>
            <div>原因</div>
          </div>
          {renames.map((r, i) => (
            <div key={i} className={`grid grid-cols-4 gap-4 px-4 py-3 border-b last:border-0 text-xs ${isDark ? 'border-[#303030] text-slate-300' : 'border-gray-100 text-slate-600'}`}>
              <div className="font-mono text-blue-500">{r.objectName}</div>
              <div className="font-mono line-through opacity-60">{r.fieldName}</div>
              <div className="font-mono text-green-500 flex items-center gap-1">
                <ArrowRight size={10} /> {r.newName}
              </div>
              <div className="opacity-80">{r.reason}</div>
            </div>
          ))}
        </Section>
      )}

      {dictTxtFields && dictTxtFields.length > 0 && (
        <Section title="字典文本字段 (b)" icon={Database}>
          <div className={`grid grid-cols-3 gap-4 px-4 py-3 border-b text-[10px] font-bold uppercase tracking-wider opacity-60 ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
            <div>对象</div>
            <div>原字段 (Code)</div>
            <div>生成字段 (Text)</div>
          </div>
          {dictTxtFields.map((r, i) => (
            <div key={i} className={`grid grid-cols-3 gap-4 px-4 py-3 border-b last:border-0 text-xs ${isDark ? 'border-[#303030] text-slate-300' : 'border-gray-100 text-slate-600'}`}>
              <div className="font-mono text-blue-500">{r.objectName}</div>
              <div className="font-mono">{r.fieldName}</div>
              <div className="font-mono text-purple-500">{r.txtField}</div>
            </div>
          ))}
        </Section>
      )}

      {enumTxtFields && enumTxtFields.length > 0 && (
        <Section title="枚举文本字段 (c)" icon={Database}>
          <div className={`grid grid-cols-4 gap-4 px-4 py-3 border-b text-[10px] font-bold uppercase tracking-wider opacity-60 ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
            <div>对象</div>
            <div>原字段 (Enum)</div>
            <div>生成字段 (Text)</div>
            <div>映射规则</div>
          </div>
          {enumTxtFields.map((r, i) => (
            <div key={i} className={`grid grid-cols-4 gap-4 px-4 py-3 border-b last:border-0 text-xs ${isDark ? 'border-[#303030] text-slate-300' : 'border-gray-100 text-slate-600'}`}>
              <div className="font-mono text-blue-500">{r.objectName}</div>
              <div className="font-mono">{r.fieldName}</div>
              <div className="font-mono text-purple-500">{r.txtField}</div>
              <div className="font-mono text-[10px] opacity-80 bg-black/10 p-1 rounded truncate" title={r.enumMapping}>{r.enumMapping}</div>
            </div>
          ))}
        </Section>
      )}

      {sqlDerivedFields && sqlDerivedFields.length > 0 && (
        <Section title="SQL 衍生字段 (e)" icon={FileDiff}>
          <div className={`grid grid-cols-3 gap-4 px-4 py-3 border-b text-[10px] font-bold uppercase tracking-wider opacity-60 ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
            <div>对象</div>
            <div>衍生字段</div>
            <div>说明/来源</div>
          </div>
          {sqlDerivedFields.map((r, i) => (
            <div key={i} className={`grid grid-cols-3 gap-4 px-4 py-3 border-b last:border-0 text-xs ${isDark ? 'border-[#303030] text-slate-300' : 'border-gray-100 text-slate-600'}`}>
              <div className="font-mono text-blue-500">{r.objectName}</div>
              <div className="font-mono font-bold text-orange-500">{r.fieldName}</div>
              <div>
                <div className="opacity-90">{r.description}</div>
                {r.sourceSql && <div className="mt-1 text-[10px] font-mono opacity-50 truncate" title={r.sourceSql}>{r.sourceSql}</div>}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
};
