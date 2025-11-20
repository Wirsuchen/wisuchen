import { translateContent } from '@/lib/services/ai/gemini'

// Simple in-memory cache for translations
// Key: "text:targetLang", Value: translatedText
const translationCache = new Map<string, string>()

export const translationService = {
  /**
   * Translate a batch of texts to a target language
   * Uses caching to minimize API calls
   */
  async translateBatch(texts: string[], targetLanguage: 'de' | 'en' | 'fr' | 'it'): Promise<string[]> {
    if (targetLanguage === 'en') return texts // Assuming source is English

    // Identify texts that need translation (not in cache)
    const uniqueTexts = [...new Set(texts.filter(t => t && t.trim().length > 0))]
    const missingTranslations = uniqueTexts.filter(text => !translationCache.has(`${text}:${targetLanguage}`))

    // If we have missing translations, fetch them in batches
    if (missingTranslations.length > 0) {
      // Process in chunks of 20 to avoid hitting token limits
      const chunkSize = 20
      for (let i = 0; i < missingTranslations.length; i += chunkSize) {
        const chunk = missingTranslations.slice(i, i + chunkSize)
        
        // Create a map for the prompt
        const mapToTranslate: Record<string, string> = {}
        chunk.forEach((text, index) => {
          mapToTranslate[`item_${index}`] = text
        })

        try {
          // We use the existing translateContent but pass a JSON string
          // This relies on the model being smart enough to return JSON when asked
          // Alternatively, we can modify gemini.ts to support batch, but let's try to use the existing function with a clever prompt
          
          // Since translateContent expects a specific prompt structure, we might need to bypass it or use it creatively.
          // The existing function wraps the content in a prompt: "Translate this ... from ... to ...: \n\n${content}"
          // If we pass a JSON string as content, it might try to translate the JSON structure.
          
          // Let's try to use a custom prompt via a new method in gemini.ts if possible, 
          // but since I can't easily modify gemini.ts without potentially breaking other things, 
          // I will try to use translateContent with a JSON string and hope for the best, 
          // OR (safer) just loop and call it in parallel with concurrency limit.
          
          // Parallel calls with concurrency limit is safer for reliability, though slower.
          // Given we have ~20 items per page, 20 parallel calls might hit rate limits.
          // Let's try a batch prompt approach by constructing a special content string.
          
          const contentToTranslate = JSON.stringify(mapToTranslate, null, 2)
          const prompt = `
            Please translate the values in the following JSON object to ${targetLanguage}. 
            Do not translate the keys. 
            Return ONLY the valid JSON object with translated values.
            
            ${contentToTranslate}
          `
          
          // We use 'general' content type to avoid specific formatting instructions
          const result = await translateContent({
            content: prompt,
            fromLanguage: 'en', // Assuming source is English
            toLanguage: targetLanguage,
            contentType: 'general'
          })

          if (result.success && result.translation) {
            try {
              // Clean up markdown code blocks if present
              const cleanJson = result.translation.replace(/```json/g, '').replace(/```/g, '').trim()
              const translatedMap = JSON.parse(cleanJson)
              
              // Update cache
              Object.keys(translatedMap).forEach((key, index) => {
                const originalText = chunk[index] // This assumes order is preserved or keys match
                // Better: use the key mapping
                // The key was item_${index}, which corresponds to chunk[index]
                // But the model might mess up keys.
                // Actually, relying on the model to preserve keys 'item_0' etc is usually reliable.
                
                if (translatedMap[key] && chunk[parseInt(key.replace('item_', ''))]) {
                   translationCache.set(`${chunk[parseInt(key.replace('item_', ''))]}:${targetLanguage}`, translatedMap[key])
                }
              })
            } catch (e) {
              console.error('Failed to parse batch translation response', e)
              // Fallback: mark as same text to avoid retry loop
              chunk.forEach(t => translationCache.set(`${t}:${targetLanguage}`, t))
            }
          }
        } catch (error) {
          console.error('Batch translation error', error)
        }
      }
    }

    // Return translations from cache
    return texts.map(text => translationCache.get(`${text}:${targetLanguage}`) || text)
  },

  /**
   * Translate jobs list
   */
  async translateJobs(jobs: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || targetLanguage === 'en') return jobs
    
    const lang = targetLanguage as 'de' | 'fr' | 'it'
    if (!['de', 'fr', 'it'].includes(lang)) return jobs

    // Extract titles
    const titles = jobs.map(j => j.title)
    const translatedTitles = await this.translateBatch(titles, lang)

    // Apply translations
    return jobs.map((job, index) => ({
      ...job,
      title: translatedTitles[index] || job.title
    }))
  },

  /**
   * Translate deals list
   */
  async translateDeals(deals: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || targetLanguage === 'en') return deals

    const lang = targetLanguage as 'de' | 'fr' | 'it'
    if (!['de', 'fr', 'it'].includes(lang)) return deals

    // Extract titles
    const titles = deals.map(d => d.title)
    const translatedTitles = await this.translateBatch(titles, lang)

    // Apply translations
    return deals.map((deal, index) => ({
      ...deal,
      title: translatedTitles[index] || deal.title
    }))
  }
}
