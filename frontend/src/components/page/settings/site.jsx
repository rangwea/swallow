import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  SiteConfigGet,
  SiteConfigSave,
  ConfGetThemes,
} from "../../../../wailsjs/go/backend/App";

function SiteSetting() {
  const form = useForm();
  const [themeOptions, setThemeOptions] = useState([]);

  useEffect(() => {
    init();
  }, []);

  function init() {
    // get themes
    getThemes();
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

  const getThemes = () => {
    ConfGetThemes().then((result) => {
      if (result.code === 0) {
        message.error("get themes fail:" + result.msg);
      } else {
        setThemeOptions(result.data);
      }
      console.log(themeOptions);
    });
  };

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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Site Title" {...field} />
                </FormControl>
                <FormDescription>Your website title</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Site Description" {...field} />
                </FormControl>
                <FormDescription>Your website description</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {themeOptions.map((x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  select your website description
                </FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="defaultContentLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  select your website description
                </FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="copyright"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Copyright</FormLabel>
                <FormControl>
                  <Input placeholder="swallow" {...field} />
                </FormControl>
                <FormDescription>
                  select your website description
                </FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="params.author.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input placeholder="swallow" {...field} />
                </FormControl>
                <FormDescription>
                  select your website description
                </FormDescription>
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

export default SiteSetting;
