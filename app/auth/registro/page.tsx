"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Registrar
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      // 2. Login automatico
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Cuenta creada pero no pudimos iniciar sesion automaticamente. Intenta loguearte.");
        setLoading(false);
        return;
      }

      router.push("/cuenta");
      router.refresh();
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-5">
        <p className="text-3xl mb-1">
          <span className="text-accent-emerald tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ fontFamily: "var(--font-logo)" }}>AOURA</span>
        </p>
        <h1 className="font-heading text-lg font-bold">
          Crear cuenta
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Registrate para acceder a todas las funciones
        </p>
      </div>

      {/* Boton de Google */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/cuenta" })}
        className="w-full flex items-center justify-center gap-2 bg-bg-card border border-border-glass rounded-lg px-3 py-2.5 text-sm text-text-primary hover:border-accent-emerald/50 transition-colors mb-4"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Registrarse con Google
      </button>

      {/* Separador */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border-glass" />
        <span className="text-xs text-text-muted">o con email</span>
        <div className="flex-1 h-px bg-border-glass" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nombre" className="block text-xs text-text-muted mb-1">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              autoComplete="given-name"
              className="w-full bg-bg-card border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-xs text-text-muted mb-1">
              Apellido
            </label>
            <input
              id="apellido"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              autoComplete="family-name"
              className="w-full bg-bg-card border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs text-text-muted mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full bg-bg-card border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs text-text-muted mb-1">
            Contraseña (minimo 6 caracteres)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full bg-bg-card border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
          />
        </div>

        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3 text-accent-red text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-emerald disabled:bg-accent-emerald/50 text-white py-2.5 rounded-card font-semibold text-sm transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.98]"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-text-secondary text-center mt-4">
        Ya tenes cuenta?{" "}
        <Link href="/auth/login" className="text-accent-emerald hover:underline">
          Iniciar sesion
        </Link>
      </p>
    </div>
  );
}
