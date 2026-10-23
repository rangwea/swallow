import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { EventsOn } from '/wailsjs/runtime/runtime';
import { ArticleGet, ArticleSaveWithDraft, DraftList, DraftSave, DraftRemove, WritingGuard, WritingCloseReady } from '/wailsjs/go/backend/App';
import { createDraftQueue } from './draft-queue';
import { getCurrentTime } from '@/components/page/util';
import { wt } from '@/lib/writing-text';
import { toast } from 'sonner';
let guardRevision = 0;
function guard(active) {
  guardRevision = Math.max(guardRevision + 1, Date.now() * 1000);
  return WritingGuard(guardRevision, active);
}
function draftKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
}
function equivalent(a, b) {
  return a.title === b.title && a.date === b.date && (a.description || '') === (b.description || '') && JSON.stringify(a.tags || []) === JSON.stringify(b.tags || []);
}
function checked(result) {
  if (result.code !== 1) throw Error(result.msg);
  return result.data;
}
export default function useWritingDraft({
  requestedId,
  requestedDraft,
  bodyRef,
  form,
  title,
  setTitle,
  setTags
}) {
  const [id, setId] = useState(requestedId);
  const idRef = useRef(requestedId || '');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const [recovery, setRecovery] = useState(null);
  const [leave, setLeave] = useState(null);
  const revision = useRef(0),
    persisted = useRef(0),
    baseHash = useRef(''),
    key = useRef(''),
    timer = useRef(null),
    queue = useRef(null),
    latest = useRef(null),
    saveBusy = useRef(false),
    composing = useRef(false),
    alive = useRef(true);
  if (!queue.current) queue.current = createDraftQueue();
  function apply(meta, content) {
    setTitle(meta.title || '');
    setTags((meta.tags || []).map(text => ({
      id: text,
      text
    })));
    form.reset({
      tags: (meta.tags || []).map(text => ({
        id: text,
        text
      })),
      date: meta.date || getCurrentTime(),
      lastmod: meta.lastmod || getCurrentTime()
    });
    bodyRef.current?.setValue(content || '');
  }
  function snapshot() {
    const values = form.getValues();
    return {
      version: 1,
      id: key.current,
      articleId: idRef.current,
      meta: {
        ...values,
        title,
        tags: (values.tags || []).map(tag => typeof tag === 'string' ? tag : tag.text)
      },
      content: bodyRef.current?.getValue() || '',
      baseHash: baseHash.current
    };
  }
  async function flush() {
    clearTimeout(timer.current);
    if (composing.current && revision.current !== persisted.current) throw Error(wt('draftWaiting'));
    // Read metadata at execution time so a preceding manual save can reassociate a new article.
    return queue.current.run(async () => {
      if (revision.current === persisted.current) return;
      const rev = revision.current;
      const data = latest.current.snapshot();
      setDraftStatus('draftSaving');
      try {
        checked(await DraftSave(data));
        persisted.current = rev;
        if (alive.current) setDraftStatus(revision.current === rev ? 'draftSaved' : 'draftWaiting');
      } catch (e) {
        if (alive.current) setDraftStatus('draftFailed');
        throw e;
      }
    });
  }
  function markChanged() {
    revision.current++;
    setChanged(true);
    setDraftStatus('draftWaiting');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latest.current.flush().catch(() => {}), 1000);
  }
  async function save() {
    if (saveBusy.current || loading || loadFailed || recovery) return;
    saveBusy.current = true;
    setSaving(true);
    clearTimeout(timer.current);
    const rev = revision.current;
    const data = snapshot();
    try {
      await queue.current.run(async () => {
        // Ensure the manual save itself has a recovery snapshot even if file/index persistence fails.
        checked(await DraftSave({
          ...data,
          articleId: idRef.current,
          baseHash: baseHash.current
        }));
        persisted.current = rev;
        const articleId = checked(await ArticleSaveWithDraft(idRef.current, key.current, data.meta, data.content));
        idRef.current = articleId;
        setId(articleId);
        const current = checked(await ArticleGet(articleId));
        baseHash.current = current.hash;
        if (revision.current === rev) {
          checked(await DraftRemove(key.current));
          setChanged(false);
          setDraftStatus('');
        } else {
          const nextRevision = revision.current;
          const next = latest.current.snapshot();
          checked(await DraftSave({
            ...next,
            articleId,
            baseHash: baseHash.current
          }));
          persisted.current = nextRevision;
          setDraftStatus(revision.current === nextRevision ? 'draftSaved' : 'draftWaiting');
        }
      });
    } catch (e) {
      setDraftStatus(persisted.current === revision.current ? 'draftSaved' : 'draftFailed');
      toast.error(e.message || wt('saveFailed'));
    } finally {
      saveBusy.current = false;
      setSaving(false);
      if (revision.current !== persisted.current) timer.current = setTimeout(() => latest.current.flush().catch(() => {}), 1000);
    }
  }
  latest.current = {
    snapshot,
    flush,
    save
  };
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setRecovery(null);
    setChanged(false);
    setDraftStatus('');
    revision.current = 0;
    persisted.current = 0;
    idRef.current = requestedId || '';
    setId(requestedId);
    key.current = requestedDraft || (requestedId ? 'article-' + requestedId : draftKey());
    baseHash.current = '';
    apply({}, '');
    (async () => {
      let official = null;
      if (requestedId) {
        official = checked(await ArticleGet(requestedId));
        if (cancelled) return;
        apply(official.meta, official.content);
        baseHash.current = official.hash;
      }
      const drafts = checked(await DraftList());
      if (cancelled) return;
      const draft = requestedDraft ? drafts.find(d => d.id === requestedDraft) : drafts.find(d => d.articleId === requestedId && requestedId);
      if (requestedDraft && !draft) throw Error(wt('loadFailed'));
      if (draft) {
        if ((draft.articleId || '') !== (requestedId || '')) throw Error(wt('loadFailed'));
        if (official && draft.content === official.content && equivalent(draft.meta, official.meta)) checked(await DraftRemove(draft.id));else {
          key.current = draft.id;
          setRecovery({
            draft,
            conflict: !!official && draft.baseHash !== official.hash
          });
        }
      }
    })().catch(e => {
      if (!cancelled) {
        setLoadFailed(true);
        toast.error(e.message || wt('loadFailed'));
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, [requestedId, requestedDraft]);
  async function decideRecovery(action) {
    if (action === 'recover') {
      apply(recovery.draft.meta, recovery.draft.content);
      revision.current = 1;
      persisted.current = 1;
      setChanged(true);
      setDraftStatus('draftSaved');
      setRecovery(null);
    }
    if (action === 'later') {
      key.current = draftKey();
      setRecovery(null);
    }
    if (action === 'discard') {
      try {
        checked(await DraftRemove(recovery.draft.id));
        setRecovery(null);
      } catch (e) {
        toast.error(e.message);
      }
    }
  }
  const blocker = useBlocker(({
    currentLocation,
    nextLocation
  }) => currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search);
  async function attemptLeave(kind) {
    setLeaving(true);
    try {
      do {
        await latest.current.flush();
      } while (revision.current !== persisted.current);
      if (kind === 'close') await WritingCloseReady();else blocker.proceed();
    } catch (e) {
      setLeaving(false);
      setLeave(kind);
      toast.error(e.message || wt('saveFailed'));
    }
  }
  useEffect(() => {
    if (blocker.state === 'blocked') attemptLeave('navigate');
  }, [blocker.state]);
  useEffect(() => {
    guard(true);
    const off = EventsOn('writing:close', () => latest.current.close());
    function beforeUnload(event) {
      if (revision.current !== persisted.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      off();
      guard(false);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
  latest.current.close = () => attemptLeave('close');
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        latest.current.save();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  async function leaveAction(action) {
    const kind = leave;
    if (action === 'stay') {
      if (kind === 'navigate' && blocker.state === 'blocked') blocker.reset();
      setLeave(null);
      setLeaving(false);
      return;
    }
    if (action === 'retry') {
      setLeave(null);
      await attemptLeave(kind);
      return;
    }
    clearTimeout(timer.current);
    persisted.current = revision.current;
    setLeave(null);
    if (kind === 'close') await WritingCloseReady();else blocker.proceed();
  }
  return {
    id,
    leaving,
    loading,
    loadFailed,
    saving,
    changed,
    markChanged,
    save,
    draftStatus,
    recovery,
    decideRecovery,
    leave,
    leaveAction,
    onComposition(active) {
      composing.current = active;
      if (!active && revision.current !== persisted.current) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => latest.current.flush().catch(() => {}), 1000);
      }
    },
    retry: () => flush().catch(e => toast.error(e.message))
  };
}
