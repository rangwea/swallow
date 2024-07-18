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
import {
  ConfSave,
  ConfGet,
} from "/wailsjs/go/backend/App";

function GitSetting() {
  const form = useForm();

  useEffect(() => {
    init();
  }, []);

  function init() {
    // init form
    SiteConfigGet().then((result) => {
      if (result.code === 0) {
        message.error("get website config fail:" + result.msg);
      } else {
        const data = result.data;
        for (var k in data) {
          form.setValue(k, data[k]);
        }
      }
    });
  }

  function onSubmit(values) {
    SiteConfigSave(values).then((r) => {
      if (r.code === 0) {
        message.error(r.msg);
      } else {
        message.info("save success", 1);
      }
    });
  }

  return (
    <div className="space-y-6 px-2">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          Update your site settings.
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="repository"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository</FormLabel>
                <FormControl>
                  <Input placeholder="Repository" {...field} />
                </FormControl>
                <FormDescription>Your github repository url</FormDescription>
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
                <FormDescription>Your email for github</FormDescription>
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
                <FormDescription>Your username for github</FormDescription>
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
                <FormDescription>Your token for github</FormDescription>
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
                <FormDescription>Your cname for gitpage</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <Button type="submit">Submit</Button>
          <Button>Connection Test</Button>
        </form>
      </Form>
    </div>
  );
}

export default GitSetting;
