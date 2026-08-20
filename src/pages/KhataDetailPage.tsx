import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Mail,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { KhataFormModal } from '@/features/khata/KhataFormModal'
import { KhataLedger } from '@/features/khata/KhataLedger'
import { useDeleteKhata, useKhata, useUpdateKhata } from '@/features/khata/queries'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'

export function KhataDetailPage() {
  const { khataId } = useParams<{ khataId: string }>()
  const navigate = useNavigate()

  const { data: khata, isLoading, isError, error, refetch } = useKhata(khataId)
  const updateKhata = useUpdateKhata(khataId ?? '')
  const deleteKhata = useDeleteKhata()

  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) return <CardSkeleton lines={6} />
  if (isError || !khata) {
    return <ErrorState error={error} title="Could not load this khata" onRetry={() => refetch()} />
  }

  const cents = toCents(khata.balance)
  const theyOweYou = cents > 0
  const settled = cents === 0

  return (
    <div className="space-y-6">
      <Link
        to="/khata"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All khatas
      </Link>

      {khata.is_archived && (
        <Alert tone="info" title="This khata is archived">
          It is hidden from your list, and its history is intact. Restore it to keep using it.
        </Alert>
      )}

      {/* The balance leads, because it is the reason anyone opens a khata. */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              name={khata.display_name}
              src={khata.person_user?.avatar_url}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {khata.display_name}
                </h1>
                {khata.person_user && <Badge tone="brand">on Owsify</Badge>}
              </div>

              <dl className="mt-1 space-y-0.5 text-sm text-slate-500">
                {khata.person_phone && (
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Phone</dt>
                    <Phone aria-hidden className="size-3.5" />
                    <dd>
                      <a href={`tel:${khata.person_phone}`} className="hover:text-slate-900">
                        {khata.person_phone}
                      </a>
                    </dd>
                  </div>
                )}
                {khata.person_email && (
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Email</dt>
                    <Mail aria-hidden className="size-3.5" />
                    <dd className="truncate">
                      <a href={`mailto:${khata.person_email}`} className="hover:text-slate-900">
                        {khata.person_email}
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  {/* The label is only for screen readers, so the value must not
                      repeat it — otherwise it is announced "Opened Opened Aug 20". */}
                  <dt className="sr-only">Opened</dt>
                  <dd className="text-xs text-slate-400">
                    <span aria-hidden>Opened </span>
                    {formatDate(khata.created_at)} · {khata.currency}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">
              {settled ? 'Balance' : theyOweYou ? 'You are owed' : 'You owe'}
            </p>
            <p
              className={cn(
                'mt-1 text-3xl font-semibold tabular-nums sm:text-4xl',
                settled ? 'text-slate-900' : theyOweYou ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {settled
                ? formatMoney(0, khata.currency)
                : formatAbsMoney(khata.balance, khata.currency)}
            </p>
            {settled && <p className="mt-1 text-sm text-slate-500">Settled up</p>}
          </div>
        </div>

        {khata.notes && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            {khata.notes}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}
            leftIcon={<Pencil className="size-4" />}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => updateKhata.mutate({ is_archived: !khata.is_archived })}
            isLoading={updateKhata.isPending}
            leftIcon={
              khata.is_archived ? (
                <ArchiveRestore className="size-4" />
              ) : (
                <Archive className="size-4" />
              )
            }
          >
            {khata.is_archived ? 'Restore' : 'Archive'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            leftIcon={<Trash2 className="size-4" />}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </Card>

      <KhataLedger
        khataId={khata.id}
        currency={khata.currency}
        personName={khata.display_name}
      />

      <KhataFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        khata={khata}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteKhata.mutateAsync({ khataId: khata.id, permanent: true })
          navigate('/khata', { replace: true })
        }}
        title="Delete this khata"
        description={
          khata.entry_count > 0
            ? `This permanently deletes ${khata.display_name}'s khata and all ${khata.entry_count} of its entries. Archive it instead to keep the history.`
            : `This permanently deletes ${khata.display_name}'s khata. Archive it instead to keep it out of the way.`
        }
        confirmLabel="Delete permanently"
      />
    </div>
  )
}
