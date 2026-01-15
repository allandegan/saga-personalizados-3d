export const metadata = {
  title: "S.A.G.A Personalizados 3D",
  description: "Sistema de precificação e tabela de preços para impressão 3D"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        {children}
      </body>
    </html>
  );
}
