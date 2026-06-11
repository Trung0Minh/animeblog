import Heading from "@tiptap/extension-heading"

import { generateSlug } from "@/lib/utils"

export const HeadingWithIdExtension = Heading.extend({
  renderHTML({ HTMLAttributes, node }) {
    const level = this.options.levels.includes(node.attrs.level)
      ? node.attrs.level
      : this.options.levels[0]
    const id = generateSlug(node.textContent)

    return [`h${level}`, { ...HTMLAttributes, id }, 0]
  },
}).configure({ levels: [2, 3, 4] })
