import supabase from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Tipos para TypeScript
interface Prompt {
  id: string;
  title: string;
  description: string | null;
  level: number;
}

const MAX_LEVEL = 10;

export async function GET() {
  try {
    const { userId } = await auth();

    // Obtener el historial de prompts completados
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        prompt_id,
        prompts (
          id,
          level
        )
      `)
      .eq('user_id', userId || '')
      .order('completed_at', { ascending: false });

    if (matchesError) {
      console.error('Error al obtener historial:', matchesError);
      return NextResponse.json(
        { error: 'Error al cargar el historial' },
        { status: 500 }
      );
    }

    // Obtener IDs de prompts ya jugados y el último nivel completado
    const usedPromptIds = (matches || []).map(match => match.prompt_id);
    const lastCompletedLevel = (matches?.[0]?.prompts as unknown as Prompt)?.level;

    // Determinar el siguiente nivel a buscar
    let nextLevel = 1; // Nivel por defecto si no hay historial
    if (lastCompletedLevel) {
      // Avanzar al siguiente nivel, volviendo a 1 si es necesario
      nextLevel = (lastCompletedLevel % MAX_LEVEL) + 1;
    }

    // Buscar prompts del nivel actual que no se hayan jugado
    let nextPrompt: Prompt | null = null;
    let currentLevel = nextLevel;
    let levelsTried = 0;
    const maxLevelsToTry = MAX_LEVEL; // Evitar bucle infinito

    while (!nextPrompt && levelsTried < maxLevelsToTry) {
      // Construir la consulta para el nivel actual
      let query = supabase
        .from('prompts')
        .select('id, title, description, level')
        .eq('level', currentLevel);

      // Excluir prompts ya jugados
      if (usedPromptIds.length > 0) {
        query = query.not('id', 'in', `(${usedPromptIds.join(',')})`);
      }

      // Obtener todos los prompts disponibles para este nivel
      const { data: prompts, error } = await query;

      if (error) {
        console.error('Error al buscar prompts:', error);
        return NextResponse.json(
          { error: 'Error al buscar prompts' },
          { status: 500 }
        );
      }

      // Si encontramos prompts, seleccionar uno al azar
      if (prompts && prompts.length > 0) {
        const randomIndex = Math.floor(Math.random() * prompts.length);
        nextPrompt = prompts[randomIndex];
        break;
      }

      // Si no hay prompts en este nivel, probar el siguiente
      currentLevel = (currentLevel % MAX_LEVEL) + 1;
      levelsTried++;
    }

    // Manejar el caso de que no haya más prompts
    if (!nextPrompt) {
      // Verificar si ya se jugaron todos los prompts
      const { count: totalPrompts } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true });

      if (usedPromptIds.length >= (totalPrompts || 0)) {
        return NextResponse.json(
          { done: true, message: '¡Felicidades! Has completado todos los desafíos.' },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { error: 'No se encontraron prompts disponibles' },
          { status: 404 }
        );
      }
    }

    // Devolver el prompt encontrado
    return NextResponse.json({ done: false, prompt: nextPrompt }, { status: 200 });

  } catch (error) {
    console.error('Error en /api/prompts/next:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}