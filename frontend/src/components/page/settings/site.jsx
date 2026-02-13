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
import { t } from "@/lib/i18n";

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
          {t(label.toLowerCase())}
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
                  {t("selectImage")}
                </p>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("selectImage")} {t(label.toLowerCase())}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 px-2">
      <div>
        <h3 className="text-lg font-medium">{t("siteTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("siteDesc")}
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
                <FormLabel>{t("siteTitleLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("siteTitleLabel")} {...field} />
                </FormControl>
                <FormDescription>{t("siteDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("siteDescription")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("siteDescription")} {...field} />
                </FormControl>
                <FormDescription>{t("siteDesc")}</FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("siteTheme")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ? field.value : "mini"}
                  defaultValue={field.value ? field.value : "mini"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("siteTheme")} />
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
                  {t("siteDesc")}
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
                <FormLabel>{t("siteLanguage")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("siteLanguage")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t("siteDesc")}
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
                <FormLabel>{t("copyright")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("copyright")} {...field} />
                </FormControl>
                <FormDescription>
                  {t("siteDesc")}
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
                <FormLabel>{t("author")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("author")} {...field} />
                </FormControl>
                <FormDescription>
                  {t("siteDesc")}
                </FormDescription>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>
          <SiteImageInput label="Avatar" type="avatar.png" />
          <SiteImageInput label="Favicon" type="favicon.ico" />
          <Button type="submit">{t("save")}</Button>
        </form>
      </Form>
    </div>
  );
}

export default SiteSetting;
