---
Task ID: 1
Agent: Main Developer
Task: Build complete Digital Archive System (Sistem Pengarsipan Digital)

Work Log:
- Explored existing project structure: Next.js 16, Prisma/SQLite, shadcn/ui components, Tailwind CSS 4
- Updated Prisma schema with ArsipDokumen model (id, nomorDokumen, namaDokumen, kategori, tanggalArsip, driveFileId, driveWebViewLink, timestamps)
- Installed googleapis package for Google Drive API v3 integration
- Pushed schema to SQLite database successfully
- Created `/src/lib/google-drive.ts` - server-side Google Drive helper with uploadFileToDrive() and deleteFileFromDrive() functions using JWT service account auth
- Created `/src/app/api/arsip/route.ts` - complete REST API with:
  - GET: List documents with search, category filter, and pagination
  - POST: Upload file to Google Drive + save metadata to database (with validation for file type/size/form fields)
  - DELETE: Remove from both Google Drive and database
- Built comprehensive frontend dashboard at `/src/app/page.tsx`:
  - Sticky header with app branding, refresh button, and upload button
  - Stats cards showing total documents and per-category counts
  - Search bar with category filter dropdown
  - Desktop: Full data table with sortable columns, category badges, view/delete actions
  - Mobile: Card-based layout for small screens
  - Upload modal with drag-and-drop file area, form validation, and error messages
  - Delete confirmation dialog with loading states
  - Smart pagination with ellipsis
  - Empty state with helpful messaging
  - Loading skeleton states
  - Sticky footer
  - Responsive design (mobile-first)
- Created `.env.example` with all required environment variables
- Updated layout metadata
- Verified with agent-browser: no errors, all interactions working, responsive on mobile/desktop

Stage Summary:
- Complete Digital Archive System built and verified
- Database schema created and pushed
- Google Drive API integration ready (server-side only, secure)
- All shadcn/ui components used: Table, Dialog, AlertDialog, Select, Input, Button, Badge, Card, Skeleton, Toast
- Lint passes cleanly
- Dev server running successfully with no runtime errors
- API returns proper JSON responses with pagination