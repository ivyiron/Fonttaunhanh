/**
 * Rewrites the name table so a compiled font does not collide with the original
 * in the user's font menu.
 *
 * The Sửa font version of this code was the better of the two and is the one
 * kept: it sanitizes the PostScript name to ASCII, strips diacritics before
 * writing the Macintosh platform (MacRoman cannot store them), and removes stray
 * non-platform keys from font.names. Without that last step opentype.js throws
 * `Name table entry "en" does not exist` on some fonts.
 */
export function applyFontNaming(
  font: any,
  familyName: string,
  subfamilyName: string,
  version = '1.00'
): void {
  if (!font?.names || !familyName) return;

  const subfamily = subfamilyName || 'Regular';
  const fullName = `${familyName} ${subfamily}`;

  const toAscii = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');

  const postScriptName =
    `${toAscii(familyName) || 'CustomFont'}-${toAscii(subfamily) || 'Regular'}`.slice(0, 63);
  const uniqueID = `${familyName} ${subfamily};Version ${version}`;

  const setAllLangs = (nameObj: any, newVal: string) => {
    if (!nameObj) return { en: newVal };
    Object.keys(nameObj).forEach(lang => { nameObj[lang] = newVal; });
    if (!nameObj.en) nameObj.en = newVal;
    return nameObj;
  };

  const names = font.names as any;

  // Anything that is not a platform table confuses the serializer
  const validPlatforms = ['unicode', 'macintosh', 'windows', 'custom'];
  Object.keys(names).forEach(k => {
    if (!validPlatforms.includes(k)) delete names[k];
  });

  // Windows and Unicode store UTF-16BE, so they can carry Vietnamese names as typed
  for (const platform of ['unicode', 'windows']) {
    if (!names[platform]) names[platform] = {};
    names[platform].fontFamily = setAllLangs(names[platform].fontFamily, familyName);
    names[platform].fontSubfamily = setAllLangs(names[platform].fontSubfamily, subfamily);
    names[platform].fullName = setAllLangs(names[platform].fullName, fullName);
    names[platform].postScriptName = setAllLangs(names[platform].postScriptName, postScriptName);
    names[platform].uniqueID = setAllLangs(names[platform].uniqueID, uniqueID);
    if (names[platform].preferredFamily) {
      names[platform].preferredFamily = setAllLangs(names[platform].preferredFamily, familyName);
    }
    if (names[platform].preferredSubfamily) {
      names[platform].preferredSubfamily = setAllLangs(names[platform].preferredSubfamily, subfamily);
    }
  }

  // Macintosh is MacRoman, so strip accents rather than let the encoder throw
  const macFamily = familyName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!names.macintosh) names.macintosh = {};
  names.macintosh.fontFamily = setAllLangs(names.macintosh.fontFamily, macFamily);
  names.macintosh.fontSubfamily = setAllLangs(names.macintosh.fontSubfamily, subfamily);
  names.macintosh.fullName = setAllLangs(names.macintosh.fullName, `${macFamily} ${subfamily}`);
  names.macintosh.postScriptName = setAllLangs(names.macintosh.postScriptName, postScriptName);
  names.macintosh.uniqueID = setAllLangs(
    names.macintosh.uniqueID, `${macFamily} ${subfamily};Version ${version}`
  );
}

/**
 * Gives every glyph a name. Unnamed glyphs make the CFF/post serializer fail
 * with a CHARARRAY error that says nothing about which glyph caused it.
 */
export function ensureGlyphNames(font: any): void {
  if (!font?.glyphs?.length) return;
  for (let i = 0; i < font.glyphs.length; i++) {
    const g = font.glyphs.get(i);
    if (g && !g.name) {
      g.name = g.unicode
        ? `uni${g.unicode.toString(16).toUpperCase().padStart(4, '0')}`
        : `glyph${i}`;
    }
  }
}
