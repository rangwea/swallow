// 预定义主题配置 - 包含完整的颜色变量
export const APP_THEMES = [
  {
    id: "sepia",
    nameKey: "warmSepia",
    name: "Warm Sepia",
    description: "温暖的米色主题",
    colors: {
      light: {
        background: "42 40% 96%",
        foreground: "25 25% 20%",
        card: "40 35% 98%",
        "card-foreground": "25 25% 20%",
        popover: "40 35% 98%",
        "popover-foreground": "25 25% 20%",
        primary: "25 25% 20%",
        "primary-foreground": "42 40% 96%",
        secondary: "38 30% 90%",
        "secondary-foreground": "25 25% 20%",
        muted: "38 25% 88%",
        "muted-foreground": "25 15% 45%",
        accent: "43 75% 60%",
        "accent-foreground": "25 25% 20%",
        destructive: "0 70% 55%",
        "destructive-foreground": "42 40% 96%",
        border: "38 20% 85%",
        input: "38 20% 85%",
        ring: "43 75% 60%",
      },
      dark: {
        background: "25 20% 12%",
        foreground: "42 30% 92%",
        card: "25 18% 15%",
        "card-foreground": "42 30% 92%",
        popover: "25 18% 15%",
        "popover-foreground": "42 30% 92%",
        primary: "42 30% 92%",
        "primary-foreground": "25 20% 12%",
        secondary: "25 15% 20%",
        "secondary-foreground": "42 30% 92%",
        muted: "25 12% 22%",
        "muted-foreground": "42 15% 60%",
        accent: "43 70% 55%",
        "accent-foreground": "25 20% 12%",
        destructive: "0 65% 50%",
        "destructive-foreground": "42 30% 92%",
        border: "25 12% 25%",
        input: "25 12% 25%",
        ring: "43 70% 55%",
      },
    },
  },
  {
    id: "slate",
    nameKey: "coolSlate",
    name: "Cool Slate",
    description: "冷色调灰蓝主题",
    colors: {
      light: {
        background: "215 28% 95%",
        foreground: "222.2 84% 4.9%",
        card: "215 30% 98%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "215 30% 98%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "222.2 47.4% 11.2%",
        "primary-foreground": "210 40% 98%",
        secondary: "215 25% 90%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "215 22% 88%",
        "muted-foreground": "215.4 16.3% 46.9%",
        accent: "210 40% 50%",
        "accent-foreground": "222.2 47.4% 11.2%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 40% 98%",
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "222.2 84% 4.9%",
      },
      dark: {
        background: "215 22% 11%",
        foreground: "210 40% 98%",
        card: "215 20% 14%",
        "card-foreground": "210 40% 98%",
        popover: "215 20% 14%",
        "popover-foreground": "210 40% 98%",
        primary: "210 40% 98%",
        "primary-foreground": "222.2 47.4% 11.2%",
        secondary: "215 18% 20%",
        "secondary-foreground": "210 40% 98%",
        muted: "215 15% 22%",
        "muted-foreground": "215 20.2% 65.1%",
        accent: "217.2 91.2% 59.8%",
        "accent-foreground": "222.2 47.4% 11.2%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 40% 98%",
        border: "217.2 32.6% 17.5%",
        input: "217.2 32.6% 17.5%",
        ring: "212.7 26.8% 83.9%",
      },
    },
  },
  {
    id: "rose",
    nameKey: "softRose",
    name: "Soft Rose",
    description: "柔和的玫瑰粉主题",
    colors: {
      light: {
        background: "350 45% 96%",
        foreground: "240 10% 3.9%",
        card: "350 45% 98%",
        "card-foreground": "240 10% 3.9%",
        popover: "350 45% 98%",
        "popover-foreground": "240 10% 3.9%",
        primary: "346.8 77.2% 49.8%",
        "primary-foreground": "355.7 100% 97.3%",
        secondary: "350 35% 92%",
        "secondary-foreground": "240 5.9% 10%",
        muted: "350 28% 89%",
        "muted-foreground": "240 3.8% 46.1%",
        accent: "346.8 77.2% 49.8%",
        "accent-foreground": "240 5.9% 10%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "0 0% 98%",
        border: "240 5.9% 90%",
        input: "240 5.9% 90%",
        ring: "346.8 77.2% 49.8%",
      },
      dark: {
        background: "350 22% 11%",
        foreground: "0 0% 95%",
        card: "350 20% 14%",
        "card-foreground": "0 0% 95%",
        popover: "350 20% 14%",
        "popover-foreground": "0 0% 95%",
        primary: "346.8 77.2% 49.8%",
        "primary-foreground": "355.7 100% 97.3%",
        secondary: "350 18% 20%",
        "secondary-foreground": "0 0% 98%",
        muted: "350 15% 22%",
        "muted-foreground": "240 5% 64.9%",
        accent: "346.8 77.2% 49.8%",
        "accent-foreground": "0 0% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "0 85.7% 97.3%",
        border: "240 3.7% 15.9%",
        input: "240 3.7% 15.9%",
        ring: "346.8 77.2% 49.8%",
      },
    },
  },
  {
    id: "emerald",
    nameKey: "freshEmerald",
    name: "Fresh Emerald",
    description: "清新的翡翠绿主题",
    colors: {
      light: {
        background: "150 30% 95%",
        foreground: "240 10% 3.9%",
        card: "150 30% 98%",
        "card-foreground": "240 10% 3.9%",
        popover: "150 30% 98%",
        "popover-foreground": "240 10% 3.9%",
        primary: "142.1 76.2% 36.3%",
        "primary-foreground": "355.7 100% 97.3%",
        secondary: "150 25% 90%",
        "secondary-foreground": "240 5.9% 10%",
        muted: "150 20% 87%",
        "muted-foreground": "240 3.8% 46.1%",
        accent: "142.1 76.2% 36.3%",
        "accent-foreground": "240 5.9% 10%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "0 0% 98%",
        border: "240 5.9% 90%",
        input: "240 5.9% 90%",
        ring: "142.1 76.2% 36.3%",
      },
      dark: {
        background: "150 22% 11%",
        foreground: "0 0% 95%",
        card: "150 20% 14%",
        "card-foreground": "0 0% 95%",
        popover: "150 20% 14%",
        "popover-foreground": "0 0% 95%",
        primary: "142.1 70.6% 45.3%",
        "primary-foreground": "144.9 80.4% 10%",
        secondary: "150 18% 20%",
        "secondary-foreground": "0 0% 98%",
        muted: "150 15% 22%",
        "muted-foreground": "240 5% 64.9%",
        accent: "142.1 70.6% 45.3%",
        "accent-foreground": "0 0% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "0 85.7% 97.3%",
        border: "240 3.7% 15.9%",
        input: "240 3.7% 15.9%",
        ring: "142.1 70.6% 45.3%",
      },
    },
  },
  {
    id: "violet",
    nameKey: "deepViolet",
    name: "Deep Violet",
    description: "深邃的紫罗兰主题",
    colors: {
      light: {
        background: "260 35% 96%",
        foreground: "224 71.4% 4.1%",
        card: "260 35% 98%",
        "card-foreground": "224 71.4% 4.1%",
        popover: "260 35% 98%",
        "popover-foreground": "224 71.4% 4.1%",
        primary: "262.1 83.3% 57.8%",
        "primary-foreground": "210 20% 98%",
        secondary: "260 30% 92%",
        "secondary-foreground": "220.9 39.3% 11%",
        muted: "260 23% 89%",
        "muted-foreground": "220 8.9% 46.1%",
        accent: "262.1 83.3% 57.8%",
        "accent-foreground": "220.9 39.3% 11%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 20% 98%",
        border: "220 13% 91%",
        input: "220 13% 91%",
        ring: "262.1 83.3% 57.8%",
      },
      dark: {
        background: "260 22% 11%",
        foreground: "210 20% 98%",
        card: "260 20% 14%",
        "card-foreground": "210 20% 98%",
        popover: "260 20% 14%",
        "popover-foreground": "210 20% 98%",
        primary: "263.4 70% 50.4%",
        "primary-foreground": "210 20% 98%",
        secondary: "260 18% 20%",
        "secondary-foreground": "210 20% 98%",
        muted: "260 15% 22%",
        "muted-foreground": "215.4 16.3% 56.9%",
        accent: "263.4 70% 50.4%",
        "accent-foreground": "210 20% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 20% 98%",
        border: "215 27.9% 16.9%",
        input: "215 27.9% 16.9%",
        ring: "263.4 70% 50.4%",
      },
    },
  },
  {
    "id": "white",
    "nameKey": "pureWhite",
    "name": "Pure White",
    "description": "纯白背景与中性色控件",
    "colors": {
      "light": {
        "background": "0 0% 100%",
        "foreground": "0 0% 15%",
        "card": "0 0% 99%",
        "card-foreground": "0 0% 15%",
        "popover": "0 0% 99%",
        "popover-foreground": "0 0% 15%",
        "primary": "0 0% 20%",
        "primary-foreground": "0 0% 100%",
        "secondary": "0 0% 95%",
        "secondary-foreground": "0 0% 15%",
        "muted": "0 0% 96%",
        "muted-foreground": "0 0% 43%",
        "accent": "0 0% 35%",
        "accent-foreground": "0 0% 100%",
        "destructive": "0 70% 50%",
        "destructive-foreground": "0 0% 100%",
        "border": "0 0% 88%",
        "input": "0 0% 88%",
        "ring": "0 0% 50%"
      },
      "dark": {
        "background": "0 0% 9%",
        "foreground": "0 0% 94%",
        "card": "0 0% 12%",
        "card-foreground": "0 0% 94%",
        "popover": "0 0% 12%",
        "popover-foreground": "0 0% 94%",
        "primary": "0 0% 92%",
        "primary-foreground": "0 0% 10%",
        "secondary": "0 0% 18%",
        "secondary-foreground": "0 0% 94%",
        "muted": "0 0% 20%",
        "muted-foreground": "0 0% 66%",
        "accent": "0 0% 72%",
        "accent-foreground": "0 0% 12%",
        "destructive": "0 65% 55%",
        "destructive-foreground": "0 0% 100%",
        "border": "0 0% 26%",
        "input": "0 0% 26%",
        "ring": "0 0% 60%"
      }
    }
  },
  {
    "id": "neutral-gray",
    "nameKey": "neutralGray",
    "name": "Neutral Gray",
    "description": "浅灰背景与明亮内容区",
    "colors": {
      "light": {
        "background": "0 0% 94%",
        "foreground": "0 0% 15%",
        "card": "0 0% 98%",
        "card-foreground": "0 0% 15%",
        "popover": "0 0% 98%",
        "popover-foreground": "0 0% 15%",
        "primary": "0 0% 20%",
        "primary-foreground": "0 0% 100%",
        "secondary": "0 0% 88%",
        "secondary-foreground": "0 0% 15%",
        "muted": "0 0% 90%",
        "muted-foreground": "0 0% 43%",
        "accent": "0 0% 35%",
        "accent-foreground": "0 0% 100%",
        "destructive": "0 70% 50%",
        "destructive-foreground": "0 0% 100%",
        "border": "0 0% 88%",
        "input": "0 0% 88%",
        "ring": "0 0% 50%"
      },
      "dark": {
        "background": "0 0% 15%",
        "foreground": "0 0% 94%",
        "card": "0 0% 19%",
        "card-foreground": "0 0% 94%",
        "popover": "0 0% 19%",
        "popover-foreground": "0 0% 94%",
        "primary": "0 0% 92%",
        "primary-foreground": "0 0% 10%",
        "secondary": "0 0% 24%",
        "secondary-foreground": "0 0% 94%",
        "muted": "0 0% 26%",
        "muted-foreground": "0 0% 66%",
        "accent": "0 0% 72%",
        "accent-foreground": "0 0% 12%",
        "destructive": "0 65% 55%",
        "destructive-foreground": "0 0% 100%",
        "border": "0 0% 26%",
        "input": "0 0% 26%",
        "ring": "0 0% 60%"
      }
    }
  },

];

// 应用主题到页面
export function applyTheme(themeId) {
  const theme = APP_THEMES.find((t) => t.id === themeId);
  if (!theme) {
    console.warn(`Theme ${themeId} not found`);
    return;
  }

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  console.log(`Applying theme: ${themeId}, isDark: ${isDark}`);

  // Apply CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

// 初始化主题（从配置加载）
export async function initializeTheme() {
  try {
    // First try to get from localStorage for instant load
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("app-theme");
      if (savedTheme) {
        console.log("Loading theme from localStorage:", savedTheme);
        applyTheme(savedTheme);
        // Continue to load from config in background to sync
      }
    }

    // Then load from backend config
    const { ConfGet } = await import("/wailsjs/go/backend/App");
    const result = await ConfGet("app");

    if (result.code === 1 && result.data && result.data.appTheme) {
      console.log("Loading theme from config:", result.data.appTheme);
      applyTheme(result.data.appTheme);
      // Sync to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("app-theme", result.data.appTheme);
      }
    } else if (!localStorage.getItem("app-theme")) {
      console.log("No theme in config or localStorage, using default");
      // Apply default theme only if localStorage also doesn't have it
      applyTheme("sepia");
    }
  } catch (error) {
    console.warn("Failed to load theme from config:", error);
    // Only apply default if localStorage doesn't have a theme
    if (typeof window !== "undefined" && !localStorage.getItem("app-theme")) {
      applyTheme("sepia");
    }
  }
}
