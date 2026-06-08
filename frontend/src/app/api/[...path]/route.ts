import { NextRequest, NextResponse } from 'next/server';

const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:5001';

const proxyRequest = async (request: NextRequest) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const backendUrl = `${backendBaseUrl}/api/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const upstream = await fetch(backendUrl, init);
  const body = await upstream.text();

  const response = new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  // Copy upstream headers but strip encoding/length headers — the body has
  // already been decoded to text by Node fetch, so re-sending these headers
  // causes browsers to double-decode and fail with "cannot decode raw data".
  const STRIP = new Set(['content-encoding', 'content-length', 'transfer-encoding']);
  upstream.headers.forEach((value, key) => {
    if (!STRIP.has(key.toLowerCase())) response.headers.set(key, value);
  });

  return response;
};

export async function GET(request: NextRequest) { return proxyRequest(request); }
export async function POST(request: NextRequest) { return proxyRequest(request); }
export async function PUT(request: NextRequest) { return proxyRequest(request); }
export async function PATCH(request: NextRequest) { return proxyRequest(request); }
export async function DELETE(request: NextRequest) { return proxyRequest(request); }
