
"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiFetch";
import CustomerFormModal from "./CustomerFormModal";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Fetch customers from the backend
  const fetchCustomers = useCallback(async () => {
    try {
      setError("");

      const response = await apiFetch("/api/customers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch customers");
      }

      setCustomers(data.customers);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Delete a customer
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");

      const response = await apiFetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete customer");
      }

      setCustomers((prev) => prev.filter((customer) => customer.id !== id));

    //   if (selectedCustomer?.id === id) {
    //     setSelectedCustomer(null);
    //   }
    } catch (err) {
      setError(err.message || "Failed to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">Loading customers...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customers
            </h1>
            <p className="mt-2 text-gray-500">
              Manage your customers and their details.
            </p>
          </div>

          <button
            onClick={() => {
           setEditingCustomer(null);
           setShowForm(true);
              }}
            className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700"
          >
            + Join as Customer
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        
        {/* Empty state */}
        {customers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              No customers yet
            </h2>
            <p className="mt-2 text-gray-500">
              Add your first customer to get started.
            </p>
          </div>
        ) : (
          /* Customer cards */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Customer name */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-gray-900">
                      {customer.name}
                    </h2>
                    <p className="truncate text-sm text-gray-500">
                      {customer.email}
                    </p>
                  </div>
                </div>

                {/* Customer details */}
                <div className="space-y-3 border-t border-gray-100 py-5 text-sm text-gray-600">
                  <p>
                    <span className="mr-2">📞</span>
                    {customer.phone}
                  </p>

                  <p className="flex items-start gap-2">
                    <span>📍</span>
                    <span>{customer.address}</span>
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 border-t border-gray-100 pt-5">
                  <button
                    onClick={() => {
                   setEditingCustomer(customer);
                   setShowForm(true);
                    }}
                    className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(customer.id)}
                    disabled={deletingId === customer.id}
                    className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === customer.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && (
  <CustomerFormModal
    customer={editingCustomer}
    onClose={() => {
      setShowForm(false);
      setEditingCustomer(null);
    }}
    onSuccess={() => {
      setShowForm(false);
      setEditingCustomer(null);
      fetchCustomers();
    }}
  />
)}
    </main>
  );
}