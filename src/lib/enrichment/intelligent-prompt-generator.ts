/**
 * Intelligent image prompt generation using semantic analysis
 * Creates contextually appropriate prompts without extensive hardcoding
 */

interface SemanticCategory {
  type: 'person' | 'object' | 'action' | 'emotion' | 'place' | 'abstract' | 'grammatical' | 'nature' | 'food';
  subtype?: string;
  visualStrategy: 'literal' | 'metaphorical' | 'symbolic' | 'contextual';
}

/**
 * Analyze the semantic nature of a character/word
 */
function analyzeSemantics(hanzi: string, meaning: string, pinyin: string): SemanticCategory {
  const meaningLower = meaning.toLowerCase();
  
  // Grammatical particles and function words
  if (meaningLower.includes('particle') || 
      meaningLower.includes('measure word') ||
      meaningLower.includes('classifier') ||
      meaningLower.includes('auxiliary')) {
    return {
      type: 'grammatical',
      subtype: detectGrammaticalSubtype(meaning),
      visualStrategy: 'symbolic'
    };
  }
  
  // People and relationships
  if (meaningLower.match(/\b(person|people|man|woman|child|family|mother|father|friend|teacher|student)\b/)) {
    return {
      type: 'person',
      subtype: detectPersonSubtype(meaning),
      visualStrategy: 'literal'
    };
  }
  
  // Actions and verbs
  if (meaningLower.match(/\b(do|make|go|come|eat|drink|walk|run|sit|stand|work|play)\b/) ||
      meaning.includes('to ')) {
    return {
      type: 'action',
      visualStrategy: 'contextual'
    };
  }
  
  // Emotions and states
  if (meaningLower.match(/\b(happy|sad|angry|afraid|tired|excited|nervous|proud|feeling|emotion)\b/)) {
    return {
      type: 'emotion',
      visualStrategy: 'literal'
    };
  }
  
  // Abstract concepts that need metaphorical representation
  if (meaningLower.includes('can') || 
      meaningLower.includes('able') ||
      meaningLower.includes('should') ||
      meaningLower.includes('must') ||
      meaningLower.includes('want') ||
      meaningLower.includes('need')) {
    return {
      type: 'abstract',
      subtype: 'modal',
      visualStrategy: 'metaphorical'
    };
  }
  
  // Pronouns
  if (meaningLower.match(/\b(i|me|you|he|she|it|we|they|us|them)\b/) ||
      meaningLower.includes('pronoun')) {
    return {
      type: 'abstract',
      subtype: 'pronoun',
      visualStrategy: 'symbolic'
    };
  }
  
  // Conjunctions and relationships
  if (meaningLower.match(/\b(and|or|but|because|therefore|if|when|then)\b/)) {
    return {
      type: 'abstract',
      subtype: 'conjunction',
      visualStrategy: 'symbolic'
    };
  }
  
  // Negation
  if (meaningLower.match(/\b(not|no|none|never|nothing)\b/)) {
    return {
      type: 'abstract',
      subtype: 'negation',
      visualStrategy: 'symbolic'
    };
  }
  
  // Default to object
  return {
    type: 'object',
    visualStrategy: 'literal'
  };
}

/**
 * Detect grammatical subtype for better prompt generation
 */
function detectGrammaticalSubtype(meaning: string): string {
  const meaningLower = meaning.toLowerCase();
  if (meaningLower.includes('question')) return 'question';
  if (meaningLower.includes('past') || meaningLower.includes('completed')) return 'aspect';
  if (meaningLower.includes('continuous') || meaningLower.includes('ongoing')) return 'aspect';
  if (meaningLower.includes('possess') || meaningLower.includes('of')) return 'possession';
  if (meaningLower.includes('passive')) return 'passive';
  return 'general';
}

/**
 * Detect person subtype for culturally appropriate representation
 */
function detectPersonSubtype(meaning: string): string {
  const meaningLower = meaning.toLowerCase();
  if (meaningLower.includes('grand') || meaningLower.includes('elder')) return 'elderly';
  if (meaningLower.includes('child') || meaningLower.includes('baby')) return 'child';
  if (meaningLower.includes('other')) return 'diverse';
  return 'general';
}

/**
 * Generate a metaphorical representation for abstract concepts
 */
function generateMetaphor(meaning: string, subtype?: string): string {
  const meaningLower = meaning.toLowerCase();
  
  // Modal concepts
  if (meaningLower.includes('can') || meaningLower.includes('may')) {
    return 'a green light or thumbs up symbol showing permission or possibility';
  }
  if (meaningLower.includes('must') || meaningLower.includes('have to')) {
    return 'an urgent red exclamation mark or warning sign showing necessity';
  }
  if (meaningLower.includes('should') || meaningLower.includes('ought')) {
    return 'a balance scale or compass showing moral direction or proper choice';
  }
  if (meaningLower.includes('want') || meaningLower.includes('desire')) {
    return 'hands reaching toward a glowing object showing desire or need';
  }
  
  // Default metaphor based on subtype
  switch (subtype) {
    case 'question':
      return 'a colorful question mark symbol with curious or wondering expression';
    case 'negation':
      return 'a red X or prohibition sign showing negation or absence';
    case 'conjunction':
      return 'connecting bridges or links showing relationship between elements';
    case 'comparison':
      return 'a balance scale or measuring tools showing comparison';
    default:
      return 'abstract symbols or diagrams representing the concept';
  }
}

/**
 * Generate symbolic representation for grammatical elements
 */
function generateSymbolicPrompt(meaning: string, subtype: string): string {
  switch (subtype) {
    case 'question':
      return 'A large, three-dimensional question mark symbol floating in space with soft lighting, representing inquiry or questioning';
    case 'aspect':
      if (meaning.includes('completed') || meaning.includes('past')) {
        return 'A checkmark with a clock showing past time, representing completed action';
      }
      if (meaning.includes('continuous')) {
        return 'Motion blur effects or flowing lines showing ongoing action or continuity';
      }
      return 'Time-related symbols showing the temporal aspect';
    case 'possession':
      return 'An arrow or chain linking two objects together, showing ownership or relationship';
    case 'passive':
      return 'Multiple arrows pointing toward a central object, showing passive reception of action';
    case 'pronoun':
      if (meaning.includes('i') || meaning.includes('me')) {
        return 'A person with hand on chest in self-referential gesture';
      }
      if (meaning.includes('you')) {
        return 'A person pointing outward toward the viewer';
      }
      if (meaning.includes('we') || meaning.includes('us')) {
        return 'A group of people standing together in unity';
      }
      return 'Gesture-based representation of the pronoun concept';
    default:
      return 'Visual symbols or icons representing the grammatical function';
  }
}

/**
 * Main function to generate intelligent prompts
 */
export function generateIntelligentPrompt(
  hanzi: string,
  meaning: string,
  pinyin: string
): string {
  const semantics = analyzeSemantics(hanzi, meaning, pinyin);
  let basePrompt = '';
  
  switch (semantics.visualStrategy) {
    case 'literal':
      // Direct representation
      if (semantics.type === 'person') {
        if (semantics.subtype === 'elderly') {
          basePrompt = `A respectful portrait of an elderly Asian person with wisdom and warmth, in comfortable setting, full body or three-quarter view`;
        } else if (semantics.subtype === 'diverse') {
          basePrompt = `A diverse group of people from different backgrounds and ethnicities, showing inclusivity and community`;
        } else {
          basePrompt = `A person or people representing "${meaning}", shown in appropriate context with full body view`;
        }
      } else if (semantics.type === 'emotion') {
        basePrompt = `A person clearly expressing the emotion of "${meaning}" through facial expression and body language`;
      } else if (semantics.type === 'object') {
        basePrompt = `A clear, detailed view of ${meaning}, shown in typical usage context`;
      } else {
        basePrompt = `A literal representation of "${meaning}" in clear, educational style`;
      }
      break;
      
    case 'metaphorical':
      // Use metaphors for abstract concepts
      basePrompt = `Visual metaphor: ${generateMetaphor(meaning, semantics.subtype)}`;
      break;
      
    case 'symbolic':
      // Use symbols for grammatical elements
      basePrompt = generateSymbolicPrompt(meaning, semantics.subtype || 'general');
      break;
      
    case 'contextual':
      // Show in context (for actions)
      basePrompt = `A person performing the action of "${meaning}" in a natural setting, showing clear motion and context`;
      break;
      
    default:
      basePrompt = `An educational illustration representing the concept of "${meaning}"`;
  }
  
  // Professional photography style for different types
  if (semantics.type === 'object' && (meaning.toLowerCase().includes('food') || meaning.toLowerCase().includes('bun') || meaning.toLowerCase().includes('dumpling'))) {
    // Food photography style
    return `A professionally photographed, high-resolution image of ${basePrompt.replace('A clear, detailed view of ', '').replace('An illustration of ', '')} presented in an authentic and appetizing setting. Captured with expert lighting and shallow depth of field to highlight texture and freshness. Styled naturally on a clean table setting, evoking a warm, culturally respectful, and family-friendly atmosphere. No added text, numbers, or written characters. No stereotypes. Composition is simple, elegant, and true to real-life food photography.`;
  } else if (semantics.type === 'person') {
    // Portrait photography style
    return `A professionally photographed, high-resolution portrait of ${basePrompt.replace('A clear, detailed view of ', '').replace('An illustration of ', '')}. Captured with expert lighting and natural expressions. Styled authentically in appropriate cultural context, evoking warmth and respect. Full body or three-quarter view. No added text, numbers, or written characters. No stereotypes. Composition is simple, elegant, and true to real-life portrait photography.`;
  } else if (semantics.type === 'place') {
    // Architectural/landscape photography
    return `A professionally photographed, high-resolution image of ${basePrompt.replace('A clear, detailed view of ', '').replace('An illustration of ', '')}. Captured with natural lighting and clear atmospheric perspective. Architectural or landscape photography style showcasing the space authentically. No added text, numbers, or written characters. No stereotypes. Composition is simple, elegant, and true to real-life architectural photography.`;
  } else if (semantics.type === 'action') {
    // Action photography
    return `A professionally photographed, high-resolution image capturing ${basePrompt.replace('A clear, detailed view of ', '').replace('An illustration of ', '')}. Shot with expert timing to show the action clearly. Natural motion and dynamic composition. Culturally appropriate and family-friendly. No added text, numbers, or written characters. No stereotypes. True to real-life action photography.`;
  } else if (semantics.type === 'emotion') {
    // Emotional/expressive photography
    return `A professionally photographed, high-resolution image expressing ${basePrompt.replace('A clear, detailed view of ', '').replace('An illustration of ', '')}. Captured with sensitivity to emotional nuance. Natural, authentic expressions in appropriate context. No added text, numbers, or written characters. No stereotypes. Composition conveys the emotion clearly and respectfully.`;
  } else if (semantics.type === 'grammatical' || semantics.type === 'abstract') {
    // For abstract concepts, use clean symbolic representation
    return `A clean, minimalist symbolic representation of ${meaning}. Educational illustration with clear visual metaphor. Simple geometric or iconic design. No text, letters, numbers, or written characters. Professional graphic design quality. Culturally neutral and universally understandable.`;
  } else {
    // Default professional photography style
    return `A professionally photographed, high-resolution image of ${basePrompt.replace('A clear, detailed view of ', '').replace('An illustration of ', '')}. Captured with expert lighting and composition. Styled naturally in authentic context, evoking warmth and cultural respect. No added text, numbers, or written characters. No stereotypes. Simple, elegant composition true to professional photography standards.`;
  }
}

/**
 * Enhance existing prompts with intelligence
 */
export function enhancePrompt(existingPrompt: string, hanzi: string, meaning: string): string {
  // If the prompt seems generic or problematic
  if (existingPrompt.includes('illustration of') || 
      existingPrompt.length < 30 ||
      !existingPrompt.includes('specific')) {
    // Generate a better one
    return generateIntelligentPrompt(hanzi, meaning, '');
  }
  
  // Otherwise, just add safety modifiers if missing
  if (!existingPrompt.includes('appropriate')) {
    return `${existingPrompt}, culturally appropriate, educational, family-friendly`;
  }
  
  return existingPrompt;
}

/**
 * Analyze if a prompt might generate problematic images
 */
export function analyzePromptQuality(prompt: string): {
  quality: 'good' | 'needs_improvement' | 'problematic';
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for potential issues
  if (prompt.includes('close-up') && prompt.includes('hand')) {
    issues.push('Close-up of hands may show AI anomalies');
    suggestions.push('Use full body or three-quarter view instead');
  }
  
  if (!prompt.includes('Asian') && prompt.match(/grandmother|grandfather|elderly/)) {
    issues.push('Family terms should specify cultural context');
    suggestions.push('Add "Asian" for culturally appropriate representation');
  }
  
  if (prompt.includes('other people') && !prompt.includes('diverse')) {
    issues.push('May not show diversity');
    suggestions.push('Specify "diverse group of different ethnicities"');
  }
  
  if (prompt.length < 50) {
    issues.push('Prompt too short, may be ambiguous');
    suggestions.push('Add more specific details about the scene');
  }
  
  if (!prompt.includes('no text') && !prompt.includes('no letters')) {
    issues.push('May generate unwanted text');
    suggestions.push('Add "no text, letters, or numbers"');
  }
  
  // Determine overall quality
  let quality: 'good' | 'needs_improvement' | 'problematic';
  if (issues.length === 0) {
    quality = 'good';
  } else if (issues.length <= 2) {
    quality = 'needs_improvement';
  } else {
    quality = 'problematic';
  }
  
  return { quality, issues, suggestions };
}