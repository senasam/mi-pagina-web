import { Node, mergeAttributes } from "@tiptap/core";

export const SectionNode = Node.create({
  name: "studioSection",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      title: { default: "Nota", parseHTML: (element) => element.dataset.title || "Nota" },
      color: { default: "gold", parseHTML: (element) => element.dataset.color || "gold" },
    };
  },
  parseHTML() { return [{ tag: 'details[data-studio-section="true"]', contentElement: "div" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes, {
      "data-studio-section": "true", "data-title": HTMLAttributes.title,
      "data-color": HTMLAttributes.color, open: "open",
    }), ["summary", HTMLAttributes.title], ["div", 0]];
  },
});
