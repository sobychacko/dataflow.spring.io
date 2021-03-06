const visit = require(`async-unist-util-visit`)
const request = require('request-promise')

const highlightCode = require(`gatsby-remark-prismjs/highlight-code`)

const FILE_EXTENSION_TO_LANGUAGE_MAP = {
  js: `jsx`,
  md: `markup`,
  sh: `bash`,
  rb: `ruby`,
}

const KEY = `embed-code:`

const getLanguage = file => {
  if (!file.includes(`.`)) {
    return `none`
  }
  const extension = file.split(`.`).pop()
  return FILE_EXTENSION_TO_LANGUAGE_MAP.hasOwnProperty(extension)
    ? FILE_EXTENSION_TO_LANGUAGE_MAP[extension]
    : extension.toLowerCase()
}

module.exports = async (
  { markdownAST, markdownNode },
  { classPrefix = `language-` } = {}
) => {
  return await visit(markdownAST, `code`, async node => {
    const { value } = node
    if (value.startsWith(KEY)) {
      const url = value.substr(KEY.length)
      try {
        const filename = url.split('/').slice(-1)[0]
        const code = await request(url)
        const language = getLanguage(filename)
        const className = language
          .split(` `)
          .map(token => `${classPrefix}${token}`)
          .join(` `)
        node.value = `<div class="gatsby-highlight">
        <pre class="${className}"><code>${highlightCode(
          language,
          code
        ).trim()}</code></pre>
        </div>`
        node.type = `html`
      } catch (e) {
        throw Error(`Error embed ${url}`)
      }
    }
    return markdownAST
  })
}
