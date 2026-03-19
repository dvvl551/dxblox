import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CreateListingPage() {
  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

<Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
<div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
  <Link href="/" className="transition hover:text-white">
    Home
  </Link>
  <span>/</span>
  <Link href="/dashboard" className="transition hover:text-white">
    Dashboard
  </Link>
  <span>/</span>
  <span className="text-white">Create listing</span>
</div>

        <section className="grid gap-8 xl:grid-cols-[1fr_340px]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="mb-6">
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                New listing
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Create a listing
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Add your item details, choose the game, upload proof and prepare
                your listing for Dxblox.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Game
                  </label>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option>Choose a game</option>
                    <option>MM2</option>
                    <option>Adopt Me</option>
                    <option>Blox Fruits</option>
                    <option>Blade Ball</option>
                    <option>Steal a Brainrot</option>
                    <option>Da Hood</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Category
                  </label>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option>Select a category</option>
                    <option>Weapons</option>
                    <option>Pets</option>
                    <option>Fruits</option>
                    <option>Bundles</option>
                    <option>Skins</option>
                    <option>Looking for</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Item name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter item name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Price
                  </label>
                  <input
                    type="text"
                    placeholder="Enter price"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Offer type
                  </label>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option>Choose an offer type</option>
                    <option>For sale</option>
                    <option>Trade</option>
                    <option>Looking for</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Status
                  </label>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option>Available</option>
                    <option>Pending</option>
                    <option>Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Description
                </label>
                <textarea
                  placeholder="Describe your listing..."
                  rows={6}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Upload image
                  </label>
<div className="flex min-h-[120px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-[#9CA3AF] transition hover:border-violet-500/30 hover:bg-white/10">
  Drop image here or click to upload
</div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Upload proof
                  </label>
<div className="flex min-h-[120px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-[#9CA3AF] transition hover:border-violet-500/30 hover:bg-white/10">
  Add proof screenshot
</div>
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-[#9CA3AF]">
                <input type="checkbox" className="mt-1 rounded border-white/10 bg-white/5" />
                <span>
                  I confirm that this listing is accurate and that any proof I
                  upload belongs to me.
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
<button
  type="submit"
  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
>
  Publish listing
</button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Save draft
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-5">
<div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
  <h2 className="text-xl font-bold">Listing tips</h2>
  <ul className="mt-4 space-y-3 text-sm leading-6 text-[#9CA3AF]">
    <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      Use a clear and accurate item name
    </li>
    <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      Add a realistic price
    </li>
    <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      Upload proof when possible
    </li>
    <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      Keep your description short and clean
    </li>
  </ul>
</div>

<div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
  <div className="flex items-center justify-between gap-3">
    <h3 className="text-xl font-bold">Why proof matters</h3>
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
      Trust
    </span>
  </div>
  <p className="mt-3 text-sm leading-6 text-white/85">
    Listings with proof look cleaner and help buyers trust what they
    see. This will matter even more once the site uses real accounts.
  </p>
</div>

            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <h3 className="text-xl font-bold">Quick links</h3>
              <div className="mt-4 space-y-3">
<Link
  href="/dashboard"
  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
>
  Back to dashboard
</Link>
<Link
  href="/wishlist"
  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
>
  Open wishlist
</Link>
<Link
  href="/games"
  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
>
  Browse games
</Link>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}