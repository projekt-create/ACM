import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = "https://backend.magnateshop.uz";
const allowedEndpoints = new Set(["stats", "category-stats", "low-stock"]);

export async function GET(request, { params }) {
  const { endpoint } = await params;

  if (!allowedEndpoints.has(endpoint)) {
    return NextResponse.json({ message: "Dashboard endpoint topilmadi" }, { status: 404 });
  }

  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Token yuborilmadi. Avval tizimga kiring." }, { status: 401 });
  }

  const url = new URL(`${BACKEND_URL}/api/dashboard/${endpoint}`);
  new URL(request.url).searchParams.forEach((value, key) => url.searchParams.set(key, value));

  try {
    const response = await fetch(url, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${decodeURIComponent(token)}`,
      },
      cache: "no-store",
    });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ message: "Backend serveriga ulanib bo‘lmadi" }, { status: 502 });
  }
}
