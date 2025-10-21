document.addEventListener('DOMContentLoaded', () => {
	// 输入的内容
	const TextContent = document.getElementById('qr-text'); // 二维码内容
	const ImgSize = document.getElementById('InputSize'); // 图像尺寸
	const x = document.getElementById('xCoord'); // 生成在画布上的坐标
	const y = document.getElementById('yCoord');
	const PointDiv = document.getElementById('coordinateInputs'); // 输入框所在的div
	const Color = document.getElementById('qr-color'); // 丝印颜色
	// 标志位
	let CreateType = document.getElementById('CreateType'); // 是否从坐标生成的开关
	let ColorFlag = document.getElementById('buttontest'); // 彩色丝印开关
	let ImgType = 0; // 图像类型，0为二维码，1为条形码
	let Create_Type = 0; // 事件是否完成的标志位
	let ID = ''; //图元ID
	let followInterval = null; //定时器ID
	// 按钮对象
	const CreateQr_Button = document.getElementById('generate-btn'); // 生成二维码按钮
	const CreateBr_Button = document.getElementById('getBrCode'); // 生成条形码按钮
	const Downolad_Button = document.getElementById('download-btn'); // 通用下载按钮
	const Create_EDA = document.getElementById('Create-btn'); // 通用放置按钮
	const Back_Button = document.getElementById('Back-btn'); //取消按钮
	const Save_Button = document.getElementById('Save-btn'); //保存到历史
	const Import_Button = document.getElementById('history-btn'); //从历史导入
	// 输出区域
	const Result = document.getElementById('qr-result'); // 二维码输出区域
	const DownloadSection = document.getElementById('download-section'); // 下载按钮的父控件
	// 全局临时变量
	let Base64 = ''; // 存储生成图像的base64数据
	let BlobData = ''; // 存储生成图像的blob数据
	let ImgId = ''; //图元ID
	// 函数相关
	/* ================================二维码生成函数================================================================== */
	async function Create_QRCode() {
		let text = TextContent.value.trim(); // 获得清除前后空格后的二维码内容
		let size = parseInt(ImgSize.value, 10); // 将获得的尺寸以10进制输出
		let color = '#000000';
		if (!text || !size) {
			// 内容或尺寸未填写则提示
			showMessage('参数不完整');
			return;
		}
		if (ColorFlag.checked) {
			color = Color.value;
		}
		Result.innerHTML = ''; // 清除上一次生成的内容
		try {
			const canvas = await new Promise((resolve, reject) => {
				QRCode.toCanvas(
					text, {
						width: 150,
						margin: 2,
						correctLevel: 3,
						color: {
							dark: color,
							light: '#ffffff',
						},
					},
					(error, canvas) => {
						if (error) reject(error);
						else resolve(canvas);
					},
				);
			});
			Result.appendChild(canvas); // 图像渲染
			DownloadSection.classList.remove('hidden');
			Base64 = await canvas.toDataURL('image/png');
			ImgType = 0;
			BlobData = base64ToBlob(Base64, 'image/png');
			console.log(Blob);
			showMessage('二维码已生成');
		} catch (error) {
			// showMessage('生成二维码时出错: ' + error.message);
			console.log(error.message);
		}
	}

	/* ===============================条形码生成函数================================================================== */
	async function Create_BRCode() {
		// 生成条形码
		let text = TextContent.value.trim(); // 获得清除前后空格后的条形码内容
		let size = parseInt(ImgSize.value, 10); // 将获得的尺寸以10进制输出
		let color = '#000000';
		if (!text || !size) {
			// 内容或尺寸未填写则提示
			showMessage('参数不完整');
			return;
		}
		if (ColorFlag.checked) {
			color = Color.value;
		}

		Result.innerHTML = '';
		try {
			const canvas = document.createElement('canvas');
			JsBarcode(canvas, text, {
				lineColor: color,
				format: 'CODE128',
				width: 2,
				height: 100,
				displayValue: false,
				correctLevel: 3,
			});
			const img = document.createElement('img');
			img.src = canvas.toDataURL('image/png');
			Result.appendChild(img);
			DownloadSection.classList.remove('hidden');
			Base64 = img.src;
			BlobData = base64ToBlob(Base64, 'image/png');
			ImgType = 1;
			showMessage('条形码已生成');
		} catch (error) {
			// showMessage('生成条形码时出错: ' + error.message);
		}
	}

	/* ================================非强制弹窗提示函数================================================================== */
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
		document.body.appendChild(messageElement); // 在ifram上渲染

		setTimeout(() => {
			if (document.body.contains(messageElement)) {
				document.body.removeChild(messageElement);
			}
		}, 3000);
	}

	/* ================================下载生成好的图像================================================================== */
	function Download() {
		if (!Base64) {
			Base64('图像未生成');
			return;
		}
		const link = document.createElement('a');
		link.download = new Date().toISOString().replace(/[:.]/g, '-') + '_丝印.png';
		link.href = Base64;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
	/* ================================在画布上创建图像_坐标生成================================================================== */
	async function CreateImg() {
		try {
			Create_Type = 1;
			let height = ImgSize.value;
			let width = ImgSize.value;
			const edaImage = await eda.pcb_MathPolygon.convertImageToComplexPolygon(BlobData, width, height,
				0.5, 0.5, 0, 0, true, false); // Blob转化为复杂多边形对象
			console.log(edaImage);
			if (ImgType) {
				// 条形码外形
				width *= 3;
			}
			if (ColorFlag.checked && CreateType.checked) { //从坐标生成，并开启彩色丝印开关
				// 彩色丝印开关
				eda.pcb_PrimitiveObject.create(EPCB_LayerId.TOP_SILKSCREEN, x.value, y.value, Base64, width,
					height, 0, false, 'img', false);
			} else if (CreateType.checked) { //从坐标生成
				eda.pcb_PrimitiveImage.create(x.value, y.value, edaImage, EPCB_LayerId.TOP_SILKSCREEN,
					width, height, 0, false, false); // 在画布上创建图像
			} else if (!CreateType.checked) {
				showMessage('请在画布上点击以放置丝印');
				CreatForMouse();
			} else {
				console.log("意外事件");
				return;
			}
			// showMessage("成功");
			return true;
		} catch (error) {
			showMessage('处理图像时出错: ' + error.message);
			return false;
		}
	}

	/* ================================base64转blob================================================================== */
	function base64ToBlob(base64, contentType) {
		const base64Message = base64.split(',')[1]; // 去除
		const byteCharacters = atob(base64Message);
		let byteArrays = [];
		for (let i = 0; i < byteCharacters.length; i++) {
			byteArrays.push(byteCharacters.charCodeAt(i));
		}
		const blob = new Blob([new Uint8Array(byteArrays)], {
			type: contentType,
		});
		console.log(blob);
		return blob;
	}
	/* ================================关闭Iframe窗口================================================================== */
	function CloseWindow() {
		eda.sys_IFrame.closeIFrame('');
	}

	/* ================================保存图像到历史记录================================================================== */
	async function SaveHistory() {
		if (!Base64 || !TextContent.value.trim()) {
			showMessage('无图像数据可保存');
			return;
		}

		const dataToSave = {
			type: ImgType === 0 ? 'qrcode' : 'barcode', // 0: 二维码, 1: 条形码
			content: TextContent.value.trim(), // 内容
			size: parseInt(ImgSize.value, 10), // 尺寸
			color: ColorFlag.checked ? Color.value : '#000000', // 颜色
			timestamp: new Date().toISOString(), // 时间戳
			//imageData: Base64, // 图像 base64 数据
			useColorSilk: ColorFlag.checked, // 是否使用彩色丝印
			fromCoordinates: CreateType.checked // 是否从坐标生成
		};

		try {
			let length = await eda.sys_Storage.getExtensionAllUserConfigs();
			let qrlength = Object.keys(length).filter(key => key.includes('qrcode')).length;
			let brlength = Object.keys(length).filter(key => key.includes('barcode')).length;
			console.log(length);
			// 使用扩展存储 API 保存数据
			await eda.sys_Storage.setExtensionUserConfig(ImgType === 0 ? 'qrcode' + (qrlength + 1) :
				'barcode' + (brlength + 1), dataToSave);
			showMessage('历史记录已保存');
			console.log(await eda.sys_Storage.getExtensionAllUserConfigs());
		} catch (error) {
			console.error('保存历史记录失败:', error);
			showMessage('保存失败: ' + error.message);
		}
	}
	/* ================================从历史记录导入图像================================================================== */
	async function Import() {
		//eda.sys_IFrame.closeIFrame('');
		await eda.sys_IFrame.openIFrame("/iframe/History.html", 900, 240, "history");
	}

	// 事件绑定
	CreateQr_Button.addEventListener('click', Create_QRCode); // 生成二维码
	CreateBr_Button.addEventListener('click', Create_BRCode); // 生成条形码
	Downolad_Button.addEventListener('click', Download); // 下载生成的图像
	Create_EDA.addEventListener('click', CreateImg); // 在画布上生成图像
	Back_Button.addEventListener('click', CloseWindow); //关闭窗口
	Save_Button.addEventListener('click', SaveHistory); //保存到历史
	Import_Button.addEventListener('click', Import); //从历史导入
	// 监听页面获得焦点
	window.onfocus = async function() {
		// console.log('网页已获得焦点');
		const Point = await eda.pcb_SelectControl.getCurrentMousePosition();
		// console.log(Point.x * 0.127 + '，' + Point.y * 0.127);
	};

	// 监听页面失去焦点
	window.onblur = async function() {
		console.log(12);
		clearInterval(followInterval);
		followInterval = null;
		//showMessage("放置完成");
	};


	async function CreatForMouse() {
		const Point = await eda.pcb_SelectControl.getCurrentMousePosition();
		let height = ImgSize.value;
		let width = ImgSize.value;

		// 非彩色图像需要先转为复杂多边形
		const edaImage = await eda.pcb_MathPolygon.convertImageToComplexPolygon(
			BlobData, width, height, 0.5, 0.5, 0, 0, true, false
		);

		if (ImgType) {
			width *= 3;
		}

		if (CreateType.checked || !Create_Type) {
			console.log('退出');
			return;
		}

		let ID;
		let isColorImage = false; // 标记是否为彩色图像，用于定时器中区分参数

		if (ColorFlag.checked && !CreateType.checked) {
			// 彩色丝印：使用 PrimitiveObject 创建
			const colorObj = eda.pcb_PrimitiveObject.create(
				EPCB_LayerId.TOP_SILKSCREEN,
				Point.x, Point.y,
				Base64,
				width,
				height,
				0,
				false,
				'img',
				false
			);
			ID = (await colorObj).getState_PrimitiveId();
			isColorImage = true;
		} else if (!CreateType.checked) {
			// 非彩色：使用 PrimitiveImage 创建
			const noColorImg = eda.pcb_PrimitiveImage.create(
				Point.x, Point.y, edaImage, EPCB_LayerId.TOP_SILKSCREEN,
				width, height, 0, false, false
			);
			ID = (await noColorImg).getState_PrimitiveId();
			isColorImage = false;
		} else {
			console.log('鼠标意外事件');
			return;
		}

		Create_Type = 0;


		// 启动定时器，统一处理，但根据类型使用不同参数
		 followInterval = setInterval(async () => {
			try {
				const currentPoint = await eda.pcb_SelectControl.getCurrentMousePosition();

				if (isColorImage) {
					// 彩色图像：使用 topLeftX / topLeftY
					await eda.pcb_PrimitiveObject.modify(ID, {
						topLeftX: currentPoint.x,
						topLeftY: currentPoint.y
					});
				} else {
					// 非彩色图像：使用 x / y
					await eda.pcb_PrimitiveImage.modify(ID, {
						x: currentPoint.x,
						y: currentPoint.y
					});
				}

				console.log(`鼠标位置: X=${currentPoint.x}, Y=${currentPoint.y}`);
			} catch (error) {
				console.error('更新图像位置失败:', error);
				clearInterval(followInterval); // 出错时清理定时器，避免内存泄漏
			}
		}, 10);
	}

});
