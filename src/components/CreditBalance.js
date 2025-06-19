// src/components/CreditBalance.js
'use client'

import { useState, useEffect } from 'react';
import { useCache } from '@/context/CacheContext';
import { getUserCredits } from '@/lib/credits';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

export default function CreditBalance() {
  const { user } = useCache();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user?.id) {
        const currentCredits = await getUserCredits(user.id);
        setCredits(currentCredits ?? 0);
      }
    };

    // Fetch credits immediately when the component mounts
    fetchCredits();

    // And then fetch again every 30 seconds to keep it fresh
    const interval = setInterval(fetchCredits, 30000); 

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [user]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center space-x-2 bg-slate-700/50 text-indigo-300 font-semibold px-3 py-1.5 rounded-full text-sm"
    >
      <Coins className="w-4 h-4" />
      <span>{credits} {credits === 1 ? 'Credit' : 'Credits'} Left Today</span>
    </motion.div>
  );
}