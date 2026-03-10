'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TemplateCOAPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => { loadTemplates() }, [])
  useEffect(() => { if (selectedTemplate) loadItems() }, [selectedTemplate])

  async function loadTemplates() {
    const supabase = createClient()
    const { data } = await supabase.from('coa_templates').select('*').order('nama_template')
    setTemplates(data || [])
    setLoading(false)
  }

  async function loadItems() {
    setLoadingItems(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('coa_template_items')
      .select('*')
      .eq('template_id', selectedTemplate)
      .order('urutan')
    setItems(data || [])
    setLoadingItems(false)
  }

  const selectedTpl = templates.find(t => t.id === selectedTemplate)

  const KATEGORI_COLORS: Record<string, string> = {
    aset: 'bg-blue-100 text-blue-700',
    kewajiban: 'bg-orange-100 text-orange-700',
    modal: 'bg-purple-100 text-purple-700',
    pendapatan: 'bg-green-100 text-green-700',
    beban: 'bg-red-100 text-red-700',
  }

  if (loading) return <div className="flex items-center justify-center py-16 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-gray-900">Template Chart of Accounts</h1>
        <p className="text-gray-500 text-sm">Template COA standar yang digunakan saat membuat unit usaha baru</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Template</label>
        <div className="flex gap-3 flex-wrap">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                selectedTemplate === t.id
                  ? 'bg-merah text-white border-merah'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-merah hover:text-merah'
              }`}
            >
              {t.nama_template}
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">{selectedTpl?.nama_template}</h3>
            {selectedTpl?.deskripsi && <p className="text-sm text-gray-500 mt-0.5">{selectedTpl.deskripsi}</p>}
            <p className="text-xs text-gray-400 mt-1">{items.length} akun standar</p>
          </div>

          {loadingItems ? (
            <div className="py-10 text-center text-gray-400">Memuat akun...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 text-left w-8">#</th>
                  <th className="px-6 py-3 text-left">Kode Akun</th>
                  <th className="px-6 py-3 text-left">Nama Akun</th>
                  <th className="px-6 py-3 text-left">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-6 py-2.5 font-mono text-gray-600 text-xs">{item.kode_akun}</td>
                    <td className="px-6 py-2.5 text-gray-800">{item.nama_akun}</td>
                    <td className="px-6 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${KATEGORI_COLORS[item.kategori]}`}>
                        {item.kategori}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Info:</strong> Template COA ini digunakan secara otomatis saat Anda membuat Unit Usaha baru dan memilih template. 
          Akun-akun standar akan langsung dibuat sesuai template yang dipilih. 
          Anda tetap dapat menambah akun khusus di halaman Chart of Accounts.
        </p>
      </div>
    </div>
  )
}
