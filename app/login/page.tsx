import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

<Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 w-full max-w-5xl text-sm text-[#9CA3AF]">
  <div className="flex flex-wrap items-center gap-2">
    <Link href="/" className="transition hover:text-white">
      Home
    </Link>
    <span>/</span>
    <span className="text-white">Login</span>
  </div>
</div>
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_460px]">
          <section className="hidden rounded-[30px] border border-white/10 bg-[#131320] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:block">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Welcome back
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Sign in to Dxblox
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-[#9CA3AF]">
              Access your listings, wishlist, saved profiles and future account
              tools from one clean dashboard.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                "Manage your active listings",
                "Track your wishlist faster",
                "Contact sellers more easily",
                "Keep your profile and trust status in one place",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-black tracking-tight">Login</h2>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                Sign in to continue using Dxblox.
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#9CA3AF]">
                  <input type="checkbox" className="rounded border-white/10 bg-white/5" />
                  Remember me
                </label>
<Link href="/login" className="text-violet-300 hover:text-violet-200">
  Forgot password?
</Link>
              </div>

<button
  type="submit"
  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
>
  Sign in
</button>
            </form>

            <div className="mt-6 text-center text-sm text-[#9CA3AF]">
              Don’t have an account?{" "}
<Link href="/signup" className="text-violet-300 hover:text-violet-200">
  Create one
</Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}