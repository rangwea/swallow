import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DraftList, DraftRemove, TrashList, TrashRestore } from '/wailsjs/go/backend/App';
import { toggleFromWindowHeader } from '@/components/layout/window-header';
import ToolButton from '@/components/layout/tool-button';
import { FileText, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { wt } from '@/lib/writing-text';
export default function WritingLibrary() {
  const generation = useRef(0);
  const [tab, setTab] = useState('drafts');
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    const request = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const r = await (tab === 'drafts' ? DraftList() : TrashList());
      if (request !== generation.current) return;
      if (r.code !== 1) throw Error(r.msg);
      setItems(r.data || []);
    } catch (e) {
      if (request === generation.current) setError(e.message || wt('loadFailed'));
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }
  useEffect(() => {
    setItems([]);
    load();
    return () => {
      generation.current++;
    };
  }, [tab]);
  async function action(item) {
    setBusy(true);
    try {
      if (tab === 'drafts' && !window.confirm(wt('discardConfirm'))) return;
      const r = await (tab === 'drafts' ? DraftRemove(item.id) : TrashRestore(item.id));
      if (r.code !== 1) throw Error(r.msg);
      if (tab === 'trash') toast.success(wt('restored'));
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  const EmptyIcon=tab==='drafts'?FileText:ArchiveRestore;
  return <div className="home-shell writing-library flex flex-col h-screen overflow-hidden bg-background">
    <header className="writing-library-header" style={{'--wails-draggable':'drag'}} onDoubleClick={toggleFromWindowHeader}>
      <Link to="/" aria-label={wt('back')}><ToolButton icon="ArrowLeft" label={wt('back')} className="home-action-button" /></Link>
      <h1>{wt('newDrafts')}</h1>
      <div className="writing-library-tabs" role="group" aria-label={wt('newDrafts')}>
        {['drafts','trash'].map(name=><Button key={name} size="sm" variant={tab===name?'secondary':'ghost'} aria-pressed={tab===name} onClick={()=>setTab(name)}>{wt(name)}</Button>)}
      </div>
    </header>
    <main className="home-content flex-1 min-h-0 overflow-auto px-8 py-6">
      <p className="writing-library-hint">{wt('publishedHint')}</p>
      {error&&<p role="alert" className="py-4">{error} <Button variant="ghost" onClick={load}>{wt('retry')}</Button></p>}
      {!busy&&!error&&!items.length&&<div className="writing-library-empty"><EmptyIcon size={28} strokeWidth={1.3} aria-hidden="true"/><p>{wt(tab==='drafts'?'emptyDrafts':'emptyTrash')}</p></div>}
      {items.map(item=><div key={item.id} className="flex gap-4 items-center py-3 rounded-lg hover:bg-muted/40 px-3">
        <div className="flex-1 min-w-0"><h2 className="truncate font-medium">{(tab==='drafts'?item.meta.title:item.title)||wt('untitled')}</h2><p className="text-xs text-muted-foreground mt-1">{new Date(item.updatedAt||item.deletedAt).toLocaleString()}</p></div>
        {tab==='drafts'&&<Link to={`/editor?${item.articleId?'id='+encodeURIComponent(item.articleId)+'&':''}draft=${encodeURIComponent(item.id)}`}><Button size="sm" variant="secondary" disabled={busy}>{wt('recover')}</Button></Link>}
        <Button size="sm" variant="ghost" disabled={busy} onClick={()=>action(item)}>{wt(tab==='drafts'?'discard':'restore')}</Button>
      </div>)}
    </main>
  </div>;
}
