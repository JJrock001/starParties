"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_IMAGE_DIMENSION = 512;

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

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    nickname: "",
    joinYear: "",
    major: "",
    profileImage: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form | "joinYear", string>>>({});
  const [loading, setLoading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleProfileImageFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFieldErrors((current) => ({ ...current, profileImage: "Please upload an image file" }));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFieldErrors((current) => ({ ...current, profileImage: "Image must be 8MB or smaller" }));
      return;
    }

    const imageDataUrl = await compressImage(file);
    updateField("profileImage", imageDataUrl);
  };

  const handleImageDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);
    await handleProfileImageFile(event.dataTransfer.files?.[0] || null);
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof typeof form | "joinYear", string>> = {};

    if (!form.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!/^\d+$/.test(form.studentId.trim())) {
      nextErrors.studentId = "Student ID must contain only numbers";
    }
    if (!form.nickname.trim()) nextErrors.nickname = "Nickname is required";
    if (!form.major.trim()) nextErrors.major = "Major is required";
    if (!/^\d{4}$/.test(form.joinYear.trim())) {
      nextErrors.joinYear = "Join year must be a 4-digit year";
    }
    if (!/^\+?[0-9]{8,15}$/.test(form.phone.trim())) {
      nextErrors.phone = "Phone must contain 8 to 15 digits";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (form.password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const nextErrors = validateForm();
    if (fieldErrors.profileImage) {
      nextErrors.profileImage = fieldErrors.profileImage;
    }
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please fix the highlighted fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          joinYear: Number(form.joinYear),
          role: "user",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Register failed");
      }

      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-4xl items-center px-6 py-12 lg:px-12">
      <section className="w-full rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
            Register
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Create a member profile</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Add your student details before making a reservation.
          </p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {[
            ["firstName", "First name"],
            ["lastName", "Last name"],
            ["studentId", "รหัสนักศึกษา"],
            ["nickname", "ชื่อเล่น"],
            ["major", "สาขา"],
            ["email", "Email"],
            ["password", "Password"],
          ].map(([field, label]) => (
            <label key={field} className="block space-y-2 md:col-span-1">
              <span className="text-sm font-medium text-slate-200">{label}</span>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                inputMode={field === "studentId" || field === "phone" ? "numeric" : undefined}
                value={form[field as keyof typeof form]}
                onChange={(event) => updateField(field as keyof typeof form, event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
                placeholder={label}
                required={field !== "profileImage"}
              />
            </label>
          ))}

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
              onDrop={handleImageDrop}
              onClick={() => document.getElementById("profile-image-input")?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  document.getElementById("profile-image-input")?.click();
                }
              }}
              className={`mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed px-6 py-8 text-center transition ${
                isDraggingImage ? "border-emerald-300 bg-emerald-300/10" : "border-white/15 bg-slate-900/60"
              }`}
            >
              {form.profileImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src={form.profileImage}
                    alt="Profile preview"
                    width={112}
                    height={112}
                    unoptimized
                    className="h-28 w-28 rounded-full object-cover ring-2 ring-emerald-300/40"
                  />
                  <p className="text-sm text-slate-300">Drop another image or click to replace it</p>
                </div>
              ) : (
                <>
                  <p className="text-base font-medium text-white">Drag and drop a picture here</p>
                  <p className="text-sm text-slate-300">or click to choose a file from your device</p>
                </>
              )}
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
            <p className="mt-2 text-xs text-slate-400">PNG, JPG, GIF, or WEBP up to 8MB. Large images are resized automatically.</p>
            {fieldErrors.profileImage ? <p className="mt-2 text-sm text-red-300">{fieldErrors.profileImage}</p> : null}
          </div>

          <label className="block space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-200">Phone</span>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              placeholder="0812345678"
              required
            />
          </label>

          <label className="block space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-200">ปีที่เข้าชมรม</span>
            <input
              type="number"
              inputMode="numeric"
              min={1900}
              value={form.joinYear}
              onChange={(event) => updateField("joinYear", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
              placeholder="2024"
              required
            />
            {fieldErrors.joinYear ? <p className="text-sm text-red-300">{fieldErrors.joinYear}</p> : null}
          </label>

          <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
            {fieldErrors.firstName ? <p className="text-sm text-red-300">{fieldErrors.firstName}</p> : null}
            {fieldErrors.lastName ? <p className="text-sm text-red-300">{fieldErrors.lastName}</p> : null}
            {fieldErrors.studentId ? <p className="text-sm text-red-300">{fieldErrors.studentId}</p> : null}
            {fieldErrors.nickname ? <p className="text-sm text-red-300">{fieldErrors.nickname}</p> : null}
            {fieldErrors.major ? <p className="text-sm text-red-300">{fieldErrors.major}</p> : null}
            {fieldErrors.email ? <p className="text-sm text-red-300">{fieldErrors.email}</p> : null}
            {fieldErrors.phone ? <p className="text-sm text-red-300">{fieldErrors.phone}</p> : null}
            {fieldErrors.password ? <p className="text-sm text-red-300">{fieldErrors.password}</p> : null}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
            {message}
          </p>
        ) : null}

        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-300 hover:text-emerald-200">
            Login here
          </Link>
        </p>
      </section>
    </main>
  );
}
