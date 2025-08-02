# Component Architecture

## Overview

Danbing uses a component-based architecture built with React 19 and Next.js 15.4.4. This document outlines the component hierarchy, relationships, and design patterns used throughout the application.

## Architecture Principles

### 1. Separation of Concerns
- **Presentation Components**: Pure UI components with no business logic
- **Container Components**: Handle data fetching and state management
- **Custom Hooks**: Reusable logic abstraction
- **Server Components**: Server-side rendering for performance

### 2. Component Composition
- **Small, focused components**: Single responsibility principle
- **Composition over inheritance**: Build complex UIs from simple components
- **Props drilling avoidance**: Use context and custom hooks for deep data

### 3. Performance Optimization
- **React 19 features**: Concurrent rendering and automatic batching
- **Lazy loading**: Code splitting for large components
- **Memoization**: Prevent unnecessary re-renders

## Core Component Categories

### 1. Layout Components

#### Navigation (`/src/components/Navigation.tsx`)
- **Purpose**: Top-level navigation and user menu
- **Features**: Authentication status, responsive design, theme switching
- **Dependencies**: NextAuth session, user preferences

#### Footer (`/src/components/Footer.tsx`)
- **Purpose**: Site-wide footer with links and branding
- **Features**: Static content, responsive layout
- **Dependencies**: None (pure presentational)

### 2. Authentication Components

#### Sign In/Up Pages (`/src/app/auth/`)
- **Purpose**: User authentication flows
- **Features**: Form validation, error handling, email verification
- **Dependencies**: NextAuth, Prisma, Resend email service

```typescript
// Example auth component structure
interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (credentials: Credentials) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function AuthForm({ mode, onSubmit, isLoading, error }: AuthFormProps) {
  // Form logic and validation
}
```

### 3. Learning Components

#### FlashSession (`/src/components/FlashSession.tsx`)
- **Purpose**: Core learning experience with dual-phase presentation
- **State Management**: Complex state machine for session flow
- **Features**: 
  - 8-character sessions with mini-quizzes every 3 cards
  - Speed presets (fast/medium/slow)
  - Pause/resume functionality
  - Progress tracking
  - Demo system integration

```typescript
interface FlashSessionProps {
  deckId: string;
  mode: 'new' | 'review' | 'practice';
  onExit: () => void;
}

// Key state management
const [phase, setPhase] = useState<'loading' | 'countdown' | 'flash' | 'quiz'>('loading');
const [currentIndex, setCurrentIndex] = useState(0);
const [viewPhase, setViewPhase] = useState<'orthographic' | 'phonological' | 'semantic'>('orthographic');
```

#### FlashSessionDemo (`/src/components/FlashSessionDemo.tsx`)
- **Purpose**: Interactive onboarding experience for new users
- **Features**:
  - Typing effect explanations
  - ASCII diagrams for session flow
  - User preference integration (show/hide toggle)
  - Manual navigation with Q-quit functionality

#### Quiz (`/src/components/Quiz.tsx`)
- **Purpose**: Interactive assessment component
- **Features**:
  - Multiple question types (meaning→character, audio→character, etc.)
  - Confused characters as distractors
  - Visual feedback (green/red highlighting)
  - Timer functionality with auto-advance

### 4. Data Management Components

#### DeckList (`/src/components/DeckList.tsx`)
- **Purpose**: Display user's decks with statistics
- **Features**:
  - Real-time due card counts
  - Progress indicators
  - Inline deck name editing
  - Action buttons (study, practice, insights)

#### DeckImport (`/src/components/DeckImport.tsx`)
- **Purpose**: CSV deck import with real-time progress
- **Features**:
  - File validation
  - Progress tracking via Server-Sent Events
  - Error handling and feedback

### 5. Analytics Components

#### Analytics (`/src/components/Analytics.tsx`)
- **Purpose**: Learning progress visualization
- **Features**:
  - Charts and graphs (using Recharts)
  - Performance metrics
  - Learning streaks and achievements

#### CharacterInsights (`/src/components/CharacterInsights.tsx`)
- **Purpose**: Deep character analysis modal
- **Features**:
  - AI-powered insights display
  - Etymology and mnemonics
  - Confusion analysis
  - Mobile-responsive design
  - Pinyin annotations

```typescript
interface CharacterInsightsProps {
  characterId: string;
  character: string;
  onClose: () => void;
}

// Key features
- Deep linguistic analysis with caching
- AI insights with etymology and mnemonics
- Confusion patterns and learning tips
- Mobile-optimized responsive design
```

### 6. UI Utility Components

#### AlertDialog (`/src/components/AlertDialog.tsx`)
- **Purpose**: Custom confirmation dialogs
- **Features**: 
  - Replace browser alerts
  - Session pause integration
  - Consistent styling

#### AnimatedCursor (`/src/components/AnimatedCursor.tsx`)
- **Purpose**: Enhanced cursor interactions
- **Features**: Visual feedback for interactive elements

## Component Communication Patterns

### 1. Props Down, Events Up
```typescript
// Parent component
function DeckPage({ deckId }: { deckId: string }) {
  const [isFlashSessionActive, setIsFlashSessionActive] = useState(false);
  
  return (
    <>
      <DeckList onStartSession={() => setIsFlashSessionActive(true)} />
      {isFlashSessionActive && (
        <FlashSession 
          deckId={deckId}
          onExit={() => setIsFlashSessionActive(false)}
        />
      )}
    </>
  );
}
```

### 2. Custom Hooks for Logic Reuse

#### useAlert Hook
```typescript
// /src/hooks/useAlert.tsx
export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  
  const showAlert = useCallback((message: string) => {
    setAlertState({ type: 'alert', message });
  }, []);
  
  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertState({ 
        type: 'confirm', 
        message, 
        onConfirm: resolve 
      });
    });
  }, []);
  
  return { showAlert, showConfirm, alertState, setAlertState };
}
```

#### useSession Hook (NextAuth)
```typescript
// Authentication state management
const { data: session, status } = useSession();

if (status === 'loading') return <LoadingSpinner />;
if (status === 'unauthenticated') redirect('/auth/signin');
```

### 3. Server Components for Data Fetching

```typescript
// Server component for initial data loading
export default async function DeckPage({ params }: { params: { deckId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  
  const deck = await getDeckWithStats(params.deckId, session.user.id);
  
  return <DeckPageClient deck={deck} />;
}
```

## State Management Patterns

### 1. Local Component State
- **Use cases**: UI state, form inputs, toggles
- **Implementation**: `useState`, `useReducer` for complex state

### 2. Server State
- **Use cases**: Database data, API responses
- **Implementation**: Server components, API routes, optimistic updates

### 3. Global State (Minimal)
- **Use cases**: User preferences, theme settings
- **Implementation**: React Context, custom hooks

## Performance Optimizations

### 1. Code Splitting
```typescript
// Dynamic imports for large components
const CharacterInsights = dynamic(() => import('@/components/CharacterInsights'), {
  loading: () => <div>Loading insights...</div>
});
```

### 2. Memoization
```typescript
// Prevent unnecessary re-renders
const MemoizedQuizQuestion = memo(function QuizQuestion({ question, onAnswer }: QuizQuestionProps) {
  return (
    <div className="quiz-question">
      {/* Question UI */}
    </div>
  );
});
```

### 3. Concurrent Features (React 19)
```typescript
// Automatic batching for better performance
function FlashCard({ card }: { card: Card }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  
  // Multiple state updates are automatically batched
  const handleCardTransition = () => {
    setIsVisible(true);
    setHasAudio(true);
    // No additional renders between these updates
  };
}
```

## Component Styling Strategy

### 1. Tailwind CSS v4
- **Utility-first approach**: Consistent, maintainable styles
- **Responsive design**: Mobile-first with breakpoint modifiers
- **Dark theme optimization**: Accessibility-focused color palette

### 2. Component-Specific Styles
```typescript
// Consistent styling patterns
const buttonVariants = {
  primary: "bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black",
  secondary: "border border-[#30363d] text-[#7d8590] hover:bg-[#21262d]",
  danger: "bg-red-600 hover:bg-red-700 text-white"
};
```

### 3. Animation Integration
```typescript
// Framer Motion for smooth animations
import { motion, AnimatePresence } from 'framer-motion';

function FlashCard({ card, isVisible }: FlashCardProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {card.hanzi}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Error Boundaries and Error Handling

### 1. Component-Level Error Boundaries
```typescript
class FlashSessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Flash session error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <FlashSessionErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    
    return this.props.children;
  }
}
```

### 2. Graceful Degradation
```typescript
function CharacterImage({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  if (!imageUrl) {
    return <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">No image</span>
    </div>;
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className="w-32 h-32 object-cover rounded-lg"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
```

## Testing Strategy

### 1. Component Testing
- **Unit tests**: Individual component functionality
- **Integration tests**: Component interactions
- **Visual regression tests**: UI consistency

### 2. Accessibility Testing
- **Keyboard navigation**: All interactive elements
- **Screen reader compatibility**: ARIA labels and semantic HTML
- **Motion preferences**: Respect `prefers-reduced-motion`

## Component Directory Structure

```
src/
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── AlertDialog.tsx
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── learning/               # Learning-specific components
│   │   ├── FlashSession.tsx
│   │   ├── FlashSessionDemo.tsx
│   │   ├── Quiz.tsx
│   │   └── CharacterInsights.tsx
│   ├── data/                   # Data management components
│   │   ├── DeckList.tsx
│   │   ├── DeckImport.tsx
│   │   └── Analytics.tsx
│   └── layout/                 # Layout and navigation
│       ├── Navigation.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── hooks/                      # Custom hooks
│   ├── useAlert.tsx
│   ├── useFlashSession.tsx
│   └── useLocalStorage.tsx
└── lib/                        # Utilities and helpers
    ├── components/             # Component utilities
    └── utils/                  # General utilities
```

## Future Component Enhancements

### 1. Component Library
- **Design system**: Standardized components across the app
- **Storybook integration**: Component documentation and testing
- **Theme system**: Dynamic theme switching

### 2. Advanced Features
- **Virtualization**: For large lists (thousands of cards)
- **Offline support**: Service worker integration
- **Progressive enhancement**: Works without JavaScript

### 3. Performance Monitoring
- **Component metrics**: Render time tracking
- **Bundle analysis**: Component size optimization
- **User experience metrics**: Core Web Vitals tracking

This component architecture provides a scalable, maintainable foundation for Danbing's learning platform while ensuring excellent user experience and development productivity.