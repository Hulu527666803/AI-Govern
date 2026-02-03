
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Database, FileCode, FileSpreadsheet, X, Upload, BookOpen, FileText, Type, FolderPlus, Folder, ChevronRight, LayoutGrid, Server, Globe, Key, ShieldCheck, CheckCircle, ChevronDown, MessageSquare, MessageSquarePlus, Trash2, Paperclip } from 'lucide-react';
import { SourceType, DataSource, DataDomain } from '../types';
import { testDatabaseConnection, getDatabaseMetadata, formatMetadata, DATABASE_TYPES } from '../services/databaseService';
import { ConfirmModal } from './ConfirmModal';

interface SourceSidebarProps {
  domains: DataDomain[];
  sources: DataSource[];
  activeDomainId: string | null;
  onAddDomain: (name: string, description: string) => void;
  onDeleteDomain?: (id: string) => void;
  onSelectDomain: (id: string) => void;
  onAddSource: (type: SourceType, name: string, content: string) => void;
  onDeleteSource?: (id: string) => void;
  onSelectSource: (source: DataSource | null) => void;
  activeSourceId?: string;
  theme?: 'light' | 'dark';
}

type InputMode = 'TEXT' | 'FILE';

export const SourceSidebar: React.FC<SourceSidebarProps> = ({ 
  domains,
  sources, 
  activeDomainId,
  onAddDomain,
  onDeleteDomain,
  onSelectDomain,
  onAddSource,
  onDeleteSource, 
  onSelectSource,
  activeSourceId,
  theme = 'dark'
}) => {
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [domainDesc, setDomainDesc] = useState('');
  
  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'warning' | 'error' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
  });
  
  // 待删除资产信息
  const [sourceToDelete, setSourceToDelete] = useState<DataSource | null>(null);
  
  const [assetType, setAssetType] = useState<SourceType>(SourceType.DDL);
  const [inputMode, setInputMode] = useState<InputMode>('TEXT');
  const [assetName, setAssetName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dbConfig, setDbConfig] = useState({
    dbType: 'MySQL',
    host: '',
    port: '3306',
    database: '',
    username: '',
    password: '',
  });
  
  const [showDbTypeDropdown, setShowDbTypeDropdown] = useState(false);
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [fetchedMetadata, setFetchedMetadata] = useState('');

  const resetAssetForm = () => {
    setAssetName('');
    setAssetType(SourceType.DDL);
    setInputMode('TEXT');
    setTextContent('');
    setDbConfig({
      dbType: 'MySQL', host: '', port: '3306', database: '', username: '', password: '',
    });
    setFileName(null);
    setIsTestingConnection(false);
    setConnectionStatus('idle');
    setConnectionMessage('');
    setFetchedMetadata('');
    setShowDbTypeDropdown(false);
  };
  
  const handleDbTypeChange = (dbType: string) => {
    const dbTypeConfig = DATABASE_TYPES.find(t => t.id === dbType);
    setDbConfig({
      ...dbConfig,
      dbType: dbType,
      port: dbTypeConfig?.defaultPort || '3306'
    });
    setShowDbTypeDropdown(false);
    setConnectionStatus('idle');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!assetName) setAssetName(file.name.split('.')[0]);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setTextContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const testDatabaseConnectionHandler = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('正在测试连接...');
    
    try {
      // 测试连接
      const testResult = await testDatabaseConnection(dbConfig);
      
      if (!testResult.success) {
        throw new Error(testResult.message);
      }
      
      setConnectionStatus('success');
      setConnectionMessage('连接成功！正在获取元数据...');
      
      // 获取元数据
      const metadata = await getDatabaseMetadata(dbConfig);
      const metadataText = formatMetadata(metadata);
      setFetchedMetadata(metadataText);
      setConnectionMessage(`✓ 成功获取 ${metadata.tables?.length || 0} 张表的元数据`);
      
    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionMessage(error.message || '连接失败，请检查配置');
      setFetchedMetadata('');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const showModal = (
    type: 'success' | 'warning' | 'error' | 'info' | 'confirm',
    title: string,
    message: string,
    onConfirm?: () => void,
    showCancel: boolean = false
  ) => {
    setConfirmModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel,
    });
  };

  const closeModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleDeleteSourceClick = (source: DataSource, e: React.MouseEvent) => {
    e.stopPropagation();
    setSourceToDelete(source);
    showModal(
      'warning',
      '确认删除资产',
      `确定要删除资产 "${source.name}" 吗？删除后将无法恢复。`,
      () => {
        if (onDeleteSource && sourceToDelete) {
          onDeleteSource(sourceToDelete.id);
          setSourceToDelete(null);
          closeModal();
          showModal('success', '删除成功', `资产 "${source.name}" 已成功删除。`, undefined, false);
        }
      },
      true
    );
  };

  const handleUploadAttachment = (source: DataSource, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: 上传附件逻辑待定
    showModal('info', '功能开发中', '上传附件功能正在开发中，敬请期待！', undefined, false);
  };

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalContent = "";
    
    // 检查资产名称
    if (!assetName || !assetName.trim()) {
      showModal('warning', '输入错误', '请填写资产展示名称', undefined, false);
      return;
    }
    
    if (assetType === SourceType.DATABASE) {
      if (connectionStatus !== 'success' || !fetchedMetadata) {
        showModal('warning', '连接错误', '请先测试连接并成功获取元数据后再提交', undefined, false);
        return;
      }
      finalContent = fetchedMetadata;
    } else {
      finalContent = textContent;
    }

    // 检查内容
    if (!finalContent || !finalContent.trim()) {
      showModal('warning', '内容为空', '请提供资产内容或元数据', undefined, false);
      return;
    }

    // 提交资产
    console.log('📦 正在接入资产:', { type: assetType, name: assetName, contentLength: finalContent.length });
    onAddSource(assetType, assetName.trim(), finalContent);
    
    // 重置表单并关闭模态框
    resetAssetForm();
    setShowAssetModal(false);
    
    // 成功提示
    showModal('success', '接入成功', `资产 "${assetName.trim()}" 已成功接入！`, undefined, false);
  };

  const renderIcon = (type: SourceType) => {
    switch (type) {
      case SourceType.DDL: return <FileCode size={14} />;
      case SourceType.XLS: return <FileSpreadsheet size={14} />;
      case SourceType.DATABASE: return <Database size={14} />;
      case SourceType.DICTIONARY: return <BookOpen size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col h-full transition-colors ${isDark ? 'bg-[#141414]' : 'bg-white'}`}>
      {/* Domain Section */}
      <div className={`p-5 border-b transition-colors ${isDark ? 'border-[#303030]' : 'border-[#f0f0f0]'}`}>
        <div className="flex items-center justify-between mb-4 px-1">
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">治数业务域</h2>
           <button 
             onClick={() => setShowDomainModal(true)}
             className={`p-1.5 rounded-lg transition-all border ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-400 hover:text-white' : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'}`}
           >
             <FolderPlus size={14} />
           </button>
        </div>
        
        <div className="space-y-1 max-h-[200px] overflow-y-auto no-scrollbar">
          {domains.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic px-2">暂无业务域，请先创建</p>
          ) : (
            domains.map(domain => (
              <button
                key={domain.id}
                onClick={() => onSelectDomain(domain.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 border group ${
                  activeDomainId === domain.id 
                    ? (isDark ? 'bg-[#177ddc]/20 border-[#177ddc]/50 text-white' : 'bg-blue-50 border-blue-200 text-blue-600') 
                    : (isDark ? 'hover:bg-[#1d1d1d] border-transparent text-slate-400' : 'hover:bg-gray-50 border-transparent text-slate-600')
                }`}
              >
                <Folder size={16} className={activeDomainId === domain.id ? (isDark ? 'text-blue-400' : 'text-blue-500') : 'text-slate-400'} />
                <span className="text-xs font-bold truncate flex-1">{domain.name}</span>
                <div className="flex items-center gap-1">
                  {activeDomainId === domain.id && <ChevronRight size={12} className="opacity-70" />}
                  {onDeleteDomain && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); onDeleteDomain(domain.id); }}
                      className={`p-1 rounded transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'hover:bg-red-500/20 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-500'}`}
                      title="删除业务域"
                    >
                      <Trash2 size={12} />
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Asset Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`p-5 pb-2 border-b transition-colors ${isDark ? 'border-[#303030]' : 'border-[#f0f0f0]'}`}>
          <button 
            disabled={!activeDomainId}
            onClick={() => { resetAssetForm(); setShowAssetModal(true); }}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
              activeDomainId 
                ? (isDark ? 'bg-[#177ddc] hover:bg-[#1668dc] text-white border-[#1668dc]/20 shadow-lg' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400/20 shadow-md') 
                : (isDark ? 'bg-[#1d1d1d] text-slate-700 border-[#303030] cursor-not-allowed' : 'bg-gray-100 text-slate-400 border-gray-200 cursor-not-allowed')
            }`}
          >
            <Plus size={16} />
            接入治理资产
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <div className="px-6 mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">当前域资产</h2>
            {activeDomainId && <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black ${isDark ? 'bg-[#1d1d1d] text-slate-400' : 'bg-gray-100 text-slate-500'}`}>{sources.length}</span>}
          </div>

          {!activeDomainId ? (
             <div className="px-10 py-12 text-center opacity-40">
                <LayoutGrid size={24} className="mx-auto mb-3 text-slate-400" />
                <p className="text-[10px] text-slate-400 font-semibold italic uppercase">请先选择业务域</p>
             </div>
          ) : sources.length === 0 ? (
            <div className="px-10 py-12 text-center">
               <Database size={24} className={`mx-auto mb-3 ${isDark ? 'text-[#303030]' : 'text-gray-200'}`} />
               <p className="text-[11px] text-slate-400 leading-relaxed font-semibold italic">该域下暂无元数据资产</p>
            </div>
          ) : (
            <div className="space-y-1 px-3">
              {sources.map(source => (
                <div
                  key={source.id}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border group ${
                    activeSourceId === source.id 
                      ? (isDark ? 'bg-[#177ddc]/10 border-[#177ddc]/30' : 'bg-blue-50 border-blue-100 shadow-sm') 
                      : 'hover:bg-slate-50 dark:hover:bg-[#1d1d1d] border-transparent'
                  }`}
                >
                  <button
                    onClick={() => onSelectSource(source)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className={`p-2 rounded-lg ${activeSourceId === source.id ? 'bg-blue-500 text-white shadow-lg' : (isDark ? 'bg-[#1d1d1d] text-slate-500 border border-[#303030]' : 'bg-gray-100 text-slate-500')}`}>
                      {renderIcon(source.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className={`text-[11px] font-bold truncate ${activeSourceId === source.id ? (isDark ? 'text-white' : 'text-blue-700') : (isDark ? 'text-slate-200' : 'text-slate-700')}`}>{source.name}</h3>
                      <p className={`text-[8px] font-bold uppercase mt-0.5 tracking-wider ${activeSourceId === source.id ? 'text-blue-400' : 'text-slate-400'}`}>{source.type}</p>
                    </div>
                  </button>
                  
                  {/* 操作按钮组 */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 上传附件按钮 */}
                    <button
                      onClick={(e) => handleUploadAttachment(source, e)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isDark 
                          ? 'hover:bg-blue-500/20 hover:text-blue-400' 
                          : 'hover:bg-blue-50 hover:text-blue-500'
                      }`}
                      title="上传附件"
                    >
                      <Paperclip size={12} />
                    </button>
                    
                    {/* 删除按钮 */}
                    {onDeleteSource && (
                      <button
                        onClick={(e) => handleDeleteSourceClick(source, e)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isDark 
                            ? 'hover:bg-red-500/20 hover:text-red-400' 
                            : 'hover:bg-red-50 hover:text-red-500'
                        }`}
                        title="删除资产"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Domain Creation Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDomainModal(false)}></div>
          <div className={`relative rounded-[28px] w-full max-w-md shadow-2xl border transition-colors animate-in fade-in zoom-in duration-300 ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-200'}`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                 <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>创建业务数据域</h3>
                 <button onClick={() => setShowDomainModal(false)}><X className="text-slate-500 hover:text-white" /></button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">业务域名称</label>
                  <input 
                    className={`w-full border rounded-xl px-4 h-11 text-sm outline-none transition-colors ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white focus:border-[#177ddc]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'}`}
                    placeholder="如：核心供应链域"
                    value={domainName}
                    onChange={e => setDomainName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">业务描述</label>
                  <textarea 
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none h-24 resize-none transition-colors ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white focus:border-[#177ddc]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'}`}
                    placeholder="描述该域覆盖的业务范围..."
                    value={domainDesc}
                    onChange={e => setDomainDesc(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => { if(domainName) { onAddDomain(domainName, domainDesc); setDomainName(''); setDomainDesc(''); setShowDomainModal(false); }}}
                  className={`w-full py-3 text-white rounded-xl text-sm font-bold shadow-xl border ${isDark ? 'bg-[#177ddc] border-[#1668dc]/30' : 'bg-blue-600 border-blue-500'}`}
                >
                  确认创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Creation Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 overflow-y-auto no-scrollbar">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssetModal(false)}></div>
           <div className={`relative rounded-[32px] w-full max-w-2xl shadow-2xl border transition-colors animate-in fade-in zoom-in duration-300 my-8 ${isDark ? 'bg-[#141414] border-[#303030]' : 'bg-white border-gray-200'}`}>
             <div className="p-10">
               <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>接入元数据资产</h3>
                    <p className="text-[11px] text-slate-500 mt-1">所属域：{domains.find(d => d.id === activeDomainId)?.name}</p>
                 </div>
                 <button onClick={() => setShowAssetModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-red-400 transition-colors" /></button>
               </div>

               <form onSubmit={handleAssetSubmit} className="space-y-8">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">资产展示名称</label>
                   <input 
                    className={`w-full border rounded-2xl px-5 h-12 text-sm outline-none transition-colors ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white focus:border-[#177ddc]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-blue-500'}`}
                    placeholder="例如：核心 ERP 采购域元数据"
                    value={assetName}
                    onChange={e => setAssetName(e.target.value)}
                    required
                  />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">选择资产类型</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { type: SourceType.DDL, label: 'SQL DDL', icon: <FileCode size={18} /> },
                        { type: SourceType.XLS, label: 'Excel/CSV', icon: <FileSpreadsheet size={18} /> },
                        { type: SourceType.DATABASE, label: 'JDBC 连接', icon: <Database size={18} /> },
                        { type: SourceType.DICTIONARY, label: '业务词典', icon: <BookOpen size={18} /> },
                      ].map(item => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setAssetType(item.type);
                            if (item.type === SourceType.XLS) setInputMode('FILE');
                            else if (item.type === SourceType.DATABASE) setInputMode('TEXT');
                          }}
                          className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${
                            assetType === item.type 
                              ? (isDark ? 'bg-[#177ddc] border-[#1668dc] text-white shadow-xl' : 'bg-blue-600 border-blue-500 text-white shadow-lg') 
                              : (isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-500 hover:border-slate-600 hover:text-white' : 'bg-gray-50 border-gray-100 text-slate-400 hover:bg-white hover:border-blue-200 hover:text-blue-500')
                          }`}
                        >
                          {item.icon}
                          <span className="text-[10px] font-black mt-2 tracking-tighter">{item.label}</span>
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* 动态表单内容 */}
                 <div className="space-y-4">
                    {assetType === SourceType.DATABASE ? (
                      <div className="space-y-4">
                        <div className={`grid grid-cols-2 gap-4 p-6 rounded-3xl border ${isDark ? 'bg-black/40 border-[#303030]' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="col-span-2 flex items-center gap-2 mb-2">
                             <Server size={14} className="text-blue-500" />
                             <span className="text-[10px] font-black text-slate-500 uppercase">JDBC 连接配置</span>
                          </div>
                          
                          {/* 数据库类型选择 */}
                          <div className="col-span-2 space-y-1.5 relative">
                            <label className="text-[9px] font-bold text-slate-500 ml-1">数据库类型</label>
                            <button
                              type="button"
                              onClick={() => setShowDbTypeDropdown(!showDbTypeDropdown)}
                              className={`w-full px-4 h-10 text-xs rounded-xl border outline-none flex items-center justify-between transition-all ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white hover:border-slate-600' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{DATABASE_TYPES.find(t => t.id === dbConfig.dbType)?.icon}</span>
                                <span>{DATABASE_TYPES.find(t => t.id === dbConfig.dbType)?.name}</span>
                              </span>
                              <ChevronDown size={14} className={`transition-transform ${showDbTypeDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showDbTypeDropdown && (
                              <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-[#1d1d1d] border-[#303030]' : 'bg-white border-gray-200'}`}>
                                {DATABASE_TYPES.map((dbType) => (
                                  <button
                                    key={dbType.id}
                                    type="button"
                                    onClick={() => handleDbTypeChange(dbType.id)}
                                    className={`w-full px-4 py-3 text-xs flex items-center gap-3 transition-all ${
                                      dbConfig.dbType === dbType.id
                                        ? (isDark ? 'bg-[#177ddc]/20 text-white' : 'bg-blue-50 text-blue-700')
                                        : (isDark ? 'text-slate-300 hover:bg-[#252525]' : 'text-slate-600 hover:bg-gray-50')
                                    }`}
                                  >
                                    <span className="text-base">{dbType.icon}</span>
                                    <div className="flex-1 text-left">
                                      <div className="font-bold">{dbType.name}</div>
                                      <div className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{dbType.description} · 默认端口: {dbType.defaultPort}</div>
                                    </div>
                                    {dbConfig.dbType === dbType.id && (
                                      <CheckCircle size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 ml-1">主机地址</label>
                            <input 
                              className={`w-full px-4 h-10 text-xs rounded-xl border outline-none ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white' : 'bg-white border-gray-200'}`} 
                              placeholder="127.0.0.1" 
                              value={dbConfig.host}
                              onChange={e => { setDbConfig({...dbConfig, host: e.target.value}); setConnectionStatus('idle'); }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 ml-1">端口</label>
                            <input 
                              className={`w-full px-4 h-10 text-xs rounded-xl border outline-none ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white' : 'bg-white border-gray-200'}`} 
                              placeholder="3306" 
                              value={dbConfig.port}
                              onChange={e => { setDbConfig({...dbConfig, port: e.target.value}); setConnectionStatus('idle'); }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 ml-1">数据库名称</label>
                            <input 
                              className={`w-full px-4 h-10 text-xs rounded-xl border outline-none ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white' : 'bg-white border-gray-200'}`} 
                              placeholder="db_name" 
                              value={dbConfig.database}
                              onChange={e => { setDbConfig({...dbConfig, database: e.target.value}); setConnectionStatus('idle'); }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 ml-1">用户名</label>
                            <input 
                              className={`w-full px-4 h-10 text-xs rounded-xl border outline-none ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white' : 'bg-white border-gray-200'}`} 
                              placeholder="root" 
                              value={dbConfig.username}
                              onChange={e => { setDbConfig({...dbConfig, username: e.target.value}); setConnectionStatus('idle'); }}
                            />
                          </div>
                          <div className="space-y-1.5 col-span-2">
                            <label className="text-[9px] font-bold text-slate-500 ml-1">密码</label>
                            <input 
                              type="password"
                              className={`w-full px-4 h-10 text-xs rounded-xl border outline-none ${isDark ? 'bg-[#1d1d1d] border-[#303030] text-white' : 'bg-white border-gray-200'}`} 
                              placeholder="******" 
                              value={dbConfig.password}
                              onChange={e => { setDbConfig({...dbConfig, password: e.target.value}); setConnectionStatus('idle'); }}
                            />
                          </div>
                          
                          <div className="col-span-2 pt-2">
                            <button
                              type="button"
                              onClick={testDatabaseConnectionHandler}
                              disabled={!dbConfig.host || !dbConfig.database || !dbConfig.username || isTestingConnection}
                              className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all border ${
                                isTestingConnection
                                  ? (isDark ? 'bg-[#1d1d1d] border-[#303030] text-slate-500 cursor-wait' : 'bg-gray-100 border-gray-200 text-slate-400 cursor-wait')
                                  : connectionStatus === 'success'
                                  ? (isDark ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-green-50 border-green-300 text-green-700')
                                  : connectionStatus === 'error'
                                  ? (isDark ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-300 text-red-700')
                                  : (isDark ? 'bg-[#177ddc] border-[#1668dc] text-white hover:bg-[#1668dc]' : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700')
                              }`}
                            >
                              {isTestingConnection ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                  测试连接中...
                                </>
                              ) : connectionStatus === 'success' ? (
                                <>
                                  <ShieldCheck size={16} />
                                  连接成功并获取元数据
                                </>
                              ) : connectionStatus === 'error' ? (
                                <>
                                  <X size={16} />
                                  连接失败，点击重试
                                </>
                              ) : (
                                <>
                                  <Database size={16} />
                                  测试连接并获取元数据
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* 连接状态提示 */}
                        {connectionMessage && (
                          <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
                            connectionStatus === 'success'
                              ? (isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200')
                              : connectionStatus === 'error'
                              ? (isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200')
                              : (isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200')
                          }`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              connectionStatus === 'success' ? 'bg-green-500' 
                              : connectionStatus === 'error' ? 'bg-red-500' 
                              : 'bg-blue-500 animate-pulse'
                            }`} />
                            <p className={`text-xs font-medium ${
                              connectionStatus === 'success' ? (isDark ? 'text-green-300' : 'text-green-700')
                              : connectionStatus === 'error' ? (isDark ? 'text-red-300' : 'text-red-700')
                              : (isDark ? 'text-blue-300' : 'text-blue-700')
                            }`}>{connectionMessage}</p>
                          </div>
                        )}
                        
                        {/* 元数据预览 */}
                        {fetchedMetadata && (
                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-black/60 border-[#303030]' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <FileCode size={14} className={isDark ? 'text-green-400' : 'text-green-600'} />
                              <span className="text-[10px] font-black text-slate-500 uppercase">已获取的元数据</span>
                            </div>
                            <div className={`max-h-48 overflow-y-auto custom-scrollbar p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                              <pre className={`text-[10px] font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{fetchedMetadata.split('\n').slice(0, 20).join('\n')}{fetchedMetadata.split('\n').length > 20 ? '\n...' : ''}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {assetType !== SourceType.XLS && (
                          <div className="flex gap-2 p-1 rounded-xl w-fit bg-slate-900/50 border border-slate-800">
                             <button 
                               type="button"
                               onClick={() => setInputMode('TEXT')}
                               className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${inputMode === 'TEXT' ? 'bg-[#177ddc] text-white' : 'text-slate-500 hover:text-white'}`}
                             >
                               直接输入文本
                             </button>
                             <button 
                               type="button"
                               onClick={() => setInputMode('FILE')}
                               className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${inputMode === 'FILE' ? 'bg-[#177ddc] text-white' : 'text-slate-500 hover:text-white'}`}
                             >
                               上传元数据文件
                             </button>
                          </div>
                        )}

                        {inputMode === 'TEXT' ? (
                          <textarea 
                            className={`w-full border rounded-2xl p-5 text-xs font-mono outline-none h-48 resize-none shadow-inner leading-relaxed transition-colors ${isDark ? 'bg-black border-[#303030] text-slate-100 focus:border-[#177ddc]' : 'bg-gray-100 border-gray-200 text-slate-800 focus:border-blue-500'}`}
                            placeholder={assetType === SourceType.DDL ? "粘贴 SQL 建表语句 (CREATE TABLE...)" : "输入业务词典定义..."}
                            value={textContent}
                            onChange={e => setTextContent(e.target.value)}
                            required
                          />
                        ) : (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                              fileName 
                                ? (isDark ? 'bg-blue-500/5 border-blue-500/50' : 'bg-blue-50 border-blue-300')
                                : (isDark ? 'bg-black border-[#303030] hover:border-slate-500' : 'bg-gray-50 border-gray-200 hover:border-blue-300')
                            }`}
                          >
                             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept={assetType === SourceType.XLS ? ".xls,.xlsx,.csv" : ".sql,.txt,.csv,.json"} />
                             <div className={`p-4 rounded-2xl mb-3 ${isDark ? 'bg-[#1d1d1d]' : 'bg-white shadow-sm'}`}>
                                <Upload size={24} className={fileName ? "text-blue-500" : "text-slate-400"} />
                             </div>
                             <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{fileName || "点击或拖拽文件到此处上传"}</p>
                             <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">支持 {assetType === SourceType.XLS ? "XLS, XLSX, CSV" : "SQL, TXT, CSV, JSON"}</p>
                          </div>
                        )}
                      </div>
                    )}
                 </div>

                 <div className={`flex justify-end gap-4 border-t pt-8 ${isDark ? 'border-[#303030]' : 'border-gray-100'}`}>
                    <button type="button" onClick={() => setShowAssetModal(false)} className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>取消</button>
                    <button 
                      type="submit" 
                      className={`px-10 py-3 text-white font-black rounded-xl shadow-xl transition-all border ${isDark ? 'bg-[#177ddc] border-[#1668dc]/30 hover:bg-[#1668dc]' : 'bg-blue-600 border-blue-500 hover:bg-blue-700'}`}
                    >
                      确认接入
                    </button>
                 </div>
               </form>
             </div>
           </div>
        </div>
      )}
      
      {/* 确认弹窗 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        theme={theme}
        showCancel={confirmModal.showCancel}
      />
    </div>
  );
};
