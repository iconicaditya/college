"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2;
      });
    }, 40);
    const timer = setTimeout(() => setVisible(false), 2600);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a]"
        >
          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <div className="w-16 h-16 rounded-lg bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-900/40">
              <span className="text-white font-manrope font-extrabold text-2xl tracking-tight">NMC</span>
            </div>
          </motion.div>

          {/* College name */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-white font-manrope font-bold text-3xl sm:text-4xl tracking-tight text-center px-4"
          >
            National Multiple College
          </motion.h1>

          {/* Affiliation */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-2 text-[#60a5fa] font-inter text-xs sm:text-sm font-semibold tracking-widest uppercase"
          >
            Affiliated to CTEVT
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-2 text-[#64748b] font-inter text-xs sm:text-sm tracking-widest uppercase"
          >
            Excellence in Technical &amp; Vocational Education
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="mt-10 w-48 h-[2px] bg-[#1e293b] rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-[#2563eb] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
