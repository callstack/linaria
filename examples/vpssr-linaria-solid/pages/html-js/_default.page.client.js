// We could also define `handleCounter()` in `index.page.client.js` instead of `_default.page.client.js`.
// We define `_default.page.client.js` to showcase how to define the browser-side JavaScript for multiple pages.

handleCounter()

function handleCounter() {
	const counterEl = document.querySelector('button')
	let countState = 0
	const txt = () => `Counter ${countState} (Vanilla JS)`
	counterEl.textContent = txt()
	counterEl.onclick = () => {
		countState++
		counterEl.textContent = txt()
	}
}
