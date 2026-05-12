import "./globals.css";
import { passero, robotoSlab, ubuntu } from "@/lib/fonts";

export const metadata = {
  title: 'DataTechService | Expert Data Solutions',
  description: 'The leading platform for managed data services and web insights.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${passero.variable} ${robotoSlab.variable} ${ubuntu.variable}`}>
      <body className={`${ubuntu.className} bg-[#09090b] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}