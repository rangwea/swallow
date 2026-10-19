import { useEffect, useSyncExternalStore } from "react";
import { ConfGet, ConfSave } from "/wailsjs/go/backend/App";
import { applyTheme } from "@/lib/themes";
import { getCurrentLanguage, setLanguage, t } from "@/lib/i18n";
import { applyEditorFonts, getRequiredFonts, loadGoogleFonts } from "@/lib/fonts";
import { requireSuccess, writeSettings } from "./save-queue";

const defaults = { appTheme: localStorage.getItem("app-theme") || "sepia", articlesPerPage: 10, showArticlesStats: true, language: getCurrentLanguage(), editorTitleFont: "playfair-display", editorContentFont: "instrument-sans", editorLineHeight: 1.75, editorFontSize: 16 };
let state = { values: defaults, ready: false, dirty: false, saving: false, saved: false, error: "" };
let baseline, loading = false, running = false, timer, fadeTimer, version = 0;
const listeners = new Set();
const emit = (patch) => { state = { ...state, ...patch }; listeners.forEach((fn) => fn()); };
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => state;
const normalized = () => ({ ...state.values, articlesPerPage: Number(state.values.articlesPerPage) });
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const valid = (value) => Number.isInteger(value.articlesPerPage) && value.articlesPerPage >= 1 && value.articlesPerPage <= 100;

async function load() {
  if (loading || state.ready) return;
  loading = true;
  try {
    const data = requireSuccess(await ConfGet("app")) || {};
    const values = Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, data[key] ?? value]));
    baseline = { ...values, articlesPerPage: Number(values.articlesPerPage) };
    emit({ values, ready: true, error: "" });
  } catch (error) { emit({ error: error.message || t("settingsLoadFailed") }); }
  finally { loading = false; }
}

async function flush() {
  clearTimeout(timer);
  if (!state.ready) return load();
  if (running || !state.dirty) return;
  const values = normalized(), savedVersion = version;
  if (!valid(values)) { emit({ error: t("settingsInvalidPageSize") }); return; }
  running = true;
  emit({ saving: true, saved: false, error: "" });
  try {
    await writeSettings(async () => {
      const existing = requireSuccess(await ConfGet("app")) || {};
      requireSuccess(await ConfSave("app", JSON.stringify({ ...existing, ...values })));
    });
    const fontsChanged = !baseline || values.editorTitleFont !== baseline.editorTitleFont || values.editorContentFont !== baseline.editorContentFont;
    baseline = values;
    localStorage.setItem("app-theme", values.appTheme);
    if (state.values.appTheme === values.appTheme) applyTheme(values.appTheme);
    applyEditorFonts({ titleFont: values.editorTitleFont, contentFont: values.editorContentFont, lineHeight: values.editorLineHeight, fontSize: values.editorFontSize });
    if (fontsChanged) loadGoogleFonts(getRequiredFonts(values.editorTitleFont, values.editorContentFont));
    const dirty = !equal(normalized(), baseline);
    emit({ saving: false, saved: !dirty, dirty, error: "" });
    setLanguage(values.language);
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => emit({ saved: false }), 2000);
  } catch (error) { emit({ saving: false, saved: false, error: error.message || t("settingsFailed") }); }
  finally {
    running = false;
    if (version !== savedVersion && state.dirty) flush();
  }
}
function update(patch) {
  if (!state.ready) return;
  clearTimeout(timer); clearTimeout(fadeTimer);
  version += 1;
  const values = { ...state.values, ...patch };
  emit({ values, dirty: !equal({ ...values, articlesPerPage: Number(values.articlesPerPage) }, baseline), saved: false, error: "" });
  if (patch.appTheme) applyTheme(patch.appTheme);
  if (state.dirty) timer = setTimeout(flush, 450);
}
export default function useAppearanceAutosave() {
  const current = useSyncExternalStore(subscribe, snapshot);
  useEffect(() => { load(); return () => { if (state.dirty) flush(); }; }, []);
  useEffect(() => {
    const keyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); flush(); }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);
  return { ...current, update, save: flush };
}
