"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  FileText,
  HardDrive,
  Search,
  Trash2,
  Upload,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Users,
  Building2,
  FileCheck2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────
interface ArsipDokumen {
  id: string;
  nomorDokumen: string;
  namaDokumen: string;
  kategori: string;
  tanggalArsip: string;
  driveFileId: string;
  driveWebViewLink: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  data: ArsipDokumen[];
  pagination: PaginationInfo;
}

// ─── Constants ───────────────────────────────────────────────
const KATEGORI_OPTIONS = ["Kependudukan", "Kepegawaian", "SIAK", "Umum"] as const;

const KATEGORI_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string; borderColor: string }
> = {
  Kependudukan: {
    icon: Users,
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  Kepegawaian: {
    icon: Building2,
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  SIAK: {
    icon: FileCheck2,
    color: "text-sky-700 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
  },
  Umum: {
    icon: FileText,
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
};

const formatTanggal = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTanggalShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Main Component ──────────────────────────────────────────
export default function ArsipDashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [data, setData] = useState<ArsipDokumen[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ArsipDokumen | null>(null);

  // Upload form state
  const [formNomor, setFormNomor] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formKategori, setFormKategori] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Stats
  const [stats, setStats] = useState<Record<string, number>>({});

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set("search", search);
      if (kategoriFilter && kategoriFilter !== "all")
        params.set("kategori", kategoriFilter);

      const res = await fetch(`/api/arsip?${params}`);
      const json: ApiResponse = await res.json();

      if (!res.ok) throw new Error(json.error || "Gagal mengambil data");

      setData(json.data);
      setPagination(json.pagination);

      // Calculate stats
      const statsMap: Record<string, number> = {};
      json.data.forEach((item) => {
        statsMap[item.kategori] = (statsMap[item.kategori] || 0) + 1;
      });
      setStats(statsMap);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Gagal mengambil data arsip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, kategoriFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [search, kategoriFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // Handle upload
  const handleUpload = async () => {
    const errors: Record<string, string> = {};
    if (!formNomor.trim()) errors.nomorDokumen = "Nomor dokumen wajib diisi";
    if (!formNama.trim()) errors.namaDokumen = "Nama dokumen wajib diisi";
    if (!formKategori) errors.kategori = "Kategori wajib dipilih";
    if (!formFile) errors.file = "File wajib diunggah";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("nomorDokumen", formNomor.trim());
      formData.append("namaDokumen", formNama.trim());
      formData.append("kategori", formKategori);
      formData.append("file", formFile!);

      const res = await fetch("/api/arsip", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengunggah dokumen");

      toast({
        title: "Berhasil",
        description: `Dokumen "${formNama}" berhasil diarsipkan`,
      });

      // Reset form
      setFormNomor("");
      setFormNama("");
      setFormKategori("");
      setFormFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal Mengunggah",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(itemToDelete.id);
    try {
      const res = await fetch(`/api/arsip?id=${itemToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");

      toast({
        title: "Berhasil Dihapus",
        description: `Dokumen "${itemToDelete.namaDokumen}" telah dihapus`,
      });

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal Menghapus",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const openDeleteDialog = (item: ArsipDokumen) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // File size formatter
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-primary-foreground">
                <Archive className="size-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Sistem Pengarsipan Digital
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Kelola arsip dokumen dengan Google Drive
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw
                  className={`size-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="size-4" />
                    <span>Unggah Dokumen</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Unggah Dokumen Baru</DialogTitle>
                    <DialogDescription>
                      Unggah dokumen ke arsip digital. File akan disimpan di
                      Google Drive.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    {/* File Upload Area */}
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">File Dokumen</Label>
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50 ${
                          formErrors.file
                            ? "border-destructive bg-destructive/5"
                            : formFile
                            ? "border-primary/30 bg-primary/5"
                            : "border-muted-foreground/25"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const droppedFile = e.dataTransfer.files[0];
                          if (droppedFile) {
                            setFormFile(droppedFile);
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.file;
                              return next;
                            });
                          }
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormFile(file);
                              setFormErrors((prev) => {
                                const next = { ...prev };
                                delete next.file;
                                return next;
                              });
                            }
                          }}
                        />
                        {formFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <FileText className="size-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {formFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(formFile.size)} •{" "}
                                {formFile.type || "Unknown type"}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                            >
                              <X className="size-3" />
                              Hapus File
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                              <Upload className="size-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Klik atau seret file ke sini
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, JPEG, PNG, GIF, WebP (maks. 25MB)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      {formErrors.file && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          {formErrors.file}
                        </p>
                      )}
                    </div>

                    {/* Nomor Dokumen */}
                    <div className="space-y-2">
                      <Label htmlFor="nomor-dokumen">Nomor Dokumen</Label>
                      <Input
                        id="nomor-dokumen"
                        placeholder="Contoh: 001/ARS/2024"
                        value={formNomor}
                        onChange={(e) => {
                          setFormNomor(e.target.value);
                          if (e.target.value.trim())
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.nomorDokumen;
                              return next;
                            });
                        }}
                      />
                      {formErrors.nomorDokumen && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          {formErrors.nomorDokumen}
                        </p>
                      )}
                    </div>

                    {/* Nama Dokumen */}
                    <div className="space-y-2">
                      <Label htmlFor="nama-dokumen">Nama Dokumen</Label>
                      <Input
                        id="nama-dokumen"
                        placeholder="Contoh: Surat Keterangan Domisili"
                        value={formNama}
                        onChange={(e) => {
                          setFormNama(e.target.value);
                          if (e.target.value.trim())
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.namaDokumen;
                              return next;
                            });
                        }}
                      />
                      {formErrors.namaDokumen && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          {formErrors.namaDokumen}
                        </p>
                      )}
                    </div>

                    {/* Kategori */}
                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Select
                        value={formKategori}
                        onValueChange={(val) => {
                          setFormKategori(val);
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.kategori;
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih kategori dokumen" />
                        </SelectTrigger>
                        <SelectContent>
                          {KATEGORI_OPTIONS.map((kat) => {
                            const config = KATEGORI_CONFIG[kat];
                            const Icon = config.icon;
                            return (
                              <SelectItem key={kat} value={kat}>
                                <div className="flex items-center gap-2">
                                  <Icon className="size-4" />
                                  {kat}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {formErrors.kategori && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          {formErrors.kategori}
                        </p>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setUploadOpen(false)}
                      disabled={uploading}
                    >
                      Batal
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="size-4" />
                          Unggah & Arsipkan
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Card */}
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Arsip</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                  <p className="text-xs text-muted-foreground">dokumen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Stats */}
          {KATEGORI_OPTIONS.map((kat) => {
            const config = KATEGORI_CONFIG[kat];
            const Icon = config.icon;
            const count = stats[kat] || 0;
            return (
              <Card key={kat} className="hidden sm:flex">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">{kat}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-lg ${config.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={`size-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">dokumen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor atau nama dokumen..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={kategoriFilter}
                onValueChange={(val) => setKategoriFilter(val)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <FolderOpen className="size-4" />
                      Semua Kategori
                    </span>
                  </SelectItem>
                  {KATEGORI_OPTIONS.map((kat) => {
                    const config = KATEGORI_CONFIG[kat];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={kat} value={kat}>
                        <span className="flex items-center gap-2">
                          <Icon className="size-4" />
                          {kat}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button type="submit" variant="outline" className="sm:w-auto">
                <Search className="size-4" />
                <span className="hidden sm:inline">Cari</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Daftar Arsip Dokumen</CardTitle>
                <CardDescription>
                  {loading
                    ? "Memuat data..."
                    : `Menampilkan ${data.length} dari ${pagination.total} dokumen`}
                </CardDescription>
              </div>
              {(search || (kategoriFilter && kategoriFilter !== "all")) && (
                <Badge variant="secondary" className="text-xs">
                  {search && `Pencarian: "${search}"`}
                  {search &&
                    kategoriFilter &&
                    kategoriFilter !== "all" &&
                    " • "}
                  {kategoriFilter &&
                    kategoriFilter !== "all" &&
                    `Kategori: ${kategoriFilter}`}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading Skeleton */}
            {loading ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 px-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-2 py-3 border-b last:border-0"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {search || kategoriFilter
                    ? "Tidak ada hasil"
                    : "Belum ada arsip"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  {search || kategoriFilter
                    ? "Coba ubah kata kunci pencarian atau filter kategori Anda."
                    : "Mulai dengan mengunggah dokumen pertama Anda ke sistem arsip digital."}
                </p>
                {!search && !kategoriFilter && (
                  <Button onClick={() => setUploadOpen(true)}>
                    <Upload className="size-4" />
                    Unggah Dokumen Pertama
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-36">Nomor Dokumen</TableHead>
                        <TableHead>Nama Dokumen</TableHead>
                        <TableHead className="w-40">Kategori</TableHead>
                        <TableHead className="w-44">Tanggal Arsip</TableHead>
                        <TableHead className="text-right w-32">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item) => {
                        const config =
                          KATEGORI_CONFIG[item.kategori] ||
                          KATEGORI_CONFIG.Umum;
                        const Icon = config.icon;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">
                              {item.nomorDokumen}
                            </TableCell>
                            <TableCell className="font-medium max-w-64 truncate">
                              {item.namaDokumen}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`gap-1.5 text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}
                              >
                                <Icon className="size-3.5" />
                                {item.kategori}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatTanggal(item.tanggalArsip)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  asChild
                                >
                                  <a
                                    href={item.driveWebViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Lihat di Google Drive"
                                  >
                                    <Eye className="size-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => openDeleteDialog(item)}
                                  title="Hapus arsip"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {data.map((item) => {
                    const config =
                      KATEGORI_CONFIG[item.kategori] ||
                      KATEGORI_CONFIG.Umum;
                    const Icon = config.icon;
                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs text-muted-foreground">
                              {item.nomorDokumen}
                            </p>
                            <p className="font-medium text-sm truncate mt-0.5">
                              {item.namaDokumen}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 gap-1 text-xs ${config.bgColor} ${config.color} border ${config.borderColor}`}
                          >
                            <Icon className="size-3" />
                            <span className="hidden sm:inline">
                              {item.kategori}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatTanggal(item.tanggalArsip)}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              asChild
                            >
                              <a
                                href={item.driveWebViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="size-3" />
                                Lihat
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="size-3" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Halaman {pagination.page} dari {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={pagination.page <= 1}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((p) => {
                          // Show first, last, current, and adjacent pages
                          if (p === 1 || p === pagination.totalPages)
                            return true;
                          if (
                            Math.abs(p - pagination.page) <= 1
                          )
                            return true;
                          return false;
                        })
                        .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i - 1] as number) > 1) {
                            acc.push("ellipsis");
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, i) =>
                          item === "ellipsis" ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="px-2 text-muted-foreground text-sm"
                            >
                              ...
                            </span>
                          ) : (
                            <Button
                              key={item}
                              variant={
                                pagination.page === item
                                  ? "default"
                                  : "outline"
                              }
                              size="icon"
                              className="size-8"
                              onClick={() =>
                                setPagination((prev) => ({
                                  ...prev,
                                  page: item,
                                }))
                              }
                            >
                              {item}
                            </Button>
                          )
                        )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={
                          pagination.page >= pagination.totalPages
                        }
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t bg-background mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="size-3.5" />
              Sistem Pengarsipan Digital — Terintegrasi dengan Google Drive
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Arsip Digital
            </p>
          </div>
        </div>
      </footer>

      {/* ─── Delete Confirmation Dialog ─────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Arsip Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus arsip{" "}
              <span className="font-semibold text-foreground">
                &quot;{itemToDelete?.namaDokumen}&quot;
              </span>{" "}
              dengan nomor{" "}
              <span className="font-mono font-semibold text-foreground">
                {itemToDelete?.nomorDokumen}
              </span>
              . Tindakan ini akan menghapus file dari Google Drive dan database.
              Tindakan ini <span className="text-destructive font-semibold">tidak dapat dibatalkan</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting !== null}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting !== null}
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Hapus Permanen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}