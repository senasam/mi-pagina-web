import DOMPurify from "dompurify";
import { marked } from "marked";

function sectionDirectives(markdown) {
  return markdown.replace(/^:::\s*section(?:\s+([^|\n]+))?(?:\|([^\n]+))?\r?\n([\s\S]*?)^:::\s*$/gmu,
    (_match, title = "Nota", color = "gold", body = "") =>
      `<details data-studio-section="true" data-title="${escapeHtml(title.trim())}" data-color="${escapeHtml(color.trim())}" open><summary>${escapeHtml(title.trim())}</summary><div>${marked.parse(body.trim())}</div></details>`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function markdownToHtml(markdown = "") {
  const html = marked.parse(sectionDirectives(markdown), { gfm: true, breaks: false });
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["details", "summary"],
    ADD_ATTR: ["data-studio-section", "data-title", "data-color", "open", "style"],
  });
}

function inline(node) {
  if (node.nodeType === 3) return node.nodeValue || "";
  if (node.nodeType !== 1) return "";
  const tag = node.tagName.toLowerCase();
  const content = [...node.childNodes].map(inline).join("");
  if (tag === "strong" || tag === "b") return `**${content}**`;
  if (tag === "em" || tag === "i") return `*${content}*`;
  if (tag === "s" || tag === "strike") return `~~${content}~~`;
  if (tag === "u") return `<u>${content}</u>`;
  if (tag === "mark") return `<mark>${content}</mark>`;
  if (tag === "code") return `\`${content}\``;
  if (tag === "br") return "  \n";
  if (tag === "a") return `[${content}](${node.getAttribute("href") || ""})`;
  return content;
}

function block(node, depth = 0) {
  if (node.nodeType === 3) return node.nodeValue || "";
  if (node.nodeType !== 1) return "";
  const tag = node.tagName.toLowerCase();
  if (tag === "details" && node.dataset.studioSection) {
    const title = node.dataset.title || node.querySelector("summary")?.textContent || "Nota";
    const color = node.dataset.color || "gold";
    const bodyNode = [...node.children].find((child) => child.tagName.toLowerCase() !== "summary");
    const body = bodyNode ? [...bodyNode.childNodes].map((child) => block(child, depth)).join("").trim() : "";
    return `::: section ${title}|${color}\n${body}\n:::\n\n`;
  }
  const children = [...node.childNodes].map((child) => block(child, depth)).join("");
  if (/^h[1-6]$/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${inline(node).trim()}\n\n`;
  if (tag === "p") return `${[...node.childNodes].map(inline).join("").trim()}\n\n`;
  if (tag === "blockquote") return children.trim().split("\n").map((line) => `> ${line}`).join("\n") + "\n\n";
  if (tag === "hr") return "---\n\n";
  if (tag === "ul" || tag === "ol") {
    return [...node.children].map((item, index) => `${tag === "ol" ? `${index + 1}.` : "-"} ${inline(item).trim()}\n`).join("") + "\n";
  }
  if (tag === "pre") return `\`\`\`\n${node.textContent || ""}\n\`\`\`\n\n`;
  if (["strong", "b", "em", "i", "s", "strike", "u", "mark", "code", "a", "br"].includes(tag)) return inline(node);
  return children;
}

export function htmlToMarkdown(html = "") {
  const document = new DOMParser().parseFromString(DOMPurify.sanitize(html, { ADD_TAGS: ["details", "summary"], ADD_ATTR: ["data-studio-section", "data-title", "data-color", "open"] }), "text/html");
  return [...document.body.childNodes].map((node) => block(node)).join("").replace(/\n{3,}/g, "\n\n").trimEnd();
}

