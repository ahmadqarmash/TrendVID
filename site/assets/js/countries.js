/**
 * Country list for the filter dropdown (code + localized names).
 * `GLOBAL` is a TrendVid pseudo-code: the API aggregates several regions for it.
 */
export const COUNTRIES = [
  { code: 'GLOBAL', name: { en: 'Global', ar: 'عالمي' } },
  { code: 'US', name: { en: 'United States', ar: 'الولايات المتحدة' } },
  { code: 'GB', name: { en: 'United Kingdom', ar: 'المملكة المتحدة' } },
  { code: 'CA', name: { en: 'Canada', ar: 'كندا' } },
  { code: 'AU', name: { en: 'Australia', ar: 'أستراليا' } },
  { code: 'DE', name: { en: 'Germany', ar: 'ألمانيا' } },
  { code: 'FR', name: { en: 'France', ar: 'فرنسا' } },
  { code: 'IT', name: { en: 'Italy', ar: 'إيطاليا' } },
  { code: 'ES', name: { en: 'Spain', ar: 'إسبانيا' } },
  { code: 'TR', name: { en: 'Türkiye', ar: 'تركيا' } },
  { code: 'SA', name: { en: 'Saudi Arabia', ar: 'السعودية' } },
  { code: 'AE', name: { en: 'United Arab Emirates', ar: 'الإمارات' } },
  { code: 'EG', name: { en: 'Egypt', ar: 'مصر' } },
  { code: 'JO', name: { en: 'Jordan', ar: 'الأردن' } },
  { code: 'IQ', name: { en: 'Iraq', ar: 'العراق' } },
  { code: 'LB', name: { en: 'Lebanon', ar: 'لبنان' } },
  { code: 'MA', name: { en: 'Morocco', ar: 'المغرب' } },
  { code: 'DZ', name: { en: 'Algeria', ar: 'الجزائر' } },
  { code: 'TN', name: { en: 'Tunisia', ar: 'تونس' } },
  { code: 'QA', name: { en: 'Qatar', ar: 'قطر' } },
  { code: 'KW', name: { en: 'Kuwait', ar: 'الكويت' } },
  { code: 'BH', name: { en: 'Bahrain', ar: 'البحرين' } },
  { code: 'OM', name: { en: 'Oman', ar: 'عُمان' } },
  { code: 'YE', name: { en: 'Yemen', ar: 'اليمن' } },
  { code: 'IN', name: { en: 'India', ar: 'الهند' } },
  { code: 'JP', name: { en: 'Japan', ar: 'اليابان' } },
  { code: 'KR', name: { en: 'South Korea', ar: 'كوريا الجنوبية' } },
  { code: 'BR', name: { en: 'Brazil', ar: 'البرازيل' } },
  { code: 'MX', name: { en: 'Mexico', ar: 'المكسيك' } },
  { code: 'AR', name: { en: 'Argentina', ar: 'الأرجنتين' } },
  { code: 'AT', name: { en: 'Austria', ar: 'النمسا' } },
  { code: 'BE', name: { en: 'Belgium', ar: 'بلجيكا' } },
  { code: 'BG', name: { en: 'Bulgaria', ar: 'بلغاريا' } },
  { code: 'CH', name: { en: 'Switzerland', ar: 'سويسرا' } },
  { code: 'CL', name: { en: 'Chile', ar: 'تشيلي' } },
  { code: 'CO', name: { en: 'Colombia', ar: 'كولومبيا' } },
  { code: 'CZ', name: { en: 'Czechia', ar: 'التشيك' } },
  { code: 'DK', name: { en: 'Denmark', ar: 'الدنمارك' } },
  { code: 'FI', name: { en: 'Finland', ar: 'فنلندا' } },
  { code: 'GR', name: { en: 'Greece', ar: 'اليونان' } },
  { code: 'HK', name: { en: 'Hong Kong', ar: 'هونغ كونغ' } },
  { code: 'HU', name: { en: 'Hungary', ar: 'المجر' } },
  { code: 'ID', name: { en: 'Indonesia', ar: 'إندونيسيا' } },
  { code: 'IE', name: { en: 'Ireland', ar: 'أيرلندا' } },
  { code: 'KE', name: { en: 'Kenya', ar: 'كينيا' } },
  { code: 'MY', name: { en: 'Malaysia', ar: 'ماليزيا' } },
  { code: 'NG', name: { en: 'Nigeria', ar: 'نيجيريا' } },
  { code: 'NL', name: { en: 'Netherlands', ar: 'هولندا' } },
  { code: 'NO', name: { en: 'Norway', ar: 'النرويج' } },
  { code: 'NZ', name: { en: 'New Zealand', ar: 'نيوزيلندا' } },
  { code: 'PH', name: { en: 'Philippines', ar: 'الفلبين' } },
  { code: 'PK', name: { en: 'Pakistan', ar: 'باكستان' } },
  { code: 'PL', name: { en: 'Poland', ar: 'بولندا' } },
  { code: 'PT', name: { en: 'Portugal', ar: 'البرتغال' } },
  { code: 'RO', name: { en: 'Romania', ar: 'رومانيا' } },
  { code: 'RU', name: { en: 'Russia', ar: 'روسيا' } },
  { code: 'SE', name: { en: 'Sweden', ar: 'السويد' } },
  { code: 'SG', name: { en: 'Singapore', ar: 'سنغافورة' } },
  { code: 'TH', name: { en: 'Thailand', ar: 'تايلاند' } },
  { code: 'UA', name: { en: 'Ukraine', ar: 'أوكرانيا' } },
  { code: 'VN', name: { en: 'Vietnam', ar: 'فيتنام' } },
  { code: 'ZA', name: { en: 'South Africa', ar: 'جنوب أفريقيا' } },
];

/** Country codes the API accepts (everything except the GLOBAL pseudo-code). */
export const COUNTRY_CODES = COUNTRIES.map((c) => c.code);

/** Look up a localized country name, falling back to the code itself. */
export function countryName(code, lang) {
  const hit = COUNTRIES.find((c) => c.code === code);
  if (!hit) return code;
  return hit.name[lang] || hit.name.en;
}

/** True when the API supports this code (keeps out bogus values from state). */
export function isSupportedCountry(code) {
  return COUNTRY_CODES.includes(code);
}
