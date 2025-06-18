import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useInterview(id) {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", id)
          .single();

        if (dbError) throw dbError;
        if (!data) throw new Error("Interview not found");

        setInterview(data);
      } catch (err) {
        console.error("Error fetching interview:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  return { interview, loading, error };
}