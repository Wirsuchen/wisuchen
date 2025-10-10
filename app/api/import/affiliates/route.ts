// Affiliate Import API - Import offers from affiliate networks
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AwinAPI, transformAwinOffer } from '@/lib/services/affiliate-apis/awin'
import { AdcellAPI, transformAdcellOffer } from '@/lib/services/affiliate-apis/adcell'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['supervisor', 'admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { source, params = {}, limit = 50 } = body

    let importedOffers: any[] = []
    let sourceId: string | null = null

    // Get or create affiliate program record
    const { data: affiliateProgram } = await supabase
      .from('affiliate_programs')
      .select('id')
      .eq('provider', source)
      .single()

    if (affiliateProgram) {
      sourceId = affiliateProgram.id
    } else {
      const { data: newProgram } = await supabase
        .from('affiliate_programs')
        .insert({
          name: `${source.charAt(0).toUpperCase() + source.slice(1)} Network`,
          provider: source,
          is_active: true,
          last_sync_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      sourceId = newProgram?.id || null
    }

    // Create import run record
    const { data: importRun } = await supabase
      .from('import_runs')
      .insert({
        source_id: sourceId,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const importRunId = importRun?.id

    try {
      switch (source) {
        case 'awin':
          const awinAPI = new AwinAPI()
          const awinOffers = await awinAPI.searchOffers({
            ...params,
            limit: Math.min(limit, 50)
          })
          
          importedOffers = awinOffers.map(transformAwinOffer)
          break

        case 'adcell':
          const adcellAPI = new AdcellAPI()
          const adcellOffers = await adcellAPI.searchOffers({
            ...params,
            per_page: Math.min(limit, 50)
          })
          
          importedOffers = adcellOffers.map(transformAdcellOffer)
          break

        default:
          return NextResponse.json({ error: 'Unsupported affiliate source' }, { status: 400 })
      }

      // Process and insert offers
      let createdCount = 0
      let updatedCount = 0
      let failedCount = 0

      for (const offerData of importedOffers) {
        try {
          // Check if offer already exists
          const { data: existingOffer } = await supabase
            .from('offers')
            .select('id')
            .eq('source', offerData.source)
            .eq('external_id', offerData.external_id)
            .single()

          // Find or create company
          let companyId = null
          if (offerData.company_name) {
            const { data: company } = await supabase
              .from('companies')
              .select('id')
              .ilike('name', offerData.company_name)
              .single()

            if (company) {
              companyId = company.id
            } else {
              // Create company
              const { data: newCompany } = await supabase
                .from('companies')
                .insert({
                  name: offerData.company_name,
                  slug: offerData.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  is_active: true
                })
                .select('id')
                .single()
              
              companyId = newCompany?.id
            }
          }

          // Find or create category
          let categoryId = null
          if (offerData.category_name) {
            const { data: category } = await supabase
              .from('categories')
              .select('id')
              .eq('type', 'affiliate')
              .ilike('name', offerData.category_name)
              .single()

            if (category) {
              categoryId = category.id
            } else {
              // Create category
              const { data: newCategory } = await supabase
                .from('categories')
                .insert({
                  name: offerData.category_name,
                  slug: offerData.category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  type: 'affiliate',
                  is_active: true
                })
                .select('id')
                .single()
              
              categoryId = newCategory?.id
            }
          }

          // Prepare offer data for insertion
          const finalOfferData = {
            ...offerData,
            company_id: companyId,
            category_id: categoryId,
            created_by: profile.id,
            slug: `${offerData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
            status: 'active' // Affiliate offers can be auto-approved
          }

          // Remove fields that don't exist in the database
          delete finalOfferData.company_name
          delete finalOfferData.category_name
          delete finalOfferData.metadata

          if (existingOffer) {
            // Update existing offer
            await supabase
              .from('offers')
              .update(finalOfferData)
              .eq('id', existingOffer.id)
            
            updatedCount++
          } else {
            // Create new offer
            await supabase
              .from('offers')
              .insert(finalOfferData)
            
            createdCount++
          }
        } catch (error) {
          console.error('Error processing offer:', error)
          failedCount++
        }
      }

      // Update import run
      await supabase
        .from('import_runs')
        .update({
          status: 'completed',
          total_records: importedOffers.length,
          processed_records: createdCount + updatedCount + failedCount,
          created_records: createdCount,
          updated_records: updatedCount,
          failed_records: failedCount,
          completed_at: new Date().toISOString()
        })
        .eq('id', importRunId)

      // Update affiliate program last sync time
      if (sourceId) {
        await supabase
          .from('affiliate_programs')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', sourceId)
      }

      return NextResponse.json({
        success: true,
        import_run_id: importRunId,
        summary: {
          total_fetched: importedOffers.length,
          created: createdCount,
          updated: updatedCount,
          failed: failedCount
        }
      })

    } catch (importError) {
      // Update import run with error
      if (importRunId) {
        await supabase
          .from('import_runs')
          .update({
            status: 'failed',
            error_log: importError instanceof Error ? importError.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', importRunId)
      }

      throw importError
    }

  } catch (error) {
    console.error('Affiliate import API error:', error)
    return NextResponse.json({ 
      error: 'Failed to import affiliate offers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check import status and list affiliate programs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const importRunId = searchParams.get('import_run_id')
    const action = searchParams.get('action')

    if (action === 'programs') {
      // List available affiliate programs
      const { data: programs, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch affiliate programs' }, { status: 500 })
      }

      return NextResponse.json({ programs })
    }

    if (importRunId) {
      // Get specific import run status
      const { data: importRun, error } = await supabase
        .from('import_runs')
        .select(`
          *,
          affiliate_program:affiliate_programs(name, provider)
        `)
        .eq('id', importRunId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Import run not found' }, { status: 404 })
      }

      return NextResponse.json({ import_run: importRun })
    } else {
      // Get recent import runs for affiliate programs
      const { data: importRuns, error } = await supabase
        .from('import_runs')
        .select(`
          *,
          affiliate_program:affiliate_programs(name, provider)
        `)
        .not('affiliate_program', 'is', null)
        .order('started_at', { ascending: false })
        .limit(20)

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch import runs' }, { status: 500 })
      }

      return NextResponse.json({ import_runs: importRuns })
    }
  } catch (error) {
    console.error('Affiliate import status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
