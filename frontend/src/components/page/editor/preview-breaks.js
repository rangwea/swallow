// Preserve soft line breaks in prose without altering code or paragraph boundaries.
function softLineBreaks() {
  return (tree) => {
    function visit(node) {
      if (!node.children) return;
      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !/[\r\n]/.test(child.value)) {
          visit(child);
          return [child];
        }
        return child.value.split(/(\r\n|\r|\n)/).filter(Boolean).map((value) =>
          /^[\r\n]+$/.test(value) ? { type: "break" } : { type: "text", value }
        );
      });
    }
    visit(tree);
  };
}
export const previewRemarkPlugins = [softLineBreaks];
