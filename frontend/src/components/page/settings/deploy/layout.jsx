import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GitSetting from "@/components/page/settings/deploy/git";

function DeploySetting() {
  return (
    <>
      <Tabs defaultValue="github">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="github">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="github">{<GitSetting />}</TabsContent>
        <TabsContent value="password"></TabsContent>
      </Tabs>
    </>
  );
}

export default DeploySetting;
