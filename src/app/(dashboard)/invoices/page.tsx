import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge, { getInvoiceStatusVariant } from '@/components/ui/Badge'

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's brand_id
  const { data: userData } = await supabase
    .from('users')
    .select('brand_id')
    .eq('id', user.id)
    .single() as { data: { brand_id: string | null } | null }

  if (!userData?.brand_id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No brand assigned yet.</p>
      </div>
    )
  }

  // Fetch all invoices for this brand
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, orders(po_number)')
    .eq('brand_id', userData.brand_id)
    .order('created_at', { ascending: false }) as { data: Array<{ id: string; invoice_number: string; amount: number; status: string; due_date: string; paid_date: string | null; orders: { po_number: string } | null }> | null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-1">View all your invoices</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Related Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.orders?.po_number || '-'}</TableCell>
                    <TableCell>
                      £{invoice.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      {invoice.paid_date
                        ? new Date(invoice.paid_date).toLocaleDateString('en-GB')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No invoices yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
