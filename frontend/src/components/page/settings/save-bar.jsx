import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function SettingsSaveBar({ dirty, saving, saved, error, onSave, automatic = false }) {
  if (!dirty && !saving && !saved && !error) return null;
  return <div className={`settings-save-bar${saved && !dirty && !error ? " is-saved" : ""}`}>
    <span role={error ? "alert" : "status"} className={error ? "text-destructive" : "text-muted-foreground"}>
      {error || t(saving ? "settingsSaving" : dirty ? "settingsUnsaved" : "settingsSavedInline")}
    </span>
    {!saving && (error || (!automatic && dirty)) && <Button type="button" size="sm" variant="secondary" onClick={onSave}>
      {t(error ? "settingsRetry" : "saveChanges")}
    </Button>}
  </div>;
}
