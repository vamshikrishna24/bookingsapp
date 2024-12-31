'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Signup successful! Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 1000); // Redirect to login after 1.5 seconds
      } else {
        setMessage(data.error || 'Signup failed');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-6 rounded-lg shadow-md w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Signup</h2>
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 px-4 py-2 border rounded-md"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 px-4 py-2 border rounded-md"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-2 border rounded-md"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          Signup
        </button>
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
        <p className="mt-4 text-center">
          Already have an account?{' '}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => router.push('/auth/login')}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}
