let queue = Promise.resolve();
export function writeSettings(work) {
  const next = queue.catch(() => {}).then(work);
  queue = next;
  return next;
}
export function requireSuccess(result) {
  if (result?.code !== 1) throw new Error(result?.msg || "");
  return result.data;
}
