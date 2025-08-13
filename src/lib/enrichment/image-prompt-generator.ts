/**
 * Sophisticated image prompt generation for Chinese characters
 * Generates appropriate prompts based on semantic category and meaning
 */

import { generateIntelligentPrompt } from './intelligent-prompt-generator';

interface CharacterAnalysis {
  category: 'person' | 'object' | 'action' | 'emotion' | 'place' | 'abstract' | 'nature' | 'food';
  shouldShowPerson: boolean;
  avoidCloseups: boolean;
  culturalContext?: string;
}

/**
 * Analyze the character to determine its semantic category
 */
function analyzeCharacter(hanzi: string, meaning: string): CharacterAnalysis {
  const meaningLower = meaning.toLowerCase();
  
  // Person-related terms
  const personTerms = [
    'person', 'people', 'man', 'woman', 'child', 'baby', 'elder', 'old',
    'mother', 'father', 'parent', 'grandma', 'grandmother', 'grandpa', 'grandfather',
    'sister', 'brother', 'aunt', 'uncle', 'friend', 'teacher', 'student',
    'doctor', 'nurse', 'worker', 'boss', 'employee', 'colleague',
    'neighbor', 'stranger', 'guest', 'host', 'customer', 'other people'
  ];
  
  // Action verbs
  const actionTerms = [
    'eat', 'drink', 'walk', 'run', 'sit', 'stand', 'sleep', 'wake',
    'read', 'write', 'speak', 'listen', 'watch', 'look', 'see',
    'work', 'play', 'study', 'teach', 'learn', 'help', 'give', 'take'
  ];
  
  // Emotion/state terms
  const emotionTerms = [
    'happy', 'sad', 'angry', 'afraid', 'scared', 'tired', 'bored',
    'excited', 'nervous', 'worried', 'confused', 'surprised', 'proud'
  ];
  
  // Object terms
  const objectTerms = [
    'book', 'pen', 'paper', 'desk', 'chair', 'table', 'door', 'window',
    'car', 'bus', 'bike', 'train', 'plane', 'phone', 'computer',
    'cup', 'bowl', 'plate', 'spoon', 'fork', 'knife'
  ];
  
  // Check for person-related terms
  if (personTerms.some(term => meaningLower.includes(term))) {
    // Special handling for family terms
    if (meaningLower.includes('grand')) {
      return {
        category: 'person',
        shouldShowPerson: true,
        avoidCloseups: true,
        culturalContext: 'Asian elderly'
      };
    }
    return {
      category: 'person',
      shouldShowPerson: true,
      avoidCloseups: true
    };
  }
  
  // Check for actions
  if (actionTerms.some(term => meaningLower.includes(term))) {
    return {
      category: 'action',
      shouldShowPerson: true,
      avoidCloseups: true
    };
  }
  
  // Check for emotions
  if (emotionTerms.some(term => meaningLower.includes(term))) {
    return {
      category: 'emotion',
      shouldShowPerson: true,
      avoidCloseups: false
    };
  }
  
  // Check for objects
  if (objectTerms.some(term => meaningLower.includes(term))) {
    return {
      category: 'object',
      shouldShowPerson: false,
      avoidCloseups: false
    };
  }
  
  // Check for food
  if (meaningLower.includes('food') || meaningLower.includes('eat') || 
      meaningLower.includes('meal') || meaningLower.includes('dish')) {
    return {
      category: 'food',
      shouldShowPerson: false,
      avoidCloseups: false
    };
  }
  
  // Check for places
  if (meaningLower.includes('place') || meaningLower.includes('room') || 
      meaningLower.includes('building') || meaningLower.includes('city')) {
    return {
      category: 'place',
      shouldShowPerson: false,
      avoidCloseups: false
    };
  }
  
  // Default to abstract
  return {
    category: 'abstract',
    shouldShowPerson: false,
    avoidCloseups: false
  };
}

/**
 * Generate an appropriate image prompt based on character analysis
 */
export function generateImagePrompt(hanzi: string, meaning: string, pinyin: string): string {
  // Use intelligent generation instead of hardcoded cases
  return generateIntelligentPrompt(hanzi, meaning, pinyin);
}

/**
 * Legacy function kept for backward compatibility
 * @deprecated Use generateImagePrompt instead
 */
function generateImagePromptLegacy(hanzi: string, meaning: string, pinyin: string): string {
  const analysis = analyzeCharacter(hanzi, meaning);
  
  // Special cases for specific characters including grammar and abstract terms
  const specialCases: Record<string, string> = {
    // People
    '奶奶': 'A warm, friendly Asian elderly grandmother smiling, wearing comfortable clothes, sitting in a cozy living room with traditional decorations, full body view',
    '爺爺': 'A kind Asian elderly grandfather with gentle expression, wearing traditional or casual clothes, sitting or standing in a home setting, full body view',
    '老人': 'A wise elderly Asian person with peaceful expression, sitting on a park bench or in a garden, full body view showing dignity and respect',
    '別人': 'A diverse group of different people of various ages and ethnicities standing together in a public space, showing community and diversity',
    '朋友': 'Two or three friends of different backgrounds laughing together in a casual setting, showing genuine friendship and happiness',
    '媽媽': 'A caring Asian mother with warm smile, interacting with family in a home setting, full body view',
    '爸爸': 'A supportive Asian father figure in casual clothes, in a family environment, full body view',
    '孩子': 'Happy children playing together in a safe environment, showing joy and innocence',
    '老師': 'A professional teacher at a classroom whiteboard, explaining something with enthusiasm, full body view',
    '學生': 'Students studying together at desks or in a library, focused and engaged in learning',
    
    // Question particles
    '嗎': 'A large, colorful question mark symbol floating above a person with a confused or questioning expression, clear visual metaphor for questions',
    '呢': 'A person with raised eyebrows and thoughtful expression, hand on chin, with thought bubbles showing question marks',
    '吧': 'A person making a suggestion gesture with open palms, friendly expression suggesting or proposing something',
    
    // Aspect markers
    '了': 'A checkmark or completion symbol with a clock showing past time, visual metaphor for completed action',
    '過': 'Footprints leading away from a location, showing the concept of experience or having been somewhere',
    '著': 'An ongoing action frozen in time, like a person mid-stride with motion blur effects showing continuation',
    
    // Modal verbs
    '可以': 'A green thumbs up symbol with a checkmark, representing permission or possibility',
    '能': 'A person flexing muscles showing capability, or hands demonstrating ability to do something',
    '會': 'A lightbulb above someone\'s head showing knowledge or skill, representing ability',
    '要': 'Reaching hands toward an object showing desire or need, visual metaphor for wanting',
    '想': 'A person with thought bubble containing dreams or desires, representing thinking or wanting',
    '應該': 'A scale of justice or moral compass, representing obligation or what should be done',
    '必須': 'A red exclamation mark with urgent gesture, showing necessity or must-do',
    
    // Pronouns
    '我': 'A person pointing to themselves with confident expression, representing "I" or "me"',
    '你': 'A person pointing forward toward viewer, representing "you"',
    '他': 'A person pointing to a male figure in the distance, representing "he"',
    '她': 'A person pointing to a female figure in the distance, representing "she"',
    '我們': 'A group of people with arms around each other, representing "we" or "us"',
    '你們': 'A person gesturing toward a group, representing "you" plural',
    '他們': 'A person pointing to a distant group, representing "they"',
    
    // Possession and relationships
    '的': 'An arrow or link connecting two objects showing possession or relationship',
    '把': 'Hands grasping and moving an object, showing the disposal or handling action',
    '被': 'An object with arrows pointing to it from multiple directions, showing passive voice',
    '給': 'Hands offering or giving something to another person, showing the act of giving',
    
    // Conjunctions
    '和': 'Two objects or symbols connected by a plus sign or link, showing "and"',
    '或': 'A fork in the road or branching path, showing choice or "or"',
    '但是': 'A road with a barrier or turn sign, showing contrast or "but"',
    '因為': 'A cause-and-effect diagram with arrows, showing "because"',
    '所以': 'A conclusion or result symbol with arrows pointing to outcome, showing "therefore"',
    
    // Negation
    '不': 'A red X or prohibition sign, universal symbol for "not" or negation',
    '沒': 'An empty container or crossed-out object, showing absence or "not have"',
    
    // Comparison
    '比': 'Two objects on a balance scale showing comparison',
    '更': 'An upward arrow or progression showing "more"',
    '最': 'A gold medal or #1 trophy showing superlative "most"',
    
    // Location markers
    '在': 'A location pin or marker on a map, showing position',
    '到': 'An arrow reaching a destination or target, showing arrival',
    '從': 'An arrow starting from a point of origin, showing "from"'
  };
  
  // Check for special cases first
  if (specialCases[hanzi]) {
    return specialCases[hanzi];
  }
  
  // Generate prompt based on category
  let prompt = '';
  
  switch (analysis.category) {
    case 'person':
      if (analysis.culturalContext === 'Asian elderly') {
        prompt = `A respectful portrait of an Asian ${meaning.toLowerCase()}, showing wisdom and warmth, in a comfortable home or garden setting, full body or three-quarter view, avoiding close-ups of hands or feet, natural lighting`;
      } else if (meaning.toLowerCase().includes('other')) {
        prompt = `A diverse group of people from different backgrounds in a public space, showing variety and inclusivity, avoiding stereotypes`;
      } else {
        prompt = `A person representing "${meaning}", full body or three-quarter view, in an appropriate setting, natural pose, avoiding close-ups of hands or feet`;
      }
      break;
      
    case 'action':
      prompt = `A person performing the action of "${meaning}", shown from a medium distance to capture the full action clearly, in an appropriate setting`;
      break;
      
    case 'emotion':
      prompt = `A person expressing the emotion of being ${meaning}, showing clear facial expression and body language, in a relatable situation`;
      break;
      
    case 'object':
      prompt = `A clear, well-lit photograph of ${meaning}, showing the object in its typical context or usage setting`;
      break;
      
    case 'food':
      prompt = `Traditional or common ${meaning} beautifully presented on a table or in a kitchen setting, appetizing and clear`;
      break;
      
    case 'place':
      prompt = `A welcoming view of ${meaning}, showing the space or location clearly with good lighting and perspective`;
      break;
      
    case 'nature':
      prompt = `A beautiful natural scene featuring ${meaning}, with clear details and pleasant composition`;
      break;
      
    default:
      prompt = `A simple, clear illustration representing the concept of ${meaning}`;
  }
  
  // Add universal quality modifiers
  prompt += ', high quality, educational illustration, clear and simple, appropriate for language learning';
  
  // Add safety modifiers
  prompt += ', family-friendly, respectful, culturally appropriate, no stereotypes';
  
  return prompt;
}

/**
 * Determine if an image should be generated for this character
 */
export function shouldGenerateImage(hanzi: string, meaning: string): boolean {
  // We now generate images for ALL characters, including grammar particles
  // They will get special symbolic representations
  return true;
}

/**
 * Get a culturally appropriate and educational image prompt
 */
export function getEducationalImagePrompt(
  hanzi: string, 
  meaning: string, 
  pinyin: string,
  existingPrompt?: string
): string {
  // If there's an existing custom prompt, validate and enhance it
  if (existingPrompt && existingPrompt.trim()) {
    // Add safety modifiers if not present
    if (!existingPrompt.includes('appropriate')) {
      return `${existingPrompt}, culturally appropriate, educational, family-friendly`;
    }
    return existingPrompt;
  }
  
  // Generate new prompt - we now generate for ALL characters
  return generateImagePrompt(hanzi, meaning, pinyin);
}