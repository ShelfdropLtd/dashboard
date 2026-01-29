import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Fetch all users with their brand info
  const { data: users } = await supabase
    .from('users')
    .select('*, brands(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.brands?.name || '-'}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
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
              No users yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
