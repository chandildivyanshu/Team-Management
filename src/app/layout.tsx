import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Team Organizer",
    description: "Hierarchical Team Management Application",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var storageKey = 'team-org-theme';
                                    var storedTheme = localStorage.getItem(storageKey);
                                    var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                    
                                    if (storedTheme === 'dark' || (!storedTheme && supportDarkMode)) {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className={inter.className}>
                <Providers>
                    <ThemeProvider defaultTheme="light" storageKey="team-org-theme">
                        {children}
                        <Toaster position="top-center" />
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
