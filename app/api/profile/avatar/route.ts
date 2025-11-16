import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    // Validate size and mime type (bucket limited to 2MB)
    const MAX_BYTES = 2 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 2MB allowed.' }, { status: 413 })
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'Unsupported file type. Use PNG, JPG, WEBP or GIF.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`

    const { data: upload, error: uploadError } = await (supabase as any)
      .storage
      .from('public-media')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || 'image/png'
      })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

    const { data: { publicUrl } } = (supabase as any).storage
      .from('public-media')
      .getPublicUrl(upload.path)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}












