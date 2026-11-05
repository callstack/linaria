import type { Config } from 'vike/types'
import vikeSolid from 'vike-solid/config'

// The file names set where each page renders:
// +Page.server.tsx renders to HTML only, +Page.client.tsx only in the browser,
// +Page.tsx to HTML that is then hydrated in the browser.
export default {
	extends: [vikeSolid],
	prerender: {
		partial: true,
		noExtraDir: true,
	},
} satisfies Config
