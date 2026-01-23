
import React from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  BookOpen, 
  Settings, 
  Share2, 
  HelpCircle, 
  FileCode,
  Box,
  Link2,
  BrainCircuit,
  PieChart,
  MessageSquare
} from 'lucide-react';

export const ICONS = {
  Database: <Database className="w-4 h-4" />,
  Xls: <FileSpreadsheet className="w-4 h-4" />,
  Dictionary: <BookOpen className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  Share: <Share2 className="w-4 h-4" />,
  Help: <HelpCircle className="w-4 h-4" />,
  DDL: <FileCode className="w-4 h-4" />,
  Object: <Box className="w-5 h-5 text-blue-500" />,
  Relationship: <Link2 className="w-5 h-5 text-green-500" />,
  Knowledge: <BrainCircuit className="w-5 h-5 text-purple-500" />,
  Term: <MessageSquare className="w-5 h-5 text-orange-500" />,
  Report: <PieChart className="w-5 h-5 text-indigo-500" />
};

export const ABC_PARADIGM_DESC = {
  A: "获取对象 (Acquire) - 识别业务主体（人、事、物）",
  B: "构建投影 (Build) - 定义属性映射与数据过滤",
  C: "计算指标 (Calculate) - 定义业务公式与逻辑指标"
};
