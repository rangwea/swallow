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

function GitSetting() {
  const form = useForm();

  const confType = "github";

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
        <h3 className="text-lg font-medium">Github page</h3>
        <p className="text-sm text-muted-foreground">
          Deploy site with github.
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
        </form>
      </Form>
    </div>
  );
}

export default GitSetting;
