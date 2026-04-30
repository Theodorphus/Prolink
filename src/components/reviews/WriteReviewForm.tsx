'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StarRating from '@/components/reviews/StarRating'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface WriteReviewFormProps {
  offerId: string
  revieweeId: string
  revieweeName: string
}

export default function WriteReviewForm({ offerId, revieweeId, revieweeName }: WriteReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Välj ett betyg'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id: offerId, reviewee_id: revieweeId, rating, comment }),
    })

    if (res.ok) {
      setDone(true)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Något gick fel')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardBody className="flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-green-800">Tack! Ditt omdöme har skickats.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">Lämna omdöme om {revieweeName}</h3>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Betyg</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Omdöme <span className="text-gray-400 font-normal">(valfritt)</span></label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder={`Berätta om din upplevelse med ${revieweeName}...`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Skicka omdöme
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
