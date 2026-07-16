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
            if (!coverage || !coverage.glyphs) continue;
            const leftGlyphs = coverage.glyphs;
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
            const coverageGlyphs = subtable.coverage?.glyphs || [];
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
 * Builds a binary legacy 'kern' table (format 0, version 0) from font.kerningPairs.
 * This legacy table is essential for modern web browsers when GPOS is omitted,
 * allowing perfect kerning for both standard and custom Vietnamese character pairs.
 */
export function buildKernTable(font: any): Uint8Array {
  const pairs: { left: number; right: number; value: number }[] = [];
  if (font && font.kerningPairs) {
    for (const [key, val] of Object.entries(font.kerningPairs)) {
      const parts = key.split(',');
      if (parts.length !== 2) continue;
      const left = parseInt(parts[0], 10);
      const right = parseInt(parts[1], 10);
      if (isNaN(left) || isNaN(right)) continue;
      if (typeof val === 'number' && val !== 0) {
        pairs.push({ left, right, value: val });
      }
    }
  }

  // Sort by left glyph index, then right glyph index as mandated by the TrueType specification
  pairs.sort((a, b) => {
    if (a.left !== b.left) {
      return a.left - b.left;
    }
    return a.right - b.right;
  });

  const nPairs = pairs.length;
  const subtableSize = 14 + 6 * nPairs;
  const totalSize = 4 + subtableSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Main header
  view.setUint16(0, 0); // version 0
  view.setUint16(2, 1); // 1 subtable

  // Subtable header
  view.setUint16(4, 0); // subtable version 0
  view.setUint16(6, subtableSize); // length of subtable
  view.setUint16(8, 1); // coverage format 0 (horizontal)

  // Format 0 search values
  const maxPowerOf2 = nPairs > 0 ? Math.pow(2, Math.floor(Math.log2(nPairs))) : 0;
  const searchRange = maxPowerOf2 * 6;
  const entrySelector = nPairs > 0 ? Math.floor(Math.log2(maxPowerOf2)) : 0;
  const rangeShift = (nPairs - maxPowerOf2) * 6;

  view.setUint16(10, nPairs);
  view.setUint16(12, searchRange);
  view.setUint16(14, entrySelector);
  view.setUint16(16, rangeShift);

  // Pairs records
  let offset = 18;
  for (let i = 0; i < nPairs; i++) {
    const pair = pairs[i];
    view.setUint16(offset, pair.left);
    view.setUint16(offset + 2, pair.right);
    view.setInt16(offset + 4, pair.value);
    offset += 6;
  }

  return new Uint8Array(buffer);
}

/**
 * Merges advanced OpenType layout tables (GPOS, GSUB, GDEF, BASE) from the original font 
 * into the compiled font buffer to guarantee pristine original kerning and substitution features.
 * When skipGPOS is true, the GPOS table is omitted, allowing browsers to fallback to the legacy 'kern'
 * table which successfully includes all custom Vietnamese character kerning.
 */
export function injectAdvancedLayoutTables(
  compiledBuffer: ArrayBuffer, 
  originalBuffer: ArrayBuffer, 
  skipGPOS: boolean = false,
  kernTableBytes?: Uint8Array
): ArrayBuffer {
  try {
    const parseTables = (buf: ArrayBuffer) => {
      const view = new DataView(buf);
      const sfntVersion = view.getUint32(0);
      const numTables = view.getUint16(4);
      
      const tables: Record<string, Uint8Array> = {};
      let offset = 12;
      for (let i = 0; i < numTables; i++) {
        const tagBytes = [
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        ];
        const tag = String.fromCharCode(...tagBytes);
        const tableOffset = view.getUint32(offset + 8);
        const length = view.getUint32(offset + 12);
        
        // Use slice to copy safely without detaching backing store
        const data = new Uint8Array(buf.slice(tableOffset, tableOffset + length));
        tables[tag] = data;
        
        offset += 16;
      }
      return { sfntVersion, tables };
    };

    const original = parseTables(originalBuffer);
    const compiled = parseTables(compiledBuffer);

    let injectedAny = false;

    // Inject/overwrite the custom legacy kern table if provided
    if (kernTableBytes) {
      compiled.tables['kern'] = kernTableBytes;
      injectedAny = true;
    }

    // Ensure we strip GPOS from compiled tables if GPOS is skipped
    if (skipGPOS && compiled.tables['GPOS']) {
      delete compiled.tables['GPOS'];
      injectedAny = true;
    }

    const tagsToInject = skipGPOS ? ['GSUB', 'GDEF', 'BASE'] : ['GPOS', 'GSUB', 'GDEF', 'BASE'];

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

