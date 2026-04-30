'use strict';
exports.main = async (event, context) => {
	const { access_token, openid, appid } = event;

	if (!access_token || !openid || !appid) {
		return {
			errcode: -1,
			errmsg: '缺少 access_token、openid 或 appid'
		};
	}

	try {
		const res = await uniCloud.getPhoneNumber({
			appid: appid,
			provider: 'univerify',
			apiKey: access_token,
			apiSecret: openid
		});

		if (res.code === 0) {
			return {
				errcode: 0,
				errmsg: 'ok',
				phoneNumber: res.phoneNumber
			};
		} else {
			return {
				errcode: res.code || -2,
				errmsg: res.message || '获取手机号失败'
			};
		}
	} catch (err) {
		console.error('getPhoneNumber error:', err);
		return {
			errcode: -3,
			errmsg: err.message || '云函数执行异常'
		};
	}
};