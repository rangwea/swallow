import { useEffect, useState } from 'react';
import { EventsOn } from '/wailsjs/runtime/runtime';
import { PublishExit } from '/wailsjs/go/backend/App';
import WritingDialog from '@/components/page/editor/writing-dialog';
import { Button } from '@/components/ui/button';
import { pt } from '@/lib/publish-text';
export default function PublishingExit() {
  const [open, setOpen] = useState(false);
  const [stopping, setStopping] = useState(false);
  useEffect(() => EventsOn('publishing:close', () => setOpen(true)), []);
  if (!open) return null;
  return <WritingDialog label={pt('exitTitle')}><h2>{pt('exitTitle')}</h2><p>{pt(stopping ? 'stopping' : 'exitHint')}</p><div className="flex gap-2"><Button disabled={stopping} onClick={() => setOpen(false)}>{pt('wait')}</Button><Button variant="secondary" disabled={stopping} onClick={() => {
        setStopping(true);
        PublishExit();
      }}>{pt('exit')}</Button></div></WritingDialog>;
}
