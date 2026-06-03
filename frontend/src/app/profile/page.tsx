"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_IMAGE_DIMENSION = 512;

type User = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  nickname: string;
  joinYear: number;
  major: string;
  profileImage: string;
  email: string;
  phone: string;
  role: string;
};

const readImageAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read the selected image"));
    };

    reader.onerror = () => reject(new Error("Could not read the selected image"));
    reader.readAsDataURL(file);
  });

const compressImage = async (file: File) => {
  const dataUrl = await readImageAsDataUrl(file);

  if (typeof window === "undefined") {
    return dataUrl;
  }

  const image = new window.Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not process the selected image"));
    image.src = dataUrl;
  });

  const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));

  const context = canvas.getContext("2d");

  if (!context) {
    return dataUrl;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.85);
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    joinYear: "",
    major: "",
    profileImage: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });

        if (!response.ok) {
          throw new Error("Please login first");
        }

        const data = await response.json();
        const currentUser = data.user as User;
        setUser(currentUser);
        setForm({
          firstName: currentUser.firstName || "",
          lastName: currentUser.lastName || "",
          nickname: currentUser.nickname || "",
          joinYear: String(currentUser.joinYear || ""),
          major: currentUser.major || "",
          profileImage: currentUser.profileImage || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleProfileImageFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file");
      return;
    }

    const imageDataUrl = await compressImage(file);
    updateField("profileImage", imageDataUrl);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          joinYear: Number(form.joinYear),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      setUser(data.user || null);
      setMessage("Profile updated successfully.");
      try {
        router.refresh();
      } catch {}
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePicture = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/me/picture", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Remove picture failed");

      setForm((f) => ({ ...f, profileImage: "" }));
      setUser(data.user || null);
      setMessage("Profile picture removed.");
      try {
        router.refresh();
      } catch {}
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not remove picture");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-4xl items-center px-6 py-12 text-slate-300">Loading profile...</main>;
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-4xl items-center px-6 py-12 lg:px-12">
      <section className="w-full rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">Profile</p>
            <h1 className="mt-3 text-3xl font-semibold">Update your profile</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Edit your details and profile picture here.</p>
          </div>
          <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-300 hover:text-emerald-300">
            Back home
          </Link>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2 flex items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-emerald-300/30 bg-slate-800">
              {form.profileImage ? (
                <Image src={form.profileImage} alt="Profile preview" fill unoptimized className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-400 text-xl font-semibold text-slate-950">
                  {user?.firstName?.slice(0, 1) || "U"}
                  {user?.lastName?.slice(0, 1) || ""}
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{user ? `${user.firstName} ${user.lastName}` : "User profile"}</p>
              <p className="text-sm text-slate-300">Click the banner or avatar to update your picture.</p>
            </div>
          </div>

          {([
            ["firstName", "First name"],
            ["lastName", "Last name"],
            ["nickname", "Nickname"],
            ["major", "Major"],
            ["email", "Email"],
            ["phone", "Phone"],
          ] as const).map(([field, label]) => (
            <label key={field} className="block space-y-2 md:col-span-1">
              <span className="text-sm font-medium text-slate-200">{label}</span>
              <input
                type={field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={(event) => updateField(field, event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              />
            </label>
          ))}

          <label className="block space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-200">Student ID</span>
            <input
              value={user?.studentId || ""}
              readOnly
              className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-slate-400 outline-none"
            />
          </label>

          <label className="block space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-200">Join year</span>
            <input
              type="number"
              value={form.joinYear}
              onChange={(event) => updateField("joinYear", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
            />
          </label>

          <div className="md:col-span-2">
            <span className="text-sm font-medium text-slate-200">Profile image</span>
            <div
              role="button"
              tabIndex={0}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingImage(true);
              }}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={async (event) => {
                event.preventDefault();
                setIsDraggingImage(false);
                await handleProfileImageFile(event.dataTransfer.files?.[0] || null);
              }}
              onClick={() => document.getElementById("profile-image-input")?.click()}
              className={`mt-2 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed px-6 py-8 text-center transition ${
                isDraggingImage ? "border-emerald-300 bg-emerald-300/10" : "border-white/15 bg-slate-900/60"
              }`}
            >
              <p className="text-base font-medium text-white">Drag and drop a new profile picture here</p>
              <p className="text-sm text-slate-300">or click to choose a file</p>
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  await handleProfileImageFile(event.target.files?.[0] || null);
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving changes..." : "Save profile"}
            </button>
            {form.profileImage ? (
              <button
                type="button"
                onClick={handleRemovePicture}
                disabled={saving}
                className="mt-3 w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 font-semibold text-white transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Remove profile picture
              </button>
            ) : null}
          </div>
        </form>

        {message ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}