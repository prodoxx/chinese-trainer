/**
 * Image validation using OpenAI Vision API to detect AI generation errors
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ImageValidationResult {
  isValid: boolean;
  issues: string[];
  confidence: number;
  details?: {
    hasExtraLimbs?: boolean;
    hasDistortedFaces?: boolean;
    hasUnrealisticHands?: boolean;
    hasFloatingObjects?: boolean;
    hasDuplicateObjects?: boolean;
    hasLogicalInconsistencies?: boolean;
    crowdedScene?: boolean;
    personCount?: number;
    hasObjectInteractionIssues?: boolean;
    otherIssues?: string[];
  };
}

/**
 * Validate an image for AI generation artifacts and inconsistencies
 */
export async function validateAIGeneratedImage(imageUrl: string): Promise<ImageValidationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at detecting AI image generation errors and inconsistencies. 
Your job is to analyze images for common AI generation artifacts like:
- Extra or missing limbs (arms, legs, fingers)
- Distorted or malformed body parts (especially hands and faces)
- Anatomically impossible poses or connections
- Floating or disconnected objects
- Unrealistic perspectives or physics
- Duplicate objects that shouldn't exist (e.g., two balls in a single basketball game)
- Logical inconsistencies (e.g., wrong number of objects for the activity)
- Overcrowded scenes (more than 3 people increases error likelihood)
- Object interaction issues (objects that change shape or deform when people touch them)

Be strict but fair. Only flag clear errors, not artistic choices. Pay special attention to:
1. Person count - flag if more than 3 people are visible
2. Object integrity - check if balls, equipment, or objects maintain proper shape when being held or touched
3. Hand-object interactions - ensure objects don't warp or distort near hands`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image for AI generation errors. Look specifically for:
1. Extra or missing body parts (count all visible limbs carefully)
2. Distorted anatomy (especially hands, feet, faces)
3. Impossible connections or poses
4. Objects that don't make physical sense
5. Duplicate objects (e.g., multiple balls in sports that use one ball)
6. Logical inconsistencies with the scene
7. Scene complexity - count the number of people (flag if more than 3)
8. Object interaction issues - check if objects (balls, equipment) maintain proper shape when people touch or hold them

Return a JSON response with:
{
  "isValid": boolean (true if no major issues AND 3 or fewer people),
  "confidence": number (0-1, how confident you are),
  "issues": string[] (list of specific issues found),
  "details": {
    "hasExtraLimbs": boolean,
    "hasDistortedFaces": boolean,
    "hasUnrealisticHands": boolean,
    "hasFloatingObjects": boolean,
    "hasDuplicateObjects": boolean,
    "hasLogicalInconsistencies": boolean,
    "crowdedScene": boolean (true if 4+ people),
    "personCount": number (count all visible people),
    "hasObjectInteractionIssues": boolean (objects deform/change shape when touched),
    "otherIssues": string[] (any other specific problems)
  }
}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure all expected fields exist
    return {
      isValid: result.isValid ?? true,
      issues: result.issues || [],
      confidence: result.confidence ?? 0.5,
      details: result.details || {}
    };
  } catch (error) {
    console.error('Image validation error:', error);
    // If validation fails, assume image is okay to avoid blocking
    return {
      isValid: true,
      issues: [],
      confidence: 0,
      details: {}
    };
  }
}

/**
 * Generate a refined prompt based on validation issues
 */
export function getRefinedPromptForIssues(originalPrompt: string, issues: string[], validationDetails?: any): string {
  let refinedPrompt = originalPrompt;
  
  // Add specific constraints based on detected issues
  const constraints: string[] = [];
  
  if (issues.some(issue => issue.toLowerCase().includes('extra') || issue.toLowerCase().includes('limb'))) {
    constraints.push('Ensure all people have exactly 2 arms and 2 legs, no more, no less');
  }
  
  if (issues.some(issue => issue.toLowerCase().includes('hand') || issue.toLowerCase().includes('finger'))) {
    constraints.push('Show hands clearly with proper anatomy - 5 fingers per hand');
  }
  
  if (issues.some(issue => issue.toLowerCase().includes('face'))) {
    constraints.push('Ensure faces are clear and properly proportioned');
  }
  
  if (issues.some(issue => issue.toLowerCase().includes('float') || issue.toLowerCase().includes('disconnect'))) {
    constraints.push('All objects must be properly connected and grounded, following laws of physics');
  }
  
  if (issues.some(issue => issue.toLowerCase().includes('duplicate') || issue.toLowerCase().includes('multiple ball'))) {
    constraints.push('Show only ONE ball/object for the activity - no duplicates');
  }
  
  if (issues.some(issue => issue.toLowerCase().includes('crowd') || issue.toLowerCase().includes('many people') || issue.toLowerCase().includes('more than 3'))) {
    constraints.push('Show MAXIMUM 3 people only - no more than 3 people visible');
  }
  
  if (validationDetails?.crowdedScene || validationDetails?.personCount > 3) {
    constraints.push('Show MAXIMUM 3 people only to reduce complexity and errors');
  }
  
  if (issues.some(issue => issue.toLowerCase().includes('object') && (issue.toLowerCase().includes('deform') || issue.toLowerCase().includes('shape') || issue.toLowerCase().includes('warp')))) {
    constraints.push('Ensure all objects (balls, equipment) maintain proper shape and integrity when being held or touched');
  }
  
  if (validationDetails?.hasObjectInteractionIssues) {
    constraints.push('Objects must keep their natural shape - balls should remain round, equipment should not deform when touched');
  }
  
  if (constraints.length > 0) {
    refinedPrompt = `${originalPrompt} CRITICAL: ${constraints.join('. ')}.`;
  }
  
  return refinedPrompt;
}

/**
 * Generate a simpler prompt for complex scenes
 */
export function getSimplifiedPrompt(originalPrompt: string, meaning: string): string {
  // Extract the core concept
  const coreConcept = meaning.toLowerCase();
  
  // Simplify group activities to smaller scenes - maximum 2 people for sports
  if (coreConcept.includes('play') || coreConcept.includes('sport') || coreConcept.includes('game')) {
    return `Two people engaged in "${meaning}". Focus on clear, simple composition with EXACTLY 2 people, proper anatomy, and single equipment/ball that maintains its shape. Professional photography, natural lighting, no text.`;
  }
  
  if (coreConcept.includes('group') || coreConcept.includes('team') || coreConcept.includes('crowd')) {
    return `Small group of exactly 3 people representing "${meaning}". Clear composition, proper anatomy for all visible people, objects maintain proper shape. Professional photography, natural lighting, no text.`;
  }
  
  // For other concepts, prefer single person or object
  return `Clear, simple visual representation of "${meaning}". Prefer single person or object when possible. If objects are shown being held, they must maintain proper shape. Professional photography, natural lighting, no text anywhere.`;
}