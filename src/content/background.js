'use strict'

var tab = null, url = chrome.runtime.getURL('index.html')
function createTab(id, force) {
	if (tab !== null && !force) {
		chrome.tabs.update(tab.id, { active: true, url: url + '?tabid=' + id }, function() {
			if (chrome.runtime.lastError)
				createTab(id, true)
		})
	} else {
		chrome.tabs.create({
			url: url + '?tabid=' + id
		}, function(newTab) {
			tab = newTab
		})
	}
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.action === 'click')
			createTab(sender.tab.id, false)
	}
)

var API = 'https://www.instagram.com/'
function getCookie(name) {
	return new Promise((resolve, reject) => {
		chrome.cookies.get({ url: API, name }, function(cookie) {
			if (cookie !== null) resolve(cookie.value)
			reject()
		})
	})
}

var sessionid = ''
function getSessionId() {
	getCookie('sessionid').then(function(value) {
		return sessionid = value
	})
}
getSessionId()

// hook into web request and modify headers before sending the request
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
	getSessionId() // just update for next time

	var headers = details.requestHeaders

	for (var i = 0; i < headers.length; ++i) {
		var header = headers[i]

		if (header.name === 'User-Agent') {
			header.value = 'Instagram 10.8.0 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US)'
		} else if (header.name === 'Cookie') {
			// add auth cookies to authenticate API requests
			var cookies = header.value + '; sessionid=' + sessionid
			header.value = cookies
		}
	}
	return { requestHeaders: headers }
},
	{
		urls: [
			'https://i.instagram.com/api/v1/feed/*'
		],
		types: ['xmlhttprequest']
	},
	['blocking', 'requestHeaders']
)
