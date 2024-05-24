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
  GetSiteImageConf,
  SelectConfImage,
} from "/wailsjs/go/backend/App";
import {
  ifSuccess,
  checkResult,
  isSuccess,
  checkError,
} from "@/components/page/util";
import { ImageUp } from "lucide-react";

function SiteSetting() {
  const form = useForm();
  const [themeOptions, setThemeOptions] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [favicon, setFavicon] = useState("");

  useEffect(() => {
    init();
  }, []);

  function init() {
    // get themes
    getThemes();
    // get site image config
    getSiteImage();
    // init form
    SiteConfigGet().then((result) => {
      if (isSuccess(result)) {
        const data = result.data;
        for (var k in data) {
          form.setValue(k, data[k]);
        }
      }
    });
  }

  const getThemes = () => {
    ConfGetThemes().then((r) => ifSuccess(r, setThemeOptions));
  };

  const getSiteImage = () => {
    GetSiteImageConf().then((r) => {
      if (isSuccess(r)) {
        setAvatar(r.avatar);
        setFavicon(r.favicon);
      }
    });
  };

  const setSiteImage = (s) => {
    SelectConfImage(s).then(checkError);
    getSiteImage();
  };

  function onSubmit(values) {
    SiteConfigSave(values).then((r) => checkResult(r, "save success"));
  }

  const SiteImageInput = (props) => {
    const { label, type } = props;
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        <div className="flex flex-col w-32 h-32 border-2 border-dashed hover:bg-gray-100 hover:border-gray-300">
          <div
            className="relative flex flex-col items-center justify-center pt-8"
            onClick={() => setSiteImage(type)}
          >
            {avatar ? (
              <img
                id="avatarPreview"
                className="absolute inset-0 w-full h-32 block"
                src="static/images/avatar.png"
              />
            ) : (
              <>
                <ImageUp color="#a1a1a1" />
                <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                  select a image
                </p>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          select a image for {label}
        </p>
      </div>
    );
  };

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
                  value={field.value ? field.value : "mini"}
                  defaultValue={field.value ? field.value : "mini"}
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
                  value={field.value}
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
          <SiteImageInput label="Avatar" type="avatar.png" />
          <SiteImageInput label="Favicon" type="favicon.ico" />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}

export default SiteSetting;
