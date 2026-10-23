import PublishFields from "./publish-fields";
import useSettingsSave from "../lib/use-settings-save";
import SettingsSaveBar from "../save-bar";
import React, { useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConfSave, ConfGet } from "/wailsjs/go/backend/App";
import { isSuccess } from "@/components/page/util";
import { t } from "@/lib/i18n";

function NetlifySetting() {
  const form = useForm();

  const confType = "netlify";
  const saving = useSettingsSave(form, "deploy-netlify", (values) => ConfSave(confType, JSON.stringify(values)));

  useEffect(() => {
    init();
  }, []);

  function init() {
    // init form
    ConfGet(confType).then((result) => {
      if (isSuccess(result)) {
        const data = result.data;
        saving.load(data);
      }
    });
  }

  return (
    <div className="space-y-6 px-2">
      <div>
        <h3 className="text-lg font-medium">{t("netlifyTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("netlifyDesc")}</p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(saving.submit)} className="space-y-6">
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SiteId</FormLabel>
                <FormControl>
                  <Input placeholder="SiteId" {...field} />
                </FormControl>
                <FormDescription>{t("siteIdDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token</FormLabel>
                <FormControl>
                  <Input placeholder="Token" {...field} />
                </FormControl>
                <FormDescription>{t("netlifyTokenDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <PublishFields form={form} provider="netlify" />
          <SettingsSaveBar {...saving} onSave={saving.save} />
        </form>
      </Form>
    </div>
  );
}

export default NetlifySetting;
