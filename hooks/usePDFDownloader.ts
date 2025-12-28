import * as FileSystem from 'expo-file-system';

export function usePDFDownloader() {
	const downloadHtmlAsFile = async (html: string, filename: string) => {
		const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
		const path = `${dir}${filename}`;
		await FileSystem.writeAsStringAsync(path, html);
		return path;
	};

	return { downloadHtmlAsFile };
}
