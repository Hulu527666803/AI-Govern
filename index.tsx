
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// 测试用：将前端 console 同步到后端日志文件（需后端 LOG_FILE_ENABLED=true + 本项 VITE_LOG_TO_SERVER=true）
if (import.meta.env.DEV && import.meta.env.VITE_LOG_TO_SERVER === 'true') {
  const send = (level: string, ...args: unknown[]) => {
    const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    try {
      fetch('/api/debug/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level, message }) }).catch(() => {});
    } catch (_) {}
  };
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  console.log = (...a: unknown[]) => { origLog.apply(console, a); send('info', ...a); };
  console.warn = (...a: unknown[]) => { origWarn.apply(console, a); send('warn', ...a); };
  console.error = (...a: unknown[]) => { origError.apply(console, a); send('error', ...a); };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
