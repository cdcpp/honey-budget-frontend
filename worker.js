function renderLockScreen(errorMessage = "") {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Honey Budget — 보안 잠금</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0B0D11;
      background-image: radial-gradient(circle at 50% 20%, rgba(49, 130, 246, 0.08) 0%, transparent 60%);
      color: #F9FAFB;
      padding: 20px;
    }
    .lock-card {
      width: 100%;
      max-width: 380px;
      background: #151821;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 40px 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      text-align: center;
      animation: fadeIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon-wrap {
      width: 64px;
      height: 64px;
      background: rgba(49, 130, 246, 0.12);
      border: 1px solid rgba(49, 130, 246, 0.25);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      margin: 0 auto 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #F9FAFB;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    p.subtitle {
      font-size: 14px;
      color: #8B95A1;
      margin-bottom: 28px;
      line-height: 1.5;
      letter-spacing: -0.01em;
    }
    .error-box {
      background: rgba(240, 68, 82, 0.12);
      border: 1px solid rgba(240, 68, 82, 0.28);
      color: #F04452;
      font-size: 13px;
      font-weight: 500;
      padding: 11px 14px;
      border-radius: 12px;
      margin-bottom: 20px;
      animation: shake 0.3s ease-in-out;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .form-group {
      margin-bottom: 20px;
    }
    input[type="password"] {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      font-size: 18px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      background: #1C202B;
      color: #F9FAFB;
      text-align: center;
      letter-spacing: 6px;
      outline: none;
      transition: all 0.15s ease;
    }
    input[type="password"]::placeholder {
      letter-spacing: normal;
      color: #6B7684;
      font-size: 14px;
    }
    input[type="password"]:focus {
      border-color: #3182F6;
      box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.25);
    }
    button.btn-submit {
      width: 100%;
      height: 48px;
      font-size: 15px;
      font-weight: 600;
      color: #FFFFFF;
      background: #3182F6;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);
      transition: all 0.15s ease;
      letter-spacing: -0.01em;
    }
    button.btn-submit:hover {
      background: #4593FC;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(49, 130, 246, 0.4);
    }
    button.btn-submit:active {
      transform: translateY(1px);
    }
    .footer-note {
      font-size: 12px;
      color: #6B7684;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="lock-card">
    <div class="icon-wrap">🍯</div>
    <h1>Honey Budget</h1>
    <p class="subtitle">소중한 우리 집 가계부 🔒<br>접근을 위해 비밀번호(PIN)를 입력하세요.</p>
    
    ${errorMessage ? `<div class="error-box">${errorMessage}</div>` : ''}

    <form method="POST" action="/auth/login">
      <div class="form-group">
        <input 
          type="password" 
          name="pin" 
          placeholder="비밀번호 입력" 
          autofocus 
          required 
          autocomplete="current-password"
        />
      </div>
      <button type="submit" class="btn-submit">가계부 열기 🔑</button>
    </form>
    
    <div class="footer-note">한 번 로그인하면 30일 동안 유지됩니다 ✨</div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 접근 비밀번호 (기본값: "2399", Cloudflare 환경변수 ACCESS_PIN으로도 변경 가능)
    const ACCESS_PIN = env.ACCESS_PIN || "2399";
    const AUTH_COOKIE_NAME = "hb_session";
    const AUTH_TOKEN_VAL = "authorized_honey_session";

    // 쿠키 확인
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    const isAuthenticated = cookies[AUTH_COOKIE_NAME] === AUTH_TOKEN_VAL;

    // 1. 로그아웃 요청 처리 (/auth/logout)
    if (url.pathname === "/auth/logout") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }

    // 2. 로그인 폼 제출 처리 (POST /auth/login)
    if (url.pathname === "/auth/login" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const pin = formData.get("pin");

        if (pin === ACCESS_PIN) {
          // 일치하면 30일간 유지되는 보안 세션 쿠키 발급
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/",
              "Set-Cookie": `${AUTH_COOKIE_NAME}=${AUTH_TOKEN_VAL}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
            },
          });
        }

        // 비밀번호 불일치 시
        return new Response(renderLockScreen("비밀번호가 올바르지 않습니다. 다시 입력해주세요."), {
          status: 401,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch (err) {
        return new Response(renderLockScreen("입력 처리 중 오류가 발생했습니다."), {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    // 3. 미인증 사용자 차단 및 잠금화면 노출
    if (!isAuthenticated) {
      // API 요청인 경우 401 JSON 반환
      if (url.pathname.startsWith("/api")) {
        return new Response(
          JSON.stringify({ success: false, message: "접근 권한이 없습니다. 먼저 로그인해주세요." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      // 일반 웹 페이지 요청인 경우 예쁜 잠금화면 렌더링
      return new Response(renderLockScreen(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 4. 인증된 사용자: 백엔드 프록시 (/api 또는 /health)
    if (url.pathname.startsWith("/api") || url.pathname === "/health") {
      const backendOrigin = "http://35.254.156.249.sslip.io:8080";
      const targetUrl = new URL(url.pathname + url.search, backendOrigin);

      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set("Host", "35.254.156.249.sslip.io:8080");

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

    // 5. 인증된 사용자: 프론트엔드 정적 파일 서빙
    return env.ASSETS.fetch(request);
  },
};
