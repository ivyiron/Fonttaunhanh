import React from 'react';
import { ShieldAlert, X, Heart } from 'lucide-react';
import { MosaicCanvas } from './MosaicCanvas';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Màu nền trùng với nền của motion để phần visual hòa liền vào popup.
const STAGE_BG = '#060714';

export const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#060714]/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-modal-title"
        className="relative isolate max-w-3xl w-full rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden animate-scale-in flex flex-col text-neutral-100"
        style={{ backgroundColor: STAGE_BG }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual: motion mosaic neo ở đáy popup, mép trên mờ dần vào nền */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 aspect-[480/200]">
          <MosaicCanvas className="block w-full h-full" />
          <div
            className="absolute inset-x-0 top-0 h-1/2"
            style={{ background: `linear-gradient(to bottom, ${STAGE_BG}, transparent)` }}
          />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 id="credit-modal-title" className="text-base font-extrabold tracking-tight">
            Credit & Miễn Trừ Trách Nhiệm
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-xs shadow-lg shadow-black/50 transition cursor-pointer"
          >
            Kệ mọe
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs leading-relaxed">
          {/* Credit Section */}
          
            <div className="flex items-center gap-2">
              
              <a
                href="https://www.instagram.com/tuannlla/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-sm text-white hover:text-amber-300 transition"
              >
                [Ig]TuanLaVibecode
              </a>
            </div>
            {/*<p className="text-neutral-300">
              Sản phẩm được nghiên cứu và phát triển bởi <strong className="text-amber-400 font-extrabold">Tuanla Vibecode</strong> nhằm hỗ trợ cộng đồng thiết kế, typography Việt Nam tiếp cận các công cụ việt hóa font chữ, chỉnh sửa glyphs và cân chỉnh khoảng cách kerning một cách nhanh chóng, trực quan và chuẩn mực.
            </p>*/}
          

          {/* Disclaimer Section */}
          
            
            <p className="text-[11px] leading-normal text-white/80">
              Bạn không có quyền Việt Hóa font chữ của người khác đâu, cơ mà quan tâm làm gì cơ chứ. (Btw tác giả chỉ
              phát triển phầm mềm vì lý do nghiên cứu và vô can trong mọi trường hợp người dùng vi phạm bản quyền ạ)
            </p>
          
        </div>

        {/* Khoảng trống để lộ visual + nút đóng đặt trên visual */}
        <div className="flex items-end justify-end px-5 pb-4 aspect-[480/220]">
          
        </div>
      </div>
    </div>
  );
};
