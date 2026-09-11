import type { DiacriticTemplate, AutoPositionRules } from '../session';
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
    name: 'Thanh gạch chữ đ/Đ (Stroke/Bar)',
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
  doubleAccentCustomY: 0
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
