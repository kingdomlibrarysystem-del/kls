'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { FormSection } from '@/components/ui/form-section'

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'librarian' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  joinDate: string
}

interface Resource {
  id: string
  title: string
  author: string
  type: 'BOOK' | 'EBOOK' | 'JOURNAL' | 'MAGAZINE' | 'AUDIO' | 'VIDEO'
  format: 'PHYSICAL' | 'DIGITAL'
  category: string
  totalQuantity: number
  availableQuantity: number
  status: 'AVAILABLE' | 'ARCHIVED' | 'OUT_OF_STOCK'
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@kingdom.edu',
    role: 'user',
    status: 'active',
    joinDate: '2024-01-10',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@kingdom.edu',
    role: 'librarian',
    status: 'active',
    joinDate: '2024-02-15',
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@kingdom.edu',
    role: 'user',
    status: 'inactive',
    joinDate: '2024-03-20',
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david@kingdom.edu',
    role: 'user',
    status: 'active',
    joinDate: '2024-04-05',
  },
]

const mockResources: Resource[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    author: 'Jane Smith',
    type: 'BOOK',
    format: 'PHYSICAL',
    category: 'Technology',
    totalQuantity: 5,
    availableQuantity: 5,
    status: 'AVAILABLE',
  },
  {
    id: '2',
    title: 'The Art of Programming',
    author: 'John Doe',
    type: 'EBOOK',
    format: 'DIGITAL',
    category: 'Technology',
    totalQuantity: 10,
    availableQuantity: 8,
    status: 'AVAILABLE',
  },
  {
    id: '3',
    title: 'World History Essentials',
    author: 'Robert Johnson',
    type: 'BOOK',
    format: 'PHYSICAL',
    category: 'History',
    totalQuantity: 8,
    availableQuantity: 3,
    status: 'AVAILABLE',
  },
  {
    id: '4',
    title: 'Biology in the 21st Century',
    author: 'Dr. Sarah Wilson',
    type: 'JOURNAL',
    format: 'DIGITAL',
    category: 'Science',
    totalQuantity: 3,
    availableQuantity: 0,
    status: 'OUT_OF_STOCK',
  },
]

const roleColors = {
  user: 'bg-blue-50 text-blue-700 border-blue-200',
  librarian: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-red-50 text-red-700 border-red-200',
}

const statusColors = {
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-50 text-gray-700 border-gray-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'resources'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [resourceSearch, setResourceSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddResource, setShowAddResource] = useState(false)
  const [newResource, setNewResource] = useState({
    title: '',
    author: '',
    type: 'BOOK' as const,
    format: 'PHYSICAL' as const,
    category: 'Technology',
    totalQuantity: 0,
  })

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus =
      selectedStatus === 'all' || user.status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  const filteredResources = mockResources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      resource.author.toLowerCase().includes(resourceSearch.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || resource.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleAddResource = () => {
    if (newResource.title && newResource.author) {
      console.log('Adding resource:', newResource)
      setNewResource({
        title: '',
        author: '',
        type: 'BOOK',
        format: 'PHYSICAL',
        category: 'Technology',
        totalQuantity: 0,
      })
      setShowAddResource(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage users, roles, permissions, and digital library resources"
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-w-300">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-lato font-semibold transition-colors ${
            activeTab === 'users'
              ? 'text-w-950 border-b-2 border-w-600'
              : 'text-w-700 hover:text-w-950'
          }`}
        >
          👥 User Management
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-3 font-lato font-semibold transition-colors ${
            activeTab === 'resources'
              ? 'text-w-950 border-b-2 border-w-600'
              : 'text-w-700 hover:text-w-950'
          }`}
        >
          📚 Digital Library
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 hidden" style={{display: activeTab === 'users' ? 'grid' : 'none'}}>
        <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
          <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
            Total Users
          </h3>
          <p className="text-4xl font-bold text-w-600">{mockUsers.length}</p>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
          <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
            Active
          </h3>
          <p className="text-4xl font-bold text-green-600">
            {mockUsers.filter((u) => u.status === 'active').length}
          </p>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
          <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
            Librarians
          </h3>
          <p className="text-4xl font-bold text-purple-600">
            {mockUsers.filter((u) => u.role === 'librarian').length}
          </p>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
          <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
            Admins
          </h3>
          <p className="text-4xl font-bold text-red-600">
            {mockUsers.filter((u) => u.role === 'admin').length}
          </p>
        </div>
      </div>

      {/* User Management */}
      <div style={{display: activeTab === 'users' ? 'block' : 'none'}}>
      <FormSection>
        <h2 className="font-cinzel text-xl font-semibold text-w-950 mb-6">
          User Management
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-lato font-normal text-w-950 mb-2">
              Search users
            </label>
            <FormInput
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                Filter by Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="librarian">Librarian</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-lato">
            <thead>
              <tr className="border-b border-w-400 bg-w-50">
                <th className="text-left px-4 py-3 font-semibold text-w-950">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-w-950">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-semibold text-w-950">
                  Role
                </th>
                <th className="text-left px-4 py-3 font-semibold text-w-950">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-w-950">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-w-200 hover:bg-w-50 transition-colors"
                >
                  <td className="px-4 py-3 text-w-950 font-semibold">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-w-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold border ${
                        roleColors[user.role]
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold border ${
                        statusColors[user.status]
                      }`}
                    >
                      {user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <ElegantButton variant="outline" className="text-xs py-1">
                        Edit
                      </ElegantButton>
                      <ElegantButton variant="outline" className="text-xs py-1">
                        Status
                      </ElegantButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="font-lato text-w-700">No users found</p>
          </div>
        )}
      </FormSection>
      </div>

      {/* Digital Library Management */}
      <div style={{display: activeTab === 'resources' ? 'block' : 'none'}}>
        {/* Resource Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
            <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
              Total Resources
            </h3>
            <p className="text-4xl font-bold text-w-600">{mockResources.length}</p>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
            <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
              Available
            </h3>
            <p className="text-4xl font-bold text-green-600">
              {mockResources.filter(r => r.status === 'AVAILABLE').length}
            </p>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
            <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
              Out of Stock
            </h3>
            <p className="text-4xl font-bold text-red-600">
              {mockResources.filter(r => r.status === 'OUT_OF_STOCK').length}
            </p>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded-lg p-6">
            <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-2">
              Total Copies
            </h3>
            <p className="text-4xl font-bold text-purple-600">
              {mockResources.reduce((sum, r) => sum + r.totalQuantity, 0)}
            </p>
          </div>
        </div>

        <FormSection>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-cinzel text-xl font-semibold text-w-950">
              Resource Management
            </h2>
            <ElegantButton
              variant="primary"
              onClick={() => setShowAddResource(!showAddResource)}
            >
              ➕ Add Resource
            </ElegantButton>
          </div>

          {/* Add Resource Form */}
          {showAddResource && (
            <div className="bg-form-highlight border border-w-300 rounded-lg p-6 mb-6">
              <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-4">
                Add New Resource
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                    Title
                  </label>
                  <FormInput
                    type="text"
                    placeholder="Resource title"
                    value={newResource.title}
                    onChange={(e) =>
                      setNewResource({ ...newResource, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                    Author
                  </label>
                  <FormInput
                    type="text"
                    placeholder="Author name"
                    value={newResource.author}
                    onChange={(e) =>
                      setNewResource({ ...newResource, author: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                      Type
                    </label>
                    <select
                      value={newResource.type}
                      onChange={(e) =>
                        setNewResource({
                          ...newResource,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded"
                    >
                      <option>BOOK</option>
                      <option>EBOOK</option>
                      <option>JOURNAL</option>
                      <option>MAGAZINE</option>
                      <option>AUDIO</option>
                      <option>VIDEO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                      Format
                    </label>
                    <select
                      value={newResource.format}
                      onChange={(e) =>
                        setNewResource({
                          ...newResource,
                          format: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded"
                    >
                      <option>PHYSICAL</option>
                      <option>DIGITAL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                      Category
                    </label>
                    <select
                      value={newResource.category}
                      onChange={(e) =>
                        setNewResource({
                          ...newResource,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded"
                    >
                      <option>Technology</option>
                      <option>Science</option>
                      <option>History</option>
                      <option>Literature</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                      Quantity
                    </label>
                    <FormInput
                      type="number"
                      placeholder="0"
                      min="0"
                      value={newResource.totalQuantity}
                      onChange={(e) =>
                        setNewResource({
                          ...newResource,
                          totalQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <ElegantButton
                    variant="primary"
                    onClick={handleAddResource}
                  >
                    Save Resource
                  </ElegantButton>
                  <ElegantButton
                    variant="secondary"
                    onClick={() => setShowAddResource(false)}
                  >
                    Cancel
                  </ElegantButton>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                Search resources
              </label>
              <FormInput
                type="text"
                placeholder="Search by title or author..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-lato font-normal text-w-950 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded"
              >
                <option value="all">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Literature">Literature</option>
              </select>
            </div>
          </div>

          {/* Resources Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-lato">
              <thead>
                <tr className="border-b border-w-400 bg-w-50">
                  <th className="text-left px-4 py-3 font-semibold text-w-950">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-w-950">
                    Author
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-w-950">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-w-950">
                    Available
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-w-950">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-w-950">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((resource) => (
                  <tr
                    key={resource.id}
                    className="border-b border-w-200 hover:bg-w-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-w-950 font-semibold">
                      {resource.title}
                    </td>
                    <td className="px-4 py-3 text-w-700">{resource.author}</td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {resource.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {resource.availableQuantity}/{resource.totalQuantity}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold border ${
                          resource.status === 'AVAILABLE'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <ElegantButton
                          variant="outline"
                          className="text-xs py-1"
                        >
                          Edit
                        </ElegantButton>
                        <ElegantButton
                          variant="outline"
                          className="text-xs py-1"
                        >
                          Stock
                        </ElegantButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-8">
              <p className="font-lato text-w-700">No resources found</p>
            </div>
          )}
        </FormSection>
      </div>
    </div>
  )
}
