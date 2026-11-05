// The whole browser-side JavaScript of this page.

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
