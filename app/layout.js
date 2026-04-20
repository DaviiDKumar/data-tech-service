import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DATATECHSERVICES | Data Processing System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#09090b] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}