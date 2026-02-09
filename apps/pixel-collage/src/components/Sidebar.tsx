export default function Sidebar() {
  return (
    <aside className="w-64 border-r-4 border-pink-300 bg-pink-50 p-4">
      <section className="mb-6">
        <h3 className="mb-2 text-xs text-pink-600">Images</h3>
        <p className="text-[10px] text-pink-300">No images yet</p>
      </section>
      <section>
        <h3 className="mb-2 text-xs text-pink-600">Stickers</h3>
        <p className="text-[10px] text-pink-300">No stickers yet</p>
      </section>
    </aside>
  );
}
