import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { checkResult, isSuccess } from "@/components/page/util";
import { t } from "@/lib/i18n";

function OssSetting() {
  const form = useForm();

  const confType = "oss";

  useEffect(() => {
    init();
  }, []);

  function init() {
    // init form
    ConfGet(confType).then((result) => {
      if (isSuccess(result)) {
        const data = result.data;
        for (var k in data) {
          form.setValue(k, data[k]);
        }
      }
    });
  }

  function onSubmit(values) {
    ConfSave(confType, JSON.stringify(values)).then(r => checkResult(r, "save config success"));
  }

  return (
    <div className="space-y-6 px-2">
      <div>
        <h3 className="text-lg font-medium">{t("ossTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("ossDesc")}</p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="appId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AppId</FormLabel>
                <FormControl>
                  <Input placeholder="AppId" {...field} />
                </FormControl>
                <FormDescription>{t("appIdDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="secretId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SecretId</FormLabel>
                <FormControl>
                  <Input placeholder="SecretId" {...field} />
                </FormControl>
                <FormDescription>{t("ossSecretIdDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="secretKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SecretKey</FormLabel>
                <FormControl>
                  <Input placeholder="SecretKey" {...field} />
                </FormControl>
                <FormDescription>{t("ossSecretKeyDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input placeholder="Region" {...field} />
                </FormControl>
                <FormDescription>{t("ossRegionDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="bucket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bucket</FormLabel>
                <FormControl>
                  <Input placeholder="Bucket" {...field} />
                </FormControl>
                <FormDescription>{t("ossBucketDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}

export default OssSetting;
