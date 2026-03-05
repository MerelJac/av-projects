export default function NewItemPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Create Item</h1>

      <form className="bg-white border rounded-xl p-6 max-w-lg flex flex-col gap-4">
        <input
          placeholder="Item Number"
          className="border rounded p-2"
        />

        <input
          placeholder="Manufacturer"
          className="border rounded p-2"
        />

        <input
          placeholder="Price"
          className="border rounded p-2"
        />

        <button className="bg-black text-white p-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}