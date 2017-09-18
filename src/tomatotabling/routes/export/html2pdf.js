import puppeteer from 'puppeteer';

let browser;

puppeteer.launch()
	.then(b => browser = b);

export default async function html2pdf(html) {
	const page = await browser.newPage();
	await page.setContent(html);
	await page.emulateMedia('screen');
	const pdf = await page.pdf({
		landscape: true,
		height: '1188px',
		width: '840px',
		printBackground: true,
	});
	await page.close();
	return pdf;
};
