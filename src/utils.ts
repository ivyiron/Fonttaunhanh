import * as opentype from 'opentype.js';
import paper from 'paper';

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Full list of 134 Vietnamese letters requiring accents/diacritics
export const VIETNAMESE_CHARS = [
  // Vowel 'a' / 'A'
  'à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ',
  'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ằ', 'Ắ', 'Ẳ', 'Ẵ', 'Ặ', 'Â', 'Ầ', 'Ấ', 'Ẩ', 'Ẫ', 'Ậ',
  // Vowel 'e' / 'E'
  'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ',
  'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ', 'Ê', 'Ề', 'Ế', 'Ể', 'Ễ', 'Ệ',
  // Vowel 'i' / 'I'
  'ì', 'í', 'ỉ', 'ĩ', 'ị',
  'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị',
  // Vowel 'o' / 'O'
  'ò', 'ó', 'ỏ', 'õ', 'ọ', 'ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ',
  'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ', 'Ô', 'Ồ', 'Ố', 'Ổ', 'Ỗ', 'Ộ', 'Ơ', 'Ờ', 'Ớ', 'Ở', 'Ỡ', 'Ợ',
  // Vowel 'u' / 'U'
  'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự',
  'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ', 'Ư', 'Ừ', 'Ứ', 'Ử', 'Ữ', 'Ự',
  // Vowel 'y' / 'Y'
  'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ',
  'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ',
  // Consonant d/D
  'đ', 'Đ'
];

// Mapping of Vietnamese character with diacritic to standard Latin base character
export const VIETNAMESE_BASE_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
  'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
  'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',

  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
  'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',

  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',

  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
  'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
  'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',

  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
  'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',

  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',

  'đ': 'd', 'Đ': 'D'
};

// Character family groups for tracking/advance width synchronization
export const TRACKING_FAMILIES: string[][] = [
  // Lowercase
  ['a', 'à', 'á', 'ả', 'ã', 'ạ'],
  ['ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ'],
  ['â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
  ['e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ'],
  ['ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
  ['i', 'ì', 'í', 'ỉ', 'ĩ', 'ị'],
  ['o', 'ò', 'ó', 'ỏ', 'õ', 'ọ'],
  ['ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ'],
  ['ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
  ['u', 'ù', 'ú', 'ủ', 'ũ', 'ụ'],
  ['ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
  ['y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'],
  ['d', 'đ'],

  // Uppercase
  ['A', 'À', 'Á', 'Ả', 'Ã', 'Ạ'],
  ['Ă', 'Ằ', 'Ắ', 'Ẳ', 'Ẵ', 'Ặ'],
  ['Â', 'Ầ', 'Ấ', 'Ẩ', 'Ẫ', 'Ậ'],
  ['E', 'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ'],
  ['Ê', 'Ề', 'Ế', 'Ể', 'Ễ', 'Ệ'],
  ['I', 'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị'],
  ['O', 'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ'],
  ['Ô', 'Ồ', 'Ố', 'Ổ', 'Ỗ', 'Ộ'],
  ['Ơ', 'Ờ', 'Ớ', 'Ở', 'Ỡ', 'Ợ'],
  ['U', 'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ'],
  ['Ư', 'Ừ', 'Ứ', 'Ử', 'Ữ', 'Ự'],
  ['Y', 'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ'],
  ['D', 'Đ']
];

export const UNACCENTED_BASE_CHARS = new Set([
  'a', 'A', 'e', 'E', 'o', 'O', 'u', 'U', 'i', 'I', 'y', 'Y', 'd', 'D'
]);

export function isUnaccentedBaseChar(char: string): boolean {
  if (!char) return false;
  return UNACCENTED_BASE_CHARS.has(char);
}

export function getTrackingFamilyMembers(char: string, includeBaseChar: boolean = false): string[] {
  for (const family of TRACKING_FAMILIES) {
    if (family.includes(char)) {
      if (!includeBaseChar) {
        return family.filter((c) => !isUnaccentedBaseChar(c));
      }
      return family;
    }
  }
  return isUnaccentedBaseChar(char) && !includeBaseChar ? [] : [char];
}

// Human-readable names for characters to make alignment/editing crystal clear
export const CHARACTER_DESCRIPTIONS: Record<string, string> = {
  'à': 'a huyền', 'á': 'a sắc', 'ả': 'a hỏi', 'ã': 'a ngã', 'ạ': 'a nặng',
  'ă': 'a trăng (ă)', 'ằ': 'ă huyền', 'ắ': 'ă sắc', 'ẳ': 'ă hỏi', 'ẵ': 'ă ngã', 'ặ': 'ă nặng',
  'â': 'a mũ (â)', 'ầ': 'â huyền', 'ấ': 'â sắc', 'ẩ': 'â hỏi', 'ẫ': 'â ngã', 'ậ': 'â nặng',
  'è': 'e huyền', 'é': 'e sắc', 'ẻ': 'e hỏi', 'ẽ': 'e ngã', 'ẹ': 'e nặng',
  'ê': 'e mũ (ê)', 'ề': 'ê huyền', 'ế': 'ê sắc', 'ể': 'ê hỏi', 'ễ': 'ê ngã', 'ệ': 'ê nặng',
  'ì': 'i huyền', 'í': 'i sắc', 'ỉ': 'i hỏi', 'ĩ': 'i ngã', 'ị': 'i nặng',
  'ò': 'o huyền', 'ó': 'o sắc', 'ỏ': 'o hỏi', 'õ': 'o ngã', 'ọ': 'o nặng',
  'ô': 'o mũ (ô)', 'ồ': 'ô huyền', 'ố': 'ô sắc', 'ổ': 'ô hỏi', 'ỗ': 'ô ngã', 'ộ': 'ô nặng',
  'ơ': 'o móc (ơ)', 'ờ': 'ơ huyền', 'ớ': 'ơ sắc', 'ở': 'ơ hỏi', 'ỡ': 'ơ ngã', 'ợ': 'ơ nặng',
  'ù': 'u huyền', 'ú': 'u sắc', 'ủ': 'u hỏi', 'ũ': 'u ngã', 'ụ': 'u nặng',
  'ư': 'u móc (ư)', 'ừ': 'ư huyền', 'ứ': 'ư sắc', 'ử': 'ư hỏi', 'ữ': 'ư ngã', 'ự': 'ư nặng',
  'ỳ': 'y huyền', 'ý': 'y sắc', 'ỷ': 'y hỏi', 'ỹ': 'y ngã', 'ỵ': 'y nặng',
  'đ': 'd gạch (đ)',

  'À': 'A huyền hoa', 'Á': 'A sắc hoa', 'Ả': 'A hỏi hoa', 'Ã': 'A ngã hoa', 'Ạ': 'A nặng hoa',
  'Ă': 'Ă trăng hoa', 'Ằ': 'Ă huyền hoa', 'Ắ': 'Ă sắc hoa', 'Ẳ': 'Ă hỏi hoa', 'Ẵ': 'Ă ngã hoa', 'Ặ': 'Ă nặng hoa',
  'Â': 'Â mũ hoa', 'Ầ': 'Â huyền hoa', 'Ấ': 'Â sắc hoa', 'Ẩ': 'Â hỏi hoa', 'Ẫ': 'Â ngã hoa', 'Ậ': 'Â nặng hoa',
  'È': 'E huyền hoa', 'É': 'E sắc hoa', 'Ẻ': 'E hỏi hoa', 'Ẽ': 'E ngã hoa', 'Ẹ': 'E nặng hoa',
  'Ê': 'Ê mũ hoa', 'Ề': 'Ê huyền hoa', 'Ế': 'Ê sắc hoa', 'Ể': 'Ê hỏi hoa', 'Ễ': 'Ê ngã hoa', 'Ệ': 'Ê nặng hoa',
  'Ì': 'I huyền hoa', 'Í': 'I sắc hoa', 'Ỉ': 'I hỏi hoa', 'Ĩ': 'I ngã hoa', 'Ị': 'I nặng hoa',
  'Ò': 'O huyền hoa', 'Ó': 'O sắc hoa', 'Ỏ': 'O hỏi hoa', 'Õ': 'O ngã hoa', 'Ọ': 'O nặng hoa',
  'Ô': 'Ô mũ hoa', 'Ồ': 'Ô huyền hoa', 'Ố': 'Ô sắc hoa', 'Ổ': 'Ô hỏi hoa', 'Ỗ': 'Ô ngã hoa', 'Ộ': 'Ô nặng hoa',
  'Ơ': 'Ơ móc hoa', 'Ờ': 'Ơ huyền hoa', 'Ớ': 'Ơ sắc hoa', 'Ở': 'Ơ hỏi hoa', 'Ỡ': 'Ơ ngã hoa', 'Ợ': 'Ơ nặng hoa',
  'Ù': 'U huyền hoa', 'Ú': 'U sắc hoa', 'Ủ': 'U hỏi hoa', 'Ũ': 'U ngã hoa', 'Ụ': 'U nặng hoa',
  'Ư': 'Ư móc hoa', 'Ừ': 'Ư huyền hoa', 'Ứ': 'Ư sắc hoa', 'Ử': 'Ư hỏi hoa', 'Ữ': 'Ư ngã hoa', 'Ự': 'Ư nặng hoa',
  'Ỳ': 'Y huyền hoa', 'Ý': 'Y sắc hoa', 'Ỷ': 'Y hỏi hoa', 'Ỹ': 'Y ngã hoa', 'Ỵ': 'Y nặng hoa',
  'Đ': 'D gạch hoa (Đ)'
};

/**
 * Extracts raw SVG path 'd' string from pasted Adobe Illustrator markup, XML strings or raw inputs.
 * Supports automatic conversion of simple SVG shapes (rect, circle, ellipse, line, polygon, polyline) to path strings.
 */
export function extractPathDataFromSvg(svgString: string): string {
  const cleanSvg = svgString.trim();

  // If it's just raw path data (e.g., M10 20 L30 40...)
  if (!cleanSvg.includes('<')) {
    return cleanSvg;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
    
    // Query both paths and basic vector shapes in DOM order
    const elements = doc.querySelectorAll('path, rect, circle, ellipse, line, polygon, polyline');
    
    if (elements.length > 0) {
      const pathDatas: string[] = [];
      elements.forEach(el => {
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'path') {
          const d = el.getAttribute('d');
          if (d) pathDatas.push(d);
        } else if (tagName === 'rect') {
          const x = parseFloat(el.getAttribute('x') || '0');
          const y = parseFloat(el.getAttribute('y') || '0');
          const w = parseFloat(el.getAttribute('width') || '0');
          const h = parseFloat(el.getAttribute('height') || '0');
          let rx = parseFloat(el.getAttribute('rx') || '0');
          let ry = parseFloat(el.getAttribute('ry') || '0');
          
          if (el.hasAttribute('rx') && !el.hasAttribute('ry')) {
            ry = rx;
          } else if (el.hasAttribute('ry') && !el.hasAttribute('rx')) {
            rx = ry;
          }
          
          if (rx > w / 2) rx = w / 2;
          if (ry > h / 2) ry = h / 2;
          
          if (rx > 0 && ry > 0) {
            pathDatas.push(`M ${x + rx} ${y} h ${w - 2 * rx} a ${rx} ${ry} 0 0 1 ${rx} ${ry} v ${h - 2 * ry} a ${rx} ${ry} 0 0 1 ${-rx} ${ry} h ${-w + 2 * rx} a ${rx} ${ry} 0 0 1 ${-rx} ${-ry} v ${-h + 2 * ry} a ${rx} ${ry} 0 0 1 ${rx} ${-ry} Z`);
          } else {
            pathDatas.push(`M ${x} ${y} h ${w} v ${h} h ${-w} Z`);
          }
        } else if (tagName === 'circle') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const r = parseFloat(el.getAttribute('r') || '0');
          if (r > 0) {
            pathDatas.push(`M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`);
          }
        } else if (tagName === 'ellipse') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const rx = parseFloat(el.getAttribute('rx') || '0');
          const ry = parseFloat(el.getAttribute('ry') || '0');
          if (rx > 0 && ry > 0) {
            pathDatas.push(`M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`);
          }
        } else if (tagName === 'line') {
          const x1 = parseFloat(el.getAttribute('x1') || '0');
          const y1 = parseFloat(el.getAttribute('y1') || '0');
          const x2 = parseFloat(el.getAttribute('x2') || '0');
          const y2 = parseFloat(el.getAttribute('y2') || '0');
          pathDatas.push(`M ${x1} ${y1} L ${x2} ${y2}`);
        } else if (tagName === 'polygon' || tagName === 'polyline') {
          const pointsAttr = el.getAttribute('points') || '';
          const coords = pointsAttr.trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
          if (coords.length >= 4) {
            let d = `M ${coords[0]} ${coords[1]}`;
            for (let i = 2; i < coords.length; i += 2) {
              if (coords[i+1] !== undefined) {
                d += ` L ${coords[i]} ${coords[i+1]}`;
              }
            }
            if (tagName === 'polygon') {
              d += ' Z';
            }
            pathDatas.push(d);
          }
        }
      });
      
      const mergedPath = pathDatas.join(' ').trim();
      if (mergedPath) {
        return mergedPath;
      }
    }

    // Regex fallback for 'd' attribute
    const regex = /d\s*=\s*["']([^"']+)["']/g;
    let match;
    const pathDatasFallback: string[] = [];
    while ((match = regex.exec(cleanSvg)) !== null) {
      pathDatasFallback.push(match[1]);
    }
    if (pathDatasFallback.length > 0) {
      return pathDatasFallback.join(' ');
    }
  } catch (err) {
    console.error("Lỗi khi trích xuất dữ liệu path từ SVG:", err);
  }

  return '';
}

/**
 * Parses SVG path 'd' strings into opentype.js style commands list
 */
export function parseSvgPath(d: string): any[] {
  const commands: any[] = [];
  
  // Robustly tokenize the SVG path (handling minus signs, exponents, commas, spacing)
  const regex = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;
  let match;
  const tokens: string[] = [];
  while ((match = regex.exec(d)) !== null) {
    tokens.push(match[0]);
  }

  let i = 0;
  let currentX = 0;
  let currentY = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(token)) {
      const cmd = token;
      i++;

      if (cmd === 'M' || cmd === 'm') {
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        if (cmd === 'm') {
          currentX += x;
          currentY += y;
        } else {
          currentX = x;
          currentY = y;
        }
        subpathStartX = currentX;
        subpathStartY = currentY;
        commands.push({ type: 'M', x: currentX, y: currentY });

        // Implicit lineto values
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const lx = parseFloat(tokens[i++]);
          const ly = parseFloat(tokens[i++]);
          if (cmd === 'm') {
            currentX += lx;
            currentY += ly;
          } else {
            currentX = lx;
            currentY = ly;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'L' || cmd === 'l') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          if (cmd === 'l') {
            currentX += x;
            currentY += y;
          } else {
            currentX = x;
            currentY = y;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'H' || cmd === 'h') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x = parseFloat(tokens[i++]);
          if (cmd === 'h') {
            currentX += x;
          } else {
            currentX = x;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'V' || cmd === 'v') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const y = parseFloat(tokens[i++]);
          if (cmd === 'v') {
            currentY += y;
          } else {
            currentY = y;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'C' || cmd === 'c') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x1 = parseFloat(tokens[i++]);
          const y1 = parseFloat(tokens[i++]);
          const x2 = parseFloat(tokens[i++]);
          const y2 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);

          let cx1, cy1, cx2, cy2, destX, destY;
          if (cmd === 'c') {
            cx1 = currentX + x1;
            cy1 = currentY + y1;
            cx2 = currentX + x2;
            cy2 = currentY + y2;
            destX = currentX + x;
            destY = currentY + y;
          } else {
            cx1 = x1;
            cy1 = y1;
            cx2 = x2;
            cy2 = y2;
            destX = x;
            destY = y;
          }
          commands.push({ type: 'C', x1: cx1, y1: cy1, x2: cx2, y2: cy2, x: destX, y: destY });
          currentX = destX;
          currentY = destY;
        }
      } else if (cmd === 'Q' || cmd === 'q') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x1 = parseFloat(tokens[i++]);
          const y1 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);

          let cx1, cy1, destX, destY;
          if (cmd === 'q') {
            cx1 = currentX + x1;
            cy1 = currentY + y1;
            destX = currentX + x;
            destY = currentY + y;
          } else {
            cx1 = x1;
            cy1 = y1;
            destX = x;
            destY = y;
          }
          commands.push({ type: 'Q', x1: cx1, y1: cy1, x: destX, y: destY });
          currentX = destX;
          currentY = destY;
        }
      } else if (cmd === 'S' || cmd === 's') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x2 = parseFloat(tokens[i++]);
          const y2 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);

          const prev = commands[commands.length - 1];
          let cx1 = currentX;
          let cy1 = currentY;
          if (prev && prev.type === 'C') {
            cx1 = 2 * currentX - prev.x2;
            cy1 = 2 * currentY - prev.y2;
          }

          const cx2 = cmd === 's' ? currentX + x2 : x2;
          const cy2 = cmd === 's' ? currentY + y2 : y2;
          const destX = cmd === 's' ? currentX + x : x;
          const destY = cmd === 's' ? currentY + y : y;

          commands.push({ type: 'C', x1: cx1, y1: cy1, x2: cx2, y2: cy2, x: destX, y: destY });
          currentX = destX;
          currentY = destY;
        }
      } else if (cmd === 'Z' || cmd === 'z') {
        commands.push({ type: 'Z' });
        currentX = subpathStartX;
        currentY = subpathStartY;
      } else {
        // Skip unknown tokens to avoid loops
        i++;
      }
    } else {
      i++;
    }
  }

  return commands;
}

/**
 * Transforms coordinates of a list of commands using scale, offsets and Y/X-flipping
 */
export function transformCommands(
  cmds: any[],
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
  flipY: boolean,
  flipX: boolean = false
): any[] {
  const tY = (val: number) => {
    let y = val;
    if (flipY) y = -y;
    return y * scaleY + offsetY;
  };
  
  const tX = (val: number) => {
    let x = val;
    if (flipX) x = -x;
    return x * scaleX + offsetX;
  };

  return cmds.map(cmd => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      return { type: cmd.type, x: tX(cmd.x), y: tY(cmd.y) };
    } else if (cmd.type === 'Q') {
      return { 
        type: 'Q', 
        x1: tX(cmd.x1), 
        y1: tY(cmd.y1), 
        x: tX(cmd.x), 
        y: tY(cmd.y) 
      };
    } else if (cmd.type === 'C') {
      return { 
        type: 'C', 
        x1: tX(cmd.x1), 
        y1: tY(cmd.y1), 
        x2: tX(cmd.x2), 
        y2: tY(cmd.y2), 
        x: tX(cmd.x), 
        y: tY(cmd.y) 
      };
    } else if (cmd.type === 'Z') {
      return { type: 'Z' };
    }
    return cmd;
  });
}

/**
 * Calculates bounding box of parsed SVG commands
 */
export function getBoundingBox(cmds: any[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  
  cmds.forEach(cmd => {
    if (cmd.x !== undefined) {
      if (cmd.x < xMin) xMin = cmd.x;
      if (cmd.x > xMax) xMax = cmd.x;
    }
    if (cmd.y !== undefined) {
      if (cmd.y < yMin) yMin = cmd.y;
      if (cmd.y > yMax) yMax = cmd.y;
    }
    if (cmd.x1 !== undefined) {
      if (cmd.x1 < xMin) xMin = cmd.x1;
      if (cmd.x1 > xMax) xMax = cmd.x1;
    }
    if (cmd.y1 !== undefined) {
      if (cmd.y1 < yMin) yMin = cmd.y1;
      if (cmd.y1 > yMax) yMax = cmd.y1;
    }
    if (cmd.x2 !== undefined) {
      if (cmd.x2 < xMin) xMin = cmd.x2;
      if (cmd.x2 > xMax) xMax = cmd.x2;
    }
    if (cmd.y2 !== undefined) {
      if (cmd.y2 < yMin) yMin = cmd.y2;
      if (cmd.y2 > yMax) yMax = cmd.y2;
    }
  });

  if (xMin === Infinity) {
    return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  }

  return { xMin, xMax, yMin, yMax };
}

/**
 * Calculates a highly accurate tight bounding box of parsed SVG commands by sampling Bezier curve points
 */
export function getExactBoundingBox(cmds: any[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  
  let currentX = 0;
  let currentY = 0;

  const updateMinMax = (x: number, y: number) => {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  };

  cmds.forEach(cmd => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      updateMinMax(cmd.x, cmd.y);
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === 'Q') {
      // Sample 20 points along the quadratic curve for extreme precision
      for (let t = 0; t <= 1; t += 0.05) {
        const mt = 1 - t;
        const x = mt * mt * currentX + 2 * mt * t * cmd.x1 + t * t * cmd.x;
        const y = mt * mt * currentY + 2 * mt * t * cmd.y1 + t * t * cmd.y;
        updateMinMax(x, y);
      }
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === 'C') {
      // Sample 20 points along the cubic curve for extreme precision
      for (let t = 0; t <= 1; t += 0.05) {
        const mt = 1 - t;
        const x = mt * mt * mt * currentX + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x;
        const y = mt * mt * mt * currentY + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y;
        updateMinMax(x, y);
      }
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === 'Z') {
      // Z command doesn't move arbitrarily but can close back. Usually M handles start point.
    }
  });

  if (xMin === Infinity) {
    return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  }

  return { xMin, xMax, yMin, yMax };
}

function getSubpaths(commands: any[]): any[][] {
  const subpaths: any[][] = [];
  let current: any[] = [];
  commands.forEach(cmd => {
    if (cmd.type === 'M') {
      if (current.length > 0) {
        subpaths.push(current);
      }
      current = [cmd];
    } else {
      current.push(cmd);
    }
  });
  if (current.length > 0) {
    subpaths.push(current);
  }
  return subpaths;
}

/**
 * Calculates the signed area of a 2D path contour in font coordinate space (Y-up).
 * Positive area (>0) indicates Clockwise (CW) direction (outer contour in TrueType fonts).
 * Negative area (<0) indicates Counter-Clockwise (CCW) direction (inner hole in TrueType fonts).
 */
export function getContourSignedArea(contour: any[]): number {
  if (!contour || contour.length === 0) return 0;
  
  const points: { x: number; y: number }[] = [];
  let curX = 0;
  let curY = 0;

  contour.forEach(cmd => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      curX = cmd.x;
      curY = cmd.y;
      points.push({ x: curX, y: curY });
    } else if (cmd.type === 'Q') {
      for (let t = 0.1; t <= 1; t += 0.1) {
        const mt = 1 - t;
        const x = mt * mt * curX + 2 * mt * t * cmd.x1 + t * t * cmd.x;
        const y = mt * mt * curY + 2 * mt * t * cmd.y1 + t * t * cmd.y;
        points.push({ x, y });
      }
      curX = cmd.x;
      curY = cmd.y;
    } else if (cmd.type === 'C') {
      for (let t = 0.1; t <= 1; t += 0.1) {
        const mt = 1 - t;
        const x = mt * mt * mt * curX + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x;
        const y = mt * mt * mt * curY + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y;
        points.push({ x, y });
      }
      curX = cmd.x;
      curY = cmd.y;
    }
  });

  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    area += (p1.x * p2.y - p2.x * p1.y);
  }
  return area / 2;
}

/**
 * Reverses the winding direction of a single contour path (M...Z).
 */
export function reverseContour(contour: any[]): any[] {
  if (!contour || contour.length <= 1) return contour;

  const segments: any[] = [];
  let hasZ = false;

  contour.forEach(cmd => {
    if (cmd.type === 'Z') {
      hasZ = true;
    } else {
      segments.push(cmd);
    }
  });

  if (segments.length <= 1) return contour;

  const lastSeg = segments[segments.length - 1];
  const reversed: any[] = [{ type: 'M', x: lastSeg.x, y: lastSeg.y }];

  for (let i = segments.length - 1; i >= 1; i--) {
    const curSeg = segments[i];
    const prevSeg = segments[i - 1];
    const destX = prevSeg.x;
    const destY = prevSeg.y;

    if (curSeg.type === 'L') {
      reversed.push({ type: 'L', x: destX, y: destY });
    } else if (curSeg.type === 'Q') {
      reversed.push({
        type: 'Q',
        x1: curSeg.x1,
        y1: curSeg.y1,
        x: destX,
        y: destY
      });
    } else if (curSeg.type === 'C') {
      reversed.push({
        type: 'C',
        x1: curSeg.x2,
        y1: curSeg.y2,
        x2: curSeg.x1,
        y2: curSeg.y1,
        x: destX,
        y: destY
      });
    }
  }

  if (hasZ) {
    reversed.push({ type: 'Z' });
  }

  return reversed;
}

/**
 * Samples dense boundary points from a contour, interpolating Bezier curves
 * so that geometric tests (such as ray-casting containment and signed area)
 * operate on the real curved boundary rather than just sparse vertices.
 */
export function getContourSampledPoints(contour: any[]): { x: number; y: number }[] {
  if (!contour || contour.length === 0) return [];
  const points: { x: number; y: number }[] = [];
  let curX = 0, curY = 0;

  contour.forEach(cmd => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      curX = cmd.x;
      curY = cmd.y;
      points.push({ x: curX, y: curY });
    } else if (cmd.type === 'Q') {
      for (let t = 0.125; t <= 1; t += 0.125) {
        const mt = 1 - t;
        const x = mt * mt * curX + 2 * mt * t * cmd.x1 + t * t * cmd.x;
        const y = mt * mt * curY + 2 * mt * t * cmd.y1 + t * t * cmd.y;
        points.push({ x, y });
      }
      curX = cmd.x;
      curY = cmd.y;
    } else if (cmd.type === 'C') {
      for (let t = 0.125; t <= 1; t += 0.125) {
        const mt = 1 - t;
        const x = mt * mt * mt * curX + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x;
        const y = mt * mt * mt * curY + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y;
        points.push({ x, y });
      }
      curX = cmd.x;
      curY = cmd.y;
    }
  });

  return points;
}

/**
 * Tests if a point (x, y) is inside a sampled polygon using Ray-Casting algorithm.
 */
export function isPointInSampledPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Tests if a point (x, y) is inside a contour using curve-sampled Ray-Casting algorithm.
 */
export function isPointInContour(x: number, y: number, contour: any[]): boolean {
  const polygon = getContourSampledPoints(contour);
  return isPointInSampledPolygon(x, y, polygon);
}

/**
 * Determines whether a given contour is geometrically an inner hole (counter)
 * enclosed inside another outer contour within a collection of glyph contours.
 * Crucial for avoiding black-hole artifacts in letters like O, o, e, a, d, p, q.
 */
export function isContourAnInnerHole(contour: any[], allContours: any[][]): boolean {
  if (!contour || !allContours || allContours.length <= 1) return false;
  const cBBox = getExactBoundingBox(contour);
  const cArea = Math.abs(getContourSignedArea(contour));
  if (cArea < 1e-3) return false;

  const cCenterX = (cBBox.xMin + cBBox.xMax) / 2;
  const cCenterY = (cBBox.yMin + cBBox.yMax) / 2;

  for (const other of allContours) {
    if (other === contour) continue;
    const oBBox = getExactBoundingBox(other);
    const oArea = Math.abs(getContourSignedArea(other));

    // Outer contour must have greater area and bounding box enclosing the candidate hole
    if (
      oArea > cArea &&
      cBBox.xMin >= oBBox.xMin - 2 &&
      cBBox.xMax <= oBBox.xMax + 2 &&
      cBBox.yMin >= oBBox.yMin - 2 &&
      cBBox.yMax <= oBBox.yMax + 2
    ) {
      const oPoly = getContourSampledPoints(other);
      if (isPointInSampledPolygon(cCenterX, cCenterY, oPoly)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Ensures all outer contours of a glyph match the target orientation (Clockwise for TrueType)
 * and all inner hole contours have the opposite orientation (Counter-Clockwise).
 * Carefully preserves internal holes and counters so they never turn black.
 */
export function orientContours(commands: any[], targetOuterClockwise: boolean = true): any[] {
  const contours = getGlyphContours(commands);
  if (contours.length === 0) return commands;
  if (contours.length === 1) {
    const area = getContourSignedArea(contours[0]);
    if (Math.abs(area) < 1e-3) return commands;
    const isClockwise = area > 0;
    if (isClockwise !== targetOuterClockwise) {
      return reverseContour(contours[0]);
    }
    return contours[0];
  }

  const resultCommands: any[] = [];

  contours.forEach((contour) => {
    const area = getContourSignedArea(contour);
    if (Math.abs(area) < 1e-3) {
      resultCommands.push(...contour);
      return;
    }

    const isHole = isContourAnInnerHole(contour, contours);
    const shouldBeClockwise = isHole ? !targetOuterClockwise : targetOuterClockwise;
    const isCurrentlyClockwise = area > 0;

    if (shouldBeClockwise !== isCurrentlyClockwise) {
      resultCommands.push(...reverseContour(contour));
    } else {
      resultCommands.push(...contour);
    }
  });

  return resultCommands;
}

/**
 * Converts an array of opentype path commands to an SVG path string d="..."
 */
export function commandsToSvgPathD(cmds: any[]): string {
  if (!cmds || cmds.length === 0) return '';
  return cmds.map(cmd => {
    if (cmd.type === 'M') return `M ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'L') return `L ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'Q') return `Q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'C') return `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'Z') return `Z`;
    return '';
  }).join(' ');
}

/**
 * Performs a 2D Boolean Union of two SVG paths using Paper.js.
 * Merges overlapping boundaries into a single continuous outline, removing internal overlapping edges.
 */
export function unionSvgPaths(d1: string, d2: string): string {
  if (!d1 || !d1.trim()) return d2 || '';
  if (!d2 || !d2.trim()) return d1 || '';

  try {
    if (!paper.project) {
      paper.setup(new paper.Size(4000, 4000));
    }

    const path1 = new paper.CompoundPath({ pathData: d1, insert: false });
    const path2 = new paper.CompoundPath({ pathData: d2, insert: false });

    const united = path1.unite(path2, { insert: false });
    const resultD = united.pathData;

    path1.remove();
    path2.remove();
    united.remove();

    if (resultD && resultD.trim().length > 0) {
      return resultD;
    }
    return d1 + ' ' + d2;
  } catch (err) {
    console.warn('Paper.js path union fallback:', err);
    return d1 + ' ' + d2;
  }
}

function getSubpathBBox(cmds: any[]) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  const update = (x: number, y: number) => {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  };
  cmds.forEach(cmd => {
    if (cmd.x !== undefined && cmd.y !== undefined) update(cmd.x, cmd.y);
    if (cmd.x1 !== undefined && cmd.y1 !== undefined) update(cmd.x1, cmd.y1);
    if (cmd.x2 !== undefined && cmd.y2 !== undefined) update(cmd.x2, cmd.y2);
  });
  return { xMin, xMax, yMin, yMax };
}

export function removeDotFromICommands(commands: any[]): any[] {
  const subpaths = getSubpaths(commands);
  if (subpaths.length <= 1) {
    return commands;
  }

  const bboxes = subpaths.map(cmds => getSubpathBBox(cmds));
  
  let overallYMax = -Infinity;
  let overallYMin = Infinity;
  bboxes.forEach(box => {
    if (box.yMax > overallYMax) overallYMax = box.yMax;
    if (box.yMin < overallYMin) overallYMin = box.yMin;
  });

  const totalHeight = overallYMax - overallYMin;
  if (totalHeight < 100) return commands;

  const thresholdY = overallYMin + 0.45 * totalHeight;

  const filteredSubpaths = subpaths.filter((cmds, idx) => {
    const box = bboxes[idx];
    const isTopmost = box.yMax === overallYMax;
    const isAboveThreshold = box.yMin > thresholdY;
    
    if (isTopmost && box.yMin > overallYMin + 0.25 * totalHeight) {
      return false; // This is the dot, remove it
    }
    if (isAboveThreshold) {
      return false; // This is also a dot, remove it
    }
    return true; // Keep this contour
  });

  if (filteredSubpaths.length === 0) {
    return commands;
  }

  const resultCommands: any[] = [];
  filteredSubpaths.forEach(cmds => {
    resultCommands.push(...cmds);
  });
  return resultCommands;
}

/**
 * Helper to extract glyph indexes from an opentype.js coverage table,
 * correctly supporting both Format 1 (individual glyphs list) and Format 2 (glyph ranges).
 */
export function getCoverageGlyphs(coverage: any): number[] {
  if (!coverage) return [];
  if (coverage.format === 1 && Array.isArray(coverage.glyphs)) {
    return coverage.glyphs;
  }
  if (coverage.format === 2 && Array.isArray(coverage.ranges)) {
    const glyphs: number[] = [];
    for (const r of coverage.ranges) {
      const start = r.start !== undefined ? r.start : r.startGlyphID;
      const end = r.end !== undefined ? r.end : r.endGlyphID;
      if (typeof start === 'number' && typeof end === 'number') {
        for (let g = start; g <= end; g++) {
          glyphs.push(g);
        }
      }
    }
    return glyphs;
  }
  if (Array.isArray(coverage.glyphs)) {
    return coverage.glyphs;
  }
  return [];
}

/**
 * Extracts and converts GPOS kerning tables (Format 1 and Format 2 Class-based positioning)
 * into standard font.kerningPairs so they can be written as standard 'kern' table pairs when saved,
 * and utilized for smart Vietnamese character kerning cloning.
 */
export function ensureKerningPairsPopulated(font: any): void {
  if (!font) return;
  if (!font.kerningPairs) {
    font.kerningPairs = {};
  }

  const gpos = font.tables?.gpos;
  if (gpos && gpos.lookups) {
    const lookups = gpos.lookups || [];
    for (const lookup of lookups) {
      if (lookup.lookupType === 2) { // Pair Positioning
        const subtables = lookup.subtables || [];
        for (const subtable of subtables) {
          const posFormat = subtable.posFormat !== undefined ? subtable.posFormat : subtable.format;
          // Format 1: Pair Adjustment (Specific glyph pairs)
          if (posFormat === 1) {
            const coverage = subtable.coverage;
            if (!coverage) continue;
            const leftGlyphs = getCoverageGlyphs(coverage);
            if (leftGlyphs.length === 0) continue;
            const pairSets = subtable.pairSets || [];
            
            for (let i = 0; i < leftGlyphs.length; i++) {
              const leftGlyphIndex = leftGlyphs[i];
              const pairSet = pairSets[i];
              if (!pairSet) continue;
              
              for (const pairValueRecord of pairSet) {
                const rightGlyphIndex = pairValueRecord.secondGlyph;
                const value1 = pairValueRecord.value1;
                if (value1 && typeof value1.xAdvance === 'number' && value1.xAdvance !== 0) {
                  const kernValue = value1.xAdvance;
                  const pairKey = `${leftGlyphIndex},${rightGlyphIndex}`;
                  if (font.kerningPairs[pairKey] === undefined) {
                    font.kerningPairs[pairKey] = kernValue;
                  }
                }
              }
            }
          }
          // Format 2: Class-based Pair Adjustment
          else if (posFormat === 2) {
            const classDef1 = subtable.classDef1;
            const classDef2 = subtable.classDef2;
            const classRecords = subtable.classRecords || [];
            const class1Count = subtable.class1Count || 0;
            const class2Count = subtable.class2Count || 0;
            
            // Helper to fetch glyph class index safely
            const getGlyphClass = (classDef: any, glyphIndex: number): number => {
              if (!classDef) return 0;
              const format = classDef.format !== undefined ? classDef.format : classDef.classFormat;
              if (format === 1) {
                const startGlyph = classDef.startGlyph || 0;
                const classValueArray = classDef.classes || classDef.classValueArray || [];
                const index = glyphIndex - startGlyph;
                if (index >= 0 && index < classValueArray.length) {
                  return classValueArray[index];
                }
                return 0;
              }
              if (format === 2) {
                const ranges = classDef.ranges || classDef.classRangeRecords || [];
                for (const record of ranges) {
                  const start = record.start !== undefined ? record.start : record.startGlyphID;
                  const end = record.end !== undefined ? record.end : record.endGlyphID;
                  const classId = record.classId !== undefined ? record.classId : record.class;
                  if (glyphIndex >= start && glyphIndex <= end) {
                    return classId || 0;
                  }
                }
                return 0;
              }
              if (classDef.classDefs && typeof classDef.classDefs === 'object') {
                return classDef.classDefs[glyphIndex] || 0;
              }
              return 0;
            };

            const numGlyphs = font.glyphs.length;
            const class1ToGlyphs: Record<number, number[]> = {};
            const class2ToGlyphs: Record<number, number[]> = {};

            // Class 1 (left glyphs) MUST be in the coverage table to be valid
            const coverageGlyphs = getCoverageGlyphs(subtable.coverage);
            for (const g of coverageGlyphs) {
              const c1 = getGlyphClass(classDef1, g);
              if (c1 < class1Count) {
                if (!class1ToGlyphs[c1]) class1ToGlyphs[c1] = [];
                class1ToGlyphs[c1].push(g);
              }
            }

            // Class 2 (right glyphs) can be any glyph in the font
            for (let g = 0; g < numGlyphs; g++) {
              const c2 = getGlyphClass(classDef2, g);
              if (c2 < class2Count) {
                if (!class2ToGlyphs[c2]) class2ToGlyphs[c2] = [];
                class2ToGlyphs[c2].push(g);
              }
            }

            // Iterate over Class 1 -> Class 2 records to expand kerning pairs
            for (let c1 = 0; c1 < classRecords.length; c1++) {
              if (c1 >= class1Count) continue;
              const classRecordRow = classRecords[c1];
              if (!classRecordRow) continue;
              
              const firstGlyphsInClass = class1ToGlyphs[c1] || [];
              if (firstGlyphsInClass.length === 0) continue;
              
              for (let c2 = 0; c2 < classRecordRow.length; c2++) {
                if (c2 >= class2Count) continue;
                const classRecord = classRecordRow[c2];
                if (!classRecord) continue;
                
                const value1 = classRecord.value1;
                if (value1 && typeof value1.xAdvance === 'number' && value1.xAdvance !== 0) {
                  const kernValue = value1.xAdvance;
                  const secondGlyphsInClass = class2ToGlyphs[c2] || [];
                  if (secondGlyphsInClass.length === 0) continue;
                  
                  for (const g1 of firstGlyphsInClass) {
                    for (const g2 of secondGlyphsInClass) {
                      const pairKey = `${g1},${g2}`;
                      if (font.kerningPairs[pairKey] === undefined) {
                        font.kerningPairs[pairKey] = kernValue;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Calculates the checksum of a font table according to the OpenType specification
 */
function calculateTableChecksum(data: Uint8Array): number {
  let sum = 0;
  const len = data.length;
  const paddedLen = Math.ceil(len / 4) * 4;
  
  for (let i = 0; i < paddedLen; i += 4) {
    const b0 = i < len ? data[i] : 0;
    const b1 = i + 1 < len ? data[i + 1] : 0;
    const b2 = i + 2 < len ? data[i + 2] : 0;
    const b3 = i + 3 < len ? data[i + 3] : 0;
    
    const val = ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
    sum = (sum + val) >>> 0;
  }
  return sum;
}

/**
 * Collects and normalizes kerning pairs from font.kerningPairs,
 * grouped by left glyph index and sorted by right glyph index.
 */
function collectKerningPairs(font: any): Map<number, { right: number; value: number }[]> {
  const leftToPairs = new Map<number, { right: number; value: number }[]>();
  if (!font || !font.kerningPairs) return leftToPairs;

  for (const [key, val] of Object.entries(font.kerningPairs)) {
    if (typeof val !== 'number' || val === 0) continue;
    const parts = key.split(',');
    if (parts.length !== 2) continue;
    const left = parseInt(parts[0], 10);
    const right = parseInt(parts[1], 10);
    if (isNaN(left) || isNaN(right) || left <= 0 || right <= 0) continue;
    if (left > 0xFFFF || right > 0xFFFF) continue;

    const clamped = Math.max(-32768, Math.min(32767, Math.round(val)));
    if (!leftToPairs.has(left)) leftToPairs.set(left, []);
    leftToPairs.get(left)!.push({ right, value: clamped });
  }

  for (const list of leftToPairs.values()) {
    list.sort((a, b) => a.right - b.right);
  }
  return leftToPairs;
}

/**
 * Builds a binary legacy 'kern' table (format 0, version 0) from font.kerningPairs.
 *
 * IMPORTANT: both nPairs and subtableLength are uint16, so a single subtable cannot
 * hold more than ~10.900 pairs. A Vietnamese build routinely produces 20.000 - 80.000
 * pairs (class-based kerning expanded to individual pairs, then cloned onto 134 new
 * glyphs), which used to silently wrap around and corrupt the table.
 * The pairs are therefore split across several format 0 subtables.
 */
export function buildKernTable(font: any): Uint8Array {
  const leftToPairs = collectKerningPairs(font);

  const flat: { left: number; right: number; value: number }[] = [];
  for (const [left, list] of leftToPairs) {
    for (const p of list) flat.push({ left, right: p.right, value: p.value });
  }
  if (flat.length === 0) return new Uint8Array(0);

  // Sort by left glyph index, then right glyph index as mandated by the TrueType specification
  flat.sort((a, b) => (a.left !== b.left ? a.left - b.left : a.right - b.right));

  const MAX_PAIRS_PER_SUBTABLE = 10000; // 14 + 6 * 10000 = 60.014 < 65.536
  const groups: { left: number; right: number; value: number }[][] = [];
  for (let i = 0; i < flat.length; i += MAX_PAIRS_PER_SUBTABLE) {
    groups.push(flat.slice(i, i + MAX_PAIRS_PER_SUBTABLE));
  }

  const totalSize = 4 + groups.reduce((sum, g) => sum + 14 + 6 * g.length, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Main header
  view.setUint16(0, 0);              // version 0
  view.setUint16(2, groups.length);  // number of subtables

  let offset = 4;
  for (const group of groups) {
    const nPairs = group.length;
    const subtableSize = 14 + 6 * nPairs;

    // Subtable header
    view.setUint16(offset, 0);             // subtable version 0
    view.setUint16(offset + 2, subtableSize);
    view.setUint16(offset + 4, 1);         // coverage: horizontal, format 0

    // Format 0 search values
    const maxPowerOf2 = Math.pow(2, Math.floor(Math.log2(nPairs)));
    view.setUint16(offset + 6, nPairs);
    view.setUint16(offset + 8, maxPowerOf2 * 6);
    view.setUint16(offset + 10, Math.floor(Math.log2(maxPowerOf2)));
    view.setUint16(offset + 12, (nPairs - maxPowerOf2) * 6);

    // Pair records
    let q = offset + 14;
    for (const pair of group) {
      view.setUint16(q, pair.left);
      view.setUint16(q + 2, pair.right);
      view.setInt16(q + 4, pair.value);
      q += 6;
    }
    offset += subtableSize;
  }

  return new Uint8Array(buffer);
}

// Every offset inside a PairPos subtable is a uint16, so one subtable must stay
// below 65.536 bytes. Keep a safety margin.
const MAX_PAIRPOS_SUBTABLE_BYTES = 60000;

/**
 * Splits left glyphs into groups so that each PairPos subtable stays under 64 KB.
 */
function chunkLeftGlyphs(leftToPairs: Map<number, { right: number; value: number }[]>): number[][] {
  const sortedLeft = Array.from(leftToPairs.keys()).sort((a, b) => a - b);
  const chunks: number[][] = [];
  let current: number[] = [];
  let currentBytes = 14; // 10 bytes subtable header + 4 bytes coverage header

  for (const g of sortedLeft) {
    const pairs = leftToPairs.get(g)!;
    // 2 (pairSetOffset) + 2 (coverage glyph) + 2 (pairValueCount) + 4 per pair
    const cost = 6 + 4 * pairs.length;
    if (current.length > 0 && currentBytes + cost > MAX_PAIRPOS_SUBTABLE_BYTES) {
      chunks.push(current);
      current = [];
      currentBytes = 14;
    }
    current.push(g);
    currentBytes += cost;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * Serializes one PairPos Format 1 subtable for the given left glyphs.
 */
function buildPairPosSubtable(
  leftGlyphs: number[],
  leftToPairs: Map<number, { right: number; value: number }[]>
): Uint8Array {
  const numLeft = leftGlyphs.length;
  let totalPairSetBytes = 0;
  for (const g of leftGlyphs) totalPairSetBytes += 2 + 4 * leftToPairs.get(g)!.length;

  const size = (10 + 2 * numLeft) + (4 + 2 * numLeft) + totalPairSetBytes;
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);

  view.setUint16(0, 1);                // posFormat = 1
  view.setUint16(2, 10 + 2 * numLeft); // coverageOffset
  view.setUint16(4, 0x0004);           // valueFormat1 = XAdvance
  view.setUint16(6, 0x0000);           // valueFormat2 = 0
  view.setUint16(8, numLeft);          // pairSetCount

  let o = 10;
  const pairSetOffsetsAt = o;
  o += 2 * numLeft;

  // Coverage table (format 1)
  view.setUint16(o, 1);
  view.setUint16(o + 2, numLeft);
  o += 4;
  for (let i = 0; i < numLeft; i++) {
    view.setUint16(o, leftGlyphs[i]);
    o += 2;
  }

  // PairSet tables
  for (let i = 0; i < numLeft; i++) {
    const pairs = leftToPairs.get(leftGlyphs[i])!;
    if (o > 0xFFFF) {
      throw new Error('PairPos subtable exceeded 64KB - chunking logic is broken');
    }
    view.setUint16(pairSetOffsetsAt + 2 * i, o);
    view.setUint16(o, pairs.length);
    o += 2;
    for (const pair of pairs) {
      view.setUint16(o, pair.right);
      view.setInt16(o + 2, pair.value);
      o += 4;
    }
  }

  return new Uint8Array(buffer);
}

/**
 * Builds a binary OpenType GPOS table (Pair Adjustment) from font.kerningPairs.
 * Modern browsers (Chrome/Blink/HarfBuzz, Firefox, Safari) require a GPOS table with
 * 'kern' feature enabled to apply CSS kerning (font-kerning: normal / font-feature-settings: "kern" 1).
 *
 * IMPORTANT: a PairPos subtable addresses its internal content with uint16 offsets, so it cannot
 * exceed 64 KB. Vietnamese builds regularly produce 100 KB - 400 KB of kerning data, which
 * used to wrap around silently and produce a corrupt GPOS table (the font still installed in
 * Windows, but opentype.js refused to re-open it).
 * The pairs are therefore split into several PairPos subtables, each wrapped in a
 * lookup type 9 (Extension Positioning) whose offset is 32-bit.
 */
export function buildGPOSTable(font: any): Uint8Array {
  const leftToPairs = collectKerningPairs(font);
  if (leftToPairs.size === 0) return new Uint8Array(0);

  const chunks = chunkLeftGlyphs(leftToPairs);
  const subtables = chunks.map(c => buildPairPosSubtable(c, leftToPairs));
  const numLookups = subtables.length;

  // Layout:
  //   GPOS Header      : 10 bytes
  //   ScriptList       : offset 10, 38 bytes (DFLT + latn) -> 10..47
  //   FeatureList      : offset 48, 2 + 6 + (6 + 2 * numLookups) bytes
  //   LookupList       : 2 + 2 * numLookups + 16 * numLookups bytes
  //                      (each Lookup is 8 bytes + an 8 byte ExtensionPos subtable)
  //   PairPos subtables: appended at the end, addressed with 32-bit extension offsets
  const scriptListOffset = 10;
  const featureListOffset = 48;
  const featureListSize = 2 + 6 + (6 + 2 * numLookups);
  const lookupListOffset = featureListOffset + featureListSize;
  const lookupListSize = 2 + 2 * numLookups + numLookups * 16;

  const subtableOffsets: number[] = [];
  let totalSize = lookupListOffset + lookupListSize;
  for (const st of subtables) {
    totalSize = Math.ceil(totalSize / 2) * 2; // keep 16-bit alignment
    subtableOffsets.push(totalSize);
    totalSize += st.length;
  }

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const writeTag = (off: number, tag: string) => {
    for (let i = 0; i < 4; i++) view.setUint8(off + i, tag.charCodeAt(i));
  };

  // --- 1. GPOS Header ---
  view.setUint16(0, 1); // majorVersion
  view.setUint16(2, 0); // minorVersion
  view.setUint16(4, scriptListOffset);
  view.setUint16(6, featureListOffset);
  view.setUint16(8, lookupListOffset);

  // --- 2. ScriptList (DFLT + latn) ---
  let o = scriptListOffset;
  view.setUint16(o, 2); o += 2;          // scriptCount
  writeTag(o, 'DFLT'); view.setUint16(o + 4, 14); o += 6;
  writeTag(o, 'latn'); view.setUint16(o + 4, 26); o += 6;
  // DFLT Script Table + LangSys
  view.setUint16(o, 4); view.setUint16(o + 2, 0); o += 4;
  view.setUint16(o, 0); view.setUint16(o + 2, 0xFFFF);
  view.setUint16(o + 4, 1); view.setUint16(o + 6, 0); o += 8;
  // latn Script Table + LangSys
  view.setUint16(o, 4); view.setUint16(o + 2, 0); o += 4;
  view.setUint16(o, 0); view.setUint16(o + 2, 0xFFFF);
  view.setUint16(o + 4, 1); view.setUint16(o + 6, 0); o += 8;

  // --- 3. FeatureList: a single 'kern' feature referencing every lookup ---
  o = featureListOffset;
  view.setUint16(o, 1); o += 2;          // featureCount
  writeTag(o, 'kern'); view.setUint16(o + 4, 8); o += 6;
  view.setUint16(o, 0);                  // featureParamsOffset
  view.setUint16(o + 2, numLookups);     // lookupIndexCount
  o += 4;
  for (let i = 0; i < numLookups; i++) {
    view.setUint16(o, i);
    o += 2;
  }

  // --- 4. LookupList: each lookup is type 9 (Extension) wrapping a type 2 PairPos ---
  view.setUint16(lookupListOffset, numLookups);
  const lookupBase = lookupListOffset + 2 + 2 * numLookups;
  for (let i = 0; i < numLookups; i++) {
    const lookupOffset = lookupBase + i * 16;
    view.setUint16(lookupListOffset + 2 + 2 * i, lookupOffset - lookupListOffset);

    view.setUint16(lookupOffset, 9);     // lookupType = Extension Positioning
    view.setUint16(lookupOffset + 2, 0); // lookupFlag
    view.setUint16(lookupOffset + 4, 1); // subTableCount
    view.setUint16(lookupOffset + 6, 8); // subTableOffset

    const ext = lookupOffset + 8;
    view.setUint16(ext, 1);              // posFormat = 1
    view.setUint16(ext + 2, 2);          // extensionLookupType = 2 (Pair Adjustment)
    view.setUint32(ext + 4, subtableOffsets[i] - ext); // 32-bit offset, cannot overflow
  }

  // --- 5. PairPos subtables ---
  for (let i = 0; i < numLookups; i++) {
    bytes.set(subtables[i], subtableOffsets[i]);
  }

  return new Uint8Array(buffer);
}

/**
 * Rebuilds an sfnt buffer without the given tables.
 */
function stripFontTables(buffer: ArrayBuffer, drop: string[]): ArrayBuffer {
  if (!buffer || buffer.byteLength < 12) return buffer;
  const view = new DataView(buffer);
  const numTables = view.getUint16(4);
  const entries: { tag: string; data: Uint8Array }[] = [];

  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    if (o + 16 > buffer.byteLength) break;
    const tag = String.fromCharCode(
      view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3)
    );
    if (drop.includes(tag)) continue;
    const start = view.getUint32(o + 8);
    const length = view.getUint32(o + 12);
    if (start >= buffer.byteLength) continue;
    const end = Math.min(buffer.byteLength, start + length);
    entries.push({ tag, data: new Uint8Array(buffer.slice(start, end)) });
  }

  entries.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const n = entries.length;

  let maxPowerOf2 = 1;
  while (maxPowerOf2 * 2 <= n) maxPowerOf2 *= 2;

  let offset = 12 + n * 16;
  const offsets = entries.map(e => {
    const start = offset;
    offset += Math.ceil(e.data.length / 4) * 4;
    return start;
  });

  const output = new ArrayBuffer(offset);
  const outView = new DataView(output);
  const outBytes = new Uint8Array(output);

  outView.setUint32(0, view.getUint32(0));
  outView.setUint16(4, n);
  outView.setUint16(6, maxPowerOf2 * 16);
  outView.setUint16(8, Math.log2(maxPowerOf2));
  outView.setUint16(10, n * 16 - maxPowerOf2 * 16);

  entries.forEach((e, i) => {
    const rec = 12 + i * 16;
    for (let j = 0; j < 4; j++) outView.setUint8(rec + j, e.tag.charCodeAt(j));
    outView.setUint32(rec + 4, 0);
    outView.setUint32(rec + 8, offsets[i]);
    outView.setUint32(rec + 12, e.data.length);
    outBytes.set(e.data, offsets[i]);
  });

  return output;
}

/**
 * Parses a font, tolerating broken advanced layout tables.
 * Fonts exported by older builds of this app carry a corrupt GPOS table and make
 * opentype.parse() throw; dropping the layout tables lets them be re-opened.
 * Returns degraded = true when the fallback path was used.
 */
export function parseFontResilient(buffer: ArrayBuffer): { font: opentype.Font; degraded: boolean } {
  try {
    return { font: opentype.parse(buffer.slice(0)), degraded: false };
  } catch (err) {
    const cleaned = stripFontTables(buffer, ['GPOS', 'GSUB', 'GDEF', 'BASE', 'kern']);
    return { font: opentype.parse(cleaned), degraded: true };
  }
}

/**
 * Merges advanced OpenType layout tables (GPOS, GSUB, GDEF, BASE) from the original font 
 * into the compiled font buffer to guarantee pristine original kerning and substitution features.
 * Also injects custom GPOS and kern tables for full cross-browser kerning compatibility.
 */
export function injectAdvancedLayoutTables(
  compiledBuffer: ArrayBuffer, 
  originalBuffer: ArrayBuffer, 
  skipGPOS: boolean = false,
  kernTableBytes?: Uint8Array,
  gposTableBytes?: Uint8Array
): ArrayBuffer {
  try {
    const parseTables = (buf: ArrayBuffer) => {
      if (!buf || buf.byteLength < 12) {
        return { sfntVersion: 0x00010000, tables: {} };
      }
      const view = new DataView(buf);
      const sfntVersion = view.getUint32(0);
      const numTables = view.getUint16(4);
      
      const tables: Record<string, Uint8Array> = {};
      let offset = 12;
      for (let i = 0; i < numTables; i++) {
        if (offset + 16 > buf.byteLength) break;
        const tagBytes = [
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        ];
        const tag = String.fromCharCode(...tagBytes);
        const tableOffset = view.getUint32(offset + 8);
        const length = view.getUint32(offset + 12);
        
        if (tableOffset < buf.byteLength) {
          const end = Math.min(buf.byteLength, tableOffset + length);
          const data = new Uint8Array(buf.slice(tableOffset, end));
          tables[tag] = data;
        }
        
        offset += 16;
      }
      return { sfntVersion, tables };
    };

    const original = parseTables(originalBuffer);
    const compiled = parseTables(compiledBuffer);

    let injectedAny = false;

    // Inject/overwrite custom GPOS table if provided
    if (gposTableBytes && gposTableBytes.length > 0) {
      compiled.tables['GPOS'] = gposTableBytes;
      injectedAny = true;
    } else if (skipGPOS && compiled.tables['GPOS']) {
      delete compiled.tables['GPOS'];
      injectedAny = true;
    }

    // Inject/overwrite the custom legacy kern table if provided
    if (kernTableBytes && kernTableBytes.length > 0) {
      compiled.tables['kern'] = kernTableBytes;
      injectedAny = true;
    }

    const tagsToInject = ['GSUB', 'GDEF', 'BASE'];
    if (!gposTableBytes && !skipGPOS) {
      tagsToInject.push('GPOS');
    }

    tagsToInject.forEach(tag => {
      if (original.tables[tag] && !compiled.tables[tag]) {
        compiled.tables[tag] = original.tables[tag];
        injectedAny = true;
      }
    });

    if (!injectedAny) {
      return compiledBuffer;
    }

    const tableTags = Object.keys(compiled.tables).sort();
    const numTables = tableTags.length;

    let maxPowerOf2 = 1;
    while (maxPowerOf2 * 2 <= numTables) {
      maxPowerOf2 *= 2;
    }
    const searchRange = maxPowerOf2 * 16;
    const entrySelector = Math.log2(maxPowerOf2);
    const rangeShift = numTables * 16 - searchRange;

    const directoryOffset = 12;
    const firstTableOffset = directoryOffset + numTables * 16;

    let currentOffset = firstTableOffset;
    const offsets: Record<string, number> = {};
    const paddedLengths: Record<string, number> = {};

    tableTags.forEach(tag => {
      offsets[tag] = currentOffset;
      const data = compiled.tables[tag];
      const length = data.length;
      const paddedLength = Math.ceil(length / 4) * 4;
      paddedLengths[tag] = paddedLength;
      currentOffset += paddedLength;
    });

    const outputBuffer = new ArrayBuffer(currentOffset);
    const outputView = new DataView(outputBuffer);
    const outputBytes = new Uint8Array(outputBuffer);

    outputView.setUint32(0, compiled.sfntVersion);
    outputView.setUint16(4, numTables);
    outputView.setUint16(6, searchRange);
    outputView.setUint16(8, entrySelector);
    outputView.setUint16(10, rangeShift);

    let recOffset = directoryOffset;
    tableTags.forEach(tag => {
      const data = compiled.tables[tag];
      const offset = offsets[tag];
      const length = data.length;
      const checksum = calculateTableChecksum(data);

      for (let j = 0; j < 4; j++) {
        outputView.setUint8(recOffset + j, tag.charCodeAt(j));
      }
      outputView.setUint32(recOffset + 4, checksum);
      outputView.setUint32(recOffset + 8, offset);
      outputView.setUint32(recOffset + 12, length);

      outputBytes.set(data, offset);
      const paddedLength = paddedLengths[tag];
      for (let p = length; p < paddedLength; p++) {
        outputBytes[offset + p] = 0;
      }

      recOffset += 16;
    });

    const headData = compiled.tables['head'];
    if (headData) {
      const headOffset = offsets['head'];
      if (headOffset + 12 <= outputBuffer.byteLength) {
        outputView.setUint32(headOffset + 8, 0);
      }

      const fileChecksum = calculateTableChecksum(new Uint8Array(outputBuffer));
      const checksumAdjustment = (0xB1B0AFBA - fileChecksum) >>> 0;

      if (headOffset + 12 <= outputBuffer.byteLength) {
        outputView.setUint32(headOffset + 8, checksumAdjustment);
      }
    }

    return outputBuffer;
  } catch (err) {
    console.error('Failed to inject advanced layout tables:', err);
    return compiledBuffer;
  }
}

// ============================================================================
// VERSION 2.0 AUTOMATED COMPOSITION ENGINE UTILITIES
// ============================================================================

import { DiacriticTemplate, AutoPositionRules, GlyphOverrideState } from './types';

// Default professional vector shapes for 9 Vietnamese diacritics
export const DEFAULT_DIACRITICS: DiacriticTemplate[] = [
  {
    id: 'acute',
    name: 'Dấu sắc (Acute)',
    svgPath: 'M 54.36,0.00 L 63.56,30.09 L -56.78,66.92 L -63.56,44.77 L 54.36,0.00 Z',
    scaleX: 1.1,
    scaleY: 1.1,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'grave',
    name: 'Dấu huyền (Grave)',
    svgPath: 'M -54.35,0.00 L -63.56,30.09 L 56.78,66.92 L 63.56,44.77 L -54.35,0.00 Z',
    scaleX: 1.1,
    scaleY: 1.1,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'hook',
    name: 'Dấu hỏi (Hook above)',
    svgPath: 'M -15.46,85.51 L -15.46,73.99 C -15.46,67.12 -13.34,61.66 -9.09,57.62 C -4.84,53.58 -0.60,49.74 3.65,46.10 C 7.90,42.46 10.02,38.22 10.02,33.36 C 10.02,25.68 3.55,21.84 -9.38,21.84 C -13.83,21.84 -18.08,22.45 -22.12,23.66 C -26.17,24.87 -30.21,26.69 -34.25,29.12 L -41.54,10.31 C -35.88,6.67 -29.52,4.05 -22.44,2.43 C -15.37,0.82 -7.79,0.00 0.30,0.00 C 13.24,0.00 23.35,2.53 30.62,7.58 C 37.90,12.64 41.54,20.22 41.54,30.32 C 41.54,37.20 39.92,42.75 36.69,47.00 C 33.45,51.25 29.81,54.69 25.77,57.31 C 21.73,59.94 18.09,62.87 14.86,66.10 C 11.62,69.34 10.01,73.78 10.01,79.44 L 10.01,85.50 L -15.46,85.50 Z',
    scaleX: 1.35,
    scaleY: 1.35,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'tilde',
    name: 'Dấu ngã (Tilde)',
    svgPath: 'M 31.12,49.11 C 23.12,49.11 15.42,47.11 7.99,43.11 C 0.57,39.12 -6.48,35.22 -13.14,31.40 C -19.80,27.60 -26.37,25.69 -32.84,25.69 C -38.94,25.69 -43.98,27.69 -47.97,31.69 C -51.96,35.69 -54.35,41.49 -55.11,49.11 L -74.52,49.11 C -73.38,33.12 -69.01,20.94 -61.39,12.56 C -53.78,4.19 -43.88,0.00 -31.69,0.00 C -23.32,0.00 -15.51,2.00 -8.28,5.99 C -1.05,9.99 6.00,13.98 12.84,17.98 C 19.69,21.98 26.36,23.98 32.83,23.98 C 38.54,23.98 43.39,21.89 47.39,17.70 C 51.38,13.52 53.77,7.62 54.53,0.00 L 74.52,0.00 C 73.39,15.99 69.00,28.18 61.39,36.54 C 53.77,44.92 43.69,49.10 31.13,49.10 Z',
    scaleX: 1.1,
    scaleY: 1.1,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'dot_below',
    name: 'Dấu nặng (Dot below)',
    svgPath: 'M 23.53,21.69 C 22.63,10.25 13.36,0.98 1.92,0.08 C -12.63,-1.07 -24.68,10.98 -23.54,25.53 C -22.63,36.97 -13.36,46.25 -1.91,47.15 C 12.64,48.30 24.68,36.25 23.54,21.70 Z',
    scaleX: 1.3,
    scaleY: 1.3,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'circumflex',
    name: 'Dấu mũ (Circumflex â/ê/ô)',
    svgPath: 'M 16.70,0.00 L -16.70,0.00 L -50.99,59.85 L -31.84,59.85 L -0.22,29.93 L 31.40,59.85 L 50.99,59.85 L 16.70,0.00 Z',
    scaleX: 1.1,
    scaleY: 1.1,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'breve',
    name: 'Dấu trăng (Breve ă)',
    svgPath: 'M 44.31,0.00 C 36.44,50.64 -35.81,50.61 -43.59,0.00 L -59.27,0.00 C -58.71,35.53 -36.86,60.43 0.08,59.85 C 37.32,60.44 59.53,35.89 59.43,0.00 L 44.31,0.00 Z',
    scaleX: 1.25,
    scaleY: 1.25,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'horn_o',
    name: 'Dấu móc chữ ơ (Horn for ơ)',
    svgPath: 'M 21.36,12.25 C 19.27,8.47 16.38,5.48 12.70,3.29 C 9.02,1.10 4.78,-0.00 0.00,-0.00 C -4.77,-0.00 -8.71,1.04 -12.40,3.14 C -16.09,5.23 -19.02,8.07 -21.21,11.65 C -23.40,15.24 -24.50,19.32 -24.50,23.90 C -24.50,28.48 -23.41,32.32 -21.21,36.00 C -19.02,39.69 -16.09,42.62 -12.40,44.81 C -11.00,45.64 -9.54,46.31 -8.02,46.83 L -19.84,87.53 L -5.38,87.53 L 11.05,59.45 C 16.03,51.28 19.51,44.66 21.51,39.58 C 23.50,34.50 24.50,29.67 24.50,25.09 C 24.50,20.51 23.46,16.03 21.36,12.24 Z',
    scaleX: 1.1,
    scaleY: 1.1,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'horn_u',
    name: 'Dấu móc chữ ư (Horn for ư)',
    svgPath: 'M 21.36,12.25 C 19.27,8.47 16.38,5.48 12.70,3.29 C 9.02,1.10 4.78,-0.00 0.00,-0.00 C -4.77,-0.00 -8.71,1.04 -12.40,3.14 C -16.09,5.23 -19.02,8.07 -21.21,11.65 C -23.40,15.24 -24.50,19.32 -24.50,23.90 C -24.50,28.48 -23.41,32.32 -21.21,36.00 C -19.02,39.69 -16.09,42.62 -12.40,44.81 C -11.00,45.64 -9.54,46.31 -8.02,46.83 L -19.84,87.53 L -5.38,87.53 L 11.05,59.45 C 16.03,51.28 19.51,44.66 21.51,39.58 C 23.50,34.50 24.50,29.67 24.50,25.09 C 24.50,20.51 23.46,16.03 21.36,12.24 Z',
    scaleX: 1.1,
    scaleY: 1.1,
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'bar',
    name: 'Gạch chữ đ/Đ (Stroke/Bar)',
    svgPath: 'M -80,30 L 80,30 L 80,60 L -80,60 Z',
    scaleX: 1.0,
    scaleY: 1.0,
    offsetX: 0,
    offsetY: 0
  }
];

export const DEFAULT_AUTO_RULES: AutoPositionRules = {
  useGroupHeightAlignment: true,
  lowercaseAccentGap: 35,
  uppercaseAccentGap: 50,
  lowercaseAccentScale: 1.0,
  uppercaseAccentScale: 1.25,
  dotBelowGap: 60,
  dotBelowScale: 1.0,
  hornScale: 1.0,
  hornOffsetX: 0,
  hornOffsetY: 0,
  barScale: 1.1,
  barOffsetX: 0,
  barOffsetY: 0,
  doubleAccentStyle: 'stacked',
  doubleAccentGap: 20,
  doubleAccentCustomX: 0,
  doubleAccentCustomY: 0,
  doubleAccentCapCustomEnabled: false,
  doubleAccentCapCustomX: 0,
  doubleAccentCapCustomY: 20,
  doubleAccentCapCompressY: 100
};

export interface ComponentRecipe {
  char: string;
  baseChar: string;
  components: string[]; // Diacritic template IDs, e.g., ['circumflex', 'acute']
}

export const VIETNAMESE_RECIPES: ComponentRecipe[] = [];

// Helper variables to auto-generate the complete recipe map
const TONE_MARKS = ['grave', 'acute', 'hook', 'tilde', 'dot_below'];

// 1. Simple single-accent vowels
const singleToneGroup = [
  { base: 'a', chars: ['à', 'á', 'ả', 'ã', 'ạ'] },
  { base: 'A', chars: ['À', 'Á', 'Ả', 'Ã', 'Ạ'] },
  { base: 'e', chars: ['è', 'é', 'ẻ', 'ẽ', 'ẹ'] },
  { base: 'E', chars: ['È', 'É', 'Ẻ', 'Ẽ', 'Ẹ'] },
  { base: 'i', chars: ['ì', 'í', 'ỉ', 'ĩ', 'ị'] },
  { base: 'I', chars: ['Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị'] },
  { base: 'o', chars: ['ò', 'ó', 'ỏ', 'õ', 'ọ'] },
  { base: 'O', chars: ['Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ'] },
  { base: 'u', chars: ['ù', 'ú', 'ủ', 'ũ', 'ụ'] },
  { base: 'U', chars: ['Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ'] },
  { base: 'y', chars: ['ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'] },
  { base: 'Y', chars: ['Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ'] }
];

singleToneGroup.forEach(({ base, chars }) => {
  chars.forEach((char, idx) => {
    VIETNAMESE_RECIPES.push({
      char,
      baseChar: base,
      components: [TONE_MARKS[idx]]
    });
  });
});

// 2. Simple circumflex / breve vowels
const baseWithAccent = [
  { char: 'ă', base: 'a', comp: 'breve' },
  { char: 'Ă', base: 'A', comp: 'breve' },
  { char: 'â', base: 'a', comp: 'circumflex' },
  { char: 'Â', base: 'A', comp: 'circumflex' },
  { char: 'ê', base: 'e', comp: 'circumflex' },
  { char: 'Ê', base: 'E', comp: 'circumflex' },
  { char: 'ô', base: 'o', comp: 'circumflex' },
  { char: 'Ô', base: 'O', comp: 'circumflex' },
  { char: 'ơ', base: 'o', comp: 'horn_o' },
  { char: 'Ơ', base: 'O', comp: 'horn_o' },
  { char: 'ư', base: 'u', comp: 'horn_u' },
  { char: 'Ư', base: 'U', comp: 'horn_u' },
  { char: 'đ', base: 'd', comp: 'bar' },
  { char: 'Đ', base: 'D', comp: 'bar' }
];

baseWithAccent.forEach(({ char, base, comp }) => {
  VIETNAMESE_RECIPES.push({
    char,
    baseChar: base,
    components: [comp]
  });
});

// 3. Double-accent combinations (circumflex/breve/horn + tone mark)
const doubleAccentGroup = [
  { base: 'a', comp: 'breve', chars: ['ằ', 'ắ', 'ẳ', 'ẵ', 'ặ'] },
  { base: 'A', comp: 'breve', chars: ['Ằ', 'Ắ', 'Ẳ', 'Ẵ', 'Ặ'] },
  { base: 'a', comp: 'circumflex', chars: ['ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'] },
  { base: 'A', comp: 'circumflex', chars: ['Ầ', 'Ấ', 'Ẩ', 'Ẫ', 'Ậ'] },
  { base: 'e', comp: 'circumflex', chars: ['ề', 'ế', 'ể', 'ễ', 'ệ'] },
  { base: 'E', comp: 'circumflex', chars: ['Ề', 'Ế', 'Ể', 'Ễ', 'Ệ'] },
  { base: 'o', comp: 'circumflex', chars: ['ồ', 'ố', 'ổ', 'ỗ', 'ộ'] },
  { base: 'O', comp: 'circumflex', chars: ['Ồ', 'Ố', 'Ổ', 'Ỗ', 'Ộ'] },
  { base: 'o', comp: 'horn_o', chars: ['ờ', 'ớ', 'ở', 'ỡ', 'ợ'] },
  { base: 'O', comp: 'horn_o', chars: ['Ờ', 'Ớ', 'Ở', 'Ỡ', 'Ợ'] },
  { base: 'u', comp: 'horn_u', chars: ['ừ', 'ứ', 'ử', 'ữ', 'ự'] },
  { base: 'U', comp: 'horn_u', chars: ['Ừ', 'Ứ', 'Ử', 'Ữ', 'Ự'] }
];

doubleAccentGroup.forEach(({ base, comp, chars }) => {
  chars.forEach((char, idx) => {
    VIETNAMESE_RECIPES.push({
      char,
      baseChar: base,
      components: [comp, TONE_MARKS[idx]]
    });
  });
});

export const BASE_CHAR_RECIPES: ComponentRecipe[] = [
  { char: 'a', baseChar: 'a', components: [] },
  { char: 'A', baseChar: 'A', components: [] },
  { char: 'e', baseChar: 'e', components: [] },
  { char: 'E', baseChar: 'E', components: [] },
  { char: 'o', baseChar: 'o', components: [] },
  { char: 'O', baseChar: 'O', components: [] },
  { char: 'u', baseChar: 'u', components: [] },
  { char: 'U', baseChar: 'U', components: [] },
  { char: 'i', baseChar: 'i', components: [] },
  { char: 'I', baseChar: 'I', components: [] },
  { char: 'y', baseChar: 'y', components: [] },
  { char: 'Y', baseChar: 'Y', components: [] },
  { char: 'd', baseChar: 'd', components: [] },
  { char: 'D', baseChar: 'D', components: [] }
];

export const STEP2_RECIPES: ComponentRecipe[] = [
  ...BASE_CHAR_RECIPES,
  ...VIETNAMESE_RECIPES
];

/**
 * Calculates standard group reference heights (x-height max and cap-height max)
 * across plain Vietnamese base vowels (a, e, o, u, y, i vs A, E, O, U, Y, I).
 * This ensures diacritics sit at 100% consistent Y-levels across character groups.
 */
export function getXHeightFromFont(font: any): number {
  if (!font) return 500;

  const measured: number[] = [];
  for (const ch of ['x', 'a', 'e', 'o', 'u']) {
    try {
      const idx = font.charToGlyphIndex(ch);
      if (idx > 0) {
        const box = font.glyphs.get(idx)?.getBoundingBox();
        if (box && box.y2 > 100) measured.push(box.y2);
      }
    } catch {
      // ignore individual glyph failures
    }
  }

  if (measured.length > 0) {
    measured.sort((a, b) => a - b);
    return measured[Math.floor(measured.length / 2)];
  }

  // NOTE: the OS/2 field is sxHeight. There is no sTypoXHeight - reading that name
  // returned undefined for every font and silently fell through to a hardcoded 500.
  const sxHeight = font.tables?.os2?.sxHeight;
  if (typeof sxHeight === 'number' && sxHeight > 100) return sxHeight;

  return Math.round((font.unitsPerEm || 1000) * 0.5);
}

export function getGroupReferenceHeights(font: opentype.Font | null): { xHeightMax: number; capHeightMax: number } {
  if (!font) return { xHeightMax: 500, capHeightMax: 700 };

  // Use flat lowercase vowels/letters without ascenders or dots
  const lowercaseFlatVowels = ['x', 'a', 'e', 'o', 'u'];
  const uppercaseFlatVowels = ['X', 'A', 'E', 'O', 'U', 'H'];

  let measuredXHeights: number[] = [];
  lowercaseFlatVowels.forEach(ch => {
    const gIndex = font.charToGlyphIndex(ch);
    if (gIndex > 0) {
      const g = font.glyphs.get(gIndex);
      if (g) {
        const bbox = g.getBoundingBox();
        if (bbox && bbox.y2 > 100) {
          measuredXHeights.push(bbox.y2);
        }
      }
    }
  });

  let measuredCapHeights: number[] = [];
  uppercaseFlatVowels.forEach(ch => {
    const gIndex = font.charToGlyphIndex(ch);
    if (gIndex > 0) {
      const g = font.glyphs.get(gIndex);
      if (g) {
        const bbox = g.getBoundingBox();
        if (bbox && bbox.y2 > 200) {
          measuredCapHeights.push(bbox.y2);
        }
      }
    }
  });

  let xHeightMax = 0;
  if (measuredXHeights.length > 0) {
    xHeightMax = Math.max(...measuredXHeights);
  } else if (font.tables.os2 && font.tables.os2.sxHeight && font.tables.os2.sxHeight > 200) {
    xHeightMax = font.tables.os2.sxHeight;
  } else {
    xHeightMax = 500;
  }

  let capHeightMax = 0;
  if (measuredCapHeights.length > 0) {
    capHeightMax = Math.max(...measuredCapHeights);
  } else if (font.tables.os2 && font.tables.os2.sCapHeight && font.tables.os2.sCapHeight > 300) {
    capHeightMax = font.tables.os2.sCapHeight;
  } else {
    capHeightMax = font.ascender || 700;
  }

  return { xHeightMax, capHeightMax };
}

/**
 * Calculates the exact translation scaling and offsets required to automatically align a diacritic on top/bottom of a base glyph.
 * Uses bounding boxes and Group Reference Heights for highly professional type design results.
 */
export function calculateAutoPosition(
  diaId: string,
  baseBBox: { x1: number; y1: number; x2: number; y2: number },
  diaBBox: { xMin: number; yMin: number; xMax: number; yMax: number },
  rules: AutoPositionRules,
  isCapital: boolean,
  previousPlacedBox?: { xMin: number; yMin: number; xMax: number; yMax: number },
  groupReferenceHeights?: { xHeightMax: number; capHeightMax: number },
  baseChar?: string
): { scaleX: number; scaleY: number; offsetX: number; offsetY: number } {
  let baseXCenter = (baseBBox.x1 + baseBBox.x2) / 2;

  // Optical X centering ONLY for lowercase 'y' (ỵ)
  // Lowercase 'y' has an asymmetric diagonal descender, whereas uppercase 'Y' (Ỵ) is horizontally symmetrical along X.
  const isLowercaseY = baseChar ? baseChar === 'y' : (!isCapital && baseChar === undefined);
  if (isLowercaseY) {
    // For lowercase 'y', the bottom descender stem/vertex is shifted slightly right (~58% of bounding box width)
    baseXCenter = baseBBox.x1 + (baseBBox.x2 - baseBBox.x1) * 0.58;
  }

  // Group Height Baseline Alignment eliminates vertical "bouncing" across á, é, ó, í, ý
  // by anchoring diacritics to a unified Group Reference Height (x-Height for lowercase, Cap-Height for uppercase).
  let baseYTop = baseBBox.y2;
  if (rules.useGroupHeightAlignment !== false && !previousPlacedBox && groupReferenceHeights) {
    if (isCapital && groupReferenceHeights.capHeightMax > 0) {
      baseYTop = groupReferenceHeights.capHeightMax;
    } else if (!isCapital && groupReferenceHeights.xHeightMax > 0) {
      baseYTop = groupReferenceHeights.xHeightMax;
    }
  }

  let baseYBottom = baseBBox.y1;
  // For standard non-descender vowels (a, e, o, u, i), anchor bottom to y = 0 for 100% consistent dot_below baseline
  if (rules.useGroupHeightAlignment !== false && !previousPlacedBox) {
    if (baseBBox.y1 > -50) {
      baseYBottom = 0;
    }
  }
  
  const diaWidth = diaBBox.xMax - diaBBox.xMin;
  const diaHeight = diaBBox.yMax - diaBBox.yMin;
  const diaXCenter = (diaBBox.xMin + diaBBox.xMax) / 2;

  let scale = isCapital ? rules.uppercaseAccentScale : rules.lowercaseAccentScale;
  let scaleX = scale;
  let scaleY = scale;
  
  let offsetX = 0;
  let offsetY = 0;

  if (diaId === 'dot_below') {
    scaleX = rules.dotBelowScale;
    scaleY = rules.dotBelowScale;
    offsetX = baseXCenter - (diaXCenter * scaleX);
    // Position below the baseline/bottom of letter
    offsetY = baseYBottom - (diaBBox.yMax * scaleY) - rules.dotBelowGap;
  } else if (diaId === 'horn' || diaId === 'horn_o' || diaId === 'horn_u') {
    scaleX = rules.hornScale;
    scaleY = rules.hornScale;
    // Align horn to upper right of vowel
    offsetX = baseBBox.x2 - (diaBBox.xMin * scaleX) - 10 + rules.hornOffsetX;
    offsetY = baseYTop - (diaBBox.yMax * scaleY) - 15 + rules.hornOffsetY;
  } else if (diaId === 'bar') {
    scaleX = rules.barScale;
    scaleY = rules.barScale;
    // Strike bar through d or Đ
    if (isCapital) {
      // In uppercase D, the vertical stem is located on the left side (near baseBBox.x1).
      // Calculate the center of the left vertical stem so the bar crosses it symmetrically.
      const stemWidth = Math.max(45, (baseBBox.x2 - baseBBox.x1) * 0.17);
      const stemCenterD = baseBBox.x1 + stemWidth * 0.85;
      offsetX = stemCenterD - (diaXCenter * scaleX) + rules.barOffsetX;
      offsetY = baseBBox.y1 + (baseBBox.y2 - baseBBox.y1) * 0.56 - (diaBBox.yMin * scaleY) + rules.barOffsetY;
    } else {
      offsetX = baseBBox.x2 - (diaBBox.xMin * scaleX) - 80 + rules.barOffsetX;
      offsetY = baseBBox.y2 - 130 + rules.barOffsetY;
    }
  } else {
    // Normal top marks: acute, grave, hook, tilde, circumflex, breve
    offsetX = baseXCenter - (diaXCenter * scaleX);

    if (previousPlacedBox) {
      // Placing on top of another diacritic (Stacked vs Side-by-side vs Custom)
      const isCapCustom = isCapital && !!rules.doubleAccentCapCustomEnabled;
      const customX = isCapCustom && rules.doubleAccentCapCustomX !== undefined
        ? rules.doubleAccentCapCustomX
        : (rules.doubleAccentCustomX ?? 0);
      const customY = isCapCustom && rules.doubleAccentCapCustomY !== undefined
        ? 0
        : (rules.doubleAccentCustomY ?? 0);
      const baseGap = isCapCustom && rules.doubleAccentCapCustomY !== undefined
        ? rules.doubleAccentCapCustomY
        : rules.doubleAccentGap;

      const isCapCompress = isCapital && (rules.doubleAccentCapCompressY ?? 100) < 100;
      const compressRatio = isCapCompress
        ? Math.max(0.1, Math.min(1.0, (rules.doubleAccentCapCompressY ?? 100) / 100))
        : 1.0;
      const gap = baseGap * compressRatio;

      if (rules.doubleAccentStyle === 'stacked') {
        const targetTopY = previousPlacedBox.yMax;
        offsetY = targetTopY - (diaBBox.yMin * scaleY) + gap + customY;
        offsetX = offsetX + customX;
      } else if (rules.doubleAccentStyle === 'side') {
        // Angled/Side placement (very popular in high-end Vietnamese type design)
        offsetX = (previousPlacedBox.xMax - 10) - (diaBBox.xMin * scaleX) + customX;
        offsetY = previousPlacedBox.yMax - (diaBBox.yMax * scaleY) + 5 + customY;
      } else {
        // 'custom' mode: freely position relative to previous accent's center top
        const prevCenterX = (previousPlacedBox.xMin + previousPlacedBox.xMax) / 2;
        const targetTopY = previousPlacedBox.yMax;
        offsetX = prevCenterX - (diaXCenter * scaleX) + customX;
        offsetY = targetTopY - (diaBBox.yMin * scaleY) + gap + customY;
      }
    } else {
      const gap = isCapital ? rules.uppercaseAccentGap : rules.lowercaseAccentGap;
      offsetY = baseYTop - (diaBBox.yMin * scaleY) + gap;
    }
  }

  return { scaleX, scaleY, offsetX, offsetY };
}

/**
 * Mapping of double-accented or compound Vietnamese characters to their existing precomposed base character
 * and the remaining secondary diacritic mark to add on top/bottom.
 * E.g., 'ấ' -> precomposed base 'â' + remaining mark 'acute'.
 */
export const PRECOMPOSED_BASE_MAP: Record<string, { precomposedBaseChar: string; remainingComponent: string }> = {
  // â (a-circumflex) group
  'ầ': { precomposedBaseChar: 'â', remainingComponent: 'grave' },
  'ấ': { precomposedBaseChar: 'â', remainingComponent: 'acute' },
  'ẩ': { precomposedBaseChar: 'â', remainingComponent: 'hook' },
  'ẫ': { precomposedBaseChar: 'â', remainingComponent: 'tilde' },
  'ậ': { precomposedBaseChar: 'â', remainingComponent: 'dot_below' },

  // Â (A-circumflex) group
  'Ầ': { precomposedBaseChar: 'Â', remainingComponent: 'grave' },
  'Ấ': { precomposedBaseChar: 'Â', remainingComponent: 'acute' },
  'Ẩ': { precomposedBaseChar: 'Â', remainingComponent: 'hook' },
  'Ẫ': { precomposedBaseChar: 'Â', remainingComponent: 'tilde' },
  'Ậ': { precomposedBaseChar: 'Â', remainingComponent: 'dot_below' },

  // ă (a-breve) group
  'ằ': { precomposedBaseChar: 'ă', remainingComponent: 'grave' },
  'ắ': { precomposedBaseChar: 'ă', remainingComponent: 'acute' },
  'ẳ': { precomposedBaseChar: 'ă', remainingComponent: 'hook' },
  'ẵ': { precomposedBaseChar: 'ă', remainingComponent: 'tilde' },
  'ặ': { precomposedBaseChar: 'ă', remainingComponent: 'dot_below' },

  // Ă (A-breve) group
  'Ằ': { precomposedBaseChar: 'Ă', remainingComponent: 'grave' },
  'Ắ': { precomposedBaseChar: 'Ă', remainingComponent: 'acute' },
  'Ẳ': { precomposedBaseChar: 'Ă', remainingComponent: 'hook' },
  'Ẵ': { precomposedBaseChar: 'Ă', remainingComponent: 'tilde' },
  'Ặ': { precomposedBaseChar: 'Ă', remainingComponent: 'dot_below' },

  // ê (e-circumflex) group
  'ề': { precomposedBaseChar: 'ê', remainingComponent: 'grave' },
  'ế': { precomposedBaseChar: 'ê', remainingComponent: 'acute' },
  'ể': { precomposedBaseChar: 'ê', remainingComponent: 'hook' },
  'ễ': { precomposedBaseChar: 'ê', remainingComponent: 'tilde' },
  'ệ': { precomposedBaseChar: 'ê', remainingComponent: 'dot_below' },

  // Ê (E-circumflex) group
  'Ề': { precomposedBaseChar: 'Ê', remainingComponent: 'grave' },
  'Ế': { precomposedBaseChar: 'Ê', remainingComponent: 'acute' },
  'Ể': { precomposedBaseChar: 'Ê', remainingComponent: 'hook' },
  'Ễ': { precomposedBaseChar: 'Ê', remainingComponent: 'tilde' },
  'Ệ': { precomposedBaseChar: 'Ê', remainingComponent: 'dot_below' },

  // ô (o-circumflex) group
  'ồ': { precomposedBaseChar: 'ô', remainingComponent: 'grave' },
  'ố': { precomposedBaseChar: 'ô', remainingComponent: 'acute' },
  'ổ': { precomposedBaseChar: 'ô', remainingComponent: 'hook' },
  'ỗ': { precomposedBaseChar: 'ô', remainingComponent: 'tilde' },
  'ộ': { precomposedBaseChar: 'ô', remainingComponent: 'dot_below' },

  // Ô (O-circumflex) group
  'Ồ': { precomposedBaseChar: 'Ô', remainingComponent: 'grave' },
  'Ố': { precomposedBaseChar: 'Ô', remainingComponent: 'acute' },
  'Ổ': { precomposedBaseChar: 'Ô', remainingComponent: 'hook' },
  'Ỗ': { precomposedBaseChar: 'Ô', remainingComponent: 'tilde' },
  'Ộ': { precomposedBaseChar: 'Ô', remainingComponent: 'dot_below' },

  // ơ (o-horn) group
  'ờ': { precomposedBaseChar: 'ơ', remainingComponent: 'grave' },
  'ớ': { precomposedBaseChar: 'ơ', remainingComponent: 'acute' },
  'ở': { precomposedBaseChar: 'ơ', remainingComponent: 'hook' },
  'ỡ': { precomposedBaseChar: 'ơ', remainingComponent: 'tilde' },
  'ợ': { precomposedBaseChar: 'ơ', remainingComponent: 'dot_below' },

  // Ơ (O-horn) group
  'Ờ': { precomposedBaseChar: 'Ơ', remainingComponent: 'grave' },
  'Ớ': { precomposedBaseChar: 'Ơ', remainingComponent: 'acute' },
  'Ở': { precomposedBaseChar: 'Ơ', remainingComponent: 'hook' },
  'Ỡ': { precomposedBaseChar: 'Ơ', remainingComponent: 'tilde' },
  'Ợ': { precomposedBaseChar: 'Ơ', remainingComponent: 'dot_below' },

  // ư (u-horn) group
  'ừ': { precomposedBaseChar: 'ư', remainingComponent: 'grave' },
  'ứ': { precomposedBaseChar: 'ư', remainingComponent: 'acute' },
  'ử': { precomposedBaseChar: 'ư', remainingComponent: 'hook' },
  'ữ': { precomposedBaseChar: 'ư', remainingComponent: 'tilde' },
  'ự': { precomposedBaseChar: 'ư', remainingComponent: 'dot_below' },

  // Ư (U-horn) group
  'Ừ': { precomposedBaseChar: 'Ư', remainingComponent: 'grave' },
  'Ứ': { precomposedBaseChar: 'Ư', remainingComponent: 'acute' },
  'Ử': { precomposedBaseChar: 'Ư', remainingComponent: 'hook' },
  'Ữ': { precomposedBaseChar: 'Ư', remainingComponent: 'tilde' },
  'Ự': { precomposedBaseChar: 'Ư', remainingComponent: 'dot_below' }
};

/**
 * Builds a composite path for a character by merging the base glyph and its required diacritics.
 * When preserveExistingGlyphs is enabled and a precomposed base character (e.g., 'â', 'ô', 'ă') exists in the font,
 * it uses that precomposed glyph directly as the base character to inherit its native circumflex/breve mark.
 */
export function composeGlyphPath(
  font: opentype.Font,
  recipe: ComponentRecipe,
  templates: Record<string, DiacriticTemplate>,
  rules: AutoPositionRules,
  overrides?: GlyphOverrideState,
  preserveExistingGlyphs: boolean = true
): { 
  path: opentype.Path; 
  advanceWidth: number; 
  hornInfo?: { yMin: number; yMax: number; excessRight: number } 
} {
  let baseCharToUse = recipe.baseChar;
  let componentsToUse = [...recipe.components];

  const isCapital = recipe.baseChar === recipe.baseChar.toUpperCase() && recipe.baseChar !== recipe.baseChar.toLowerCase();
  const isHornRecipe = recipe.components.some(c => c.startsWith('horn')) ||
    recipe.baseChar === 'Ư' || recipe.baseChar === 'Ơ' ||
    recipe.char === 'Ư' || recipe.char === 'Ơ' ||
    recipe.char === 'ừ' || recipe.char === 'ứ' || recipe.char === 'ử' || recipe.char === 'ữ' || recipe.char === 'ự' ||
    recipe.char === 'ờ' || recipe.char === 'ớ' || recipe.char === 'ở' || recipe.char === 'ỡ' || recipe.char === 'ợ' ||
    recipe.char === 'Ừ' || recipe.char === 'Ứ' || recipe.char === 'Ử' || recipe.char === 'Ữ' || recipe.char === 'Ự' ||
    recipe.char === 'Ờ' || recipe.char === 'Ớ' || recipe.char === 'Ở' || recipe.char === 'Ỡ' || recipe.char === 'Ợ';

  const isTwoTierCapAccent = isCapital && !isHornRecipe && (
    recipe.components.includes('circumflex') ||
    recipe.components.includes('breve') ||
    (recipe.components.length === 2 && !recipe.components.some(c => c.startsWith('horn')))
  );

  const effectiveCapCompressY = (overrides && overrides.hasCustomDoubleAccent && overrides.doubleAccentCapCompressY !== undefined)
    ? overrides.doubleAccentCapCompressY
    : (rules.doubleAccentCapCompressY ?? 100);

  const effectiveCapCustomEnabled = (overrides && overrides.hasCustomDoubleAccent && overrides.doubleAccentCapCustomEnabled !== undefined)
    ? overrides.doubleAccentCapCustomEnabled
    : (rules.doubleAccentCapCustomEnabled ?? false);

  const hasCapCompression = isTwoTierCapAccent && effectiveCapCompressY < 100;
  const compressRatio = hasCapCompression
    ? Math.max(0.1, Math.min(1.0, effectiveCapCompressY / 100))
    : 1.0;

  const hasUserOverrides = overrides && (
    (overrides.offsetX !== undefined && overrides.offsetX !== 0) ||
    (overrides.offsetY !== undefined && overrides.offsetY !== 0) ||
    (overrides.scaleX !== undefined && overrides.scaleX !== 1.0) ||
    (overrides.scaleY !== undefined && overrides.scaleY !== 1.0) ||
    (overrides.advanceWidthTweak !== undefined && overrides.advanceWidthTweak !== 0) ||
    !!overrides.hasCustomDoubleAccent ||
    overrides.comp1OffsetX !== undefined ||
    overrides.comp1OffsetY !== undefined ||
    overrides.comp2OffsetX !== undefined ||
    overrides.comp2OffsetY !== undefined
  );

  // If preserveExistingGlyphs is enabled and the target character itself is available in the font (and no manual override exists),
  // use the native precomposed glyph directly from the font (unless custom cap compression/override is active).
  if (preserveExistingGlyphs && font && !hasUserOverrides && !hasCapCompression && !(isTwoTierCapAccent && effectiveCapCustomEnabled)) {
    const existingIdx = font.charToGlyphIndex(recipe.char);
    if (existingIdx > 0) {
      const existingGlyph = font.glyphs.get(existingIdx);
      if (existingGlyph && existingGlyph.path && existingGlyph.path.commands && existingGlyph.path.commands.length > 0) {
        return {
          path: existingGlyph.path,
          advanceWidth: existingGlyph.advanceWidth || 500
        };
      }
    }
  }

  // If preserveExistingGlyphs is enabled, check if a precomposed base character (like 'â', 'ô', 'ă', 'ê', 'ơ', 'ư')
  // is available in the font. Using it as the base glyph preserves the font's native circumflex/breve/horn.
  let precomposedFirstAccentBox: { xMin: number; yMin: number; xMax: number; yMax: number } | undefined = undefined;

  if (preserveExistingGlyphs && font && !hasCapCompression && !(isTwoTierCapAccent && effectiveCapCustomEnabled)) {
    const preInfo = PRECOMPOSED_BASE_MAP[recipe.char];
    if (preInfo) {
      const preIdx = font.charToGlyphIndex(preInfo.precomposedBaseChar);
      if (preIdx > 0) {
        const preGlyph = font.glyphs.get(preIdx);
        if (preGlyph && preGlyph.path && preGlyph.path.commands && preGlyph.path.commands.length > 0) {
          baseCharToUse = preInfo.precomposedBaseChar;
          componentsToUse = [preInfo.remainingComponent];

          // For top-accent precomposed bases ('â', 'Â', 'ă', 'Ă', 'ê', 'Ê', 'ô', 'Ô'),
          // extract the native top mark's bounding box so double accent rules ('stacked', 'side', 'custom') apply seamlessly!
          const preCharLower = preInfo.precomposedBaseChar.toLowerCase();
          if (['â', 'ă', 'ê', 'ô'].includes(preCharLower)) {
            const unaccentedBaseChar = recipe.baseChar;
            const unaccentedGlyph = font.charToGlyph(unaccentedBaseChar);
            let unaccentedTopY = getXHeightFromFont(font);
            if (unaccentedGlyph && unaccentedGlyph.path && unaccentedGlyph.path.commands && unaccentedGlyph.path.commands.length > 0) {
              const uBox = unaccentedGlyph.getBoundingBox();
              unaccentedTopY = uBox.y2;
            }

            const contours = getGlyphContours(preGlyph.path.commands);
            const topMarkCmds: any[] = [];
            for (const contour of contours) {
              const cBox = getExactBoundingBox(contour);
              if (cBox.yMin >= unaccentedTopY - 30) {
                topMarkCmds.push(...contour);
              }
            }

            if (topMarkCmds.length > 0) {
              precomposedFirstAccentBox = getExactBoundingBox(topMarkCmds);
            } else {
              const pBox = preGlyph.getBoundingBox();
              const pHeight = pBox.y2 - pBox.y1;
              precomposedFirstAccentBox = {
                xMin: pBox.x1,
                xMax: pBox.x2,
                yMin: pBox.y2 - pHeight * 0.35,
                yMax: pBox.y2
              };
            }
          }
        }
      }
    }
  }

  let baseGlyph = font.charToGlyph(baseCharToUse);
  
  // For lowercase 'i', remove the original dot only when adding top diacritics (ì, í, ỉ, ĩ),
  // but keep the dot on 'i' when adding bottom diacritics like dot_below (ị)
  const shouldRemoveDotOnI = baseCharToUse === 'i' && componentsToUse.some(comp => comp !== 'dot_below' && comp !== 'bar');

  if (shouldRemoveDotOnI) {
    const dotlessGlyph = font.charToGlyph('ı');
    if (dotlessGlyph && dotlessGlyph.index > 0 && dotlessGlyph.name !== '.notdef') {
      baseGlyph = dotlessGlyph;
    } else {
      const glyphNames = (font as any).glyphNames;
      const glyphIndex = glyphNames && typeof glyphNames.nameToGlyph === 'function' 
        ? glyphNames.nameToGlyph('dotlessi') 
        : 0;
      if (glyphIndex > 0) {
        const glyph = font.glyphs.get(glyphIndex);
        if (glyph) {
          baseGlyph = glyph;
        }
      }
    }
  }

  if (!baseGlyph) {
    return { path: new opentype.Path(), advanceWidth: 500 };
  }

  const upm = font.unitsPerEm || 1000;
  
  // Get base commands and programmatically strip dot if it's 'i' with top diacritics
  let baseCmds = baseGlyph.path.commands;
  if (shouldRemoveDotOnI) {
    baseCmds = removeDotFromICommands(baseCmds);
  }

  // Recalculate bounding box based on actual dotless commands if we stripped it
  const baseBBox = baseGlyph.getBoundingBox();
  if (shouldRemoveDotOnI) {
    const tightBox = getExactBoundingBox(baseCmds);
    baseBBox.x1 = tightBox.xMin;
    baseBBox.y1 = tightBox.yMin;
    baseBBox.x2 = tightBox.xMax;
    baseBBox.y2 = tightBox.yMax;
  }

  // Determine target winding direction from base glyph (TrueType default: Clockwise >0)
  const baseContours = getGlyphContours(baseCmds);
  let targetOuterClockwise = true;
  if (baseContours.length > 0) {
    let maxArea = 0;
    let maxAreaSigned = 0;
    baseContours.forEach(c => {
      const a = getContourSignedArea(c);
      if (Math.abs(a) > maxArea) {
        maxArea = Math.abs(a);
        maxAreaSigned = a;
      }
    });
    if (maxArea > 0) {
      targetOuterClockwise = maxAreaSigned > 0;
    }
  }

  // IMPORTANT: Do NOT call orientContours on baseCmds!
  // The base glyph's original contours already have pristine coordinate precision,
  // curve types (quadratic Q or cubic C), and perfect outer/inner hole winding.
  // Leaving baseCmds untouched guarantees that the inner holes of O, o, e, etc. never turn black!

  let previousBox: { xMin: number; yMin: number; xMax: number; yMax: number } | undefined = undefined;
  let autoHornAdvanceWidthTweak = 0;
  let hornInfo: { yMin: number; yMax: number; excessRight: number } | undefined = undefined;
  const allDiaCmds: any[] = [];

  componentsToUse.forEach((diaId, idx) => {
    const template = templates[diaId];
    if (!template) return;

    const useCapVariant = isCapital && template.hasCapVariant;
    const svgPathToUse = useCapVariant && template.capSvgPath ? template.capSvgPath : template.svgPath;
    const scaleXToUse = useCapVariant && template.capScaleX !== undefined ? template.capScaleX : template.scaleX;
    const scaleYToUse = useCapVariant && template.capScaleY !== undefined ? template.capScaleY : template.scaleY;
    const offsetXToUse = useCapVariant && template.capOffsetX !== undefined ? template.capOffsetX : template.offsetX;
    const offsetYToUse = useCapVariant && template.capOffsetY !== undefined ? template.capOffsetY : template.offsetY;
    const autoCenterXToUse = useCapVariant && template.capAutoCenterX !== undefined ? template.capAutoCenterX : (template.autoCenterX !== false);

    const diaRawCmds = parseSvgPath(svgPathToUse);
    if (diaRawCmds.length === 0) return;

    // Apply template scale first
    const templateTransformed = transformCommands(
      diaRawCmds,
      scaleXToUse,
      scaleYToUse,
      0,
      0,
      true // flip Y to ensure Illustrator compatibility
    );

    const diaBBox = getExactBoundingBox(templateTransformed);
    
    // Auto align the diacritic based on the bounding boxes and group reference heights
    const prevBoxToPass = idx === 0 ? precomposedFirstAccentBox : previousBox;
    const groupHeights = getGroupReferenceHeights(font);
    const effectiveRules = (overrides && overrides.hasCustomDoubleAccent) ? {
      ...rules,
      doubleAccentStyle: overrides.doubleAccentStyle ?? rules.doubleAccentStyle,
      doubleAccentGap: overrides.doubleAccentGap ?? rules.doubleAccentGap,
      doubleAccentCustomX: overrides.doubleAccentCustomX ?? rules.doubleAccentCustomX,
      doubleAccentCustomY: overrides.doubleAccentCustomY ?? rules.doubleAccentCustomY,
      doubleAccentCapCustomEnabled: overrides.doubleAccentCapCustomEnabled ?? rules.doubleAccentCapCustomEnabled,
      doubleAccentCapCustomX: overrides.doubleAccentCapCustomX ?? rules.doubleAccentCapCustomX,
      doubleAccentCapCustomY: overrides.doubleAccentCapCustomY ?? rules.doubleAccentCapCustomY,
      doubleAccentCapCompressY: overrides.doubleAccentCapCompressY ?? rules.doubleAccentCapCompressY
    } : rules;
    const autoPos = calculateAutoPosition(diaId, baseBBox, diaBBox, effectiveRules, isCapital, prevBoxToPass, groupHeights, recipe.baseChar);

    // Apply template offsets and individual character override tweaks if present
    let finalScaleX = autoPos.scaleX;
    let finalScaleY = autoPos.scaleY;
    
    const useAutoCenterX = autoCenterXToUse;
    let finalOffsetX = autoPos.offsetX + (useAutoCenterX ? 0 : offsetXToUse);
    let finalOffsetY = autoPos.offsetY + offsetYToUse;

    // Apply vertical compression for 2-tier capital accents (excluding Ư, Ơ)
    if (hasCapCompression && compressRatio < 1.0 && diaId !== 'dot_below') {
      finalScaleY = autoPos.scaleY * compressRatio;
      // Preserve the foot position (yMin) of the diacritic:
      finalOffsetY = autoPos.offsetY + (diaBBox.yMin * autoPos.scaleY * (1 - compressRatio)) + offsetYToUse;
    }

    if (overrides) {
      // Robust safeguard against undefined or NaN scale/offset values
      const oScaleX = overrides.scaleX !== undefined && !isNaN(overrides.scaleX) ? overrides.scaleX : 1.0;
      const oScaleY = overrides.scaleY !== undefined && !isNaN(overrides.scaleY) ? overrides.scaleY : 1.0;
      const oOffsetX = overrides.offsetX !== undefined && !isNaN(overrides.offsetX) ? overrides.offsetX : 0;
      const oOffsetY = overrides.offsetY !== undefined && !isNaN(overrides.offsetY) ? overrides.offsetY : 0;

      finalScaleX *= oScaleX;
      finalScaleY *= oScaleY;
      finalOffsetX += oOffsetX;
      finalOffsetY += oOffsetY;

      // Component-specific offsets
      if (idx === 0) {
        if (overrides.comp1OffsetX !== undefined && !isNaN(overrides.comp1OffsetX)) {
          finalOffsetX += overrides.comp1OffsetX;
        }
        if (overrides.comp1OffsetY !== undefined && !isNaN(overrides.comp1OffsetY)) {
          finalOffsetY += overrides.comp1OffsetY;
        }
        // If we switched to precomposed base, the single remaining component corresponds to the 2nd component in the original recipe
        if (recipe.components.length === 2) {
          if (overrides.comp2OffsetX !== undefined && !isNaN(overrides.comp2OffsetX)) {
            finalOffsetX += overrides.comp2OffsetX;
          }
          if (overrides.comp2OffsetY !== undefined && !isNaN(overrides.comp2OffsetY)) {
            finalOffsetY += overrides.comp2OffsetY;
          }
        }
      } else if (idx === 1) {
        if (overrides.comp2OffsetX !== undefined && !isNaN(overrides.comp2OffsetX)) {
          finalOffsetX += overrides.comp2OffsetX;
        }
        if (overrides.comp2OffsetY !== undefined && !isNaN(overrides.comp2OffsetY)) {
          finalOffsetY += overrides.comp2OffsetY;
        }
      }
    }

    // Final composition transformation for this diacritic
    const finalCmds = transformCommands(
      templateTransformed,
      finalScaleX,
      finalScaleY,
      finalOffsetX,
      finalOffsetY,
      false // Already flipped Y in templateTransformed, don't flip again
    );

    // Update previous bounding box to handle stacked double accents (only for circumflex & breve)
    const composedDiaBBox = getExactBoundingBox(finalCmds);
    if (diaId === 'circumflex' || diaId === 'breve') {
      previousBox = composedDiaBBox;
    } else {
      previousBox = undefined;
    }

    if (diaId === 'horn_o' || diaId === 'horn_u' || diaId.startsWith('horn')) {
      const excessRight = composedDiaBBox.xMax - baseBBox.x2;
      if (excessRight > 0) {
        autoHornAdvanceWidthTweak = Math.max(autoHornAdvanceWidthTweak, excessRight);
        hornInfo = {
          yMin: composedDiaBBox.yMin,
          yMax: composedDiaBBox.yMax,
          excessRight: excessRight
        };
      }
    }

    // For attached components (bar on d/Đ, horn on u/o/U/O), perform a 2D boolean union
    // with the base glyph path. This merges overlapping boundaries into a single continuous outline,
    // completely eliminating intersecting 'white holes' (lỗi vùng giao tạo ra ô trắng) in Canvas 2D
    // and font rasterizers.
    const isAttachedComponent = diaId === 'bar' || diaId === 'horn' || diaId === 'horn_o' || diaId === 'horn_u' || diaId.startsWith('horn');
    if (isAttachedComponent) {
      try {
        const baseSvg = commandsToSvgPathD(baseCmds);
        const diaSvg = commandsToSvgPathD(finalCmds);
        const unitedSvg = unionSvgPaths(baseSvg, diaSvg);
        if (unitedSvg && unitedSvg.trim().length > 0) {
          const unitedRaw = parseSvgPath(unitedSvg);
          if (unitedRaw && unitedRaw.length > 0) {
            // Re-orient the united contours to strictly match target font winding
            baseCmds = orientContours(unitedRaw, targetOuterClockwise);
          } else {
            allDiaCmds.push(...orientContours(finalCmds, targetOuterClockwise));
          }
        } else {
          allDiaCmds.push(...orientContours(finalCmds, targetOuterClockwise));
        }
      } catch (unionErr) {
        console.warn('Path union error, falling back to separate contours:', unionErr);
        allDiaCmds.push(...orientContours(finalCmds, targetOuterClockwise));
      }
    } else {
      // Floating accents (acute, grave, hook, tilde, circumflex, breve, dot_below)
      const orientedFinalCmds = orientContours(finalCmds, targetOuterClockwise);
      allDiaCmds.push(...orientedFinalCmds);
    }
  });

  // Construct final composite glyph path:
  // 1. Add base glyph commands (which now contains the seamlessly united attached diacritics)
  const compositePath = new opentype.Path();
  baseCmds.forEach(cmd => {
    if (cmd.type === 'M') compositePath.moveTo(cmd.x, cmd.y);
    else if (cmd.type === 'L') compositePath.lineTo(cmd.x, cmd.y);
    else if (cmd.type === 'Q') compositePath.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
    else if (cmd.type === 'C') compositePath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    else if (cmd.type === 'Z') compositePath.closePath();
  });

  // 2. Add floating diacritic commands (e.g. top tone marks)
  allDiaCmds.forEach(cmd => {
    if (cmd.type === 'M') compositePath.moveTo(cmd.x, cmd.y);
    else if (cmd.type === 'L') compositePath.lineTo(cmd.x, cmd.y);
    else if (cmd.type === 'Q') compositePath.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
    else if (cmd.type === 'C') compositePath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    else if (cmd.type === 'Z') compositePath.closePath();
  });

  // Calculate advance width (tracking)
  let advanceWidth = baseGlyph.advanceWidth;
  if (autoHornAdvanceWidthTweak > 0) {
    advanceWidth += autoHornAdvanceWidthTweak;
  }
  if (overrides && overrides.advanceWidthTweak !== undefined) {
    advanceWidth += overrides.advanceWidthTweak;
  }

  return { path: compositePath, advanceWidth, hornInfo };
}

/**
 * Searches the loaded font for the best candidate glyph matching a diacritic ID,
 * checking standard Unicodes and a list of alternative glyph names.
 */
export function findCandidateGlyph(font: any, diaId: string): any {
  if (!font) return null;

  // 1. Try extracting diacritic shape directly from existing precomposed Vietnamese characters in the font (e.g. 'â', 'ô', 'ă', etc.)
  const extractedGlyph = extractDiacriticFromComposedGlyph(font, diaId);
  if (extractedGlyph) {
    return extractedGlyph;
  }

  const searchConfig: Record<string, { unicodes: number[]; names: string[] }> = {
    grave: {
      unicodes: [0x0060, 0x0300, 0x02CB],
      names: ['grave', 'graveaccent', 'uni0300', 'uni0060', 'dauhuyen']
    },
    acute: {
      unicodes: [0x00B4, 0x0301, 0x02CA],
      names: ['acute', 'acuteaccent', 'uni0301', 'uni00B4', 'dausac']
    },
    hook: {
      unicodes: [0x0309, 0x02C0],
      names: ['hookabove', 'hookabovecomb', 'uni0309', 'hook', 'dauhoi']
    },
    tilde: {
      unicodes: [0x007E, 0x02DC, 0x0303],
      names: ['tilde', 'tildeaccent', 'uni0303', 'uni007E', 'daunga']
    },
    dot_below: {
      unicodes: [0x0323, 0x2024],
      names: ['dotbelow', 'dotbelowcomb', 'uni0323', 'dot', 'daunang']
    },
    circumflex: {
      unicodes: [0x005E, 0x02C6, 0x0302],
      names: ['circumflex', 'circumflexaccent', 'uni0302', 'uni005E', 'hat', 'daumu']
    },
    breve: {
      unicodes: [0x02D8, 0x0306],
      names: ['breve', 'breveaccent', 'uni0306', 'uni02D8', 'dautrang']
    },
    horn_o: {
      unicodes: [0x031B, 0x002C],
      names: ['horn', 'horncomb', 'uni031B', 'daumoc', 'comma', 'uni002C']
    },
    horn_u: {
      unicodes: [0x031B, 0x002C],
      names: ['horn', 'horncomb', 'uni031B', 'daumoc', 'comma', 'uni002C']
    },
    bar: {
      unicodes: [0x00AF, 0x002D, 0x2212, 0x0304],
      names: ['macron', 'hyphen', 'minus', 'uni002D', 'uni00AF', 'bar', 'gachngang']
    }
  };

  const config = searchConfig[diaId];
  if (!config) return null;

  // 2. Try search by character codes in the font mapping
  for (const unicode of config.unicodes) {
    try {
      const charStr = String.fromCharCode(unicode);
      const idx = font.charToGlyphIndex(charStr);
      if (idx > 0) {
        const glyph = font.glyphs.get(idx);
        if (glyph && glyph.path && glyph.path.commands && glyph.path.commands.length > 0) {
          return glyph;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  // 3. Scan font glyph names sequentially
  if (font.glyphs && font.glyphs.length > 0) {
    for (let i = 0; i < font.glyphs.length; i++) {
      try {
        const glyph = font.glyphs.get(i);
        if (glyph && glyph.name) {
          const lowerName = glyph.name.toLowerCase();
          if (config.names.includes(lowerName)) {
            if (glyph.path && glyph.path.commands && glyph.path.commands.length > 0) {
              return glyph;
            }
          }
        }
      } catch (e) {
        // Ignored
      }
    }
  }

  return null;
}

/**
 * Splits path commands into separate closed/open contours (grouped by MoveTo commands).
 */
export function getGlyphContours(commands: any[]): any[][] {
  const contours: any[][] = [];
  let currentContour: any[] = [];

  for (const cmd of commands) {
    if (cmd.type === 'M' && currentContour.length > 0) {
      contours.push(currentContour);
      currentContour = [];
    }
    currentContour.push(cmd);
  }
  if (currentContour.length > 0) {
    contours.push(currentContour);
  }
  return contours;
}

/**
 * Extracts a specific diacritic mark from existing precomposed Vietnamese characters in the font
 * (e.g., isolating the acute mark from 'á', tilde from 'ẽ', horn from 'ơ'/'ư', etc.)
 */
export function extractDiacriticFromComposedGlyph(font: any, diaId: string): any {
  if (!font) return null;

  const PRECOMPOSED_MAP: Record<string, {
    targetType: 'upper' | 'lower' | 'horn' | 'bar';
    candidates: Array<{ composedChar: string; baseChar: string }>;
  }> = {
    grave: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'à', baseChar: 'a' },
        { composedChar: 'è', baseChar: 'e' },
        { composedChar: 'ò', baseChar: 'o' },
        { composedChar: 'ù', baseChar: 'u' },
        { composedChar: 'ì', baseChar: 'i' },
        { composedChar: 'ỳ', baseChar: 'y' },
        { composedChar: 'À', baseChar: 'A' },
        { composedChar: 'È', baseChar: 'E' },
        { composedChar: 'Ò', baseChar: 'O' },
        { composedChar: 'Ù', baseChar: 'U' },
        { composedChar: 'Ỳ', baseChar: 'Y' },
        { composedChar: 'ầ', baseChar: 'â' },
        { composedChar: 'ề', baseChar: 'ê' },
        { composedChar: 'ồ', baseChar: 'ô' },
        { composedChar: 'ằ', baseChar: 'ă' },
        { composedChar: 'ờ', baseChar: 'ơ' },
        { composedChar: 'ừ', baseChar: 'ư' },
        { composedChar: 'Ầ', baseChar: 'Â' },
        { composedChar: 'Ề', baseChar: 'Ê' },
        { composedChar: 'Ồ', baseChar: 'Ô' },
        { composedChar: 'Ằ', baseChar: 'Ă' },
        { composedChar: 'Ờ', baseChar: 'Ơ' },
        { composedChar: 'Ừ', baseChar: 'Ư' }
      ]
    },
    acute: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'á', baseChar: 'a' },
        { composedChar: 'é', baseChar: 'e' },
        { composedChar: 'ó', baseChar: 'o' },
        { composedChar: 'ú', baseChar: 'u' },
        { composedChar: 'í', baseChar: 'i' },
        { composedChar: 'ý', baseChar: 'y' },
        { composedChar: 'Á', baseChar: 'A' },
        { composedChar: 'É', baseChar: 'E' },
        { composedChar: 'Ó', baseChar: 'O' },
        { composedChar: 'Ú', baseChar: 'U' },
        { composedChar: 'Ý', baseChar: 'Y' },
        { composedChar: 'ấ', baseChar: 'â' },
        { composedChar: 'ế', baseChar: 'ê' },
        { composedChar: 'ố', baseChar: 'ô' },
        { composedChar: 'ắ', baseChar: 'ă' },
        { composedChar: 'ớ', baseChar: 'ơ' },
        { composedChar: 'ứ', baseChar: 'ư' },
        { composedChar: 'Ấ', baseChar: 'Â' },
        { composedChar: 'Ế', baseChar: 'Ê' },
        { composedChar: 'Ố', baseChar: 'Ô' },
        { composedChar: 'Ắ', baseChar: 'Ă' },
        { composedChar: 'Ớ', baseChar: 'Ơ' },
        { composedChar: 'Ứ', baseChar: 'Ư' }
      ]
    },
    hook: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'ả', baseChar: 'a' },
        { composedChar: 'ẻ', baseChar: 'e' },
        { composedChar: 'ỏ', baseChar: 'o' },
        { composedChar: 'ủ', baseChar: 'u' },
        { composedChar: 'ỉ', baseChar: 'i' },
        { composedChar: 'ỷ', baseChar: 'y' },
        { composedChar: 'Ả', baseChar: 'A' },
        { composedChar: 'Ẻ', baseChar: 'E' },
        { composedChar: 'Ỏ', baseChar: 'O' },
        { composedChar: 'Ủ', baseChar: 'U' },
        { composedChar: 'Ỷ', baseChar: 'Y' },
        { composedChar: 'ẩ', baseChar: 'â' },
        { composedChar: 'ể', baseChar: 'ê' },
        { composedChar: 'ổ', baseChar: 'ô' },
        { composedChar: 'ẳ', baseChar: 'ă' },
        { composedChar: 'ở', baseChar: 'ơ' },
        { composedChar: 'ử', baseChar: 'ư' },
        { composedChar: 'Ẩ', baseChar: 'Â' },
        { composedChar: 'Ể', baseChar: 'Ê' },
        { composedChar: 'Ổ', baseChar: 'Ô' },
        { composedChar: 'Ẳ', baseChar: 'Ă' },
        { composedChar: 'Ở', baseChar: 'Ơ' },
        { composedChar: 'Ử', baseChar: 'Ư' }
      ]
    },
    tilde: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'ã', baseChar: 'a' },
        { composedChar: 'ẽ', baseChar: 'e' },
        { composedChar: 'õ', baseChar: 'o' },
        { composedChar: 'ũ', baseChar: 'u' },
        { composedChar: 'ĩ', baseChar: 'i' },
        { composedChar: 'ỹ', baseChar: 'y' },
        { composedChar: 'Ã', baseChar: 'A' },
        { composedChar: 'Ẽ', baseChar: 'E' },
        { composedChar: 'Õ', baseChar: 'O' },
        { composedChar: 'Ũ', baseChar: 'U' },
        { composedChar: 'Ỹ', baseChar: 'Y' },
        { composedChar: 'ẫ', baseChar: 'â' },
        { composedChar: 'ễ', baseChar: 'ê' },
        { composedChar: 'ỗ', baseChar: 'ô' },
        { composedChar: 'ẵ', baseChar: 'ă' },
        { composedChar: 'ỡ', baseChar: 'ơ' },
        { composedChar: 'ữ', baseChar: 'ư' },
        { composedChar: 'Ẫ', baseChar: 'Â' },
        { composedChar: 'Ễ', baseChar: 'Ê' },
        { composedChar: 'Ỗ', baseChar: 'Ô' },
        { composedChar: 'Ẵ', baseChar: 'Ă' },
        { composedChar: 'Ỡ', baseChar: 'Ơ' },
        { composedChar: 'Ữ', baseChar: 'Ư' }
      ]
    },
    dot_below: {
      targetType: 'lower',
      candidates: [
        { composedChar: 'ạ', baseChar: 'a' },
        { composedChar: 'ẹ', baseChar: 'e' },
        { composedChar: 'ọ', baseChar: 'o' },
        { composedChar: 'ụ', baseChar: 'u' },
        { composedChar: 'ị', baseChar: 'i' },
        { composedChar: 'ỵ', baseChar: 'y' },
        { composedChar: 'Ạ', baseChar: 'A' },
        { composedChar: 'Ẹ', baseChar: 'E' },
        { composedChar: 'Ọ', baseChar: 'O' },
        { composedChar: 'Ụ', baseChar: 'U' },
        { composedChar: 'Ỵ', baseChar: 'Y' },
        { composedChar: 'ậ', baseChar: 'â' },
        { composedChar: 'ệ', baseChar: 'ê' },
        { composedChar: 'ộ', baseChar: 'ô' },
        { composedChar: 'ặ', baseChar: 'ă' },
        { composedChar: 'ợ', baseChar: 'ơ' },
        { composedChar: 'ự', baseChar: 'ư' },
        { composedChar: 'Ậ', baseChar: 'Â' },
        { composedChar: 'Ệ', baseChar: 'Ê' },
        { composedChar: 'Ộ', baseChar: 'Ô' },
        { composedChar: 'Ặ', baseChar: 'Ă' },
        { composedChar: 'Ợ', baseChar: 'Ơ' },
        { composedChar: 'Ự', baseChar: 'Ư' }
      ]
    },
    circumflex: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'â', baseChar: 'a' },
        { composedChar: 'ê', baseChar: 'e' },
        { composedChar: 'ô', baseChar: 'o' },
        { composedChar: 'Â', baseChar: 'A' },
        { composedChar: 'Ê', baseChar: 'E' },
        { composedChar: 'Ô', baseChar: 'O' }
      ]
    },
    breve: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'ă', baseChar: 'a' },
        { composedChar: 'Ă', baseChar: 'A' }
      ]
    },
    horn_o: {
      targetType: 'horn',
      candidates: [
        { composedChar: 'ơ', baseChar: 'o' },
        { composedChar: 'Ơ', baseChar: 'O' }
      ]
    },
    horn_u: {
      targetType: 'horn',
      candidates: [
        { composedChar: 'ư', baseChar: 'u' },
        { composedChar: 'Ư', baseChar: 'U' }
      ]
    },
    bar: {
      targetType: 'bar',
      candidates: [
        { composedChar: 'đ', baseChar: 'd' },
        { composedChar: 'Đ', baseChar: 'D' }
      ]
    }
  };

  const config = PRECOMPOSED_MAP[diaId];
  if (!config) return null;

  for (const { composedChar, baseChar } of config.candidates) {
    try {
      const compIdx = font.charToGlyphIndex(composedChar);
      if (compIdx <= 0) continue;

      const compGlyph = font.glyphs.get(compIdx);
      if (!compGlyph || !compGlyph.path || !compGlyph.path.commands || compGlyph.path.commands.length === 0) {
        continue;
      }

      const baseIdx = font.charToGlyphIndex(baseChar);
      let baseBBox = { xMin: 50, xMax: 450, yMin: 0, yMax: getXHeightFromFont(font) };

      let baseGlyph: any = null;
      let baseCmds: any[] = [];
      if (baseIdx > 0) {
        baseGlyph = font.glyphs.get(baseIdx);
        if (baseGlyph && baseGlyph.path && baseGlyph.path.commands && baseGlyph.path.commands.length > 0) {
          baseCmds = baseChar === 'i' ? removeDotFromICommands(baseGlyph.path.commands) : baseGlyph.path.commands;
          baseBBox = getExactBoundingBox(baseCmds);
        }
      }

      const compContours = getGlyphContours(compGlyph.path.commands);
      if (compContours.length <= 1 && config.targetType !== 'bar') {
        // If single contour and not a bar, diacritic is merged into body, hard to split safely
        continue;
      }

      const baseContours = baseCmds.length > 0 ? getGlyphContours(baseCmds) : [];
      const matchedCmds: any[] = [];
      const baseHeight = Math.max(100, baseBBox.yMax - baseBBox.yMin);
      const baseWidth = Math.max(100, baseBBox.xMax - baseBBox.xMin);

      for (const contour of compContours) {
        // 1. A diacritic is NEVER an inner hole/counter enclosed inside another contour!
        // This permanently protects the inner counters of O, o, e, etc. from being extracted.
        if (isContourAnInnerHole(contour, compContours)) {
          continue;
        }

        const cBBox = getExactBoundingBox(contour);

        // 2. Filter out any contour that closely matches any base glyph contour (body or counter)
        let matchesBase = false;
        for (const bContour of baseContours) {
          const bBBox = getExactBoundingBox(bContour);
          if (
            Math.abs(cBBox.xMin - bBBox.xMin) <= 18 &&
            Math.abs(cBBox.xMax - bBBox.xMax) <= 18 &&
            Math.abs(cBBox.yMin - bBBox.yMin) <= 18 &&
            Math.abs(cBBox.yMax - bBBox.yMax) <= 18
          ) {
            matchesBase = true;
            break;
          }
        }
        if (matchesBase) {
          continue;
        }

        let isMatch = false;

        if (config.targetType === 'upper') {
          const isAccentBase = ['â', 'ê', 'ô', 'ă', 'ơ', 'ư', 'Â', 'Ê', 'Ô', 'Ă', 'Ơ', 'Ư'].includes(baseChar);
          if (isAccentBase) {
            // Secondary tone mark sitting above/on top of a precomposed base character (like 'â', 'ă')
            if (cBBox.yMin >= baseBBox.yMax - 100 && cBBox.yMax > baseBBox.yMax - 30) {
              isMatch = true;
            }
          } else {
            // Primary tone mark sitting in the upper region of a simple base character (like 'a', 'e', 'o')
            if (
              cBBox.yMin >= baseBBox.yMin + baseHeight * 0.35 &&
              cBBox.yMax >= baseBBox.yMin + baseHeight * 0.55 &&
              cBBox.yMin >= baseBBox.yMax - 150
            ) {
              isMatch = true;
            }
          }
        } else if (config.targetType === 'lower') {
          // Contour sits below bottom of base glyph
          if (cBBox.yMax <= baseBBox.yMin + baseHeight * 0.45 && cBBox.yMin < baseBBox.yMin + 30) {
            isMatch = true;
          }
        } else if (config.targetType === 'horn') {
          // Contour sits near top-right of base glyph (for ơ / ư)
          if (
            cBBox.xMin >= baseBBox.xMin + baseWidth * 0.3 &&
            cBBox.yMin >= baseBBox.yMin + baseHeight * 0.3 &&
            cBBox.yMax > baseBBox.yMin + baseHeight * 0.45 &&
            (cBBox.xMax - cBBox.xMin) < baseWidth * 0.85
          ) {
            isMatch = true;
          }
        } else if (config.targetType === 'bar') {
          // Contour is horizontal crossbar on d/D
          if (
            cBBox.yMin >= baseBBox.yMin + baseHeight * 0.15 &&
            cBBox.yMax <= baseBBox.yMax * 0.95 &&
            (cBBox.xMin <= baseBBox.xMin + 20 || cBBox.xMax >= baseBBox.xMax - 20)
          ) {
            isMatch = true;
          }
        }

        if (isMatch) {
          matchedCmds.push(...contour);
        }
      }

      if (matchedCmds.length > 0 && matchedCmds.length < compGlyph.path.commands.length) {
        // Construct extracted glyph using opentype.Path instance
        const path = new opentype.Path();
        path.commands = matchedCmds;
        const dummyGlyph = new opentype.Glyph({
          name: diaId + '_extracted',
          advanceWidth: baseGlyph?.advanceWidth || compGlyph.advanceWidth || 500,
          path: path
        });
        return dummyGlyph;
      }
    } catch (err) {
      // Ignore individual character extraction errors and continue to next candidate
    }
  }

  return null;
}

/**
 * Extracts the contour path commands from an existing font glyph,
 * centers it horizontally, normalizes coordinates uniformly to a standard 1000-UPM bounding scale
 * to preserve original designer proportions, and converts it into a standard Y-down SVG path string.
 */
export function extractSvgFromGlyph(glyph: any, fontUnitsPerEm: number = 1000): string {
  if (!glyph || !glyph.path || !glyph.path.commands || glyph.path.commands.length === 0) {
    return '';
  }

  const baseCmds = glyph.path.commands;

  // Compute bounding box manually to ensure high precision
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  baseCmds.forEach((cmd: any) => {
    if (cmd.x !== undefined) {
      if (cmd.x < xMin) xMin = cmd.x;
      if (cmd.x > xMax) xMax = cmd.x;
    }
    if (cmd.y !== undefined) {
      if (cmd.y < yMin) yMin = cmd.y;
      if (cmd.y > yMax) yMax = cmd.y;
    }
    if (cmd.x1 !== undefined) {
      if (cmd.x1 < xMin) xMin = cmd.x1;
      if (cmd.x1 > xMax) xMax = cmd.x1;
    }
    if (cmd.y1 !== undefined) {
      if (cmd.y1 < yMin) yMin = cmd.y1;
      if (cmd.y1 > yMax) yMax = cmd.y1;
    }
    if (cmd.x2 !== undefined) {
      if (cmd.x2 < xMin) xMin = cmd.x2;
      if (cmd.x2 > xMax) xMax = cmd.x2;
    }
    if (cmd.y2 !== undefined) {
      if (cmd.y2 < yMin) yMin = cmd.y2;
      if (cmd.y2 > yMax) yMax = cmd.y2;
    }
  });

  if (xMin === Infinity || yMin === Infinity) return '';

  const cx = (xMin + xMax) / 2;

  // Uniformly scale to a standard 1000 UPM space, and apply 0.5 reduction to make extracted diacritics smaller by 1/2 of their current size.
  const targetScale = (1000 / (fontUnitsPerEm || 1000)) * 0.5;

  const parts: string[] = [];

  baseCmds.forEach((cmd: any) => {
    // Horizontal alignment relative to center of glyph; vertical flip and offset relative to yMax, then scaled
    const tX = (x: number) => (x - cx) * targetScale;
    const tY = (y: number) => (yMax - y) * targetScale;

    if (cmd.type === 'M') {
      parts.push(`M${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'L') {
      parts.push(`L${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'Q') {
      parts.push(`Q${tX(cmd.x1).toFixed(1)},${tY(cmd.y1).toFixed(1)} ${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'C') {
      parts.push(`C${tX(cmd.x1).toFixed(1)},${tY(cmd.y1).toFixed(1)} ${tX(cmd.x2).toFixed(1)},${tY(cmd.y2).toFixed(1)} ${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'Z') {
      parts.push('Z');
    }
  });

  return parts.join('');
}

/**
 * Gets the SVG path string d="..." for a full native character glyph in the font.
 */
export function getNativeCharSvgPath(font: any, char: string): string {
  if (!font) return '';
  const idx = font.charToGlyphIndex(char);
  if (idx <= 0) return '';
  const glyph = font.glyphs.get(idx);
  if (!glyph || !glyph.path) return '';
  const ascender = font.tables?.os2?.sTypoAscender || font.ascender || 800;
  const upm = font.unitsPerEm || 1000;
  const path = glyph.getPath(0, ascender, upm);
  return path.toPathData(2);
}

/**
 * Gets the full <svg>...</svg> element string for a full native character glyph in the font.
 */
export function getNativeCharFullSvg(font: any, char: string): string {
  const d = getNativeCharSvgPath(font, char);
  if (!d) return '';
  const upm = font?.unitsPerEm || 1000;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${upm} ${upm}" width="100%" height="100%">\n  <path d="${d}" fill="currentColor" />\n</svg>`;
}

/**
 * Isolates and extracts the diacritic contour from a specific precomposed character (e.g. 'ã' relative to 'a') in the font.
 */
export function extractDiacriticFromSpecificChar(font: any, composedChar: string, baseChar: string): any {
  if (!font) return null;
  const compIdx = font.charToGlyphIndex(composedChar);
  if (compIdx <= 0) return null;
  const compGlyph = font.glyphs.get(compIdx);
  if (!compGlyph || !compGlyph.path || !compGlyph.path.commands || compGlyph.path.commands.length === 0) {
    return null;
  }

  const baseIdx = font.charToGlyphIndex(baseChar);
  let baseBBox = { xMin: 50, xMax: 450, yMin: 0, yMax: getXHeightFromFont(font) };
  let baseGlyph: any = null;
  let baseCmds: any[] = [];
  if (baseIdx > 0) {
    baseGlyph = font.glyphs.get(baseIdx);
    if (baseGlyph && baseGlyph.path && baseGlyph.path.commands && baseGlyph.path.commands.length > 0) {
      baseCmds = baseChar === 'i' ? removeDotFromICommands(baseGlyph.path.commands) : baseGlyph.path.commands;
      baseBBox = getExactBoundingBox(baseCmds);
    }
  }

  const compContours = getGlyphContours(compGlyph.path.commands);
  if (compContours.length <= 1 && composedChar !== 'đ' && composedChar !== 'Đ') {
    return null;
  }

  const baseContours = baseCmds.length > 0 ? getGlyphContours(baseCmds) : [];
  const matchedCmds: any[] = [];
  const baseHeight = Math.max(100, baseBBox.yMax - baseBBox.yMin);
  const baseWidth = Math.max(100, baseBBox.xMax - baseBBox.xMin);

  // Position classification
  const isLowerTarget = ['ạ', 'ẹ', 'ị', 'ọ', 'ụ', 'ỵ', 'ậ', 'ặ', 'ệ', 'ộ', 'ợ', 'ự', 'Ạ', 'Ẹ', 'Ị', 'Ọ', 'Ụ', 'Ỵ', 'Ậ', 'Ặ', 'Ệ', 'Ộ', 'Ợ', 'Ự'].includes(composedChar);
  const isHornTarget = ['ơ', 'ư', 'Ơ', 'Ư'].includes(composedChar) || ['ớ', 'ờ', 'ở', 'ỡ', 'ợ', 'ứ', 'ừ', 'ử', 'ữ', 'ự', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự'].includes(composedChar);
  const isBarTarget = ['đ', 'Đ'].includes(composedChar);

  for (const contour of compContours) {
    // 1. Hole/counter of a letter is NEVER a diacritic mark
    if (isContourAnInnerHole(contour, compContours)) {
      continue;
    }

    const cBBox = getExactBoundingBox(contour);

    // 2. Reject contours matching any contour of the base character
    let matchesBase = false;
    for (const bContour of baseContours) {
      const bBBox = getExactBoundingBox(bContour);
      if (
        Math.abs(cBBox.xMin - bBBox.xMin) <= 18 &&
        Math.abs(cBBox.xMax - bBBox.xMax) <= 18 &&
        Math.abs(cBBox.yMin - bBBox.yMin) <= 18 &&
        Math.abs(cBBox.yMax - bBBox.yMax) <= 18
      ) {
        matchesBase = true;
        break;
      }
    }
    if (matchesBase) {
      continue;
    }

    let isMatch = false;

    if (isLowerTarget) {
      if (cBBox.yMax <= baseBBox.yMin + 40) {
        isMatch = true;
      }
    } else if (isHornTarget) {
      if (
        cBBox.xMax >= baseBBox.xMax - 25 &&
        cBBox.yMax >= baseBBox.yMax - 80 &&
        (cBBox.xMax - cBBox.xMin) < baseWidth * 0.85
      ) {
        isMatch = true;
      }
    } else if (isBarTarget) {
      if (
        cBBox.yMin >= baseBBox.yMin + baseHeight * 0.15 &&
        cBBox.yMax <= baseBBox.yMax * 0.95 &&
        (cBBox.xMin <= baseBBox.xMin + 30 || cBBox.xMax >= baseBBox.xMax - 30)
      ) {
        isMatch = true;
      }
    } else {
      if (
        cBBox.yMax >= baseBBox.yMax - 30 &&
        cBBox.yMin >= baseBBox.yMin + baseHeight * 0.5
      ) {
        isMatch = true;
      }
    }

    if (isMatch) {
      matchedCmds.push(...contour);
    }
  }

  if (matchedCmds.length === 0 || matchedCmds.length >= compGlyph.path.commands.length) return null;

  const path = new opentype.Path();
  path.commands = matchedCmds;
  return new opentype.Glyph({
    name: `${composedChar}_extracted_mark`,
    advanceWidth: compGlyph.advanceWidth || 500,
    path: path
  });
}

/**
 * Gets extracted diacritic SVG path string for a specific composed character.
 */
export function getExtractedDiacriticSvgPathFromChar(font: any, composedChar: string, baseChar: string): string {
  const extractedGlyph = extractDiacriticFromSpecificChar(font, composedChar, baseChar);
  if (!extractedGlyph) return '';
  return extractSvgFromGlyph(extractedGlyph, font.unitsPerEm || 1000);
}

/**
 * Gets full <svg>...</svg> code string for an extracted diacritic path.
 * Computes tight bounding box for the viewBox so the vector imports cleanly into design tools.
 */
export function formatSvgPathToFullSvg(pathD: string): string {
  if (!pathD) return '';
  try {
    const cmds = parseSvgPath(pathD);
    if (cmds && cmds.length > 0) {
      const bbox = getExactBoundingBox(cmds);
      if (
        isFinite(bbox.xMin) &&
        isFinite(bbox.xMax) &&
        isFinite(bbox.yMin) &&
        isFinite(bbox.yMax) &&
        bbox.xMax > bbox.xMin &&
        bbox.yMax > bbox.yMin
      ) {
        const w = Math.round(bbox.xMax - bbox.xMin);
        const h = Math.round(bbox.yMax - bbox.yMin);
        const pad = Math.max(10, Math.round(Math.max(w, h) * 0.1));
        const vx = Math.round(bbox.xMin - pad);
        const vy = Math.round(bbox.yMin - pad);
        const vw = w + pad * 2;
        const vh = h + pad * 2;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="100%" height="100%">\n  <path d="${pathD}" fill="currentColor" />\n</svg>`;
      }
    }
  } catch {
    // fallback
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -250 500 500" width="100%" height="100%">\n  <path d="${pathD}" fill="currentColor" />\n</svg>`;
}




