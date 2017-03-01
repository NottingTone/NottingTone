import crypto from 'crypto';
import config from '../../../config';

function checkSignature(timestamp, nonce, signature) {
	const data = [config.wechat.token, timestamp, nonce]
		.sort()
		.join('');
	const hash = crypto.createHash('sha1')
		.update(data)
		.digest('hex');
	return hash === signature;
};

export default async (ctx, next) => {
	const valid = checkSignature(ctx.query.timestamp, ctx.query.nonce, ctx.query.signature);
	if (valid) {
		return await next();
	} else {
		ctx.status = 404;
	}
};
