import '../styles/globals.css';
import { SocketProvider } from '../context/SocketContext';
import { DroneProvider } from '../context/DroneContext';

export const metadata = {
  title: 'Torneo de Carreras de Drones & Telemetría en Vivo',
  description: 'Sistema web de telemetría y ranking en tiempo real para eventos de carreras de drones con pantallas para monitores y leaderboard gigante.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-carbon min-h-screen text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        <SocketProvider>
          <DroneProvider>
            {children}
          </DroneProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
