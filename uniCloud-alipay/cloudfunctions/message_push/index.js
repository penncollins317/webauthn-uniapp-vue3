'use strict';

exports.main = async (event, context) => {
	const data = JSON.parse(event.body)
	const uniPush = uniCloud.getPushManager({
		appId: data.appid
	})
	console.log('event data : ', data)
	const result = await uniPush.sendMessage(data.message)
	return result
};