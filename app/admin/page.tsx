"use client";

import { useEffect, useState } from "react";

type Role = "ADMIN" | "DOCENTE";

type UserDto = {
  id: string;
  email: string | null;
  role: Role;
  isAllowed: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("DOCENTE");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Cargar usuarios al entrar
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.status === 401 || res.status === 403) {
          setAccessDenied(true);
          setLoadingUsers(false);
          return;
        }
        const data = await res.json();
        if (!data.success) {
          setUsersError(data.error || "Error al cargar usuarios");
        } else {
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error(err);
        setUsersError("Error de conexión al cargar usuarios");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreatedPassword(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCreateError(data.error || "Error al crear usuario");
        setCreating(false);
        return;
      }

      // Añadir a la lista
      setUsers((prev) => [data.user, ...prev]);
      setCreatedPassword(data.password);
      setEmail("");
    } catch (err) {
      console.error(err);
      setCreateError("Error de conexión");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser(id: string) {
    const confirmar = window.confirm("¿Eliminar este usuario?");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "No se pudo eliminar");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error de conexión al eliminar");
    }
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-lg font-semibold">Acceso restringido.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Panel de administración
        </h1>
        <p className="text-sm text-slate-300">
          Desde aquí puedes crear cuentas para docentes y administradores, y
          gestionar los usuarios existentes.
        </p>

        {/* Crear usuario */}
        <section className="rounded-2xl bg-slate-800/70 border border-slate-600 p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Crear nuevo usuario</h2>

          <form
            onSubmit={handleCreateUser}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo institucional
              </label>
              <input
                type="email"
                className="w-full rounded-lg px-3 py-2 text-sm bg-slate-900/70 border border-slate-500 focus:outline-none focus:border-emerald-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="w-full md:w-40">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rol
              </label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm bg-slate-900/70 border border-slate-500 focus:outline-none focus:border-emerald-300"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="DOCENTE">Docente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full md:w-40 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-2 text-sm disabled:opacity-60"
            >
              {creating ? "Creando..." : "Crear usuario"}
            </button>
          </form>

          {createError && (
            <p className="text-sm text-red-300 bg-red-900/40 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}

          {createdPassword && (
            <div className="text-sm text-emerald-200 bg-emerald-900/40 rounded-lg px-3 py-2">
              Usuario creado correctamente.{" "}
              <span className="font-semibold">
                Contraseña temporal: {createdPassword}
              </span>{" "}
              (compártela solo una vez con el docente).
            </div>
          )}
        </section>

        {/* Lista de usuarios */}
        <section className="rounded-2xl bg-slate-800/70 border border-slate-600 p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Usuarios registrados</h2>

          {loadingUsers && <p className="text-sm text-slate-300">Cargando...</p>}

          {usersError && (
            <p className="text-sm text-red-300 bg-red-900/40 rounded-lg px-3 py-2">
              {usersError}
            </p>
          )}

          {!loadingUsers && !usersError && users.length === 0 && (
            <p className="text-sm text-slate-300">
              Aún no hay usuarios registrados.
            </p>
          )}

          {!loadingUsers && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900/70 text-slate-200">
                    <th className="px-3 py-2 text-left">Correo</th>
                    <th className="px-3 py-2 text-left">Rol</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left">Creado</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-700/70 hover:bg-slate-900/40"
                    >
                      <td className="px-3 py-2">
                        {u.email || <span className="text-slate-400">Sin correo</span>}
                      </td>
                      <td className="px-3 py-2">
                        {u.role === "ADMIN" ? "Administrador" : "Docente"}
                      </td>
                      <td className="px-3 py-2">
                        {u.isAllowed ? (
                          <span className="text-emerald-300">Activo</span>
                        ) : (
                          <span className="text-yellow-300">Pendiente</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {new Date(u.createdAt).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-xs px-3 py-1 rounded-lg bg-red-500/80 hover:bg-red-400 text-white"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
