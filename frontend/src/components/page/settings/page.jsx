import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SiteSetting from "@/components/page/settings/site";
import AppearanceSetting from "@/components/page/settings/appearance";
import DeploySetting from "@/components/page/settings/deploy/layout";
import { Toaster } from "@/components/ui/sonner";
import { t } from "@/lib/i18n";
import PageShell from "@/components/layout/page-shell";
import ToolButton from "@/components/layout/tool-button";

const panels = { appearance: AppearanceSetting, theme: SiteSetting, deploy: DeploySetting };
function SettingsPage() {
  const [current, setCurrent] = useState("appearance");
  const Panel = panels[current];
  return <PageShell name="settings" label={t("settings")} toolbar={<>
    <Link to="/"><ToolButton icon="MoveLeft" label={t("editorBack")} /></Link>
    <div className="editor-mode-switch" role="group" aria-label={t("settings")}>
      {Object.keys(panels).map((name) => <Button key={name} size="sm"
        variant={current === name ? "secondary" : "ghost"} aria-pressed={current === name}
        onClick={() => setCurrent(name)}>{t(name)}</Button>)}
    </div>
  </>}>
    <Toaster position="top-center" />
    <div className="settings-content flex-1 min-h-0 overflow-auto px-8 py-6">
      <div className="mx-auto w-full max-w-3xl pb-8">
        <Panel key={current} />
      </div>
    </div>
  </PageShell>;
}
export default SettingsPage;
