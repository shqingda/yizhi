/** Static assets are served by Cloudflare; retired cloud APIs stay unavailable. */
export default {
	fetch(request: Request): Response {
		const path = new URL(request.url).pathname;
		if (request.method === "GET" && path === "/api/health") {
			return Response.json({ ok: true, service: "yizhi", storage: "browser" });
		}
		if (path.startsWith("/api/")) {
			return Response.json(
				{ error: "当前版本仅使用浏览器本机存储" },
				{
					status: 410,
					headers: { "Cache-Control": "no-store" },
				},
			);
		}
		return new Response("Not Found", { status: 404 });
	},
};
