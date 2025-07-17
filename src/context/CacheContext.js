"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";

const CACHE_KEYS = {
  INTERVIEWS: "user_interviews",
  FEEDBACK: "interviews_feedback",
  CACHE_TIMESTAMP: "cache_timestamp",
};

const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const CacheContext = createContext();

export const useCache = () => useContext(CacheContext);

export const CacheProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);

  const isCacheValid = (timestamp) => {
    return new Date().getTime() - timestamp < CACHE_EXPIRATION_MS;
  };

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        return session.user;
      }
      setUser(null);
      return null;
    } catch (error) {
      console.error("Error fetching user session:", error);
      setUser(null);
      return null;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(CACHE_KEYS.INTERVIEWS);
    localStorage.removeItem(CACHE_KEYS.FEEDBACK);
    localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
    setUser(null);
    setInterviews([]);
    setFeedback({});
  }, []);

  const fetchInterviews = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
      
      // Store interviews without user_id
      const sanitizedInterviews = (data || []).map(({ user_id, ...rest }) => rest);
      localStorage.setItem(CACHE_KEYS.INTERVIEWS, JSON.stringify(sanitizedInterviews));
    } catch (error) {
      console.error("Error fetching interviews:", error);
    }
  }, []);
  
  const deleteInterview = useCallback(async (interviewId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("User not authenticated");

    const previousInterviews = interviews;
    const updatedInterviews = interviews.filter((i) => i.id !== interviewId);
    setInterviews(updatedInterviews);
    
    // Store interviews without user_id
    const sanitizedInterviews = updatedInterviews.map(({ user_id, ...rest }) => rest);
    localStorage.setItem(CACHE_KEYS.INTERVIEWS, JSON.stringify(sanitizedInterviews));

    try {
      const { error } = await supabase
        .from("interviews")
        .delete()
        .eq("id", interviewId)
        .eq("user_id", session.user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to delete interview:", error);
      setInterviews(previousInterviews);
      const sanitizedPrevious = previousInterviews.map(({ user_id, ...rest }) => rest);
      localStorage.setItem(CACHE_KEYS.INTERVIEWS, JSON.stringify(sanitizedPrevious));
      throw error;
    }
  }, [interviews]);

  const updateInterviewNotes = useCallback(async (interviewId, notes) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('interviews')
        .update({ user_notes: notes })
        .eq('id', interviewId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedInterviews = interviews.map(i => 
        i.id === interviewId ? data : i
      );
      setInterviews(updatedInterviews);
      
      // Store interviews without user_id
      const sanitizedInterviews = updatedInterviews.map(({ user_id, ...rest }) => rest);
      localStorage.setItem(CACHE_KEYS.INTERVIEWS, JSON.stringify(sanitizedInterviews));
    } catch (error) {
        console.error("Failed to save notes:", error);
        throw error;
    }
  }, [interviews]);

  const fetchFeedbackForInterview = useCallback(async (interviewId) => {
    if (!interviewId) return;
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("interview_id", interviewId)
        .single();

      if (error) throw error;

      if (data) {
        setFeedback((prev) => ({ ...prev, [interviewId]: data }));
        const allFeedback = JSON.parse(localStorage.getItem(CACHE_KEYS.FEEDBACK) || '{}');
        allFeedback[interviewId] = data;
        localStorage.setItem(CACHE_KEYS.FEEDBACK, JSON.stringify(allFeedback));
      }
    } catch (error) {
      if (error.code !== 'PGRST116') {
          console.error(`Error fetching feedback for interview ${interviewId}:`, error);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const cachedTimestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      const cacheIsValid = cachedTimestamp && isCacheValid(parseInt(cachedTimestamp, 10));

      const currentUser = await fetchUser();
      
      if (currentUser) {
        if (cacheIsValid) {
          const cachedInterviews = localStorage.getItem(CACHE_KEYS.INTERVIEWS);
          const cachedFeedback = localStorage.getItem(CACHE_KEYS.FEEDBACK);
          if (cachedInterviews) setInterviews(JSON.parse(cachedInterviews));
          if (cachedFeedback) setFeedback(JSON.parse(cachedFeedback));
        } else {
          await fetchInterviews();
          localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, new Date().getTime().toString());
        }
      }
      setLoading(false);
    };
    loadData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          const newUser = session.user;
          setUser(newUser);
          fetchInterviews();
          localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, new Date().getTime().toString());
        } else if (event === "SIGNED_OUT") {
          signOutUser();
        }
      }
    );

    return () => authListener?.subscription.unsubscribe();
  }, [fetchUser, fetchInterviews, signOutUser]);

  const value = {
    user,
    interviews,
    feedback,
    loading,
    logout: signOutUser,
    deleteInterview,
    fetchFeedbackForInterview,
    updateInterviewNotes,
    refreshInterviews: () => fetchInterviews(),
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};