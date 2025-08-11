# Character Insights UI - All Sections Summary

## Current Display Order:

### ✅ 1. Character Header
- Character image
- Hanzi characters  
- Pinyin
- Meaning

### ✅ 2. Complexity Analysis
- Overall Difficulty (percentage bar)
- Visual Complexity (percentage bar)
- Stroke Count
- Components
- Semantic Category
- Concept Type
- Tone Pattern

### ✅ 3. Review History (if available)
- Times seen
- Accuracy percentage
- Average response time
- Next review due

### ✅ 4. Commonly Confused With (from confusionAnalysis)
- Shows similar characters from confusion analysis
- Visual confusion score
- Character, pinyin, and meaning for each

### ✅ 5. Memory Aids
- Visual Mnemonic
- Story
- Component Analysis

### ✅ 6. Etymology
- Origin
- Evolution (numbered list)
- Cultural Context

### ✅ 7. Common Errors & Confusions (NEW - Added)
- Commonly Confused With (from aiInsights.commonErrors.similarCharacters)
- Wrong Contexts
- Tone Confusions

### ✅ 8. Usage Information (NEW - Added)
- Common Collocations
- Register Level
- Frequency
- Common Domains

### ✅ 9. Learning Tips
- For Beginners
- For Intermediate
- For Advanced

## Data Sources:

1. **From Card Model directly:**
   - Basic info (hanzi, pinyin, meaning, imageUrl)
   - Complexity metrics (strokeCount, visualComplexity, etc.)
   - aiInsights (all the AI-generated content)

2. **From API confusion analysis:**
   - confusionAnalysis array (for "Commonly Confused With" section)

3. **From Review Model (via API):**
   - Review history statistics

## All AI Insights Fields Now Displayed:
- ✅ etymology.origin
- ✅ etymology.evolution 
- ✅ etymology.culturalContext
- ✅ mnemonics.visual
- ✅ mnemonics.story
- ✅ mnemonics.components
- ✅ commonErrors.similarCharacters
- ✅ commonErrors.wrongContexts
- ✅ commonErrors.toneConfusions
- ✅ usage.commonCollocations
- ✅ usage.registerLevel
- ✅ usage.frequency
- ✅ usage.domains
- ✅ learningTips.forBeginners
- ✅ learningTips.forIntermediate
- ✅ learningTips.forAdvanced