import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * AnimatedProfileNavigation Component
 * 
 * A component that provides animated profile navigation with
 * smooth transitions, hover effects, and micro-animations.
 */
interface AnimatedProfileNavigationProps {
  activeSectionId: string;
  onSectionChange: (sectionId: string) => void;
  sections: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export const AnimatedProfileNavigation: React.FC<AnimatedProfileNavigationProps> = ({
  activeSectionId,
  onSectionChange,
  sections,
  className,
}) => {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  return (
    <Tabs
      defaultValue={activeSectionId}
      value={activeSectionId}
      onValueChange={onSectionChange}
      className={cn("w-full", className)}
    >
      <TabsList className="w-full flex justify-start border-b pb-0 mb-6 overflow-x-auto">
        {sections.map((section) => (
          <TabsTrigger
            key={section.id}
            value={section.id}
            className="relative py-2 px-3 flex items-center gap-2 group"
            onMouseEnter={() => setHoveredTabId(section.id)}
            onMouseLeave={() => setHoveredTabId(null)}
          >
            {/* Icon with bounce animation on hover */}
            {section.icon && (
              <motion.div
                initial={{ y: 0 }}
                animate={{
                  y: hoveredTabId === section.id ? [-2, 0, -1, 0] : 0,
                  transition: {
                    duration: 0.5,
                    times: [0, 0.2, 0.4, 0.6],
                    ease: "easeInOut",
                  }
                }}
                className="text-current"
              >
                {section.icon}
              </motion.div>
            )}

            {/* Label with slight scale on hover */}
            <motion.span
              initial={{ scale: 1 }}
              animate={{
                scale: hoveredTabId === section.id ? 1.05 : 1,
                transition: { duration: 0.2 }
              }}
            >
              {section.label}
            </motion.span>

            {/* Active indicator line with slide transition */}
            {activeSectionId === section.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Content with fade transition */}
      <AnimatePresence mode="wait">
        {sections.map((section) => (
          section.id === activeSectionId && (
            <TabsContent
              key={section.id}
              value={section.id}
              forceMount
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {section.content}
              </motion.div>
            </TabsContent>
          )
        ))}
      </AnimatePresence>
    </Tabs>
  );
};

/**
 * AnimatedBadge Component
 * 
 * A badge component with entrance animation for
 * displaying notifications and indicators in the profile.
 */
interface AnimatedBadgeProps {
  children: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
  animate?: boolean;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  color = "primary",
  className,
  animate = true,
}) => {
  // Map color to tailwind classes
  const colorClasses = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-green-500 text-white",
    warning: "bg-amber-500 text-white",
    danger: "bg-red-500 text-white",
  };

  return (
    <motion.div
      initial={animate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={animate ? { 
        scale: [0, 1.2, 1], 
        opacity: 1,
      } : undefined}
      transition={{ 
        duration: 0.5,
        times: [0, 0.6, 1],
        ease: "easeOut"
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colorClasses[color],
        className
      )}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedProfileCard Component
 * 
 * A profile card component with hover animations
 * for a more interactive user experience.
 */
interface AnimatedProfileCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedProfileCard: React.FC<AnimatedProfileCardProps> = ({
  children,
  className,
}) => {
  return (
    <motion.div
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.3 }
      }}
      className={cn(
        "bg-white shadow rounded-lg overflow-hidden transition-colors duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
};