
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/apiFetch";

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await apiFetch("/api/users");

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load users");
          return;
        }

        setUsers(data.users);
      } catch {
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        setError("Logout failed. Please try again.");
        return;
      }

      router.replace("/login");
    } catch {
      setError("Could not connect to the server.");
    }
  }

  if (loading) {
    return (
      <main className="p-10 text-center">
        Loading users...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Users Dashboard
          </h1>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        {error && (
          <p className="mb-4 text-red-600">{error}</p>
        )}

        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Created At</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-4 text-gray-900">
                    {user.name}
                  </td>
                  <td className="p-4 text-gray-700">
                    {user.email}
                  </td>
                  <td className="p-4 text-gray-700">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <p className="p-6 text-center text-gray-500">
              No users found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}