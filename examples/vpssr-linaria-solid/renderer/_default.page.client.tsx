import { render as solidRender, hydrate as solidHydrate } from 'solid-js/web'
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client' // When using Client Routing
export async function render(pageContext: PageContextBuiltInClient) {
	const { Page, exports, isHydration } = pageContext
	if ('hydrate' in exports && isHydration) {
		console.log('hydrating')
		solidHydrate(() => <Page />, document.body)
		return
	}
	solidRender(() => <Page />, document.body)
}
export const clientRouting = true
