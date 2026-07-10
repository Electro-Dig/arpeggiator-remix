import {
  AUTH_COOKIE_NAME,
  DEFAULT_TTL_SECONDS,
  createAuthToken,
  isInviteCodeAllowed,
  parseCookies,
  verifyAuthToken,
} from '../invite-auth-core.js';

const LOGIN_PATH = '/__invite';
const LOGOUT_PATH = '/__invite/logout';
const ROBOTS_PATH = '/robots.txt';

export default async (request, context) => {
  const url = new URL(request.url);

  if (url.pathname === ROBOTS_PATH) {
    return withSecurityHeaders(
      new Response('User-agent: *\nDisallow: /\n', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      }),
    );
  }

  if (url.pathname === '/r' || url.pathname.startsWith('/r/')) {
    return withSecurityHeaders(await context.next());
  }

  if (url.pathname === LOGOUT_PATH) {
    return redirectWithCookieClear(new URL(LOGIN_PATH, url));
  }

  if (url.pathname === LOGIN_PATH && request.method === 'POST') {
    return handleInviteSubmit(request, url);
  }

  if (url.pathname === LOGIN_PATH) {
    return invitePageResponse({
      redirectPath: sanitizeRedirect(url.searchParams.get('redirect')),
      status: 200,
    });
  }

  const secret = getEnv('INVITE_SECRET');
  if (!secret) {
    return serviceUnavailableResponse('门禁尚未配置签名密钥。');
  }

  const cookies = parseCookies(request.headers.get('cookie') || '');
  const hasValidCookie = await verifyAuthToken({
    token: cookies[AUTH_COOKIE_NAME],
    secret,
  });

  if (hasValidCookie) {
    const response = await context.next();
    return withSecurityHeaders(response);
  }

  const loginUrl = new URL(LOGIN_PATH, url);
  loginUrl.searchParams.set('redirect', `${url.pathname}${url.search}`);
  return Response.redirect(loginUrl, 303);
};

export const config = {
  path: '/*',
};

async function handleInviteSubmit(request, url) {
  const secret = getEnv('INVITE_SECRET');
  const allowedCodes = getEnv('INVITE_CODES') || getEnv('INVITE_CODE');

  if (!secret) {
    return serviceUnavailableResponse('门禁尚未配置签名密钥。');
  }

  if (!allowedCodes) {
    return serviceUnavailableResponse('门禁尚未配置邀请码。');
  }

  const formData = await request.formData();
  const submittedCode = formData.get('invite_code');
  const redirectPath = sanitizeRedirect(formData.get('redirect'));

  if (!isInviteCodeAllowed(submittedCode, allowedCodes)) {
    return invitePageResponse({
      redirectPath,
      errorMessage: '邀请码不正确，请再试一次。',
      status: 401,
    });
  }

  const token = await createAuthToken({
    secret,
    ttlSeconds: DEFAULT_TTL_SECONDS,
  });

  const targetUrl = new URL(redirectPath, url);
  const response = redirectResponse(targetUrl);
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DEFAULT_TTL_SECONDS}`,
  );

  return withSecurityHeaders(response);
}

function invitePageResponse({ redirectPath = '/', errorMessage = '', status = 200 }) {
  return withSecurityHeaders(
    new Response(renderInvitePage({ redirectPath, errorMessage }), {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }),
  );
}

function serviceUnavailableResponse(message) {
  return withSecurityHeaders(
    new Response(renderInvitePage({ redirectPath: '/', errorMessage: message }), {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }),
  );
}

function redirectWithCookieClear(targetUrl) {
  const response = redirectResponse(targetUrl);
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
  return withSecurityHeaders(response);
}

function redirectResponse(targetUrl) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: targetUrl.toString(),
    },
  });
}

function withSecurityHeaders(response) {
  const securedResponse = new Response(response.body, response);
  securedResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  securedResponse.headers.set('X-Content-Type-Options', 'nosniff');
  securedResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  securedResponse.headers.set('Referrer-Policy', 'no-referrer');
  return securedResponse;
}

function sanitizeRedirect(value) {
  const redirectPath = String(value || '/').trim();
  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) return '/';
  if (redirectPath.startsWith(LOGIN_PATH)) return '/';
  return redirectPath;
}

function renderInvitePage({ redirectPath, errorMessage }) {
  const escapedRedirect = escapeHtml(redirectPath || '/');
  const escapedError = escapeHtml(errorMessage || '');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>请输入邀请码</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #08090d;
      color: #f7f7fb;
      font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .dialog {
      width: min(92vw, 380px);
      padding: 28px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 16px;
      background: rgba(18, 20, 28, 0.94);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
    }
    h1 {
      margin: 0 0 10px;
      font-size: 22px;
      font-weight: 650;
      letter-spacing: 0;
    }
    p {
      margin: 0 0 22px;
      color: rgba(247, 247, 251, 0.68);
      font-size: 14px;
      line-height: 1.6;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: rgba(247, 247, 251, 0.78);
      font-size: 13px;
    }
    input {
      width: 100%;
      height: 46px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      font: inherit;
      letter-spacing: 0;
      outline: none;
      padding: 0 14px;
    }
    input:focus {
      border-color: #7dd3fc;
      box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.16);
    }
    button {
      width: 100%;
      height: 46px;
      margin-top: 16px;
      border: 0;
      border-radius: 10px;
      background: #f7f7fb;
      color: #090b10;
      cursor: pointer;
      font: inherit;
      font-weight: 650;
    }
    .error {
      margin: 14px 0 0;
      color: #fca5a5;
      min-height: 20px;
    }
  </style>
</head>
<body>
  <main class="dialog" role="dialog" aria-labelledby="invite-title">
    <h1 id="invite-title">请输入邀请码</h1>
    <p>该作品目前仅向受邀观众开放。验证后，本浏览器将在一段时间内自动进入。</p>
    <form method="post" action="${LOGIN_PATH}">
      <input type="hidden" name="redirect" value="${escapedRedirect}">
      <label for="invite-code">邀请码</label>
      <input id="invite-code" name="invite_code" type="password" autocomplete="off" autofocus required>
      <button type="submit">进入作品</button>
      <p class="error" aria-live="polite">${escapedError}</p>
    </form>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getEnv(name) {
  if (typeof Netlify === 'undefined' || !Netlify.env) return '';
  return Netlify.env.get(name) || '';
}
