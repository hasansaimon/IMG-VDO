"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getApiBase, setSession } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedAdultContent, setAcceptedAdultContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.post(`${getApiBase()}/api/auth/register`, {
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
        dateOfBirth,
        acceptedTerms,
        acceptedPrivacy,
        acceptedAdultContent,
      });
      setSession(data.token, data.user);
      if (data.consent && !data.consent.complete) {
        router.replace("/consent");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      let msg = "Registration failed";
      if (axios.isAxiosError(err)) {
        msg = String(
          err.response?.data?.error ||
            (err.response?.data?.details
              ? JSON.stringify(err.response.data.details)
              : msg),
        );
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          Create account
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          You must be 18+. Password: 12+ chars with upper, lower, digit, special.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
          />
          <input
            type="text"
            required
            minLength={3}
            maxLength={30}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
          />
          <input
            type="password"
            required
            minLength={12}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
          />
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Date of birth
            </label>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
            />
          </div>
          <label className="flex gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            I accept the Terms of Service
          </label>
          <label className="flex gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            />
            I accept the Privacy Policy
          </label>
          <label className="flex gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={acceptedAdultContent}
              onChange={(e) => setAcceptedAdultContent(e.target.checked)}
            />
            I confirm I am 18+ and want unrestricted adult content
          </label>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-2.5 font-medium"
          >
            {loading ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="mt-4 text-sm text-zinc-400 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-pink-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
