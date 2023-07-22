import { generateHydrationScript, renderToStream } from 'solid-js/web'
import { escapeInject, stampPipe, dangerouslySkipEscape } from 'vite-plugin-ssr'
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client' // When using Client Routing

export function render(pageContext: PageContextBuiltInClient) {
	if (pageContext.Page) {
		const { Page } = pageContext
		const { pipe } = renderToStream(() => <Page />)

		stampPipe(pipe, 'node-stream')

      return escapeInject`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${dangerouslySkipEscape(generateHydrationScript())}
        </head>
        <body>${pipe}</body>
      </html>`
	}

   return escapeInject`<!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     </head>
     <body></body>
   </html>`
}
