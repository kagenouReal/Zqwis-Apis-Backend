import "./(main)/globals.css";

export const metadata = {
  title: "Zqwis - Apis",
  description: "Powered By KagenouReal",
};

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="en" suppressHydrationWarning>
<body>{children}</body>
</html>
);
}
