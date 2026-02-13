// 可选字体配置
export const FONT_OPTIONS = [
  {
    id: "playfair-display",
    name: "Playfair Display",
    family: "'Playfair Display', Georgia, serif",
    category: "serif",
    preview: "优雅的衬线字体 Elegant Serif",
  },
  {
    id: "instrument-sans",
    name: "Instrument Sans",
    family: "'Instrument Sans', -apple-system, sans-serif",
    category: "sans-serif",
    preview: "现代无衬线字体 Modern Sans",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    family: "'Merriweather', Georgia, serif",
    category: "serif",
    preview: "适合阅读的衬线字体 Readable Serif",
  },
  {
    id: "lora",
    name: "Lora",
    family: "'Lora', Georgia, serif",
    category: "serif",
    preview: "经典衬线字体 Classic Serif",
  },
  {
    id: "source-serif",
    name: "Source Serif Pro",
    family: "'Source Serif Pro', Georgia, serif",
    category: "serif",
    preview: "优雅的衬线字体 Elegant Serif",
  },
  {
    id: "inter",
    name: "Inter",
    family: "'Inter', -apple-system, sans-serif",
    category: "sans-serif",
    preview: "清晰的无衬线字体 Clear Sans",
  },
  {
    id: "roboto",
    name: "Roboto",
    family: "'Roboto', -apple-system, sans-serif",
    category: "sans-serif",
    preview: "现代无衬线字体 Modern Sans",
  },
  {
    id: "open-sans",
    name: "Open Sans",
    family: "'Open Sans', -apple-system, sans-serif",
    category: "sans-serif",
    preview: "友好的无衬线字体 Friendly Sans",
  },
  {
    id: "noto-serif",
    name: "Noto Serif",
    family: "'Noto Serif SC', 'Noto Serif', Georgia, serif",
    category: "serif",
    preview: "适合中文的衬线字体 思源宋体",
  },
  {
    id: "noto-sans",
    name: "Noto Sans",
    family: "'Noto Sans SC', 'Noto Sans', -apple-system, sans-serif",
    category: "sans-serif",
    preview: "适合中文的无衬线字体 思源黑体",
  },
  {
    id: "system",
    name: "System Default",
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    category: "system",
    preview: "系统默认字体 System Font",
  },
];

// 行距选项
export const LINE_HEIGHT_OPTIONS = [
  { value: 1.4, label: "紧凑 Compact" },
  { value: 1.6, label: "适中 Normal" },
  { value: 1.75, label: "舒适 Comfortable" },
  { value: 2.0, label: "宽松 Relaxed" },
  { value: 2.5, label: "超宽 Extra Wide" },
];

// 字体大小选项（像素）
export const FONT_SIZE_OPTIONS = [
  { value: 14, label: "较小 Small (14px)" },
  { value: 16, label: "标准 Standard (16px)" },
  { value: 18, label: "较大 Large (18px)" },
  { value: 20, label: "很大 X-Large (20px)" },
  { value: 22, label: "超大 XX-Large (22px)" },
];

// 应用编辑器字体配置
export function applyEditorFonts(config) {
  const {
    titleFont = "playfair-display",
    contentFont = "instrument-sans",
    lineHeight = 1.75,
    fontSize = 16,
  } = config;

  const titleFontFamily = FONT_OPTIONS.find((f) => f.id === titleFont)?.family;
  const contentFontFamily = FONT_OPTIONS.find(
    (f) => f.id === contentFont
  )?.family;

  if (titleFontFamily) {
    document.documentElement.style.setProperty(
      "--editor-title-font",
      titleFontFamily
    );
  }

  if (contentFontFamily) {
    document.documentElement.style.setProperty(
      "--editor-content-font",
      contentFontFamily
    );
  }

  document.documentElement.style.setProperty(
    "--editor-line-height",
    lineHeight.toString()
  );
  document.documentElement.style.setProperty(
    "--editor-font-size",
    `${fontSize}px`
  );
}

// 获取需要加载的 Google Fonts
export function getRequiredFonts(titleFont, contentFont) {
  const fonts = new Set();
  const fontIds = [titleFont, contentFont];

  fontIds.forEach((id) => {
    const font = FONT_OPTIONS.find((f) => f.id === id);
    if (font && !font.family.includes("-apple-system") && !font.family.includes("sans-serif")) {
      // Extract font name from family
      const match = font.family.match(/'([^']+)'/);
      if (match) {
        fonts.add(match[1]);
      }
    }
  });

  return Array.from(fonts);
}

// 加载 Google Fonts
export function loadGoogleFonts(fonts) {
  if (fonts.length === 0) return;

  const existingLink = document.getElementById("editor-fonts");
  if (existingLink) {
    existingLink.remove();
  }

  const fontFamilies = fonts.map((font) => font.replace(/ /g, "+")).join("&family=");
  const link = document.createElement("link");
  link.id = "editor-fonts";
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}
