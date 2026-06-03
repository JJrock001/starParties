"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ReservationPage() {
  const searchParams = useSearchParams();
  const selectedRoomId = searchParams.get("roomId") || "";
  const [roomId, setRoomId] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const activeRoomId = roomId || selectedRoomId;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/reservations`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: activeRoomId,
          reservationDate,
          startAt,
          endAt,
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Reservation failed");
      }

      setMessage("Reservation created successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-3xl items-center px-6 py-12 lg:px-12">
      <section className="w-full rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
            Reservation
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Book the band room</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            One-hour booking only. Make sure you are logged in first.
          </p>
          {selectedRoomId ? (
            <p className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
              Selected room: {selectedRoomId}
            </p>
          ) : null}
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Room ID</span>
            <input
              type="text"
              value={roomId || selectedRoomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              placeholder="MongoDB room id"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Reservation date</span>
            <input
              type="date"
              value={reservationDate}
              onChange={(event) => setReservationDate(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Start time</span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">End time</span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              required
            />
          </label>

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-200">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              placeholder="Optional message"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Saving reservation..." : "Create reservation"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
            {message}
          </p>
        ) : null}

        <p className="mt-6 text-sm text-slate-300">
          Need to create an account first?{" "}
          <Link href="/register" className="font-medium text-emerald-300 hover:text-emerald-200">
            Register here
          </Link>
        </p>
      </section>
    </main>
  );
}
