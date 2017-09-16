export config from './config';

export default async function () {
	this.log.func = 'contact';
	await this.sendTemplateResponse('contact');
	this.interrupt();
}
