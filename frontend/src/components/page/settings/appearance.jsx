import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ConfGet, ConfSave } from "/wailsjs/go/backend/App";
import { isSuccess } from "@/components/page/util";
import { APP_THEMES, applyTheme } from "@/lib/themes";
import { t, LANGUAGES, setLanguage } from "@/lib/i18n";
import {
  FONT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  FONT_SIZE_OPTIONS,
  applyEditorFonts,
  loadGoogleFonts,
  getRequiredFonts,
} from "@/lib/fonts";

function AppearanceSetting() {
  const [appTheme, setAppTheme] = useState("sepia");
  const [articlesPerPage, setArticlesPerPage] = useState(10);
  const [showArticlesStats, setShowArticlesStats] = useState(true);
  const [language, setLanguageState] = useState("zh-CN");
  const [editorTitleFont, setEditorTitleFont] = useState("playfair-display");
  const [editorContentFont, setEditorContentFont] = useState("instrument-sans");
  const [editorLineHeight, setEditorLineHeight] = useState(1.75);
  const [editorFontSize, setEditorFontSize] = useState(16);

  useEffect(() => {
    init();
  }, []);

  function init() {
    ConfGet("app").then((result) => {
      if (isSuccess(result)) {
        const data = result.data;
        if (data) {
          setAppTheme(data.appTheme || "sepia");
          setArticlesPerPage(data.articlesPerPage || 10);
          setShowArticlesStats(
            data.showArticlesStats !== undefined ? data.showArticlesStats : true
          );
          setLanguageState(data.language || "zh-CN");
          setEditorTitleFont(data.editorTitleFont || "playfair-display");
          setEditorContentFont(data.editorContentFont || "instrument-sans");
          setEditorLineHeight(data.editorLineHeight || 1.75);
          setEditorFontSize(data.editorFontSize || 16);
        }
      }
    });
  }

  function save() {
    // Get existing config first
    ConfGet("app").then((existingResult) => {
      const existingData = (isSuccess(existingResult) && existingResult.data) ? existingResult.data : {};

      // Merge with new values
      const conf = {
        ...existingData,
        appTheme,
        articlesPerPage: parseInt(articlesPerPage),
        showArticlesStats,
        language,
        editorTitleFont,
        editorContentFont,
        editorLineHeight: parseFloat(editorLineHeight),
        editorFontSize: parseInt(editorFontSize),
      };

      console.log("Saving config:", conf);

      ConfSave("app", JSON.stringify(conf)).then((result) => {
        if (isSuccess(result)) {
          console.log("Config saved successfully");
          toast.success(t("settingsSaved"));

          // Apply theme immediately
          applyTheme(appTheme);
          setLanguage(language);
          applyEditorFonts({
            titleFont: editorTitleFont,
            contentFont: editorContentFont,
            lineHeight: editorLineHeight,
            fontSize: editorFontSize,
          });

          // Load required fonts
          const fonts = getRequiredFonts(editorTitleFont, editorContentFont);
          loadGoogleFonts(fonts);

          // Save to localStorage to prevent reset on reload
          if (typeof window !== "undefined") {
            localStorage.setItem("app-theme", appTheme);
          }

          // Reload page to apply language changes
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          toast.error(result.msg || t("settingsFailed"));
        }
      });
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-serif font-semibold mb-2">
          {t("appearanceTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("appearanceDesc")}</p>
      </div>

      <Separator />

      {/* Language Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">{t("language")}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {t("languageDesc")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              onClick={() => setLanguageState(lang.code)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                language === lang.code
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border/40 hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              <div>
                <div className="font-medium">{lang.nativeName}</div>
                <div className="text-sm text-muted-foreground">{lang.name}</div>
              </div>
              {language === lang.code && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* App Theme */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">{t("appTheme")}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {t("appThemeDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {APP_THEMES.map((theme) => (
            <div
              key={theme.id}
              onClick={() => setAppTheme(theme.id)}
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                appTheme === theme.id
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border/40 hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              {/* Color Preview */}
              <div className="flex gap-1.5">
                <div
                  className="w-8 h-8 rounded-lg border shadow-sm"
                  style={{
                    background: `hsl(${theme.colors.light.background})`,
                  }}
                />
                <div
                  className="w-8 h-8 rounded-lg border shadow-sm"
                  style={{
                    background: `hsl(${theme.colors.light.accent})`,
                  }}
                />
                <div
                  className="w-8 h-8 rounded-lg border shadow-sm"
                  style={{
                    background: `hsl(${theme.colors.dark.background})`,
                  }}
                />
              </div>

              {/* Theme Info */}
              <div className="flex-1">
                <div className="font-medium">{t(theme.id.replace("-", ""))}</div>
                <div className="text-sm text-muted-foreground">
                  {t(theme.id.replace("-", "") + "Desc")}
                </div>
              </div>

              {/* Selected Indicator */}
              {appTheme === theme.id && (
                <div className="flex-none">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-accent"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Articles Per Page */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="articlesPerPage" className="text-base font-medium">
            {t("articlesPerPage")}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            {t("articlesPerPageDesc")}
          </p>
        </div>
        <Input
          id="articlesPerPage"
          type="number"
          min="5"
          max="50"
          value={articlesPerPage}
          onChange={(e) => setArticlesPerPage(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Separator />

      {/* Show Articles Stats */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">{t("articlesStats")}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {t("articlesStatsDesc")}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowArticlesStats(true)}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
              showArticlesStats
                ? "border-accent bg-accent/5 text-accent"
                : "border-border/40 hover:border-accent/50"
            }`}
          >
            <div className="font-medium">{t("show")}</div>
            <div className="text-sm text-muted-foreground">
              {t("displayStats")}
            </div>
          </button>
          <button
            onClick={() => setShowArticlesStats(false)}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
              !showArticlesStats
                ? "border-accent bg-accent/5 text-accent"
                : "border-border/40 hover:border-accent/50"
            }`}
          >
            <div className="font-medium">{t("hide")}</div>
            <div className="text-sm text-muted-foreground">
              {t("hideStats")}
            </div>
          </button>
        </div>
      </div>

      <Separator />

      {/* Editor Settings */}
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-serif font-semibold">
            {t("editorSettings")}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            {t("editorSettingsDesc")}
          </p>
        </div>

        {/* Title Font */}
        <div className="space-y-3">
          <Label className="text-base font-medium">{t("titleFont")}</Label>
          <p className="text-sm text-muted-foreground">{t("titleFontDesc")}</p>
          <Select value={editorTitleFont} onValueChange={setEditorTitleFont}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <div>
                    <div className="font-medium">{font.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {font.preview}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Font */}
        <div className="space-y-3">
          <Label className="text-base font-medium">{t("contentFont")}</Label>
          <p className="text-sm text-muted-foreground">
            {t("contentFontDesc")}
          </p>
          <Select
            value={editorContentFont}
            onValueChange={setEditorContentFont}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <div>
                    <div className="font-medium">{font.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {font.preview}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Line Height */}
        <div className="space-y-3">
          <Label className="text-base font-medium">{t("lineHeight")}</Label>
          <p className="text-sm text-muted-foreground">
            {t("lineHeightDesc")}
          </p>
          <Select
            value={editorLineHeight.toString()}
            onValueChange={(v) => setEditorLineHeight(parseFloat(v))}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINE_HEIGHT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <Label className="text-base font-medium">{t("fontSize")}</Label>
          <p className="text-sm text-muted-foreground">{t("fontSizeDesc")}</p>
          <Select
            value={editorFontSize.toString()}
            onValueChange={(v) => setEditorFontSize(parseInt(v))}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={save} className="px-8">
          {t("saveChanges")}
        </Button>
      </div>
    </div>
  );
}

export default AppearanceSetting;
