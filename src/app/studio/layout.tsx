import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Marca Ubi Studio",
    robots: { index: false }, // don't index the studio
};

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // No site header, footer, smooth scroll, or custom cursor —
    // just the raw studio rendered in its own shell.
    return children;
}
