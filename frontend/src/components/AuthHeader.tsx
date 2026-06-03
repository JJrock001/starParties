"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  profileImage: string;
  email: string;
};

export default function AuthHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [pathname]);

  const displayName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-12">
        <Link href="/profile" className="flex items-center gap-3">
          {loading ? (
            <div className="h-11 w-11 rounded-full border border-white/10 bg-white/10" />
          ) : user ? (
            <div className="relative h-11 w-11 overflow-hidden rounded-full border border-emerald-300/30 bg-slate-800">
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt="Profile picture"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-400 text-sm font-semibold text-slate-950">
                  {user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-sm font-semibold text-slate-950">
              S
            </div>
          )}

          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-white">Starparties</p>
            {user ? <p className="text-xs text-slate-300">{displayName}</p> : null}
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/register" className="transition hover:text-white">
            Register
          </Link>
          <Link href="/login" className="transition hover:text-white">
            Login
          </Link>
          <Link href="/reservation" className="transition hover:text-white">
            Reservation
          </Link>
        </nav>
      </div>
    </header>
  );
}