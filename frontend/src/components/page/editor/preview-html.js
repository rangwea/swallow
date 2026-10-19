// Raw HTML is limited to the Markdown elements plus spans with a single color.
export const previewElements = ["a", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "img", "input", "li", "ol", "p", "pre", "span", "strong", "sup", "sub", "table", "tbody", "td", "th", "thead", "tr", "ul"];
export function previewUrl(url) {
  const clean = url.replace(/[\u0000-\u0020]/g, "");
  return /^[a-z][a-z\d+.-]*:/i.test(clean) && !/^(https?:|mailto:|tel:)/i.test(clean) ? "" : url;
}
export function colorSpansOnly() {
  return (tree) => {
    function visit(node) {
      if (node.type === "element") {
        const properties = node.properties || {};
        const match = node.tagName === "span" && typeof properties.style === "string" && properties.style.match(/^\s*color\s*:\s*(#[\da-f]{3}(?:[\da-f]{3})?)\s*;?\s*$/i);
        delete properties.style;
        for (const key of Object.keys(properties)) if (/^on/i.test(key)) delete properties[key];
        if (node.tagName === "span") node.properties = match ? { style: `color: ${match[1]}` } : {};
        if (node.tagName === "input") node.properties = { type: "checkbox", disabled: true, checked: Boolean(properties.checked) };
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
export const previewPlugins = [colorSpansOnly];
