import pdf from 'html-pdf';

export default function html2pdf(html) {
	return new Promise((resolve, reject) => {
		pdf.create(html, {
			height: '840px',
			width: '1188px',
			border: 0,
		}).toStream((err, stream) => {
			if (err) {
				reject(err);
			} else {
				resolve(stream);
			}
		});
	});
};
