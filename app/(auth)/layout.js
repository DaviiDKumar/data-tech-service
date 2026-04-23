// app/(auth)/layout.js
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen">
      <div className="w-full  overflow-hidden">
        {children}
      </div>
    </div>
  );
}