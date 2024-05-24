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

function NetlifySetting() {
  const form = useForm();

  const confType = "netlify";

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
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">Deploy site with cos.</p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SiteId</FormLabel>
                <FormControl>
                  <Input placeholder="SiteId" {...field} />
                </FormControl>
                <FormDescription>Your SiteId for netlify</FormDescription>
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
                <FormDescription>Your Token for netlify</FormDescription>
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

export default NetlifySetting;
