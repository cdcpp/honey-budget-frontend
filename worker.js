export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /api 또는 /health 요청은 GCP 백엔드(포트 8080)로 프록시
    if (url.pathname.startsWith("/api") || url.pathname === "/health") {
      const backendOrigin = "http://35.254.156.249:8080";
      const targetUrl = new URL(url.pathname + url.search, backendOrigin);

      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set("Host", "35.254.156.249:8080");

      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });

      try {
        return await fetch(modifiedRequest);
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "백엔드 프록시 통신 실패: " + error.message,
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 그 외 모든 정적 파일 및 SPA 라우팅은 dist 폴더에서 서빙
    return env.ASSETS.fetch(request);
  },
};
