// Import NextResponse untuk membentuk respons API dari Next.js
import { NextResponse } from "next/server";

// Kelas custom error untuk API, mempermudah penanganan error dengan status code dan detail tambahan
export class ApiError extends Error {
	constructor(
		public statusCode: number, // HTTP status code, contoh: 404, 500, dll
		public message: string, // Pesan utama error
		public details?: any // Detail tambahan (opsional), bisa berupa objek atau data lainnya
	) {
		super(message); // Panggil constructor parent (Error)
	}
}

// Fungsi untuk menangani error yang dilempar dari API handler
export const handleApiError = (error: unknown): NextResponse => {
	console.error("API Error:", error); // Log error ke konsol (berguna saat debugging)

	// Jika error merupakan instance dari ApiError (error custom kita)
	if (error instanceof ApiError) {
		return NextResponse.json(
			{ error: error.message, details: error.details }, // Response JSON dengan pesan dan detail error
			{ status: error.statusCode } // Gunakan status code dari error
		);
	}

	// Jika error adalah error bawaan JavaScript (Error biasa)
	if (error instanceof Error) {
		return NextResponse.json(
			{ error: error.message }, // Kirim pesan error
			{ status: 500 } // Default ke 500 Internal Server Error
		);
	}

	// Jika error-nya tidak diketahui tipenya (bukan instance dari Error maupun ApiError)
	return NextResponse.json(
		{ error: "Unknown error occurred" }, // Pesan default
		{ status: 500 } // Status default
	);
};
