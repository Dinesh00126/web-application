import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Share2, Copy, Check, X, Smartphone, Globe, ExternalLink, QrCode } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#172554',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'College Bus NFC Attendance System',
          text: 'Smart NFC bus attendance system for students and fleet monitoring',
          url: currentUrl,
        });
      } catch {
        // cancelled or failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Share2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Open on Other Devices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Scan this QR code with your phone camera or copy the link to open this website on any mobile phone or PC.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-5 shadow-xs">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code to open on mobile"
              className="w-48 h-48 rounded-xl shadow-xs border border-white"
            />
          ) : (
            <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-xl" />
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-3">
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Scan with phone camera or QR reader</span>
          </div>
        </div>

        {/* Direct Link Box */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Shareable Website Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Share via WhatsApp / Email / Messenger</span>
            </button>
          )}

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
            💡 <strong>Mobile NFC Tip:</strong> When opened in Chrome on an Android phone with NFC enabled, click <em>"Enable Android Mobile NFC Sensor"</em> on the scanner screen to tap real cards directly against the phone!
          </div>
        </div>
      </div>
    </div>
  );
};
