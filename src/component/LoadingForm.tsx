import { motion } from "framer-motion";

export const LoadingForm = ({ text }: { text: string }) => {
  const boxAnimations = [
    // Row 1
    {
      x: [0, -26, -26, -26, 0, 26, 26, 26, 0, -26, 0],
      y: [0, 0, 0, -26, -26, -26, 0, 26, 26, 26, 0],
    },
    {
      x: [0, 0, 26, 0, 26, 26, 26, 26, 0, 0, 0],
      y: [0, 0, 0, 0, 26, 26, 26, 26, 26, 26, 0],
    },
    {
      x: [-26, -26, 0, -26, -26, -26, -26, -26, -26, 0, 0],
      y: [0, 0, 0, 0, 0, 0, 0, 0, -26, -26, 0],
    },
    // Row 2
    {
      x: [-26, -26, -26, 0, 0, 0, 0, 0, -26, -26, 0],
      y: [0, 0, -26, -26, 0, -26, -26, -26, -26, 0, 0],
    },
    {
      x: [0, 0, 0, 26, 26, 26, 26, 26, 26, 0, 0],
      y: [0, 0, 0, 0, 0, 0, 0, 0, -26, -26, 0],
    },
    {
      x: [0, -26, -26, 0, 0, 0, 0, 0, -26, -26, 0],
      y: [0, 0, 0, 0, 0, 0, 0, 26, 26, 0, 0],
    },
    // Row 3
    {
      x: [26, 26, 26, 0, 0, 26, 0, 0, 0, 26, 0],
      y: [0, 0, 0, 0, -26, -26, -26, -26, 0, 0, 0],
    },
    {
      x: [0, -26, -26, 0, 0, 0, 0, 0, 26, 26, 0],
      y: [0, 0, -26, -26, -26, -26, -26, -26, -26, 0, 0],
    },
    {
      x: [-26, -26, 0, -26, 0, 0, -26, -26, -52, -26, 0],
      y: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ];

  const blueShades = [
    "bg-blue-50",
    "bg-blue-100",
    "bg-blue-200",
    "bg-blue-300",
    "bg-blue-400",
    "bg-blue-500",
    "bg-blue-600",
    "bg-blue-700",
    "bg-blue-800",
  ];

  return (
    <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
          {[...Array(9)].map((_, index) => (
            <motion.div
              key={index}
              className={`w-6 h-6 ${blueShades[index]} rounded-sm shadow-md`}
              animate={{
                x: boxAnimations[index].x,
                y: boxAnimations[index].y,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
              }}
            />
          ))}
        </div>

        {/* Optional loading text */}
        <motion.div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="text-gray-500 font-medium">{text}</span>
          <motion.span
            className="inline-block"
            animate={{ opacity: [0, 1] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.2,
            }}
          >
            .
          </motion.span>
          <motion.span
            className="inline-block"
            animate={{ opacity: [0, 1] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.4,
            }}
          >
            .
          </motion.span>
          <motion.span
            className="inline-block"
            animate={{ opacity: [0, 1] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.6,
            }}
          >
            .
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};
