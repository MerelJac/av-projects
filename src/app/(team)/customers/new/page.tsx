export default function NewCustomerPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Create Customer</h1>

      <form className="bg-white border rounded-xl p-6 max-w-lg flex flex-col gap-4">
        <input
          placeholder="Customer Name"
          className="border rounded p-2"
        />

        <input
          placeholder="Email"
          className="border rounded p-2"
        />

        <input
          placeholder="Phone"
          className="border rounded p-2"
        />

        <input
          placeholder="Billing Terms (Net 30)"
          className="border rounded p-2"
        />

        <button className="bg-black text-white p-2 rounded">
          Save Customer
        </button>
      </form>
    </div>
  );
}