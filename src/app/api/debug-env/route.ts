import { NextResponse } from "next/server";

export async function GET() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  return NextResponse.json({
    user: user ? `${user.substring(0, 3)}...${user.substring(user.indexOf("@"))}` : "NOT SET",
    passLength: pass?.length ?? 0,
    passHasSpaces: pass?.includes(" ") ?? false,
    passSample: pass ? `${pass.substring(0, 2)}****${pass.substring(pass.length - 2)}` : "NOT SET",
  });
}
