import React, { useEffect, useRef, useState } from 'react';
import { useTutorial, TutorialStep } from './TutorialProvider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

/**
 * TutorialTooltip Component
 * 
 * Displays an animated tooltip that guides users through
 * the onboarding process with helpful tips and instructions.
 * Positions itself relative to the target element.
 */
export function TutorialTooltip() {
  const {
    activeTutorial,
    currentStep,
    progress,
    nextStep,
    previousStep,
    skipTutorial,
  } = useTutorial();
  
  const [, navigate] = useLocation();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [calculatedPlacement, setCalculatedPlacement] = useState<string>('bottom');
  const [isVisible, setIsVisible] = useState(false);

  // Navigation to the correct route for the tutorial step
  useEffect(() => {
    if (activeTutorial && currentStep && currentStep.route) {
      navigate(currentStep.route);
    }
  }, [activeTutorial, currentStep, navigate]);

  // Position tooltip relative to target element
  useEffect(() => {
    if (!activeTutorial || !currentStep) return;

    // Delayed visibility to handle positioning
    setIsVisible(false);
    
    // Allow DOM to update after navigation
    const timer = setTimeout(() => {
      const targetElement = document.getElementById(currentStep.targetElementId);
      if (!targetElement || !tooltipRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Determine the best placement based on available space
      let placement = currentStep.placement || 'bottom';
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if there's enough space for the preferred placement
      if (placement === 'top' && targetRect.top < tooltipRect.height + 20) {
        placement = 'bottom';
      } else if (placement === 'bottom' && targetRect.bottom + tooltipRect.height + 20 > viewportHeight) {
        placement = 'top';
      } else if (placement === 'left' && targetRect.left < tooltipRect.width + 20) {
        placement = 'right';
      } else if (placement === 'right' && targetRect.right + tooltipRect.width + 20 > viewportWidth) {
        placement = 'left';
      }
      
      setCalculatedPlacement(placement);
      
      // Calculate position based on placement
      let top, left;
      const arrowOffset = 10; // Arrow offset from edge
      
      switch (placement) {
        case 'top':
          top = targetRect.top - tooltipRect.height - arrowOffset;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.right + arrowOffset;
          break;
        case 'bottom':
          top = targetRect.bottom + arrowOffset;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left - tooltipRect.width - arrowOffset;
          break;
        default:
          top = targetRect.bottom + arrowOffset;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
      }
      
      // Ensure tooltip stays within viewport
      if (left < 20) left = 20;
      if (left + tooltipRect.width + 20 > viewportWidth) left = viewportWidth - tooltipRect.width - 20;
      if (top < 20) top = 20;
      if (top + tooltipRect.height + 20 > viewportHeight) top = viewportHeight - tooltipRect.height - 20;
      
      setPosition({ top, left });
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [activeTutorial, currentStep]);

  if (!activeTutorial || !currentStep || !isVisible) return null;

  // Dynamic arrow classnames based on placement
  const arrowClass = {
    top: 'before:bottom-[-8px] before:left-1/2 before:transform before:-translate-x-1/2 before:border-t-primary before:border-t-8 before:border-x-transparent before:border-x-8 before:border-b-0',
    right: 'before:left-[-8px] before:top-1/2 before:transform before:-translate-y-1/2 before:border-r-primary before:border-r-8 before:border-y-transparent before:border-y-8 before:border-l-0',
    bottom: 'before:top-[-8px] before:left-1/2 before:transform before:-translate-x-1/2 before:border-b-primary before:border-b-8 before:border-x-transparent before:border-x-8 before:border-t-0',
    left: 'before:right-[-8px] before:top-1/2 before:transform before:-translate-y-1/2 before:border-l-primary before:border-l-8 before:border-y-transparent before:border-y-8 before:border-r-0',
  }[calculatedPlacement];

  return (
    <div 
      ref={tooltipRef}
      className={cn(
        "fixed z-50 w-[320px] shadow-lg transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        "before:absolute before:content-[''] before:w-0 before:h-0",
        arrowClass
      )}
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`
      }}
    >
      <Card className="border-primary bg-card animate-in fade-in-50 zoom-in-95 duration-300">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold">{currentStep.title}</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={skipTutorial}
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close tutorial</span>
            </Button>
          </div>
          <Progress value={progress} className="h-1 mt-1" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-card-foreground">{currentStep.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousStep}
            disabled={progress <= (100 / TUTORIAL_STEPS.length)}
            className="text-xs"
          >
            <ArrowLeftIcon className="h-3 w-3 mr-1" />
            Back
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={nextStep}
            className="text-xs"
          >
            {progress >= 100 ? 'Finish' : 'Next'}
            {progress < 100 && <ArrowRightIcon className="h-3 w-3 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}