import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Tutorial step type definition
export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetElementId: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  order: number;
  route: string;
  condition?: () => boolean;
};

// Define tutorial steps for different features
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the Professional Network',
    description: 'This guide will help you get started with all the key features available to you.',
    targetElementId: 'header',
    placement: 'bottom',
    order: 1,
    route: '/',
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your work experience, education, and skills to showcase your professional background.',
    targetElementId: 'nav-profile',
    placement: 'bottom',
    order: 2,
    route: '/',
  },
  {
    id: 'create-post',
    title: 'Share Updates',
    description: 'Share professional updates, articles, or thoughts with your network.',
    targetElementId: 'post-creator',
    placement: 'top',
    order: 3,
    route: '/',
  },
  {
    id: 'services',
    title: 'Offer Your Services',
    description: 'List professional services you offer to connect with potential clients.',
    targetElementId: 'nav-services',
    placement: 'bottom',
    order: 4,
    route: '/',
  },
  {
    id: 'instances',
    title: 'Join or Create Instances',
    description: 'Join existing professional networks or create your own federated instance.',
    targetElementId: 'instances-card',
    placement: 'right',
    order: 5,
    route: '/',
  },
];

// Local storage key
const TUTORIAL_STORAGE_KEY = 'professional-network-tutorial';

// Tutorial context type
type TutorialContextType = {
  activeTutorial: boolean;
  currentStep: TutorialStep | null;
  progress: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepId: string) => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
};

// Create context with default values
const TutorialContext = createContext<TutorialContextType>({
  activeTutorial: false,
  currentStep: null,
  progress: 0,
  startTutorial: () => {},
  endTutorial: () => {},
  nextStep: () => {},
  previousStep: () => {},
  goToStep: () => {},
  skipTutorial: () => {},
  resetTutorial: () => {},
});

// User-level tutorial state stored in localStorage
type TutorialState = {
  completed: boolean;
  lastStepId: string | null;
};

/**
 * Tutorial Provider Component
 * 
 * Manages the onboarding tutorial state and navigation.
 * Persists tutorial progress in localStorage to prevent showing
 * completed tutorials to returning users.
 */
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeTutorial, setActiveTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [availableSteps, setAvailableSteps] = useState<TutorialStep[]>([]);

  // Initialize or load tutorial state from localStorage
  useEffect(() => {
    if (user) {
      const userKey = `${TUTORIAL_STORAGE_KEY}-${user.userId}`;
      const storedState = localStorage.getItem(userKey);
      const tutorialState: TutorialState = storedState 
        ? JSON.parse(storedState) 
        : { completed: false, lastStepId: null };

      // If tutorial is not completed and the user has logged in, 
      // consider showing the tutorial automatically
      if (!tutorialState.completed) {
        // Filter steps based on conditions if necessary
        const steps = TUTORIAL_STEPS.filter(step => !step.condition || step.condition())
          .sort((a, b) => a.order - b.order);
        
        setAvailableSteps(steps);
        
        // Start from the beginning or resume from last step
        if (steps.length > 0) {
          if (tutorialState.lastStepId) {
            const lastStepIndex = steps.findIndex(step => step.id === tutorialState.lastStepId);
            setCurrentStep(lastStepIndex >= 0 ? steps[lastStepIndex] : steps[0]);
          } else {
            setCurrentStep(steps[0]);
          }
        }
      }
    }
  }, [user]);

  // Save tutorial state to localStorage
  const saveTutorialState = (state: TutorialState) => {
    if (user) {
      const userKey = `${TUTORIAL_STORAGE_KEY}-${user.userId}`;
      localStorage.setItem(userKey, JSON.stringify(state));
    }
  };

  // Start tutorial
  const startTutorial = () => {
    if (availableSteps.length > 0) {
      setCurrentStep(availableSteps[0]);
      setActiveTutorial(true);
      saveTutorialState({ completed: false, lastStepId: availableSteps[0].id });
    }
  };

  // End tutorial
  const endTutorial = () => {
    setActiveTutorial(false);
    saveTutorialState({ completed: true, lastStepId: null });
  };

  // Go to next tutorial step
  const nextStep = () => {
    if (currentStep && availableSteps.length > 0) {
      const currentIndex = availableSteps.findIndex(step => step.id === currentStep.id);
      if (currentIndex < availableSteps.length - 1) {
        const nextStep = availableSteps[currentIndex + 1];
        setCurrentStep(nextStep);
        saveTutorialState({ completed: false, lastStepId: nextStep.id });
      } else {
        // Tutorial completed
        setActiveTutorial(false);
        saveTutorialState({ completed: true, lastStepId: null });
      }
    }
  };

  // Go to previous tutorial step
  const previousStep = () => {
    if (currentStep && availableSteps.length > 0) {
      const currentIndex = availableSteps.findIndex(step => step.id === currentStep.id);
      if (currentIndex > 0) {
        const prevStep = availableSteps[currentIndex - 1];
        setCurrentStep(prevStep);
        saveTutorialState({ completed: false, lastStepId: prevStep.id });
      }
    }
  };

  // Go to specific step by ID
  const goToStep = (stepId: string) => {
    const step = availableSteps.find(step => step.id === stepId);
    if (step) {
      setCurrentStep(step);
      setActiveTutorial(true);
      saveTutorialState({ completed: false, lastStepId: step.id });
    }
  };

  // Skip tutorial
  const skipTutorial = () => {
    setActiveTutorial(false);
    saveTutorialState({ completed: true, lastStepId: null });
  };

  // Reset tutorial (for testing)
  const resetTutorial = () => {
    if (user) {
      const userKey = `${TUTORIAL_STORAGE_KEY}-${user.userId}`;
      localStorage.removeItem(userKey);
      
      if (availableSteps.length > 0) {
        setCurrentStep(availableSteps[0]);
      }
      setActiveTutorial(true);
      saveTutorialState({ completed: false, lastStepId: availableSteps[0]?.id || null });
    }
  };

  // Calculate progress percentage
  const progress = currentStep && availableSteps.length > 0
    ? ((availableSteps.findIndex(step => step.id === currentStep.id) + 1) / availableSteps.length) * 100
    : 0;

  return (
    <TutorialContext.Provider
      value={{
        activeTutorial,
        currentStep,
        progress,
        startTutorial,
        endTutorial,
        nextStep,
        previousStep,
        goToStep,
        skipTutorial,
        resetTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

// Hook to use the tutorial context
export const useTutorial = () => useContext(TutorialContext);