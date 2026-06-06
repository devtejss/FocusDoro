import { motion } from "framer-motion";

/** Lightweight animated SVG mascot (Lottie-style without the dep). */
export function LionMascot({ size = 200, mood = "happy" }: { size?: number; mood?: "happy" | "focus" | "rest" }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      aria-label="Leo the lion"
    >
      {/* Mane */}
      <motion.g
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 100px" }}
      >
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const x = 100 + Math.cos(a) * 62;
          const y = 110 + Math.sin(a) * 58;
          return <circle key={i} cx={x} cy={y} r={22} fill="#F59E0B" opacity={0.85} />;
        })}
      </motion.g>
      {/* Head */}
      <circle cx="100" cy="108" r="48" fill="#FBBF24" />
      {/* Ears */}
      <circle cx="68" cy="78" r="12" fill="#F59E0B" />
      <circle cx="132" cy="78" r="12" fill="#F59E0B" />
      <circle cx="68" cy="78" r="6" fill="#FBBF24" />
      <circle cx="132" cy="78" r="6" fill="#FBBF24" />
      {/* Eyes */}
      <motion.g
        animate={mood === "rest" ? { scaleY: [1, 0.1, 1] } : { scaleY: [1, 0.2, 1] }}
        transition={{ duration: mood === "rest" ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 105px" }}
      >
        <ellipse cx="85" cy="105" rx="5" ry="7" fill="#1f2937" />
        <ellipse cx="115" cy="105" rx="5" ry="7" fill="#1f2937" />
        <circle cx="86.5" cy="103" r="1.5" fill="#fff" />
        <circle cx="116.5" cy="103" r="1.5" fill="#fff" />
      </motion.g>
      {/* Nose */}
      <path d="M95 122 Q100 128 105 122 Q100 132 95 122 Z" fill="#1f2937" />
      {/* Mouth */}
      <path
        d={mood === "happy" ? "M88 132 Q100 142 112 132" : "M88 134 Q100 130 112 134"}
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cheeks */}
      <circle cx="78" cy="125" r="4" fill="#FCA5A5" opacity="0.7" />
      <circle cx="122" cy="125" r="4" fill="#FCA5A5" opacity="0.7" />
    </motion.svg>
  );
}