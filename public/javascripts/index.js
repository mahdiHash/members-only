
function deleteMsg(msgId, elem) {
	let params = {
		method: 'POST',
	};

	fetch('/message/delete/' + msgId, params)
		.then((res) => {
			if (res.status === 200) {
				// remove the whole message container element
				elem.parentElement.parentElement.remove();	
			}
			else {
				alert('Message could not be deleted.');
			}
		});
}

function pinMsg(msgId) {
	let params = {
		method: 'POST',
	}

	fetch('/message/pin/' + msgId, params)
		.then((res) => {
			if (res.status === 200) {
				document.location.reload();
			}
			else {
				alert('Message could not be pinned.');
			}
		});
}

function unpinMsg(msgId) {
	let params = {
		method: 'POST',
	}

	fetch('/message/unpin/' + msgId, params) 
		.then((res) => {
			if (res.status === 200) {
				document.location.reload();
			}
			else {
				alert('Message could not be unpinned.');
			}
		});
}
