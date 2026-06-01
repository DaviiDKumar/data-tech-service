// app/(auth)/layout.js
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-white select-none">
      {children}
    </div>
  );
}