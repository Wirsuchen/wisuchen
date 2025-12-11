import { GoogleGenAI } from '@google/genai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// Centralized model selection with env override
export const DEFAULT_TEXT_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash'

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables')
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

/**
 * Generate or improve job descriptions using AI
 */
export async function generateJobDescription(params: {
  jobTitle: string
  company: string
  location?: string
  employmentType?: string
  requirements?: string[]
  benefits?: string[]
  existingDescription?: string
}) {
  const { jobTitle, company, location, employmentType, requirements, benefits, existingDescription } = params

  const prompt = existingDescription
    ? `Improve and expand this job description:\n\nJob Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location || 'Not specified'}\nType: ${employmentType || 'Full-time'}\n\nCurrent Description:\n${existingDescription}\n\nRequirements: ${requirements?.join(', ') || 'Not specified'}\nBenefits: ${benefits?.join(', ') || 'Not specified'}\n\nPlease rewrite this job description to be more compelling, professional, and SEO-friendly. Include clear sections for responsibilities, requirements, and benefits. Keep it between 300-500 words.`
    : `Create a professional job description for:\n\nJob Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location || 'Not specified'}\nType: ${employmentType || 'Full-time'}\nRequirements: ${requirements?.join(', ') || 'Not specified'}\nBenefits: ${benefits?.join(', ') || 'Not specified'}\n\nCreate a compelling, professional, and SEO-friendly job description with clear sections for responsibilities, requirements, and benefits. Keep it between 300-500 words.`

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    })

    return {
      success: true,
      description: response.text || '',
    }
  } catch (error: any) {
    console.error('Error generating job description:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate job description',
    }
  }
}

/**
 * Generate SEO meta descriptions
 */
export async function generateMetaDescription(params: {
  title: string
  content: string
  keywords?: string[]
  maxLength?: number
}) {
  const { title, content, keywords, maxLength = 160 } = params

  const prompt = `Generate an SEO-optimized meta description for this content:\n\nTitle: ${title}\nContent: ${content.substring(0, 500)}...\nKeywords: ${keywords?.join(', ') || 'Not specified'}\n\nCreate a compelling meta description under ${maxLength} characters that encourages clicks and includes relevant keywords naturally.`

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 200,
        temperature: 0.5,
      },
    })

    const description = (response.text || '').replace(/["']/g, '').trim()
    return {
      success: true,
      description: description.substring(0, maxLength),
    }
  } catch (error: any) {
    console.error('Error generating meta description:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate meta description',
    }
  }
}

/**
 * Generate blog article content
 */
export async function generateBlogArticle(params: {
  topic: string
  category: string
  targetAudience: 'job_seekers' | 'employers' | 'general'
  tone?: 'professional' | 'casual' | 'informative'
  keywords?: string[]
  language?: 'de' | 'en' | 'fr' | 'it'
}) {
  const { topic, category, targetAudience, tone = 'professional', keywords, language = 'en' } = params

  const languageInstructions = {
    de: 'Write in German (Deutsch)',
    en: 'Write in English',
    fr: 'Write in French (Français)',
    it: 'Write in Italian (Italiano)',
  }

  const audienceMap = {
    job_seekers: 'job seekers looking for employment opportunities',
    employers: 'employers and recruiters looking to hire talent',
    general: 'general audience interested in job market trends',
  }

  const prompt = `Write a comprehensive blog article about: ${topic}\n\nCategory: ${category}\nTarget Audience: ${audienceMap[targetAudience]}\nTone: ${tone}\nKeywords to include: ${keywords?.join(', ') || 'relevant keywords'}\nLanguage: ${languageInstructions[language]}\n\nCreate an engaging, well-structured article with:\n1. Compelling headline\n2. Introduction (hook the reader)\n3. 3-5 main sections with subheadings (H2)\n4. Practical tips or actionable advice\n5. Conclusion with call-to-action\n\nLength: 800-1200 words\nMake it SEO-friendly, informative, and valuable to the reader.`

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 2000,
        temperature: 0.8,
      },
    })

    return {
      success: true,
      content: response.text || '',
    }
  } catch (error: any) {
    console.error('Error generating blog article:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate blog article',
    }
  }
}

/**
 * Translate content to different languages
 */
export async function translateContent(params: {
  content: string
  fromLanguage: 'de' | 'en' | 'fr' | 'it'
  toLanguage: 'de' | 'en' | 'fr' | 'it'
  contentType?: 'job_description' | 'blog_article' | 'general'
}) {
  const { content, fromLanguage, toLanguage, contentType = 'general' } = params

  if (fromLanguage === toLanguage) {
    return { success: true, translation: content }
  }

  const languageNames = {
    de: 'German',
    en: 'English',
    fr: 'French',
    it: 'Italian',
  }

  const prompt = `You are a professional translator. Translate the following ${contentType.replace('_', ' ')} from ${languageNames[fromLanguage]} to ${languageNames[toLanguage]}.
  
  IMPORTANT INSTRUCTIONS:
  1. Return ONLY the translated text.
  2. Do NOT add any conversational text, introductions, or explanations.
  3. Maintain the original tone, formatting, and professional style.
  4. Ensure all industry-specific terms are accurately translated.
  
  Content to translate:
  ${content}`

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 2000,
        temperature: 0.3, // Lower temperature for more accurate translation
      },
    })

    return {
      success: true,
      translation: response.text || '',
    }
  } catch (error: any) {
    console.error('Error translating content:', error)
    return {
      success: false,
      error: error.message || 'Failed to translate content',
    }
  }
}

// Translation model optimized for free tier (60 RPM)
const TRANSLATION_MODEL = 'gemini-2.5-flash-lite'

// JSON Schema for structured translation output
const translationSchema = {
  type: 'object',
  properties: {
    en: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['title', 'description']
    },
    de: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['title', 'description']
    },
    fr: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['title', 'description']
    },
    it: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['title', 'description']
    }
  },
  required: ['en', 'de', 'fr', 'it']
}

export interface MultiLanguageTranslation {
  en: { title: string; description: string }
  de: { title: string; description: string }
  fr: { title: string; description: string }
  it: { title: string; description: string }
}

/**
 * Translate title and description to all 4 languages in a single API call
 * Uses Gemini structured output for guaranteed JSON format
 * Includes automatic retry with exponential backoff for rate limits
 */
export async function translateToAllLanguages(params: {
  title: string
  description: string
  contentType?: 'job' | 'deal' | 'blog'
  maxRetries?: number
}): Promise<{ success: boolean; translations?: MultiLanguageTranslation; error?: string }> {
  const { title, description, contentType = 'job', maxRetries = 3 } = params

  if (!title && !description) {
    return { success: false, error: 'No content to translate' }
  }

  const contentLabel = contentType === 'job' ? 'job posting' : contentType === 'deal' ? 'product deal' : 'blog article'

  const prompt = `Translate this ${contentLabel} to English, German, French, and Italian.
Keep translations professional and accurate.

Title: ${title || 'N/A'}
Description: ${description || 'N/A'}`

  let lastError: any = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: TRANSLATION_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: translationSchema,
          temperature: 0.2,
          maxOutputTokens: 2000,
        },
      })

      const text = response.text || ''
      const translations = JSON.parse(text) as MultiLanguageTranslation

      return { success: true, translations }
    } catch (error: any) {
      lastError = error
      
      // Check if it's a rate limit error (429)
      const errorMessage = error?.message || ''
      const is429 = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || error?.status === 429
      
      if (is429 && attempt < maxRetries) {
        // Parse retry delay from error message (e.g., "Please retry in 47.777734419s")
        let waitSeconds = 60 // Default wait time
        const retryMatch = errorMessage.match(/retry in (\d+\.?\d*)s/i)
        if (retryMatch) {
          waitSeconds = Math.ceil(parseFloat(retryMatch[1])) + 5 // Add 5 second buffer
        }
        
        console.log(`⏳ Rate limited. Waiting ${waitSeconds}s before retry ${attempt + 1}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000))
        continue
      }
      
      console.error('Gemini translation error:', error)
      break
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Translation failed after retries',
  }
}

/**
 * Generate SEO keywords for content
 */
export async function generateSEOKeywords(params: {
  title: string
  content: string
  industry?: string
  maxKeywords?: number
}) {
  const { title, content, industry, maxKeywords = 10 } = params

  const prompt = `Analyze this content and generate ${maxKeywords} SEO keywords:\n\nTitle: ${title}\n${industry ? `Industry: ${industry}\n` : ''}Content: ${content.substring(0, 500)}...\n\nGenerate a comma-separated list of relevant SEO keywords and phrases that would help this content rank well in search engines. Include both short-tail and long-tail keywords.`

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 300,
        temperature: 0.5,
      },
    })

    const keywordsText = (response.text || '').trim()
    const keywords = keywordsText
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)
      .slice(0, maxKeywords)

    return {
      success: true,
      keywords,
    }
  } catch (error: any) {
    console.error('Error generating SEO keywords:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate SEO keywords',
    }
  }
}

/**
 * Stream content generation for real-time display
 */
// Low-level stream: returns AsyncIterable of chunks from Gemini
export async function streamContentGeneration(prompt: string) {
  try {
    const response = await ai.models.generateContentStream({
      model: DEFAULT_TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    })
    return response
  } catch (error: any) {
    console.error('Error streaming content:', error)
    throw new Error(error.message || 'Failed to stream content')
  }
}

// Helper: wrap an AsyncIterable from Gemini into a ReadableStream emitting SSE frames
export function iterableToSSE(iterable: AsyncIterable<any>) {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of iterable as any) {
          const text = (chunk?.text ?? '') as string
          if (text && text.length) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
