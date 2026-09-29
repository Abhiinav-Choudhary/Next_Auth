
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiFetch";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

const validateField = (name, value) => {
  const trimmed = value.trim();

  switch (name) {
    case "name":
      if (!trimmed) return "Name is required.";
      if (trimmed.length < 2)
        return "Name must be at least 2 characters.";
      if (trimmed.length > 60)
        return "Name cannot exceed 60 characters.";
      if (!/^[\p{L}\p{M}\s'-]+$/u.test(trimmed))
        return "Only letters, spaces, hyphens, and apostrophes are allowed.";
      return "";

    case "email":
      if (!trimmed) return "Email is required.";
      if (trimmed.length > 254)
        return "Email cannot exceed 254 characters.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
        return "Enter a valid email address.";
      return "";

    case "phone": {
      if (!trimmed) return "Phone number is required.";
      if (!/^[+\d\s().-]+$/.test(trimmed))
        return "Enter a valid phone number.";

      const digits = trimmed.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15)
        return "Phone number must contain 7–15 digits.";
      return "";
    }

    case "address":
      if (!trimmed) return "Address is required.";
      if (trimmed.length < 5)
        return "Address must be at least 5 characters.";
      if (trimmed.length > 250)
        return "Address cannot exceed 250 characters.";
      return "";

    default:
      return "";
  }
};

export default function CustomerFormModal({
  customer,
  onClose,
  onSuccess,
}) {
  const isEditing = Boolean(customer);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill form when editing
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
    setTouched({});
    setError("");
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(emptyForm).forEach((field) => {
      newErrors[field] = validateField(field, form[field]);
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      address: true,
    });

    return Object.values(newErrors).every((message) => !message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const url = isEditing
        ? `/api/customers/${customer.id}`
        : "/api/customers";

      const method = isEditing ? "PATCH" : "POST";

      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to save customer."
        );
      }

      onSuccess();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-lg border px-4 py-3 outline-none transition ${
      touched[field] && errors[field]
        ? "border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100"
    }`;

  const renderError = (field) =>
    touched[field] && errors[field] ? (
      <p
        id={`${field}-error`}
        className="mt-1 text-sm text-red-600"
      >
        {errors[field]}
      </p>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal heading */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="customer-form-title"
              className="text-2xl font-bold text-gray-900"
            >
              {isEditing ? "Edit Customer" : "Join as Customer"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? "Update the customer's details."
                : "Enter the details to add a new customer."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
          >
            &times;
          </button>
        </div>

        {/* Server error */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Customer form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Full Name *
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter full name"
              maxLength={60}
              aria-invalid={Boolean(touched.name && errors.name)}
              aria-describedby="name-error"
              disabled={loading}
              className={inputClass("name")}
            />
            {renderError("name")}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address *
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="name@example.com"
              maxLength={254}
              aria-invalid={Boolean(touched.email && errors.email)}
              aria-describedby="email-error"
              disabled={loading}
              className={inputClass("email")}
            />
            {renderError("email")}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone Number *
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter phone number"
              maxLength={20}
              aria-invalid={Boolean(touched.phone && errors.phone)}
              aria-describedby="phone-error"
              disabled={loading}
              className={inputClass("phone")}
            />
            {renderError("phone")}
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Address *
            </label>

            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter full address"
              rows={3}
              maxLength={250}
              aria-invalid={Boolean(touched.address && errors.address)}
              aria-describedby="address-error"
              disabled={loading}
              className={`${inputClass("address")} resize-y`}
            />
            {renderError("address")}
          </div>

          {/* Form actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}