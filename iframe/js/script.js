// const { create } = require("qrcode");

document.addEventListener('DOMContentLoaded', () => {
	// 获取DOM元素
	const qrText = document.getElementById('qr-text'); //二维码和条形码内容
	const qrSize = document.getElementById('InputSize'); //尺寸
	const generateBtn = document.getElementById('generate-btn'); //按钮对象
	const qrResult = document.getElementById('qr-result'); //输出区域的div对象
	const downloadSection = document.getElementById('download-section'); //下载按钮的父控件对象
	const downloadBtn = document.getElementById('download-btn'); //下载按钮对象
	const createBtn = document.getElementById('Create-btn'); //创建按钮对象
	const getBrCodeBtn = document.getElementById('getBrCode');
	const IntX = document.getElementById('IntX'); // 坐标 下同
	const IntY = document.getElementById('IntY');
	const color = document.getElementById('qr-color'); //彩色丝印配置相关
	const ColorButton = document.getElementById('buttontest'); // 彩色丝印开关
	const HistoryDataBtn = document.getElementById('history'); //查看历史记录 暂时不写
	let Temp = 0; //耦合度太高了 拿一个变量作为是否在画布创建图像的开关
	let imgtest = ''; //存储图形的容器
	let ImgType = 0; // 条形码或者二维码的标志位
	// 当前生成的图像数据
	let currentImageData = null;

	// Base64转blob 别的demo借的
	function base64ToBlob(base64, contentType) {
		const base64Message = base64.split(',')[1];
		const byteCharacters = atob(base64Message);
		let byteArrays = [];
		for (let i = 0; i < byteCharacters.length; i++) {
			byteArrays.push(byteCharacters.charCodeAt(i));
		}
		return new Blob([new Uint8Array(byteArrays)], {
			type: contentType,
		});
	}

	// 处理传递过来的二维码
	async function BprocessImageToEDA(imageData, size, x, y) {
		try {
			const imageBlob = base64ToBlob(imageData, 'image/png');
			const edaImage = await eda.pcb_MathPolygon.convertImageToComplexPolygon(imageBlob, size * 3,
				size, 0.5, 0.5, 0, 0, true, false);

			let value = ColorButton.checked; //检查丝印开关状态（其实是只能单选的多选）	下同
			// console.log(value);
			if (Temp) { //由于做完之后客户才要求分离创建按钮 耦合度太高 所以直接拿一个标志位作为是否创建的凭证
				eda.pcb_Document.setCanvasOrigin(0, 0);	//修改坐标一致
				if (value) { //是否开启彩色丝印
					eda.pcb_PrimitiveObject.create(EPCB_LayerId.TOP_SILKSCREEN, x, y, imageData, size * 3,
						size, 0, false, 'img', false);
				} else {
					eda.pcb_PrimitiveImage.create(x, y, edaImage, EPCB_LayerId.TOP_SILKSCREEN, size * 3,
						size, 0, false, false);
				}
				Temp = 0;
			}
			return true;
		} catch (error) {
			// showMessage('处理图像时出错: ' + error.message); 在HbuilderX环境下 由于缺少eda对象 所以会报错 直接屏蔽
			// return false;
		}
	}

	// 处理传递过来的条形码
	async function processImageToEDA(imageData, size, x, y) {
		try {
			const imageBlob = base64ToBlob(imageData, 'image/png');
			const edaImage = await eda.pcb_MathPolygon.convertImageToComplexPolygon(imageBlob, size, size,
				0.5, 0.5, 0, 0, true, false);
			let value = ColorButton.checked;
			// console.log(value);
			if (Temp) {
				eda.pcb_Document.setCanvasOrigin(0, 0);
				if (value) {
					eda.pcb_PrimitiveObject.create(EPCB_LayerId.TOP_SILKSCREEN, x, y, imageData, size, size,
						0, false, 'img', false);
				} else {
					eda.pcb_PrimitiveImage.create(x, y, edaImage, EPCB_LayerId.TOP_SILKSCREEN, size, size,
						0, false, false);
				}
				Temp = 0;
			}
			return true;
		} catch (error) {
			// showMessage('处理图像时出错: ' + error.message);
			// return false;
		}
	}

	// 生成条形码
	async function generateBarcode() {
		const text = qrText.value.trim(); //清除前后空格
		const Int_X = parseInt(IntX.value, 10);
		const Int_Y = parseInt(IntY.value, 10);
		if (!text) {
			showMessage('请输入要生成的条形码的内容！');
			return;
		}

		const size = parseInt(qrSize.value, 10);
		if (!size) {
			showMessage('请输入正确的条形码尺寸！');
			return;
		}

		qrResult.innerHTML = '';

		try {
			const canvas = document.createElement('canvas');
			JsBarcode(canvas, text, {
				lineColor: color.value,
				format: 'CODE128',
				width: 2,
				height: 100,
				displayValue: false,
				correctLevel: 3,
			});

			const img = document.createElement('img');
			img.src = canvas.toDataURL('image/png');
			qrResult.appendChild(img);

			currentImageData = img.src;
			imgtest = img.src;
			ImgType = 1;
			if (await BprocessImageToEDA(img.src, size, Int_X, Int_Y)) {
				showMessage('条形码已生成');
				console.log(parseInt(IntX.value, 10));
				downloadSection.classList.remove('hidden');
			}
		} catch (error) {
			// showMessage('生成条形码时出错: ' + error.message);
		}
	}

	// 生成二维码
	async function generateQRCode() {
		const text = qrText.value.trim();
		const Int_X = parseInt(IntX.value, 10);
		const Int_Y = parseInt(IntY.value, 10);
		if (!text) {
			showMessage('请输入要生成二维码的内容');
			return;
		}

		const size = parseInt(qrSize.value, 10);
		if (!size) {
			showMessage('请输入有效的二维码尺寸');
			return;
		}

		qrResult.innerHTML = '';

		try {
			const canvas = await new Promise((resolve, reject) => {
				QRCode.toCanvas(
					text, {
						width: 200,
						margin: 2,
						correctLevel: 3,
						color: {
							dark: color.value,
							light: '#ffffff',
						},
					},
					(error, canvas) => {
						if (error) reject(error);
						else resolve(canvas);
					},
				);
			});

			qrResult.appendChild(canvas);
			currentImageData = canvas.toDataURL('image/png');

			if (await processImageToEDA(currentImageData, size, Int_X, Int_Y)) {
				imgtest = currentImageData;
				ImgType = 0;
				showMessage('二维码已生成');
				downloadSection.classList.remove('hidden');
			}
		} catch (error) {
			// showMessage('生成二维码时出错: ' + error.message);
		}
	}

	// 下载图像
	function downloadImage() {
		if (!currentImageData) {
			showMessage('没有可下载的图像');
			return;
		}

		const link = document.createElement('a');
		link.download = new Date().toISOString().replace(/[:.]/g, '-') + '_丝印.png';
		link.href = currentImageData;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	// 显示消息函数
	function showMessage(message) {
		// 检查是否已存在样式
		if (!document.getElementById('message-style')) {
			const style = document.createElement('style');
			style.id = 'message-style';
			style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
                .message {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #1e90ff;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 6px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    animation: fadeInOut 3s forwards;
                }
            `;
			document.head.appendChild(style);
		}

		const messageElement = document.createElement('div');
		messageElement.className = 'message';
		messageElement.textContent = message;
		document.body.appendChild(messageElement); //在ifram上渲染

		setTimeout(() => {
			if (document.body.contains(messageElement)) {
				document.body.removeChild(messageElement);
			}
		}, 3000);
	}

	async function CreateBtn() { //创建按钮
		Temp = 1;
		if (!ImgType) {
			await processImageToEDA(imgtest, parseInt(qrSize.value, 10), parseInt(IntX.value, 10), parseInt(
				IntY.value, 10));
		} else {
			await BprocessImageToEDA(imgtest, parseInt(qrSize.value, 10), parseInt(IntX.value, 10),
				parseInt(IntY.value, 10));
		}

	}

	function HistoryData() {
		window.alert("还没写");
	}

	// 事件监听
	generateBtn.addEventListener('click', generateQRCode);
	downloadBtn.addEventListener('click', downloadImage);
	getBrCodeBtn.addEventListener('click', generateBarcode);
	createBtn.addEventListener('click', CreateBtn);
	HistoryDataBtn.addEventListener('click', HistoryData)
});
