import "./globals.css";

export const metadata = {
  title: "Vayu - Premium Flight Deals",
  description: "Save up to 90% on international flights. Join the exclusive club.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
