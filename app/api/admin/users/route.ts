import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta JWT_SECRET en el entorno");
  }
  return new TextEncoder().encode(secret);
}

// 🔤 Genera una contraseña de N letras (a-z, A-Z)
function generatePassword(length = 5) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * letters.length);
    result += letters[idx];
  }

  return result;
}

// 🔐 helper para validar ADMIN
async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return { ok: false, response: NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 }) };
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const data = payload as JwtPayload;

    if (data.role !== "ADMIN") {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "Solo un administrador puede acceder" },
          { status: 403 }
        ),
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("JWT ERROR:", err);
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 }),
    };
  }
}

// POST /api/admin/users -> crear usuario
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const email = (body.email as string)?.trim().toLowerCase();
    const rawRole = (body.role as string)?.toUpperCase(); // "ADMIN" | "DOCENTE"

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Correo inválido" },
        { status: 400 }
      );
    }

    if (!rawRole || !Object.values(Role).includes(rawRole as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Rol inválido. Usa uno de: ${Object.values(Role).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const role = rawRole as Role;

    // ya existe?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Ya existe un usuario con ese correo" },
        { status: 400 }
      );
    }

    // genera contraseña de 5 letras
    const randomPassword = generatePassword(5);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        role,
        isAllowed: true,
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isAllowed: user.isAllowed,
        createdAt: user.createdAt,
      },
      password: randomPassword,
    });
  } catch (err) {
    console.error("ERROR creando usuario:", err);
    return NextResponse.json(
      { success: false, error: "Error interno al crear usuario" },
      { status: 500 }
    );
  }
}

// GET /api/admin/users -> listar usuarios
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        isAllowed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error("ERROR listando usuarios:", err);
    return NextResponse.json(
      { success: false, error: "Error al listar usuarios" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users?id=...
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Falta id de usuario" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("ERROR eliminando usuario:", err);

    if (err.code === "P2025") {
      // registro no encontrado
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
