// src/lib/credits.js
import { supabase } from './supabase';

/**
 * Fetches the current credit balance for a user after ensuring daily credits are refilled.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<number|null>} The user's up-to-date credit balance, or null on error.
 */
export const getUserCredits = async (userId) => {
  if (!userId) return 0;
  try {
    // This RPC call will handle the daily refill logic and return the updated credit count.
    const { data, error } = await supabase.rpc('refill_daily_credits', {
      user_id_param: userId,
    });

    if (error) throw error;
    
    // The RPC function is designed to return a single value in a table format.
    return data.length > 0 ? data[0].credits_updated : 0;
  } catch (error) {
    console.error('Error fetching user credits:', error.message);
    return null;
  }
};

/**
 * Deducts a specified amount of credits from a user's balance.
 * @param {string} userId - The ID of the user.
 * @param {number} amount - The amount of credits to deduct.
 * @returns {Promise<Object|null>} The result of the update operation.
 */
export const deductUserCredits = async (userId, amount) => {
  try {
    // It's good practice to get the latest credit count before deducting.
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