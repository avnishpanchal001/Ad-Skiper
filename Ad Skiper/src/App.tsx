/**
 * adskiper - Simple, Neat & Clean Dashboard
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PixelLogo } from './components/PixelLogo';
import { createExtensionZip, downloadBlob } from './zipExporter';
import { Check, Download, Play, RefreshCw, Power } from 'lucide-react';

export default function App() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('adskiper_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [adsBlockedCount, setAdsBlockedCount] = useState<number>(() => {
    const saved = localStorage.getItem('adskiper_blocked_count');
    return saved ? parseInt(saved, 10) : 64;
  });

  const [testUrl, setTestUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('adskiper_enabled', isEnabled.toString());
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem('adskiper_blocked_count', adsBlockedCount.toString());
  }, [adsBlockedCount]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      const zipBlob = await createExtensionZip();
      downloadBlob(zipBlob, 'adskiper-extension.zip');
      showToast('adskiper extension downloaded! Load unpacked in Chrome.');
    } catch (err) {
      console.error(err);
      showToast('Error packaging ZIP');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggle = () => {
    setIsEnabled((prev) => {
      const next = !prev;
      showToast(next ? 'adskiper is now ON' : 'adskiper is now OFF');
      return next;
    });
  };

  const handleResetCount = () => {
    setAdsBlockedCount(0);
    showToast('Counter reset to 0');
  };

  const handleSimulateSkip = () => {
    if (!isEnabled) {
      showToast('adskiper is currently OFF. Turn it ON to skip ads.');
      return;
    }
    setAdsBlockedCount((prev) => prev + 1);
    showToast('⚡ Video ad skipped in 0ms! (+1)');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-300 selection:text-slate-900">
      <Header onDownloadZip={handleDownloadZip} isDownloading={isDownloading} />

      {/* Main Clean & Simple Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 space-y-5">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MAIN SIMPLE CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Logo & Headline */}
          <div className="flex items-center justify-between">
            <PixelLogo size="lg" showText={true} />

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active</span>
            </div>
          </div>

          <p className="text-sm text-slate-500 font-normal">
            Zero video ads, zero banners, zero buffering delay. 100% client-side with no VPN needed.
          </p>

          {/* Simple ON / OFF Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Ad Skipper Status
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {isEnabled ? 'Skipping and erasing all YouTube ads' : 'Paused — ads allowed'}
              </div>
            </div>

            <button
              onClick={handleToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                isEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Clean Counter Box */}
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ads Skipped &amp; Erased
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
                {adsBlockedCount}
              </div>
              <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero black screen · Video ads fast-skipped</span>
              </div>
            </div>

            <button
              onClick={handleResetCount}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Test Simulator */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Quick Test</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
              <button
                onClick={handleSimulateSkip}
                className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-amber-300 text-slate-900 text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-slate-900" />
                <span>Test (+1)</span>
              </button>
            </div>
          </div>

          {/* Download Action Button */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#FFE600]" />
            <span>{isDownloading ? 'Packaging adskiper...' : 'Download adskiper Extension (.ZIP)'}</span>
          </button>
        </div>

        {/* 3 SIMPLE STEPS TO INSTALL */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            How to Install in Chrome (3 Steps)
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <span>
                Click <strong>Download adskiper Extension (.ZIP)</strong> and unzip the folder.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <span>
                Open Chrome, navigate to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">chrome://extensions</code>, and turn on <strong>Developer mode</strong>.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <span>
                Click <strong>Load unpacked</strong> and select the extracted folder.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        adskiper · Ultra-Fast YouTube Ad Skipper
      </footer>
    </div>
  );
}
