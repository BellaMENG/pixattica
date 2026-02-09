export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-lg font-semibold">Pixel Collage</h2>
      <section className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-gray-600">Images</h3>
        <p className="text-sm text-gray-400">No images yet</p>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-medium text-gray-600">Stickers</h3>
        <p className="text-sm text-gray-400">No stickers yet</p>
      </section>
    </aside>
  );
}
