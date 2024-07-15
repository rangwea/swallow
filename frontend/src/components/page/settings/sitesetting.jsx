import { Link, useNavigate } from "react-router-dom";
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

function SiteSetting() {
  const form = useForm();

  function onSubmit(values) {
    console.log(values);
  }

  return (
    <div className="space-y-6">
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
                  <Input placeholder="swallow" {...field} />
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
                  <Input placeholder="swallow" {...field} />
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
                <FormControl>
                  <Input placeholder="swallow" {...field} />
                </FormControl>
                <FormDescription>select your website description</FormDescription>
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
                <FormControl>
                  <Input placeholder="swallow" {...field} />
                </FormControl>
                <FormDescription>select your website description</FormDescription>
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
                <FormDescription>select your website description</FormDescription>
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
                <FormDescription>select your website description</FormDescription>
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
