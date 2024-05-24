import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GitSetting from "@/components/page/settings/deploy/git";
import CosSetting from "@/components/page/settings/deploy/cos";
import OssSetting from "@/components/page/settings/deploy/oss";
import NetlifySetting from "@/components/page/settings/deploy/netlify";
import { ConfGet } from "/wailsjs/go/backend/App";
import { Toaster } from "@/components/ui/sonner";
import { isSuccess } from "@/components/page/util";

function DeploySetting() {
  const [activedDeploy, setActivedDeploy] = useState("github");

  useEffect(() => {
    init();
  }, []);

  function init() {
    ConfGet("app").then((result) => {
      if (isSuccess(result)) {
        const data = result.data;
        if (data && data.activedDeploy) {
          setActivedDeploy(data.activedDeploy);
        }
      }
    });
  }

  return (
    <>
      <Toaster position="top-center" />
      <Tabs value={activedDeploy}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="github">github</TabsTrigger>
          <TabsTrigger value="cos">cos</TabsTrigger>
          <TabsTrigger value="oss">oss</TabsTrigger>
          <TabsTrigger value="netlify">netlify</TabsTrigger>
        </TabsList>
        <TabsContent value="github">{<GitSetting />}</TabsContent>
        <TabsContent value="cos">{<CosSetting />}</TabsContent>
        <TabsContent value="oss">{<OssSetting />}</TabsContent>
        <TabsContent value="netlify">{<NetlifySetting />}</TabsContent>
      </Tabs>
    </>
  );
}

export default DeploySetting;
