import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { pt } from '@/lib/publish-text';
export default function PublishFields({
  form,
  provider
}) {
  const fields = [['siteUrl', 'website', 'https://example.com'], ...(provider === 'github' ? [['branch', 'branch', 'master']] : []), ...(['cos', 'oss'].includes(provider) ? [['prefix', 'prefix', 'blog']] : [])];
  return <>{fields.map(([name, label, placeholder]) => <FormField key={name} control={form.control} name={name} render={({
      field
    }) => <FormItem><FormLabel>{pt(label)}</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder={placeholder} /></FormControl></FormItem>} />)}</>;
}
