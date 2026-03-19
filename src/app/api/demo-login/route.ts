import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_SESSION_COOKIE,
  createDemoSessionValue,
} from "@/lib/demo-auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      callbackUrl?: string;
    };

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const callbackUrl = String(body.callbackUrl || "/ocr");

    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true, redirectTo: callbackUrl });
    response.cookies.set(DEMO_SESSION_COOKIE, createDemoSessionValue(email), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("demo-login error", error);
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 500 });
  }
}
