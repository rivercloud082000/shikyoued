import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      loggedIn: true,
      role: payload.role,
      email: payload.email,
    });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
