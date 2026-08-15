import { supabase } from './supabaseClient';

// Math History
export async function saveMathHistory(expression, steps, answer, topic = 'General Math') {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  const { data, error } = await supabase
    .from('math_history')
    .insert([
      { 
        user_id: userData.user.id, 
        original_expression: expression,
        solution_steps: JSON.stringify(steps),
        final_answer: answer,
        topic: topic
      }
    ])
    .select();
    
  if (error) throw error;
  return data;
}

export async function getMathHistory() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const { data, error } = await supabase
    .from('math_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteMathHistory(id) {
  const { error } = await supabase.from('math_history').delete().eq('id', id);
  if (error) throw error;
}

// Handwriting History
export async function saveHandwriting(textContent, title = 'Untitled Note') {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  const { data, error } = await supabase
    .from('handwritten_notes')
    .insert([
      { 
        user_id: userData.user.id, 
        text_content: textContent,
        title: title
      }
    ])
    .select();
    
  if (error) throw error;
  return data;
}

export async function getHandwritingHistory() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const { data, error } = await supabase
    .from('handwritten_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function searchHandwriting(query) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  // Basic ilike search for now
  const { data, error } = await supabase
    .from('handwritten_notes')
    .select('*')
    .ilike('text_content', `%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteHandwriting(id) {
  const { error } = await supabase.from('handwritten_notes').delete().eq('id', id);
  if (error) throw error;
}
