import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar';
import AdminNavbar from '../admin/AdminNavbar';

export default function AdminLayout({ title = 'Administration' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell admin-shell">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content-wrapper">
        <AdminNavbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          title={title}
        />
        <main className="page-main-container admin-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
