"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface MetaPilotLogoProps {
    className?: string;
}

const MetaPilotLogo: React.FC<MetaPilotLogoProps> = ({ className = "" }) => {
    return (
        <Link href="/" className={`flex items-center ${className}`}>
            <motion.div
                className="relative flex items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 md:w-10 md:h-10"
                >
                    {/* Background Circle */}
                    <circle cx="30" cy="30" r="30" fill="#040D36" fillOpacity="0.1" />

                    {/* Hexagon Base */}
                    <path
                        d="M30 10L48.6603 20V40L30 50L11.3397 40V20L30 10Z"
                        fill="#3B82F6"
                        fillOpacity="0.1"
                        stroke="#3B82F6"
                        strokeWidth="1.5"
                    />

                    {/* Inner Hexagon */}
                    <path
                        d="M30 18L41.3301 24V36L30 42L18.6699 36V24L30 18Z"
                        fill="#3B82F6"
                        fillOpacity="0.2"
                        stroke="#3B82F6"
                        strokeWidth="1"
                    />

                    {/* Centered Icon */}
                    <path
                        d="M30 23L36.1603 26.5V33.5L30 37L23.8397 33.5V26.5L30 23Z"
                        fill="#3B82F6"
                    />

                    {/* Pulsing Data Points */}
                    <circle cx="30" cy="13" r="2" fill="#6366F1" className="animate-pulse" />
                    <circle cx="45" cy="20" r="2" fill="#6366F1" className="animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <circle cx="45" cy="40" r="2" fill="#6366F1" className="animate-pulse" style={{ animationDelay: "0.4s" }} />
                    <circle cx="30" cy="47" r="2" fill="#6366F1" className="animate-pulse" style={{ animationDelay: "0.6s" }} />
                    <circle cx="15" cy="40" r="2" fill="#6366F1" className="animate-pulse" style={{ animationDelay: "0.8s" }} />
                    <circle cx="15" cy="20" r="2" fill="#6366F1" className="animate-pulse" style={{ animationDelay: "1s" }} />

                    {/* Connection Lines */}
                    <line x1="30" y1="13" x2="30" y2="23" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="45" y1="20" x2="36" y2="26.5" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="45" y1="40" x2="36" y2="33.5" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="30" y1="47" x2="30" y2="37" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="15" y1="40" x2="24" y2="33.5" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="15" y1="20" x2="24" y2="26.5" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 2" />
                </svg>

                <span className="ml-2 text-gray-900 dark:text-white text-xl md:text-2xl font-bold">
                    <span className="text-blue-500">Meta</span>Pilot
                </span>
            </motion.div>
        </Link>
    );
};

export default MetaPilotLogo;


// // components/MetaPilotLogo.tsx
// import React from 'react';
// import { motion } from 'framer-motion';

// interface MetaPilotLogoProps {
//     size?: 'sm' | 'md' | 'lg';
//     textVisible?: boolean;
// }

// const MetaPilotLogo: React.FC<MetaPilotLogoProps> = ({
//     size = 'md',
//     textVisible = true
// }) => {
//     // Define size classes
//     const sizeClasses = {
//         sm: {
//             container: "h-6 w-6",
//             text: "text-sm"
//         },
//         md: {
//             container: "h-8 w-8",
//             text: "text-lg"
//         },
//         lg: {
//             container: "h-12 w-12",
//             text: "text-2xl"
//         }
//     };

//     return (
//         <motion.div
//             className="flex items-center gap-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5 }}
//         >
//             <motion.div
//                 className={`relative ${sizeClasses[size].container} rounded-md overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-indigo-600 flex items-center justify-center`}
//                 whileHover={{
//                     scale: 1.05,
//                     boxShadow: "0 0 12px rgba(56, 189, 248, 0.6)"
//                 }}
//             >
//                 <motion.div
//                     className="absolute inset-0 bg-grid-white/[0.05] dark:bg-grid-white/[0.1]"
//                     style={{
//                         backgroundSize: "8px 8px",
//                         backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)"
//                     }}
//                     initial={{ opacity: 0.5 }}
//                     animate={{
//                         opacity: [0.5, 0.8, 0.5],
//                         scale: [1, 1.05, 1]
//                     }}
//                     transition={{
//                         duration: 3,
//                         repeat: Infinity,
//                         repeatType: "reverse"
//                     }}
//                 />
//                 <motion.div
//                     className={`z-10 font-bold text-white ${sizeClasses[size].text}`}
//                     animate={{
//                         textShadow: ["0 0 0px #fff", "0 0 5px #38bdf8", "0 0 0px #fff"]
//                     }}
//                     transition={{
//                         duration: 2,
//                         repeat: Infinity,
//                         repeatType: "reverse"
//                     }}
//                 >
//                     MP
//                 </motion.div>
//             </motion.div>

//             {textVisible && (
//                 <motion.div
//                     className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-600 dark:from-white dark:to-teal-400"
//                     animate={{
//                         backgroundPosition: ["0% center", "100% center"],
//                     }}
//                     transition={{
//                         duration: 8,
//                         repeat: Infinity,
//                         repeatType: "reverse"
//                     }}
//                 >
//                     MetaPilot
//                 </motion.div>
//             )}
//         </motion.div>
//     );
// };

// export default MetaPilotLogo;