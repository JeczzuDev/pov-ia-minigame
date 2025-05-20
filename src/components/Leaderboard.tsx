import { Trophy } from 'lucide-react';
import { SignUpButton } from '@clerk/nextjs';

interface LeaderboardEntry {
  username: string;
  score: number;
  user_id?: string;
  // Podemos expandir esto según sea necesario
}

interface LeaderboardProps {
  data: LeaderboardEntry[];
  title?: string;
  maxItems?: number;
  className?: string;
  showTopThreeMedals?: boolean;
  currentUserId?: string | null;
  showSignUpButton?: boolean;
}

export function Leaderboard({
  data = [],
  title = 'Leaderboard',
  maxItems = 10,
  currentUserId = null,
  showSignUpButton = false,
  className = '',
  showTopThreeMedals = true,
}: LeaderboardProps) {
  // Ordenar y limitar los items
  const sortedData = [...data]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  // Colores para los primeros puestos
  const getPositionColor = (index: number) => {
    if (index === 0) return 'from-yellow-500 to-yellow-600';
    if (index === 1) return 'from-gray-500 to-gray-600';
    if (index === 2) return 'from-amber-700 to-amber-800';
    return 'from-gray-600 to-gray-700';
  };

  // Icono para los primeros puestos
  const getPositionIcon = (index: number) => {
    if (!showTopThreeMedals) return null;

    if (index === 0) return (
      <Trophy className="w-5 h-5 text-yellow-400" fill="currentColor" />
    );
    if (index === 1) return (
      <Trophy className="w-5 h-5 text-gray-400" fill="currentColor" />
    );
    if (index === 2) return (
      <Trophy className="w-5 h-5 text-amber-600" fill="currentColor" />
    );

    return <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>;
  };

  if (data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
        <p className="text-gray-400 text-center py-4">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>

        <div className="space-y-2">
          {sortedData.map((entry, index) => (
            <div
              key={`${entry.user_id || entry.username}-${index}`}
              className={`relative flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-black/15 ${index < 3 ? 'bg-gradient-to-r ' + getPositionColor(index) : 'bg-black/25'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${index < 3
                  ? 'bg-black/25 text-white p-1'
                  : 'bg-black/25 text-white p-1'
                  }`}>
                  {getPositionIcon(index) || (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span className="font-bold text-white bg-black/25 p-1 px-2 rounded-md">
                  {entry.username}
                </span>
                {/* Indicador "Tú" */}
                {currentUserId && entry.user_id === currentUserId && (
                  <span className="bg-white/50 text-black text-xs font-bold p-2 rounded-md">
                    Tú
                  </span>
                )}
              </div>


              <span className="font-bold text-white bg-black/25 p-1 px-2 rounded-md">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Botón de registro */}
        {showSignUpButton && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <SignUpButton mode="modal">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                Regístrate para guardar tu progreso
              </button>
            </SignUpButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
