import { PDF_PROCESSING } from "./constants";
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import type { TextContent } from "pdfjs-dist/types/src/display/api";

if (typeof window != "undefined") {
	GlobalWorkerOptions.workerSrc = PDF_PROCESSING.WORKER_SRC;

	console.log(`PDF.JS Version: ${version}`);
}

// Fungsi untuk mengekstrak teks dari file PDF
export const extractTextFromPDF = async (file: File): Promise<string> => {
	try {
		// Mengonversi file PDF menjadi ArrayBuffer agar bisa diproses
		const arrayBuffer = await file.arrayBuffer();

		// Memulai proses loading dokumen PDF menggunakan pdfjs
		const loadingTask = getDocument({
			data: arrayBuffer, // Data PDF dalam bentuk ArrayBuffer
			useWorkerFetch: false, // Nonaktifkan fetch di web worker
			isEvalSupported: false, // Nonaktifkan penggunaan eval (untuk keamanan)
			useSystemFonts: true, // Menggunakan font sistem (jika perlu)
		});

		// Menunggu dokumen PDF selesai diload
		const pdf = await loadingTask.promise;

		// Mengambil jumlah halaman pada PDF
		const numPages = pdf.numPages;

		let text = "";

		// Membuat array promise untuk mengambil teks dari setiap halaman
		const pagePromises = Array.from({ length: numPages }, (_, i) => i + 1).map(
			async (pageNum) => {
				// Mengambil objek halaman berdasarkan nomor halaman
				const page = await pdf.getPage(pageNum);

				// Mengambil konten teks dari halaman tersebut
				const content = (await page.getTextContent()) as TextContent;

				// Menggabungkan semua teks pada halaman menjadi satu string
				return content.items
					.map((item) => ("str" in item ? item.str : "")) // Cek apakah item memiliki properti `str`
					.join(" ");
			}
		);

		// Menunggu semua teks halaman selesai diambil
		const pageTexts = await Promise.all(pagePromises);

		// Menggabungkan semua teks halaman menjadi satu string besar dengan pemisah newline
		text = pageTexts.join("\n");

		return text;
	} catch (error) {
		// Menangani error jika proses ekstraksi gagal
		console.error("PDF extraction failed:", error);
		throw new Error(
			error instanceof Error
				? `Failed to extract text from PDF: ${error.message}`
				: "Failed to extract text from PDF"
		);
	}
};
