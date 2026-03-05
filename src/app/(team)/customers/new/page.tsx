import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Create Customer
      </h1>

      <form
        action={createCustomer}
        className="bg-white border rounded-xl p-6 max-w-lg flex flex-col gap-4"
      >

        <input
          name="name"
          placeholder="Customer Name"
          className="border rounded p-2"
          required
        />

        <input
          name="email"
          placeholder="Email"
          className="border rounded p-2"
        />

        <input
          name="phone"
          placeholder="Phone"
          className="border rounded p-2"
        />

        <select
          name="billingTerms"
          className="border p-2 rounded"
          defaultValue="NET30"
        >
          <option value="NET30">Net 30</option>
          <option value="PROGRESS">Progress Billing</option>
          <option value="PREPAID">Prepaid</option>
        </select>

        <button className="bg-black text-white p-2 rounded">
          Save Customer
        </button>

      </form>

    </div>
  );
}