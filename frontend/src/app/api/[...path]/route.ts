import { NextRequest, NextResponse } from 'next/server';

const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:5001';

const buildBackendUrl = (request: NextRequest) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  return `${backendBaseUrl}/api/${path}${url.search}`;
};

const proxyRequest = async (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('origin');
  headers.delete('referer');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const backendResponse = await fetch(buildBackendUrl(request), init);
  const responseBody = await backendResponse.text();
  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });

  backendResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      response.headers.set(key, value);
    }
  });

  const setCookies =
    typeof (backendResponse.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (backendResponse.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
      : backendResponse.headers.get('set-cookie')
        ? [backendResponse.headers.get('set-cookie') as string]
        : [];

  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
};

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}
