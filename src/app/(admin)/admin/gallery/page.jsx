'use client';
import React from 'react';
import AdminGalleryManager from '@/components/admin/AdminGalleryManager';
export const dynamic = 'force-dynamic';
export default function AdminGalleryPage() {
    return (<div className="w-full">
      <AdminGalleryManager />
    </div>);
}
