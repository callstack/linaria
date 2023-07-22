import { Counter } from './Counter'
import { css } from '@linaria/core'

export function Page() {
	return (
		<>
			<h1>SSR</h1>
			<p>This page is:</p>
			<ul>
				<li>Rendered to HTML and hydrated in the browser.</li>
				<li>
					Interactive. <Counter />
				</li>
			</ul>
			<p
				class={css`
            color: blue;
         `}
			>
				Blue text.
			</p>
		</>
	)
}

export const hydrate = true
