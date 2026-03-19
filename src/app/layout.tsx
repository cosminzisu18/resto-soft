import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Giurom Ospatar",
  description: "Giurom Ospatar",
  authors: [{ name: "Veziv" }],
  openGraph: {
    title: "Giurom Ospatar",
    description: "Giurom Ospatar",
    type: "website",
    images: ["https://veziv.ro/wp-content/uploads/2025/04/Acasa-1-1.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@veziv_it_services",
    images: ["https://veziv.ro/wp-content/uploads/2025/04/Acasa-1-1.jpg"],
  },
  robots: "noindex",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <head>
        <link
          rel="icon"
          type="image/x-icon"
          href="https://veziv.ro/wp-content/uploads/2025/04/Acasa-1-1.jpg"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
