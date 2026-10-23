import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Globe2, Rocket, History, Check, Loader2, Circle } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import ToolButton from '@/components/layout/tool-button';
import { toggleFromWindowHeader } from '@/components/layout/window-header';
import { pt, publishError, publishKey } from '@/lib/publish-text';
import { PublishPrepare, PublishList, PublishGet, PublishTarget, PublishStart, PublishRetry, PublishCancel, PublishVerify, PublishCleanup, PublishFreshness, PublishOpenWebsite, PublishAbandonRetry, PublishUseTarget } from '/wailsjs/go/backend/App';
const activeStates = ['preparing', 'building', 'uploading', 'recording'];
function checked(r) {
  if (r.code !== 1) throw Error(r.msg);
  return r.data;
}
export default function Publishing() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('run') || '';
  const [historyOpen, setHistoryOpen] = useState(false);
  const [run, setRun] = useState(null);
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const generation = useRef(0);
  async function refresh() {
    const seq = ++generation.current;
    try {
      const data = checked(await PublishList(filter, page));
      if (seq !== generation.current) return;
      setHistory(data.list || []);
      setTotal(data.total);
      if (Number.isInteger(data.page)) setPage(data.page);
      if (!selected && data.activeId) {
        setParams({
          run: data.activeId
        }, {
          replace: true
        });
        return;
      }
      if (selected) {
        const detail = checked(await PublishGet(selected));
        if (seq !== generation.current) return;
        setRun(detail);
        if (detail.state === 'ready') {
          const change = checked(await PublishFreshness(detail.id));
          if (seq === generation.current) setFresh(change.changed);
        }
      }
      const current = await PublishTarget();
      if (seq === generation.current) {
        setTarget(current.code === 1 ? current.data : null);
      }
    } catch (e) {
      if (seq === generation.current) setError(publishError(e.message));
    }
  }
  useEffect(() => {
    setRun(null);
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => {
      clearInterval(timer);
      generation.current++;
    };
  }, [selected, filter, page]);
  async function perform(fn) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const id = checked(await fn());
      if (typeof id === 'string' && /^[a-f0-9]{32}$/.test(id)) setParams({
        run: id
      });
      await refresh();
    } catch (e) {
      const message = publishError(e.message);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    await perform(async () => {
      let r = await PublishStart(run.id, false);
      if (r.code !== 1 && r.msg === 'source_changed' && window.confirm(pt('older'))) r = await PublishStart(run.id, true);
      return r;
    });
  }
  function retry() {
    if (run.state === 'outcome_unknown' && !window.confirm(pt('resend'))) return;
    perform(() => PublishRetry(run.id, publishKey(), run.state === 'outcome_unknown'));
  }
  const targets = [...new Map(history.map(r => [r.target.id, r.target])).values()];
  const blocked = busy || !!history.find(r => activeStates.includes(r.state));
  const prepareButton = <Button size="sm" className="publish-prepare" disabled={blocked || !target} onClick={() => perform(() => PublishPrepare(publishKey()))}><Rocket size={14}/>{pt('prepare')}</Button>;
  const stages = ['preparing', 'building', 'uploading', 'recording'];
  const step = run?.state === 'succeeded' ? 4 : stages.indexOf(run?.state);
  return <div className="home-shell flex flex-col h-screen overflow-hidden bg-background">
 <header className="writing-library-header" style={{'--wails-draggable': 'drag'}} onDoubleClick={toggleFromWindowHeader}>
 <Link to="/"><ToolButton icon="ArrowLeft" label={pt('back')} className="home-action-button" /></Link><h1>{pt('center')}</h1>
 <div className="ml-auto flex gap-2"><ToolButton icon="History" label={pt('history')} className="home-action-button" onClick={() => setHistoryOpen(true)}/><Link to="/settings"><ToolButton icon="Settings" label={pt('settings')} className="home-action-button" /></Link></div></header>
 <Sheet open={historyOpen} onOpenChange={setHistoryOpen}><SheetContent className="publish-history">
 <SheetTitle>{pt('history')}</SheetTitle><SheetDescription>{pt('historyHint')}</SheetDescription>
 {!!total && <Select value={filter || 'all'} onValueChange={value => {setFilter(value === 'all' ? '' : value);setPage(0);}}><SelectTrigger aria-label={pt('target')} className="publish-select mt-5"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{pt('all')}</SelectItem>{targets.map(t => <SelectItem key={t.id} value={t.id}>{t.provider} · {t.destination}</SelectItem>)}</SelectContent></Select>}
 <div className="publish-history-list">{history.map(item => <button key={item.id} className={`publish-history-row ${selected === item.id ? 'is-selected' : ''}`} onClick={() => {setParams({run:item.id});setHistoryOpen(false);}}><span className="flex items-center gap-2"><span className={`publish-dot is-${item.state}`}/>{pt(item.state)}</span><span className="text-xs text-muted-foreground">{item.target.provider} · {new Date(item.startedAt).toLocaleString()}</span><span className="text-xs text-muted-foreground truncate">{item.target.destination}</span></button>)}{!history.length && <div className="publish-history-empty"><History size={24}/><p>{pt('noHistory')}</p></div>}</div>
 {total > 20 && <div className="flex justify-center gap-2 mt-3"><Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</Button><span className="text-xs self-center">{page + 1} / {Math.ceil(total / 20)}</span><Button size="sm" variant="ghost" disabled={(page + 1) * 20 >= total} onClick={() => setPage(p => p + 1)}>›</Button></div>}</SheetContent></Sheet>
 <main className="publish-layout flex-1 min-h-0"><section className="publish-detail">
 {target && <div className="publish-target"><div className="publish-target-icon"><Globe2 size={20}/></div><div className="publish-destination"><span className="publish-eyebrow">{pt('target')}</span><Select value={target.provider} disabled={blocked} onValueChange={value => perform(() => PublishUseTarget(value))}><SelectTrigger aria-label={pt('target')} className="publish-select"><SelectValue/></SelectTrigger><SelectContent>{['github','cos','oss','netlify'].map(provider => <SelectItem key={provider} value={provider}>{provider === 'github' ? 'GitHub' : provider === 'netlify' ? 'Netlify' : provider.toUpperCase()}</SelectItem>)}</SelectContent></Select><p>{target.destination}</p></div>{prepareButton}</div>}
 {error && <p role="alert" className="publish-error">{error}</p>}
 {!run && <div className="publish-empty"><div className="publish-empty-icon">{target ? <Rocket size={28} strokeWidth={1.4}/> : <Globe2 size={28} strokeWidth={1.4}/>}</div><h2>{pt(target ? 'emptyTitle' : 'setupTitle')}</h2><p>{pt(target ? 'emptyHint' : 'configure')}</p>{!target && <Button asChild size="sm" className="publish-prepare"><Link to="/settings">{pt('settings')}</Link></Button>}<span className="publish-empty-footnote">{pt('draftHint')}</span></div>}
 {run && <><div className="flex items-center gap-3 flex-wrap mt-6"><h2 className="text-lg font-medium">{pt(run.state)}</h2><span className="text-xs text-muted-foreground">{run.target.provider} · {run.target.destination}</span></div>
 <p className="text-xs text-muted-foreground mt-2">{pt('snapshot')}: {run.preparedAt ? new Date(run.preparedAt).toLocaleString() : '—'}</p>
 {(activeStates.includes(run.state) || run.state === 'succeeded') && <div className="publish-steps">{stages.map((stage,index) => <div key={stage} className={`publish-step ${index < step ? 'is-complete' : index === step ? 'is-current' : ''}`}>{index < step ? <Check size={14}/> : index === step ? <Loader2 size={14} className="animate-spin"/> : <Circle size={12}/>}<span>{pt(stage)}</span></div>)}</div>}
 {activeStates.includes(run.state) && <div className="my-4" role="status"><p className="text-sm">{pt(run.stage)} {run.total > 0 ? `${run.completed}/${run.total}` : ''}</p>{run.total > 0 ? <progress className="w-full mt-2" value={run.completed} max={run.total} /> : <p className="text-xs text-muted-foreground">{Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000)}s</p>}</div>}
 {!run.target.baseline && <p className="publish-notice">{pt('first')}</p>}
 {run.state === 'ready' && <><p className="publish-notice">{run.drafts} · {pt('draftHint')}</p>{fresh && <p className="publish-notice">{pt('newer')}</p>}</>}
 {run.diagnostic && <p className="text-xs text-muted-foreground mt-3 break-all">{run.diagnostic}</p>}
 {run.error && <p role="alert" className="publish-error">{publishError(run.error)}</p>}
 {(['outcome_unknown', 'interrupted'].includes(run.state) || run.state === 'failed' && run.stage === 'uploading') && <p className="publish-notice">{pt('partial')}</p>}
 <div className="flex flex-wrap gap-2 my-4">
 {run.state === 'ready' && <><Button size="sm" disabled={busy} onClick={start}>{pt('confirm')}</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => perform(() => PublishPrepare(publishKey()))}>{pt('refresh')}</Button></>}
 {(activeStates.includes(run.state) || run.state === 'ready') && <Button size="sm" variant="ghost" disabled={busy} onClick={() => perform(() => PublishCancel(run.id))}>{pt('cancel')}</Button>}
 {['failed', 'interrupted', 'cancelled', 'outcome_unknown'].includes(run.state) && !run.cleaned && !run.retryDisabled && <Button size="sm" disabled={busy} onClick={retry}>{pt('retry')}</Button>}
 {run.state === 'outcome_unknown' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => perform(() => PublishVerify(run.id))}>{pt('verify')}</Button>}
 {run.target.website && <Button size="sm" variant="ghost" disabled={busy} onClick={() => perform(() => PublishOpenWebsite(run.id))}>{pt('open')}</Button>}
 {!activeStates.includes(run.state) && run.state !== 'ready' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => perform(() => PublishPrepare(publishKey()))}>{pt('current')}</Button>}
 </div>
 <details className="publish-section" open={run.state === 'ready'}><summary className="text-sm cursor-pointer">{pt('changes')} ({run.changes?.length || 0})</summary>{!run.changes?.length && <p className="text-xs text-muted-foreground py-3">{pt('noChanges')}</p>}{run.changes?.filter(item => item.articleId).map(item => <div key={item.path} className="publish-change"><span className="publish-status">{pt(item.kind)}</span><span className="truncate">{item.title || item.path}</span>{item.articleId && <span className="text-xs text-muted-foreground">#{item.articleId}</span>}</div>)}{!!run.changes?.filter(item => !item.articleId).length && <details className="mt-3"><summary className="text-xs cursor-pointer">{pt('resources')} ({run.changes.filter(item => !item.articleId).length})</summary>{run.changes.filter(item => !item.articleId).map(item => <div className="publish-change" key={item.path}><span className="publish-status">{pt(item.kind)}</span><span className="truncate">{item.path}</span></div>)}</details>}</details>
 {!!run.managed?.length && <details className="publish-section"><summary className="text-xs cursor-pointer">{pt('owned')} ({run.managed.length})</summary>{run.managed.map(name => <p key={name} className="text-xs text-muted-foreground break-all">{name}</p>)}</details>}
 <details className="publish-section"><summary className="text-sm cursor-pointer">{pt('logs')}</summary><ol className="text-xs text-muted-foreground space-y-2 mt-3">{run.events?.map(event => <li key={event.sequence}>{new Date(event.time).toLocaleTimeString()} · {pt(event.stage)} · {pt(event.message)}</li>)}</ol><p className="text-xs text-muted-foreground mt-2">{run.id}</p></details>
 <div className="flex gap-2 mt-6">{['failed', 'interrupted', 'cancelled'].includes(run.state) && !run.retryDisabled && <Button size="sm" variant="ghost" disabled={busy} onClick={() => {
              if (window.confirm(pt('abandonConfirm'))) perform(() => PublishAbandonRetry(run.id));
            }}>{pt('abandon')}</Button>}{!run.cleaned && !activeStates.includes(run.state) && <Button size="sm" variant="ghost" disabled={busy} onClick={() => {
              if (window.confirm(pt('cleanupConfirm') + ' ' + (((run.sources || []).reduce((n, f) => n + f.size, 0) + (run.output || []).reduce((n, f) => n + f.size, 0)) / 1024 / 1024).toFixed(1) + ' MB')) perform(() => PublishCleanup(run.id));
            }}>{pt('cleanup')}</Button>}{run.retryDisabled && <span className="text-xs text-muted-foreground self-center">{pt('retryDisabled')}</span>}</div>
 </>}
 </section></main></div>;
}
