# Image Prompt Generation Improvements

## Overview
We've implemented a sophisticated image prompt generation system that creates better, more culturally appropriate images for Chinese language learning, especially for people-related terms.

## Key Problems Solved

### 1. People Recognition
- **Problem**: Characters like 奶奶 (grandmother) were generating images of cookies instead of people
- **Solution**: Automatic detection of person-related terms with appropriate full-body prompts

### 2. AI Anomalies
- **Problem**: Close-ups of hands/feet often showed AI-generated anomalies (wrong number of fingers, distorted features)
- **Solution**: Always use full body or three-quarter views for people to avoid these problematic areas

### 3. Cultural Sensitivity
- **Problem**: Generic prompts didn't respect cultural context
- **Solution**: 
  - Family terms (奶奶, 爺爺) specifically mention "Asian elderly" with appropriate settings
  - Respectful, dignified representations

### 4. Diversity Issues
- **Problem**: "別人" (other people) might show only one ethnicity
- **Solution**: Explicitly prompt for "diverse group of different people of various ages and ethnicities"

## Implementation Details

### New Files Created
1. **`src/lib/enrichment/image-prompt-generator.ts`**
   - Core logic for semantic analysis
   - Special case handling for specific characters
   - Educational prompt generation
   - Skip logic for grammatical particles

### Files Updated
1. **`src/lib/enrichment/shared-media.ts`**
   - Integrated new prompt generator
   - Falls back to AI if educational prompt fails
   - Skips image generation for abstract terms

2. **`src/lib/enrichment/openai-interpret.ts`**
   - Added PEOPLE category to prompt instructions
   - Included examples for person-related terms
   - Updated system prompt for better people detection

3. **`src/app/api/admin/cards/generate-image/route.ts`**
   - Uses educational prompt generator
   - Can generate prompts without custom input
   - Returns skip signal for abstract terms

4. **`src/app/admin/cards/page.tsx`**
   - Uses educational prompts as defaults in edit modal
   - Better initial prompts for image editing

## Semantic Categories

The system now recognizes these categories:
- **PERSON**: Full body views, cultural context
- **OBJECT**: Close-up of object only
- **ACTION**: Person performing action
- **EMOTION**: Facial expressions and body language
- **PLACE**: Environment or location
- **NATURE**: Natural scenes
- **FOOD**: Appetizing presentations
- **ABSTRACT**: Symbolic representations

## Special Cases

Specific prompts for common characters:
- **奶奶**: Warm Asian grandmother in home setting
- **爺爺**: Kind Asian grandfather, traditional setting
- **老人**: Dignified elderly person in peaceful setting
- **別人**: Diverse group showing inclusivity
- **朋友**: Friends of different backgrounds together

## Visual Representations for Grammar

Rather than skipping abstract terms, we now create meaningful visual metaphors:

### Question Particles
- **嗎**: Large question mark floating above confused person
- **呢**: Thoughtful person with question bubbles
- **吧**: Person making suggestion gesture

### Modal Verbs  
- **可以**: Green thumbs up (permission)
- **能**: Person flexing muscles (capability)
- **會**: Lightbulb above head (knowledge)
- **應該**: Scale of justice (obligation)
- **必須**: Red exclamation mark (necessity)

### Pronouns
- **我**: Person pointing to self
- **你**: Person pointing to viewer
- **他/她**: Person pointing to distant figure
- **我們**: Group with arms around each other

### Aspect Markers
- **了**: Checkmark with past time clock
- **過**: Footprints leading away
- **著**: Action with motion blur

### Relationships
- **的**: Arrow linking objects (possession)
- **把**: Hands grasping object
- **被**: Arrows pointing to object (passive)
- **給**: Hands offering something

### Conjunctions
- **和**: Objects connected by plus sign
- **或**: Fork in the road
- **但是**: Road with barrier
- **因為**: Cause-effect diagram
- **所以**: Conclusion arrows

### Negation
- **不**: Red X or prohibition sign
- **沒**: Empty container

### Comparison
- **比**: Balance scale
- **更**: Upward arrow
- **最**: Gold medal or trophy

## Quality Modifiers

All prompts include:
- "high quality, educational illustration"
- "family-friendly, respectful"
- "culturally appropriate, no stereotypes"
- "clear and simple, appropriate for language learning"

## Testing

Run test scripts:
```bash
# Test the improved prompts
bun run scripts/test-improved-prompts.js
```

## Benefits

1. **Better Learning**: Images accurately represent meanings
2. **Cultural Respect**: Appropriate representations for Asian context
3. **Reduced Anomalies**: Avoids problematic AI generation areas
4. **Inclusivity**: Promotes diversity where appropriate
5. **Educational Focus**: Optimized for language learning
6. **Automatic Filtering**: Skips abstract terms that shouldn't have images

## Future Improvements

Consider:
- Age-appropriate variations for different learner groups
- Regional variations (Taiwan vs mainland China contexts)
- Seasonal or contextual variations
- Integration with user feedback for prompt refinement