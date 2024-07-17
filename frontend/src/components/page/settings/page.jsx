import { Link, useNavigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import AppSetting from "@/components/page/settings/appsetting";
import SiteSetting from "@/components/page/settings/sitesetting";
import { cn } from "@/lib/utils";
import "../style.css";

function SettingsPage() {
  const [panel, setPanel] = useState("");
  const [curMenu, setCurMenu] = useState("General");

  function navChange(text, to) {
    setCurMenu(text);
    setPanel(to);
  }

  const NavItem = ({ text, to }) => {
    return (
      <Link
        onClick={() => navChange(text, to)}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          curMenu === text ? "bg-muted hover:bg-muted" : "hover:bg-transparent",
          "justify-start",
          "h-8"
        )}
      >
        {text}
      </Link>
    );
  };

  return (
    <div className="mx-10 h-screen">
      <div
        className="space-y-0.5 pt-10"
        style={{ "--wails-draggable": "drag" }}
      >
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-row space-x-5 overflow-hidden">
        <nav className="flex flex-col text-sm text-muted-foreground w-40">
          <NavItem text="General" to={<AppSetting />} />
          <NavItem text="Theme" to={<SiteSetting />} />
          <NavItem text="Integrations" />
          <NavItem text="Organizations" />
        </nav>
        <div className="flex-1 py-5 pb-5 h-[calc(100vh-160px)] overflow-y-auto scrollbar-hide">
          {panel}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
