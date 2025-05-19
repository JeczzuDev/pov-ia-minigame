import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { clerkId, email, username } = await request.json();

    // Verifica si el usuario ya existe en Supabase
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', clerkId)
      .single();

    if (!existing) {
      // Inserta el usuario si no existe
      const { data, error } = await supabase.from('users').insert({
        id: clerkId,
        username,
        // email,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Error syncing user' }, { status: 500 });
  }
}
