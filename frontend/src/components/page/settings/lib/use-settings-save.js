import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { requireSuccess, writeSettings } from "./save-queue";

// Keep unsaved form values in memory when moving between settings panels.
const drafts = new Map();
const clone = (value) => JSON.parse(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export default function useSettingsSave(form, key, write) {
  const [state, setState] = useState({ saving: false, saved: false, error: "" });
  const mounted = useRef(false), busy = useRef(false), hydrated = useRef(false), timer = useRef(null);
  const writeRef = useRef(write); writeRef.current = write;
  const dirty = form.formState.isDirty;

  useEffect(() => {
    mounted.current = true;
    const subscription = form.watch((values) => {
      if (hydrated.current) drafts.set(key, clone(values));
    });
    return () => { mounted.current = false; clearTimeout(timer.current); subscription.unsubscribe(); };
  }, [form, key]);

  function load(values) {
    hydrated.current = false;
    const draft = drafts.get(key);
    form.reset(values || {});
    if (draft) form.reset(draft, { keepDefaultValues: true });
    hydrated.current = true;
  }

  async function submit(values) {
    if (busy.current || !hydrated.current || (!form.formState.isDirty && !state.error)) return;
    busy.current = true;
    clearTimeout(timer.current);
    setState({ saving: true, saved: false, error: "" });
    const snapshot = clone(values);
    try {
      requireSuccess(await writeSettings(() => writeRef.current(snapshot)));
      const latest = mounted.current ? clone(form.getValues()) : drafts.get(key) || snapshot;
      if (equal(latest, snapshot)) drafts.delete(key);
      else drafts.set(key, latest);
      if (mounted.current) {
        hydrated.current = false;
        form.reset(snapshot);
        form.reset(latest, { keepDefaultValues: true });
        hydrated.current = true;
        setState({ saving: false, saved: true, error: "" });
        timer.current = setTimeout(() => { if (mounted.current) setState((state) => ({ ...state, saved: false })); }, 2000);
      }
    } catch (error) {
      if (mounted.current) setState({ saving: false, saved: false, error: error.message || t("settingsFailed") });
    } finally { busy.current = false; }
  }

  const save = () => { if (form.formState.isDirty || state.error) return form.handleSubmit(submit)(); };
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => {
    function keyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault(); saveRef.current();
      }
    }
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);
  return { ...state, dirty, load, submit, save };
}
