// Share one queue between draft writes, formal saves, and draft cleanup.
export function createDraftQueue() {
  let tail = Promise.resolve();
  return {
    run(operation) {
      const result = tail.then(operation);
      tail = result.catch(() => {});
      return result;
    },
  };
}
