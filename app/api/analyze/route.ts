import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { handleApiError, ApiError } from "@/lib/errors";
import { rateLimiter } from "@/lib/rateLimiter";
import { API, PDF_PROCESSING } from "@/lib/constants";

export async function POST(request: NextRequest) {
	try {
		await rateLimiter(request);

		const body = await request.json().catch(() => ({}));
		const { text } = body;

		if (!text || typeof text !== "string") {
			throw new ApiError(
				400,
				"Invalid input: text is required and must be a string"
			);
		}

		if (text.length === 0) {
			throw new ApiError(400, "Invalid input: text cannot be empty");
		}

		const processedText = text.substring(0, PDF_PROCESSING.MAX_TEXT_LENGTH);

		const response = await fetch(
			`${API.GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: `
                                        Silakan analisis dokumen berikut dan berikan ringkasan naratif yang elegan dengan format sebagai berikut, dengan fokus pendekatan PICO:

                                        # Ikhtisar Dokumen
                                        Tuliskan ikhtisar ringkas dalam 2 kalimat yang menangkap inti dari jurnal ini.
                                        Fokuskan pada populasi yang diteliti, tujuan intervensi, serta ruang lingkup studi kesehatan yang dibahas.

                                        
                                        ## Wawasan Utama (PICO)
                                        A. Population: Tinjauan sistematis ini memusatkan perhatian pada pasien gagal jantung yang mengalami keterbatasan akses ke layanan kesehatan langsung akibat pandemi COVID-19.
                                        B. Intervention: Intervensi yang dikaji adalah penggunaan telemedicine, yakni pemanfaatan teknologi komunikasi untuk memberikan layanan kesehatan jarak jauh guna meminimalkan kontak fisik.
                                        C. Comparison: Perbandingan dilakukan antara kelompok pasien yang menerima layanan berbasis telemedicine dengan kelompok yang mendapatkan perawatan standar secara tatap muka.
                                        D. Outcome: Hasil yang dianalisis meliputi angka hospitalisasi, tingkat mortalitas, kualitas hidup pasien, kepatuhan terhadap pengobatan, dan efisiensi biaya. Beberapa studi menunjukkan bahwa telemedicine secara signifikan mampu menurunkan angka hospitalisasi dan mortalitas dibandingkan perawatan konvensional.

                                        ## Analisis Kritis
                                        Analisis dalam 1 paragraf (maksimal 3 kalimat) bagaimana pendekatan metodologis digunakan untuk mengevaluasi intervensi dalam konteks PICO.
                                        Diskusikan kekuatan desain penelitian, ketepatan analisis data, serta potensi keterbatasan yang mempengaruhi hasil.
                                        Sertakan kutipan atau temuan statistik bila mendukung pemahaman.

                                        ## Kesimpulan
                                        Sampaikan dua kalimat penutup yang merangkum kontribusi jurnal ini dalam praktik kesehatan atau kedokteran berbasis bukti.
                                        Soroti poin yang paling perlu diingat terkait hasil dan relevansinya terhadap populasi sasaran.

                                        Formatkan jawaban dengan judul-judul yang jelas dan paragraf-paragraf yang tersusun dengan baik.
                                        Gunakan bahasa yang profesional dan ringkas sepanjang tulisan.

                                        Isi Dokumen (Jurnal):
                                        ${processedText}`,
								},
								// {
								// 	text: `
								//         Silakan analisis dokumen berikut dan berikan ringkasan naratif yang elegan dengan format sebagai berikut:

								//         # Wawasan Utama
								//         Berikan 1 paragraf yang dirangkai dengan baik, maksimal 3 kalimat, yang menjelaskan temuan utama atau argumen penting dalam dokumen.
								//         Gunakan bahasa yang jelas dan menarik, serta fokus pada informasi yang paling signifikan.
								//         Hindari penggunaan poin-poin; sajikan dalam bentuk narasi mengalir.

								//         ## Analisis Kritis
								//         Dalam 1 paragraf (maksimal 3 kalimat), analisis pendekatan, metodologi, atau sudut pandang yang digunakan dalam dokumen.
								//         Bahas kekuatan, keterbatasan, atau aspek unik dari penelitian tersebut.
								//         Sertakan kutipan atau data relevan jika mendukung pemahaman.

								//         ## Kesimpulan
								//         Tulis paragraf penutup yang menyimpulkan pentingnya dokumen ini dan hal utama yang perlu diingat pembaca.
								//         Maksimal 2 kalimat.
								//         Formatkan jawaban dengan judul-judul yang jelas dan paragraf-paragraf yang tersusun dengan baik.
								//         Gunakan bahasa yang profesional dan ringkas sepanjang tulisan.

								//         Isi Dokumen:
								//         ${processedText}`,
								// },
							],
						},
					],
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 1024,
					},
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));

			throw new ApiError(
				response.status,
				errorData.error?.message ||
					`Failed to analyze document: ${response.statusText}`,
				errorData
			);
		}

		const data = await response.json();

		if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
			throw new ApiError(500, "Invalid response from AI service");
		}

		return NextResponse.json({
			summary: data.candidates[0].content.parts[0].text,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
