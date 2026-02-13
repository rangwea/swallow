// 预定义主题配置 - 包含完整的颜色变量
export const APP_THEMES = [
  {
    id: "sepia",
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
    name: "Cool Slate",
    description: "冷色调灰蓝主题",
    colors: {
      light: {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        card: "0 0% 100%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "0 0% 100%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "222.2 47.4% 11.2%",
        "primary-foreground": "210 40% 98%",
        secondary: "210 40% 96.1%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "210 40% 96.1%",
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
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        card: "222.2 84% 4.9%",
        "card-foreground": "210 40% 98%",
        popover: "222.2 84% 4.9%",
        "popover-foreground": "210 40% 98%",
        primary: "210 40% 98%",
        "primary-foreground": "222.2 47.4% 11.2%",
        secondary: "217.2 32.6% 17.5%",
        "secondary-foreground": "210 40% 98%",
        muted: "217.2 32.6% 17.5%",
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
    name: "Soft Rose",
    description: "柔和的玫瑰粉主题",
    colors: {
      light: {
        background: "0 0% 100%",
        foreground: "240 10% 3.9%",
        card: "0 0% 100%",
        "card-foreground": "240 10% 3.9%",
        popover: "0 0% 100%",
        "popover-foreground": "240 10% 3.9%",
        primary: "346.8 77.2% 49.8%",
        "primary-foreground": "355.7 100% 97.3%",
        secondary: "240 4.8% 95.9%",
        "secondary-foreground": "240 5.9% 10%",
        muted: "240 4.8% 95.9%",
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
        background: "20 14.3% 4.1%",
        foreground: "0 0% 95%",
        card: "24 9.8% 10%",
        "card-foreground": "0 0% 95%",
        popover: "0 0% 9%",
        "popover-foreground": "0 0% 95%",
        primary: "346.8 77.2% 49.8%",
        "primary-foreground": "355.7 100% 97.3%",
        secondary: "240 3.7% 15.9%",
        "secondary-foreground": "0 0% 98%",
        muted: "0 0% 15%",
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
    name: "Fresh Emerald",
    description: "清新的翡翠绿主题",
    colors: {
      light: {
        background: "0 0% 100%",
        foreground: "240 10% 3.9%",
        card: "0 0% 100%",
        "card-foreground": "240 10% 3.9%",
        popover: "0 0% 100%",
        "popover-foreground": "240 10% 3.9%",
        primary: "142.1 76.2% 36.3%",
        "primary-foreground": "355.7 100% 97.3%",
        secondary: "240 4.8% 95.9%",
        "secondary-foreground": "240 5.9% 10%",
        muted: "240 4.8% 95.9%",
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
        background: "20 14.3% 4.1%",
        foreground: "0 0% 95%",
        card: "24 9.8% 10%",
        "card-foreground": "0 0% 95%",
        popover: "0 0% 9%",
        "popover-foreground": "0 0% 95%",
        primary: "142.1 70.6% 45.3%",
        "primary-foreground": "144.9 80.4% 10%",
        secondary: "240 3.7% 15.9%",
        "secondary-foreground": "0 0% 98%",
        muted: "0 0% 15%",
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
    name: "Deep Violet",
    description: "深邃的紫罗兰主题",
    colors: {
      light: {
        background: "0 0% 100%",
        foreground: "224 71.4% 4.1%",
        card: "0 0% 100%",
        "card-foreground": "224 71.4% 4.1%",
        popover: "0 0% 100%",
        "popover-foreground": "224 71.4% 4.1%",
        primary: "262.1 83.3% 57.8%",
        "primary-foreground": "210 20% 98%",
        secondary: "220 14.3% 95.9%",
        "secondary-foreground": "220.9 39.3% 11%",
        muted: "220 14.3% 95.9%",
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
        background: "224 71.4% 4.1%",
        foreground: "210 20% 98%",
        card: "224 71.4% 4.1%",
        "card-foreground": "210 20% 98%",
        popover: "224 71.4% 4.1%",
        "popover-foreground": "210 20% 98%",
        primary: "263.4 70% 50.4%",
        "primary-foreground": "210 20% 98%",
        secondary: "215 27.9% 16.9%",
        "secondary-foreground": "210 20% 98%",
        muted: "223 47% 11%",
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

    if (result.code === 0 && result.data && result.data.appTheme) {
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
