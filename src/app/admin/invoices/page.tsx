import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge, { getInvoiceStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default async function AdminInvoicesPage() {
  const supabase = await createClient()

  // Fetch all invoices with brand and order info
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, brands(name), orders(po_number)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage all invoices across brands</p>
        </div>
        <Link href="/admin/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Related Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.brands?.name || '-'}</TableCell>
                    <TableCell>{invoice.orders?.po_number || '-'}</TableCell>
                    <TableCell>
                      £{invoice.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="text-brand-accent hover:text-indigo-600 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No invoices yet</p>
              <Link href="/admin/invoices/new" className="text-brand-accent hover:text-indigo-600 mt-2 inline-block">
                Create your first invoice
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
