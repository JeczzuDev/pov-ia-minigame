import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { evaluateWithModel } from '@/lib/evaluateUtils';

interface Evaluation {
    match_id: string;
    resource_id: string;
    model_id: string;
    score: number;
    explanation: string;
}

export async function POST(request: Request) {
    try {
        // Leer body
        const { matchId } = await request.json();
        if (!matchId) {
            return NextResponse.json({ error: 'matchId requerido' }, { status: 400 });
        }

        // Verificar si ya existen evaluaciones para este match
        const { data: existingEvaluations, error: existingError } = await supabase
            .from('ai_evaluations')
            .select(`
                    id, 
                    score, 
                    explanation, 
                    submitted_resources:resource_id (url)
                `)
            .eq('match_id', matchId);

        if (existingError) {
            return NextResponse.json(
                { message: 'Error al verificar evaluaciones existentes', error: existingError.message },
                { status: 500 }
            );
        }

        // Si ya existen evaluaciones, devolverlas
        if (existingEvaluations && existingEvaluations.length > 0) {
            const evaluations = existingEvaluations.map(evalItem => {
                const resource = Array.isArray(evalItem.submitted_resources)
                    ? evalItem.submitted_resources[0]
                    : evalItem.submitted_resources;
                return {
                    id: evalItem.id,
                    score: evalItem.score,
                    explanation: evalItem.explanation,
                    url: resource?.url || ''
                };
            });

            // Obtener el total de la partida
            const { data: matchData } = await supabase
                .from('matches')
                .select('score_ai, time_elapsed, time_bonus')
                .eq('id', matchId)
                .single();

            return NextResponse.json({
                total: matchData?.score_ai || 0,
                baseScore: matchData?.score_ai || 0,
                timeBonus: matchData?.time_bonus || 0,
                timeElapsed: matchData?.time_elapsed || 0,
                evaluations
            });
        }

        // Verificar si hay recursos para evaluar
        const { data: resources, error: resourcesError } = await supabase
            .from('submitted_resources')
            .select('id, url')
            .eq('match_id', matchId);

        if (resourcesError) {
            return NextResponse.json(
                { message: 'Error al obtener recursos', error: resourcesError.message },
                { status: 500 });
        }

        if (!resources?.length) {
            // Actualizar puntaje en matches
            await supabase
                .from('matches')
                .update({
                    score_ai: 0,
                    time_bonus: 0,
                    time_elapsed: 0
                })
                .eq('id', matchId);

            return NextResponse.json({
                message: 'No se encontraron recursos',
                total: 0,
                baseScore: 0,
                timeBonus: 0,
                timeElapsed: 0,
                evaluations: []
            });
        }

        // Crear un mapa de resource_id a URL para referencia rápida
        const resourceUrlMap = resources.reduce<Record<string, string>>((acc, resource) => {
            acc[resource.id] = resource.url;
            return acc;
        }, {});

        // Obtener id del prompt de la partida
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('prompt_id, time_elapsed')
            .eq('id', matchId)
            .single();

        if (matchError) {
            return NextResponse.json(
                { message: 'Error al obtener match', error: matchError.message },
                { status: 500 }
            );
        }

        if (!match) {
            return NextResponse.json(
                { message: 'Match no encontrado', error: 'Match no encontrado' },
                { status: 400 }
            );
        }

        // Obtener prompt y recursos
        const { data: promptData, error: promptError } = await supabase
            .from('prompts')
            .select('description')
            .eq('id', match?.prompt_id)
            .single();

        if (promptError) {
            return NextResponse.json(
                { message: 'Error al obtener prompt', error: promptError.message },
                { status: 500 }
            );
        }

        if (!promptData) {
            return NextResponse.json(
                { error: 'Prompt no encontrado' },
                { status: 400 }
            );
        }

        // Obtener modelo activo
        const { data: config, error: configError } = await supabase
            .from('app_config')
            .select('key, value')
            .in('key', ['community_winner_model', 'default_ai_model']);

        if (configError) {
            return NextResponse.json(
                { message: 'Error al obtener config', error: configError.message },
                { status: 500 }
            );
        }

        if (!config?.length) {
            return NextResponse.json(
                { message: 'Config no encontrado', error: 'Config no encontrado' },
                { status: 400 }
            );
        }

        const modelId = config?.find((c) => c.key === 'community_winner_model')?.value ||
            config?.find((c) => c.key === 'default_ai_model')?.value;

        const { data: model, error: modelError } = await supabase
            .from('ai_models')
            .select('*')
            .eq('id', modelId)
            .single();

        if (modelError) {
            return NextResponse.json(
                { message: 'Error al obtener modelo', error: modelError.message },
                { status: 500 }
            );
        }

        if (!model) {
            return NextResponse.json(
                { message: 'Modelo no encontrado', error: 'Modelo no encontrado' },
                { status: 400 }
            );
        }

        const resourcesIds = resources.map((resource) => resource.id).join(', ');
        const resourcesUrls = resources.map((resource) => resource.url).join(', ');
        const evaluations = [];

        const prompt = `Evalúa los recursos asignando un score de 1 a 10 y una explicación de máximo 200 caracteres basándote en precisión técnica, complejidad, nivel de detalle, utilidad práctica, calidad de la fuente, claridad de exposición y complementariedad entre sí.No se permiten recursos repetidos. Problema: ${promptData.description}. Recursos: ${resourcesUrls}. IDs de recursos: ${resourcesIds}. Devuelve **únicamente un objeto JSON válido en una sola línea**, sin formato adicional, sin explicaciones, sin saltos de línea ni bloques de código. Ejemplo: {[resource_id]: {"score": x, "explanation": "y"}}`;
        const response = await evaluateWithModel(model, prompt);
        const responseJson = JSON.parse(response);

        for (const resource of resources) {
            const score = responseJson[resource.id].score;
            const explanation = responseJson[resource.id].explanation;

            evaluations.push({
                match_id: matchId,
                resource_id: resource.id,
                model_id: model.id,
                score,
                explanation,
            });
        }

        // Insertar evaluaciones
        const { error: insertError } = await supabase
            .from('ai_evaluations')
            .insert(evaluations);

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Calcular puntaje base
        let baseScore = 0;
        evaluations.forEach((evaluation) => {
            baseScore += evaluation.score;
        });

        // Calcular puntos por tiempo (5 puntos por cada 10 segundos, máximo 50 segundos)
        const timeElapsed = match?.time_elapsed || 0;
        const timeBonus = Math.max(0, 5 - Math.ceil(timeElapsed / 10));
        const totalScore = baseScore + timeBonus;

        // Actualizar puntaje en matches
        await supabase
            .from('matches')
            .update({
                score_ai: baseScore,
                time_bonus: timeBonus
            })
            .eq('id', matchId);

        // Incluir las URLs en la respuesta
        const evaluationsWithUrls = evaluations.map(evalItem => ({
            ...evalItem,
            url: resourceUrlMap[evalItem.resource_id] || ''
        }));

        return NextResponse.json({
            total: totalScore,
            baseScore: baseScore,
            timeBonus: timeBonus,
            timeElapsed: timeElapsed,
            evaluations: evaluationsWithUrls
        });
    } catch (error) {
        console.error('Error in evaluate API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al evaluar recursos';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}