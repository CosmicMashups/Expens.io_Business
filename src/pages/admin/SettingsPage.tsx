import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { FormSection } from '@/components/forms/FormSection'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { AppSettings } from '@/types'
import { toast } from 'sonner'

export function SettingsPage() {
  const qc = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*').limit(1).single()
      if (error) throw error
      return data as AppSettings
    },
  })

  const [draft, setDraft] = useState<Partial<AppSettings>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (settings) {
      setDraft({
        expense_approvals_enabled: settings.expense_approvals_enabled,
        payroll_lock_enabled: settings.payroll_lock_enabled,
        report_approval_enabled: settings.report_approval_enabled,
        default_vat_rate: settings.default_vat_rate,
      })
      setDirty(false)
    }
  }, [settings])

  const update = useMutation({
    mutationFn: async (patch: Partial<AppSettings>) => {
      if (!settings?.id) return
      const { error } = await supabase.from('app_settings').update(patch).eq('id', settings.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app-settings'] })
      toast.success('Saved successfully')
      setDirty(false)
    },
  })

  const patch = (p: Partial<AppSettings>) => {
    setDraft((d) => ({ ...d, ...p }))
    setDirty(true)
  }

  if (!settings) return null

  return (
    <div className="max-w-lg space-y-8">
      <FormSection title="Workflows" description="Control approval and locking behavior">
        <div className="col-span-2 flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-card p-4 md:col-span-2">
          <div>
            <Label htmlFor="exp-approvals">Expense approvals</Label>
            <p className="text-xs text-text-tertiary">Require approval before expenses are finalized</p>
          </div>
          <Switch
            id="exp-approvals"
            checked={draft.expense_approvals_enabled ?? settings.expense_approvals_enabled}
            onCheckedChange={(v) => patch({ expense_approvals_enabled: v })}
          />
        </div>
        <div className="col-span-2 flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-card p-4 md:col-span-2">
          <div>
            <Label htmlFor="payroll-lock">Payroll lock</Label>
            <p className="text-xs text-text-tertiary">Prevent edits to locked payroll periods</p>
          </div>
          <Switch
            id="payroll-lock"
            checked={draft.payroll_lock_enabled ?? settings.payroll_lock_enabled}
            onCheckedChange={(v) => patch({ payroll_lock_enabled: v })}
          />
        </div>
        <div className="col-span-2 flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-card p-4 md:col-span-2">
          <div>
            <Label htmlFor="report-approvals">Report approvals</Label>
            <p className="text-xs text-text-tertiary">Require approval for monitoring reports</p>
          </div>
          <Switch
            id="report-approvals"
            checked={draft.report_approval_enabled ?? settings.report_approval_enabled}
            onCheckedChange={(v) => patch({ report_approval_enabled: v })}
          />
        </div>
      </FormSection>

      <FormSection title="Finance">
        <div className="col-span-2 md:col-span-1">
          <Label htmlFor="vat-rate">Default VAT rate</Label>
          <Input
            id="vat-rate"
            type="number"
            step="0.01"
            className="mt-1.5"
            value={draft.default_vat_rate ?? settings.default_vat_rate}
            onChange={(e) => patch({ default_vat_rate: Number(e.target.value) })}
          />
        </div>
      </FormSection>

      {dirty && (
        <Button onClick={() => update.mutate(draft)} disabled={update.isPending}>
          Save changes
        </Button>
      )}
    </div>
  )
}
