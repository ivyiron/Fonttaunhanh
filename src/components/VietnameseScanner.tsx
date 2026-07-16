import React, { useMemo, useState } from 'react';
import * as opentype from 'opentype.js';
import { Search, AlertCircle, Check, Plus, Edit3 } from 'lucide-react';
import { VIETNAMESE_CHARS, VIETNAMESE_BASE_MAP, CHARACTER_DESCRIPTIONS } from '../utils';
import { GlyphEditState } from '../types';

interface VietnameseScannerProps {
  font: opentype.Font;
  editedGlyphs: Record<string, GlyphEditState>;
  onSelectSlot: (char: string) => void;
  activeSlot: string | null;
}

type FilterStatus = 'all' | 'missing' | 'found' | 'completed';
type VowelGroup = 'all' | 'A' | 'E' | 'O' | 'U' | 'others';

export const VietnameseScanner: React.FC<VietnameseScannerProps> = ({
  font,
  editedGlyphs,
  onSelectSlot,
  activeSlot
}) => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('missing');
  const [groupFilter, setGroupFilter] = useState<VowelGroup>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Scan font character-by-character
  const scannedData = useMemo(() => {
    const list = VIETNAMESE_CHARS.map(char => {
      // Check if original font has it (maps to non-zero index)
      const isOriginallyPresent = font.charToGlyphIndex(char) !== 0;
      const userEdit = editedGlyphs[char];
      const isUserCompleted = !!(userEdit && userEdit.isCompleted);
      
      let status: 'found' | 'missing' | 'completed' = 'missing';
      if (isUserCompleted) {
        status = 'completed';
      } else if (isOriginallyPresent) {
        status = 'found';
      }

      return {
        char,
        base: VIETNAMESE_BASE_MAP[char] || char,
        description: CHARACTER_DESCRIPTIONS[char] || '',
        status,
        isOriginallyPresent,
        isUserCompleted
      };
    });

    return list;
  }, [font, editedGlyphs]);

  // Statistics
  const stats = useMemo(() => {
    const total = scannedData.length;
    const found = scannedData.filter(d => d.status === 'found').length;
    const completed = scannedData.filter(d => d.status === 'completed').length;
    const missing = scannedData.filter(d => d.status === 'missing').length;

    return { total, found, completed, missing };
  }, [scannedData]);

  // Filters mapping
  const filteredData = useMemo(() => {
    return scannedData.filter(item => {
      // Status filter
      if (statusFilter === 'missing' && item.status !== 'missing') return false;
      if (statusFilter === 'found' && item.status !== 'found') return false;
      if (statusFilter === 'completed' && item.status !== 'completed') return false;

      // Group filter
      if (groupFilter !== 'all') {
        const baseLower = item.base.toLowerCase();
        if (groupFilter === 'A') {
          if (!['a', 'ă', 'â'].includes(baseLower)) return false;
        } else if (groupFilter === 'E') {
          if (!['e', 'ê'].includes(baseLower)) return false;
        } else if (groupFilter === 'O') {
          if (!['o', 'ô', 'ơ'].includes(baseLower)) return false;
        } else if (groupFilter === 'U') {
          if (!['u', 'ư'].includes(baseLower)) return false;
        } else if (groupFilter === 'others') {
          if (['a', 'e', 'o', 'u', 'ă', 'â', 'ê', 'ô', 'ơ', 'ư'].includes(baseLower)) return false;
        }
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.char.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.base.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [scannedData, statusFilter, groupFilter, searchQuery]);

  return (
    <div id="scanner-section" className="bg-white border border-neutral-100 rounded-xl p-6 shadow-xs">
      <div className="mb-6">
        <h3 className="text-base font-bold text-neutral-900 mb-4">Kết Quả Phân Tích Font Việt Hóa</h3>
        
        {/* Progress Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50/50 border border-green-100 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-green-500 text-white rounded-full">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs text-green-700 font-medium">Đã có trong font gốc</span>
              <span className="text-lg font-bold text-green-950">{stats.found} / {stats.total}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-blue-500 text-white rounded-full">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs text-blue-700 font-medium">Đã bổ sung thành công</span>
              <span className="text-lg font-bold text-blue-950">{stats.completed} ký tự</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-full">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs text-amber-700 font-medium font-vietnamese">Ký tự thiếu (Cần Việt hóa)</span>
              <span className="text-lg font-bold text-amber-950">{stats.missing} ký tự</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {/* Status Selector */}
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                id="filter-status-missing"
                onClick={() => setStatusFilter('missing')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'missing'
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Cần thêm ({stats.missing})
              </button>
              <button
                id="filter-status-completed"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Đã chỉnh sửa/thêm ({stats.completed})
              </button>
              <button
                id="filter-status-found"
                onClick={() => setStatusFilter('found')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'found'
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Đã có sẵn ({stats.found})
              </button>
              <button
                id="filter-status-all"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Tất cả ({stats.total})
              </button>
            </div>

            {/* Vowel Group Filter */}
            <div className="flex bg-neutral-50 p-0.5 rounded-lg border border-neutral-200">
              <button
                onClick={() => setGroupFilter('all')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupFilter === 'all' ? 'bg-white border border-neutral-200/60 shadow-xs text-neutral-950' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Tất cả nhóm
              </button>
              <button
                onClick={() => setGroupFilter('A')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupFilter === 'A' ? 'bg-white border border-neutral-200/60 shadow-xs text-neutral-950' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                A, Ă, Â
              </button>
              <button
                onClick={() => setGroupFilter('E')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupFilter === 'E' ? 'bg-white border border-neutral-200/60 shadow-xs text-neutral-950' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                E, Ê
              </button>
              <button
                onClick={() => setGroupFilter('O')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupFilter === 'O' ? 'bg-white border border-neutral-200/60 shadow-xs text-neutral-950' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                O, Ô, Ơ
              </button>
              <button
                onClick={() => setGroupFilter('U')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupFilter === 'U' ? 'bg-white border border-neutral-200/60 shadow-xs text-neutral-950' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                U, Ư
              </button>
              <button
                onClick={() => setGroupFilter('others')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupFilter === 'others' ? 'bg-white border border-neutral-200/60 shadow-xs text-neutral-950' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Khác
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm ký tự (ví dụ: ấ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-neutral-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Grid rendering */}
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 max-h-[360px] overflow-y-auto pr-2">
          {filteredData.map(item => {
            const isSelected = activeSlot === item.char;
            
            // Border & Background style based on status
            let cardStyle = 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50';
            let iconColor = 'text-amber-500';
            
            if (item.status === 'found') {
              cardStyle = 'border-green-100 bg-green-50/10 text-green-950 hover:border-green-300 hover:bg-green-50/25';
              iconColor = 'text-green-500';
            } else if (item.status === 'completed') {
              cardStyle = 'border-blue-200 bg-blue-50/10 text-blue-950 hover:bg-blue-50/20';
              iconColor = 'text-blue-500';
            } else {
              cardStyle = 'border-dashed border-amber-200 bg-amber-50/10 hover:bg-amber-50/30 text-amber-950';
            }

            if (isSelected) {
              cardStyle += ' ring-2 ring-neutral-800 border-transparent';
            }

            return (
              <button
                key={item.char}
                onClick={() => {
                  onSelectSlot(item.char);
                }}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 ${cardStyle}`}
              >
                {/* Character */}
                <span className="text-2xl font-bold font-sans tracking-tight mb-1">
                  {item.char}
                </span>

                {/* Sub-label */}
                <span className="text-[10px] text-neutral-500 font-medium truncate w-full px-1">
                  {item.description}
                </span>

                {/* Status Indicator Badge on corner */}
                <span className="absolute top-1.5 right-1.5">
                  {item.status === 'found' ? (
                    <span className="flex w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  ) : item.status === 'completed' ? (
                    <span className="flex w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  ) : (
                    <span className="flex w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  )}
                </span>
                
                {/* Base char helper */}
                <span className="absolute bottom-1 right-1 text-[8px] font-mono text-neutral-400">
                  {item.base}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
          <AlertCircle className="w-8 h-8 mb-2 text-neutral-300" />
          <p className="text-sm">Không tìm thấy ký tự phù hợp với tiêu chí lọc.</p>
        </div>
      )}
    </div>
  );
};
