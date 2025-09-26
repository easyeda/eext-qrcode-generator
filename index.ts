// import * as extensionConfig from '../extension.json';
// eslint-disable-next-line @typescript-eslint/no-unused-vars

// export function activate(status?: 'onStartupFinished', arg?: string): void {}

export function CreateQRCode(): void {
	eda.sys_IFrame.openIFrame('/iframe/index.html', 700, 500, 'bonding_pad');
}

export function ImportImg(): void {
	eda.sys_IFrame.openIFrame('/iframe/ImportImg.html', 500, 600, 'bonding_pad1');
}
