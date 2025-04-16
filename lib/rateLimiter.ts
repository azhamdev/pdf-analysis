// Import jenis request dari Next.js
import { NextRequest } from "next/server";

// Import LRUCache untuk menyimpan data rate limit per IP
import { LRUCache } from "lru-cache";

// Import konstanta untuk pengaturan rate limit
import { RATE_LIMIT } from "./constants";

// Import class error khusus untuk API
import { ApiError } from "./errors";

// Inisialisasi cache dengan LRU (Least Recently Used) untuk menyimpan jumlah request per IP
const rateLimitCache = new LRUCache<string, number>({
	max: RATE_LIMIT.CACHE_MAX_SIZE, // Maksimum jumlah IP yang disimpan dalam cache
	ttl: RATE_LIMIT.CACHE_TTL_MS, // Waktu hidup setiap entry dalam cache (dalam milidetik)
});

// Middleware rate limiter
export const rateLimiter = async (req: NextRequest) => {
	// Ambil IP pengguna dari header (atau gunakan default 127.0.0.1 jika tidak tersedia)
	const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

	// Ambil batas maksimum request per menit dari konstanta
	const limit = RATE_LIMIT.REQUESTS_PER_MINUTE;

	// Ambil jumlah request saat ini dari cache, default ke 0 jika belum ada
	const currentCount = (rateLimitCache.get(ip) || 0) as number;

	// Jika jumlah request melebihi batas, lempar error 429 (Too Many Requests)
	if (currentCount >= limit) {
		throw new ApiError(429, "Rate limit exceeded. Please try again later.", {
			limitResetTime: new Date(
				Date.now() + RATE_LIMIT.CACHE_TTL_MS // Tambahkan waktu TTL untuk estimasi kapan limit akan di-reset
			).toISOString(),
		});
	}

	// Jika masih di bawah batas, tambahkan count dan simpan ke cache
	rateLimitCache.set(ip, currentCount + 1);
};
