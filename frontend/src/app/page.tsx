"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Room = {
  _id: string;
  roomName: string;
  roomCode: string;
  roomImage: string;
  isAvailable: boolean;
};

const features = [
  {
    title: "Register members",
    description: "Capture student profile details for the band reservation system.",
  },
  {
    title: "Login securely",
    description: "Use JWT-based authentication to keep member access protected.",
  },
  {
    title: "Reserve the room",
    description: "Book the single room in one-hour slots with daily reset rules.",
  },
];

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomMessage, setRoomMessage] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await fetch("/api/rooms");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load rooms");
        }

        setRooms(data.rooms || []);
      } catch (error) {
        setRoomMessage(error instanceof Error ? error.message : "Could not load rooms");
      } finally {
        setLoadingRooms(false);
      }
    };

    loadRooms();
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937,_#0f172a_48%,_#020617_100%)] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 lg:px-12">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-300 backdrop-blur">
            University band room reservation
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Reserve the band room with a simple, focused student workflow.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A clean frontend for registration, login, and one-hour room booking.
            Click the room card below to jump straight to reservation.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">Rooms</p>
            <h2 className="mt-3 text-2xl font-semibold">Available room</h2>
          </div>

          {loadingRooms ? (
            <p className="text-slate-300">Loading rooms...</p>
          ) : roomMessage ? (
            <p className="text-slate-300">{roomMessage}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Link
                  key={room._id}
                  href={`/reservation?roomId=${room._id}`}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-slate-900"
                >
                  <div className="relative h-44 w-full bg-slate-900">
                    <Image
                      src={room.roomImage || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiIGZpbGw9IiMxZjI5MzciLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2VjZjBmMyIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Sb29tIEltYWdlPC90ZXh0Pjwvc3ZnPg=="}
                      alt={room.roomName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">{room.roomCode}</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{room.roomName}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {room.isAvailable ? "Available now" : "Currently unavailable"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
