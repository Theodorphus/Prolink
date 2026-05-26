import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import EditProfileForm from '@/components/profile/EditProfileForm'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'
import ReviewCard from '@/components/reviews/ReviewCard'
import StarRating from '@/components/reviews/StarRating'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('name').eq('id', params.id).single()
  return { title: data?.name ? `${data.name} | Prolink` : 'Profil | Prolink' }
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const isOwn = user?.id === params.id

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:users(id, name, avatar_url)')
    .eq('reviewee_id', params.id)
    .order('created_at', { ascending: false })

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Sidebar: Profile card */}
        <div className="space-y-4">
          <Card>
            <CardBody className="text-center space-y-3">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-3xl mx-auto">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" />
                ) : (
                  profile.name?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              </div>
              {profile.bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn-profil
                </a>
              )}
              {avgRating !== null && (
                <div className="flex flex-col items-center gap-1">
                  <StarRating value={Math.round(avgRating)} readonly size="sm" />
                  <p className="text-xs text-gray-500">{avgRating.toFixed(1)} / 5 ({reviews!.length} omdömen)</p>
                </div>
              )}
              <p className="text-xs text-gray-400">Medlem sedan {formatDate(profile.created_at)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          {isOwn && <EditProfileForm profile={profile} />}

          {/* Posted jobs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isOwn ? 'Dina jobbannonser' : 'Jobbannonser'}
              </h2>
              {isOwn && (
                <Link
                  href="/jobs/create"
                  className="inline-flex items-center bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Nytt jobb
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {jobs?.map((job: any) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardBody className="flex items-center justify-between gap-4">
                    <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0 group">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 truncate">{job.title}</h3>
                      <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
                    </Link>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {job.status === 'open' ? 'Öppet' : 'Stängt'}
                      </span>
                      {isOwn && <DeleteJobButton jobId={job.id} compact />}
                    </div>
                  </CardBody>
                </Card>
              ))}
              {(!jobs || jobs.length === 0) && (
                <p className="text-sm text-gray-500 py-4">Inga jobbannonser ännu.</p>
              )}
            </div>
          </div>

          {reviews && reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Omdömen ({reviews.length})
              </h2>
              <div className="bg-white border border-gray-100 rounded-2xl px-6 divide-y divide-gray-100">
                {reviews.map((review: any) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
