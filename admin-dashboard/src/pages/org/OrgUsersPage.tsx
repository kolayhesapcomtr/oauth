import { useState } from 'react';
import { UserPlus, Mail, Shield } from 'lucide-react';

export default function OrgUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcılar</h1>
          <p className="text-gray-600 mt-1">Organizasyon kullanıcılarını yönetin</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <UserPlus className="h-5 w-5" />
          Kullanıcı Davet Et
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Shield className="h-24 w-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Kullanıcı Yönetimi
        </h2>
        <p className="text-gray-600">
          Yakında: Kullanıcı davet etme, rol atama ve yetki yönetimi özellikleri
        </p>
      </div>
    </div>
  );
}
