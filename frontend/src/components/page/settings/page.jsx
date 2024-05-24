import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import SiteSetting from "@/components/page/settings/site";
import { cn } from "@/lib/utils";
import { CircleX } from "lucide-react";
import "../style.css";
import DeploySetting from "@/components/page/settings/deploy/layout";
import { Toaster } from "@/components/ui/sonner"

function SettingsPage() {
  const [panel, setPanel] = useState("");
  const [curMenu, setCurMenu] = useState("Theme");

  useEffect(() => {
    navChange("Theme", <SiteSetting />);
  }, []);

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
      <Toaster position="top-center"/>
      <div
        className="space-y-0.5 pt-10"
        style={{ "--wails-draggable": "drag" }}
      >
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
        <Link to="/">
          <Button
            className="fixed top-12 right-12 w-[32px] h-[32px] rounded-[16px]"
            variant="ghost"
            size="icon"
          >
            <CircleX color="#888888" strokeWidth={1} />
          </Button>
        </Link>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-row space-x-5 overflow-hidden">
        <nav className="flex flex-col text-sm text-muted-foreground w-40 space-y-2">
          <NavItem text="Theme" to={<SiteSetting />} />
          <NavItem text="Deploy" to={<DeploySetting />} />
        </nav>
        <div className="flex-1 pb-5 h-[calc(100vh-160px)] overflow-y-auto scrollbar-hide">
          {panel}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
