export class XHR {
	static parseJSON(response) {
		return response.json()
	}

	static fetch(url, options) {
		return window
			.fetch(url, options)
			.then(XHR.checkStatus)
			.then(XHR.parseJSON)
	}

	static checkStatus(response) {
		if (response.ok) return response

		const error = new Error(`HTTP Error ${response.statusText}`)
		error.status = response.statusText
		error.response = response
		console.log(error)
		throw error
	}
}

export class Storage {
	static STORAGE = 'local'

	static set = (key, value) =>
		new Promise((resolve, reject) => {
			chrome.storage[Storage.STORAGE].set({ [key]: value }, data => Storage.check(data, resolve, reject))
		})

	static get = (key, defaultValue) =>
		new Promise((resolve, reject) => {
			chrome.storage[Storage.STORAGE].get({ [key]: defaultValue }, data => Storage.check(data[key], resolve, reject))
		})

	static remove = key =>
		new Promise((resolve, reject) => {
			chrome.storage[Storage.STORAGE].remove(key, data => Storage.check(data, resolve, reject))
		})

	static check(data, resolve, reject) {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError)
			return reject(chrome.runtime.lastError)
		}

		return resolve(data)
	}
}

export class Chrome {
	static send(action, additional = {}) {
		const search = document.location.search.replace('?', '').split('='),
			index = search.indexOf('tabid')
		if (index !== -1) {
			console.log('sending req', action, additional)
			chrome.tabs.sendMessage(+search[index + 1], { action, ...additional }, null, function() {})
			return true
		}
		return false
	}
}

const regex = /-fr[atx]\d-\d/
export function updateCDN(url) {
	return url.replace(regex, '-frt3-1') // 10.08.2017
}

export function shallowDiffers(a, b) {
	for (const key in a) if (a[key] !== b[key]) return true
	for (const key in b) if (!(key in a)) return true
	return false
}

export const webWorkerScript = `const postMsg = (url, blob) => self.postMessage(url)
const checkStatus = function(response) {
	if (response.ok) return response
	throw response
}
self.addEventListener('message', event => {
	const url = event.data,
		bound = postMsg.bind(undefined, url)
	self.fetch(url, { mode: 'no-cors' }).then(checkStatus).then(bound).catch((e) => console.error(e) && bound())
})
`

let workerBlob = null
export function getWorkerBlob() {
	if (workerBlob === null) workerBlob = URL.createObjectURL(new Blob([webWorkerScript], { type: 'application/javascript' }))
	return workerBlob
}
