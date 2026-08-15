import { supabase } from "./supabaseClient";

export async function saveStudyMaterial(title, originalText, summary) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from('study_materials')
    .insert([
      { 
        user_id: user.id, 
        title, 
        original_text: originalText, 
        summary 
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStudyMaterials() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteStudyMaterial(materialId) {
  const { error } = await supabase
    .from('study_materials')
    .delete()
    .eq('id', materialId);

  if (error) throw error;
}

export async function saveFlashcards(materialId, flashcardsJson) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const inserts = flashcardsJson.map(fc => ({
    material_id: materialId,
    user_id: user.id,
    question: fc.question,
    answer: fc.answer,
    difficulty: fc.difficulty || 'medium',
    status: 'new'
  }));

  const { error } = await supabase
    .from('flashcards')
    .insert(inserts);

  if (error) throw error;
}

export async function getFlashcards(materialId) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('material_id', materialId);

  if (error) throw error;
  return data;
}

export async function updateFlashcardStatus(flashcardId, status) {
  const { error } = await supabase
    .from('flashcards')
    .update({ status })
    .eq('id', flashcardId);

  if (error) throw error;
}

export async function saveQuizAttempt(materialId, score, totalQuestions, weakTopics = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // First create a mock quiz parent since we aren't saving quiz questions individually yet for brevity,
  // or we just save the attempt. Wait, schema requires quiz_id. Let's create a generic quiz record.
  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .insert([{
      material_id: materialId,
      user_id: user.id,
      title: "Generated Quiz",
      difficulty: "adaptive"
    }])
    .select()
    .single();

  if (quizError) throw quizError;

  const { error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert([{
      quiz_id: quizData.id,
      user_id: user.id,
      score,
      total_questions: totalQuestions,
      weak_topics: JSON.stringify(weakTopics)
    }]);

  if (attemptError) throw attemptError;
}

export async function getQuizStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  
  if (!data || data.length === 0) return null;

  const totalQuizzes = data.length;
  const avgScore = data.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0) / totalQuizzes;
  
  return {
    totalQuizzes,
    avgScore: Math.round(avgScore * 100)
  };
}
