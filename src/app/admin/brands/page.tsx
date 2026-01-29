import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default async function AdminBrandsPage() {
  const supabase = await createClient()

  // Fetch all brands with their order counts
  const { data: brands } = await supabase
    .from('brands')
    .select('*, orders(id)')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-1">Manage all brand partners</p>
        </div>
        <Link href="/admin/brands/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {brands && brands.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>{brand.contact_email}</TableCell>
                    <TableCell>{brand.orders?.length ?? 0}</TableCell>
                    <TableCell>
                      {new Date(brand.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/brands/${brand.id}`}
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
              <p>No brands yet</p>
              <Link href="/admin/brands/new" className="text-brand-accent hover:text-indigo-600 mt-2 inline-block">
                Add your first brand
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
