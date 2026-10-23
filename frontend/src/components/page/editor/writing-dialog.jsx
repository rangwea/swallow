import { useEffect, useRef } from 'react';
export default function WritingDialog({
  label,
  alert = false,
  children
}) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    return () => dialog.current?.close();
  }, []);
  return <dialog ref={dialog} role={alert ? 'alertdialog' : 'dialog'} aria-label={label} onCancel={event => event.preventDefault()} className="writing-dialog">{children}</dialog>;
}
