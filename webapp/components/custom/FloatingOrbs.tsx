'use client';

import { motion } from 'framer-motion';

export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Terracotta orb */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-15"
        style={{
          background:
            'radial-gradient(circle, rgba(224, 120, 86, 0.4) 0%, rgba(224, 120, 86, 0) 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ top: '10%', left: '10%' }}
      />
      {/* Amber orb */}
      <motion.div
        className="absolute w-[30rem] h-[30rem] rounded-full opacity-12"
        style={{
          background:
            'radial-gradient(circle, rgba(230, 168, 82, 0.35) 0%, rgba(230, 168, 82, 0) 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -150, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ top: '50%', right: '10%' }}
      />
      {/* Sage orb */}
      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-10"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 157, 131, 0.3) 0%, rgba(139, 157, 131, 0) 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 80, 0],
          y: [0, 150, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ bottom: '10%', left: '30%' }}
      />
    </div>
  );
}
