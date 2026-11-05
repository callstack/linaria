export function Page() {
	return (
		<>
			<h1>Render Modes</h1>
			<ul>
				<li>
					<a href="/html-only">HTML only</a>. Rendered to HTML, zero browser-side JavaScript.
				</li>
				<li>
					<a href="/spa">SPA</a>. Rendered to the browser's DOM (not rendered to HTML).
				</li>
				<li>
					<a href="/html-js">HTML + JS</a>. Rendered to HTML, some browser-side JavaScript.
				</li>
				<li>
					<a href="/ssr">SSR</a>. Rendered to HTML and hydrated in the browser.
				</li>
			</ul>
		</>
	)
}
