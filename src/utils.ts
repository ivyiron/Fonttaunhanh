import { GlyphEditState } from './types';

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
    const paths = doc.querySelectorAll('path');
    
    if (paths.length > 0) {
      const pathDatas: string[] = [];
      paths.forEach(p => {
        const d = p.getAttribute('d');
        if (d) pathDatas.push(d);
      });
      return pathDatas.join(' ');
    }

    // Regex fallback
    const regex = /d\s*=\s*["']([^"']+)["']/g;
    let match;
    const pathDatas: string[] = [];
    while ((match = regex.exec(cleanSvg)) !== null) {
      pathDatas.push(match[1]);
    }
    if (pathDatas.length > 0) {
      return pathDatas.join(' ');
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
 * Transforms coordinates of a list of commands using scale, offsets and Y-flipping
 */
export function transformCommands(
  cmds: any[],
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
  flipY: boolean
): any[] {
  const tY = (val: number) => {
    let y = val;
    if (flipY) y = -y;
    return y * scaleY + offsetY;
  };
  
  const tX = (val: number) => {
    return val * scaleX + offsetX;
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
