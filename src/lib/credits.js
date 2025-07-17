import { supabase } from './supabase';

export const getUserCredits = async (userId) => {
  if (!userId) return 0;
  try {
    // This RPC call will handle the daily refill logic and return the updated credit count.
    const { data, error } = await supabase.rpc('refill_daily_credits', {
      user_id_param: userId,
    });

    if (error) throw error;
    
    return data.length > 0 ? data[0].credits_updated : 0;
  } catch (error) {
    console.error('Error fetching user credits:', error.message);
    return null;
  }
};

export const deductUserCredits = async (userId, amount) => {
  try {
    
    const currentCredits = await getUserCredits(userId);

    if (currentCredits === null || currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    const { data, error } = await supabase
      .from('users')
      .update({ credits: currentCredits - amount })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error deducting user credits:', error.message);
    throw error;
  }
};