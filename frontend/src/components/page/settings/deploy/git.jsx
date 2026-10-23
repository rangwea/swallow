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

function GitSetting() {
  const form = useForm();

  const confType = "github";
  const saving = useSettingsSave(form, "deploy-github", (values) => ConfSave(confType, JSON.stringify(values)));

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
        <h3 className="text-lg font-medium">{t("githubPageTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("githubPageDesc")}
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(saving.submit)} className="space-y-6">
          <FormField
            control={form.control}
            name="repository"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository</FormLabel>
                <FormControl>
                  <Input placeholder="Repository" {...field} />
                </FormControl>
                <FormDescription>{t("repositoryDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email" {...field} />
                </FormControl>
                <FormDescription>{t("emailDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                <FormDescription>{t("usernameDesc")}</FormDescription>
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
                  <Input placeholder="token" {...field} />
                </FormControl>
                <FormDescription>{t("tokenDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="cname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNAME</FormLabel>
                <FormControl>
                  <Input placeholder="cname" {...field} />
                </FormControl>
                <FormDescription>{t("cnameDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <PublishFields form={form} provider="github" />
          <SettingsSaveBar {...saving} onSave={saving.save} />
        </form>
      </Form>
    </div>
  );
}

export default GitSetting;
