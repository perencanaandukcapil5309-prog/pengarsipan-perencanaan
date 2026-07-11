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
  Download,
  ExternalLink,
  Calendar,
  Filter,
  Info,
  Database,
  Clock,
  Sparkles,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
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

interface StatsData {
  total: number;
  Kependudukan: number;
  Kepegawaian: number;
  SIAK: number;
  Umum: number;
}

// ─── Constants ───────────────────────────────────────────────
const KATEGORI_OPTIONS = ["Kependudukan", "Kepegawaian", "SIAK", "Umum"] as const;

const KATEGORI_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    hoverBg: string;
    gradient: string;
  }
> = {
  Kependudukan: {
    icon: Users,
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    gradient: "from-emerald-500 to-teal-600",
  },
  Kepegawaian: {
    icon: Building2,
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
    gradient: "from-amber-500 to-orange-600",
  },
  SIAK: {
    icon: FileCheck2,
    color: "text-sky-700 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
    hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-950/30",
    gradient: "from-sky-500 to-cyan-600",
  },
  Umum: {
    icon: FileText,
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
    hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-950/30",
    gradient: "from-violet-500 to-purple-600",
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

// ─── Stat Card Component ─────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  delay,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  delay: number;
}) {
  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`}
      />
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p
              className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums"
              style={{ animationDelay: `${delay}ms` }}
            >
              {value}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              dokumen terarsip
            </p>
          </div>
          <div
            className={`size-10 sm:size-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
          >
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    Kependudukan: 0,
    Kepegawaian: 0,
    SIAK: 0,
    Umum: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ArsipDokumen | null>(null);
  const [detailItem, setDetailItem] = useState<ArsipDokumen | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Upload form state
  const [formNomor, setFormNomor] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formKategori, setFormKategori] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/arsip/stats");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStats(json.stats);
    } catch {
      // silent fail for stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

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
      if (tanggalDari) params.set("tanggalDari", tanggalDari);
      if (tanggalSampai) params.set("tanggalSampai", tanggalSampai);

      const res = await fetch(`/api/arsip?${params}`);
      const json: ApiResponse = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengambil data");

      setData(json.data);
      setPagination(json.pagination);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Gagal mengambil data arsip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, kategoriFilter, tanggalDari, tanggalSampai, toast]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  // Reset page on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [search, kategoriFilter, tanggalDari, tanggalSampai]);

  const hasActiveFilters =
    search || (kategoriFilter && kategoriFilter !== "all") || tanggalDari || tanggalSampai;

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setKategoriFilter("all");
    setTanggalDari("");
    setTanggalSampai("");
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // Handle CSV export
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (kategoriFilter && kategoriFilter !== "all")
        params.set("kategori", kategoriFilter);
      if (tanggalDari) params.set("tanggalDari", tanggalDari);
      if (tanggalSampai) params.set("tanggalSampai", tanggalSampai);

      const res = await fetch(`/api/arsip/export?${params}`);
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arsip_dokumen_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Berhasil", description: "Data berhasil diekspor ke CSV" });
    } catch {
      toast({
        title: "Gagal Ekspor",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
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

      const res = await fetch("/api/arsip", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengunggah dokumen");

      toast({
        title: "Berhasil",
        description: `Dokumen "${formNama}" berhasil diarsipkan`,
      });

      setFormNomor("");
      setFormNama("");
      setFormKategori("");
      setFormFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadOpen(false);
      fetchData();
      fetchStats();
    } catch (err) {
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
      fetchStats();
    } catch (err) {
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

  const openDetail = (item: ArsipDokumen) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted/40 via-background to-muted/20">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl blur-sm" />
                <div className="relative flex items-center justify-center size-10 rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Archive className="size-5" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Sistem Pengarsipan Digital
                </h1>
                <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                  Kelola arsip dokumen dengan Google Drive
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={fetchData}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`size-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9"
                    onClick={handleExport}
                    disabled={exporting || loading}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ekspor CSV</TooltipContent>
              </Tooltip>
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="shadow-sm">
                    <Upload className="size-4" />
                    <span className="hidden sm:inline">Unggah Dokumen</span>
                    <span className="sm:hidden">Unggah</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Upload className="size-4 text-primary" />
                      </div>
                      Unggah Dokumen Baru
                    </DialogTitle>
                    <DialogDescription>
                      Unggah dokumen ke arsip digital. File akan disimpan di
                      Google Drive secara otomatis.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    {/* File Upload Area */}
                    <div className="space-y-2">
                      <Label htmlFor="file-upload" className="text-sm font-medium">
                        File Dokumen
                      </Label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                          formErrors.file
                            ? "border-destructive bg-destructive/5"
                            : formFile
                            ? "border-primary/40 bg-primary/5 shadow-sm"
                            : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30"
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
                              <p className="text-sm font-medium">{formFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(formFile.size)} • {formFile.type || "Unknown"}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive mt-1"
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
                          <div className="flex flex-col items-center gap-2 py-2">
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
                      <Label htmlFor="nomor-dokumen" className="text-sm font-medium">
                        Nomor Dokumen
                      </Label>
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
                      <Label htmlFor="nama-dokumen" className="text-sm font-medium">
                        Nama Dokumen
                      </Label>
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
                      <Label className="text-sm font-medium">Kategori</Label>
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

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setUploadOpen(false)}
                      disabled={uploading}
                    >
                      Batal
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading} className="shadow-sm">
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
        {/* Hero Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Total Arsip"
                value={stats.total}
                icon={FolderOpen}
                gradient="from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-600"
                delay={0}
              />
              {KATEGORI_OPTIONS.map((kat, idx) => {
                const config = KATEGORI_CONFIG[kat];
                return (
                  <StatCard
                    key={kat}
                    title={kat}
                    value={stats[kat] || 0}
                    icon={config.icon}
                    gradient={config.gradient}
                    delay={(idx + 1) * 75}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* Filters Card */}
        <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Cari nomor atau nama dokumen..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-10 bg-background"
                  />
                </div>
                <Select
                  value={kategoriFilter}
                  onValueChange={(val) => setKategoriFilter(val)}
                >
                  <SelectTrigger className="w-full sm:w-48 h-10 bg-background">
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
                <div className="flex gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={showDateFilter ? "default" : "outline"}
                        size="icon"
                        className="size-10 shrink-0"
                        onClick={() => setShowDateFilter(!showDateFilter)}
                      >
                        <Calendar className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Filter tanggal</TooltipContent>
                  </Tooltip>
                  <Button type="submit" size="icon" className="size-10 shrink-0 shadow-sm">
                    <Search className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Date Filter (expandable) */}
              {showDateFilter && (
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-2 border-t">
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Dari Tanggal
                    </Label>
                    <Input
                      type="date"
                      value={tanggalDari}
                      onChange={(e) => setTanggalDari(e.target.value)}
                      className="h-9 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Sampai Tanggal
                    </Label>
                    <Input
                      type="date"
                      value={tanggalSampai}
                      onChange={(e) => setTanggalSampai(e.target.value)}
                      className="h-9 bg-background"
                    />
                  </div>
                  {(tanggalDari || tanggalSampai) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setTanggalDari("");
                        setTanggalSampai("");
                      }}
                    >
                      <X className="size-3" />
                      Reset
                    </Button>
                  )}
                </div>
              )}

              {/* Active filter badges */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Filter className="size-3" />
                    Filter aktif:
                  </span>
                  {search && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      &quot;{search}&quot;
                      <button onClick={() => { setSearchInput(""); setSearch(""); }}>
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}
                  {kategoriFilter && kategoriFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      {kategoriFilter}
                      <button onClick={() => setKategoriFilter("all")}>
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}
                  {(tanggalDari || tanggalSampai) && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      {tanggalDari && formatTanggalShort(tanggalDari)}
                      {tanggalDari && tanggalSampai && " — "}
                      {tanggalSampai && formatTanggalShort(tanggalSampai)}
                      <button
                        onClick={() => {
                          setTanggalDari("");
                          setTanggalSampai("");
                        }}
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs text-muted-foreground px-1.5"
                    onClick={clearFilters}
                  >
                    Hapus semua
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Data Table Card */}
        <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Database className="size-4 text-muted-foreground" />
                  Daftar Arsip Dokumen
                </CardTitle>
                <CardDescription className="mt-1">
                  {loading
                    ? "Memuat data..."
                    : `Menampilkan ${data.length} dari ${pagination.total} dokumen`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading Skeleton */}
            {loading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4 px-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-2 py-3 border-b last:border-0"
                  >
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-5">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
                  <div className="relative size-20 rounded-2xl bg-muted/80 flex items-center justify-center border">
                    <FolderOpen className="size-10 text-muted-foreground/60" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1.5">
                  {hasActiveFilters ? "Tidak ada hasil ditemukan" : "Belum ada arsip"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
                  {hasActiveFilters
                    ? "Coba ubah kata kunci pencarian atau filter kategori dan tanggal Anda."
                    : "Mulai dengan mengunggah dokumen pertama Anda ke sistem arsip digital ini."}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters} className="shadow-sm">
                    <X className="size-4" />
                    Hapus Semua Filter
                  </Button>
                ) : (
                  <Button onClick={() => setUploadOpen(true)} className="shadow-sm">
                    <Sparkles className="size-4" />
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
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-36 text-xs font-semibold uppercase tracking-wider">
                          Nomor Dokumen
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                          Nama Dokumen
                        </TableHead>
                        <TableHead className="w-40 text-xs font-semibold uppercase tracking-wider">
                          Kategori
                        </TableHead>
                        <TableHead className="w-44 text-xs font-semibold uppercase tracking-wider">
                          Tanggal Arsip
                        </TableHead>
                        <TableHead className="text-right w-28 text-xs font-semibold uppercase tracking-wider">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item) => {
                        const config =
                          KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG.Umum;
                        const Icon = config.icon;
                        return (
                          <TableRow
                            key={item.id}
                            className="group cursor-pointer transition-colors"
                            onClick={() => openDetail(item)}
                          >
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {item.nomorDokumen}
                            </TableCell>
                            <TableCell className="font-medium max-w-72">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`size-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0 border ${config.borderColor}`}
                                >
                                  <Icon className={`size-3.5 ${config.color}`} />
                                </div>
                                <span className="truncate">{item.namaDokumen}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`gap-1.5 text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}
                              >
                                <Icon className="size-3" />
                                {item.kategori}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3 opacity-50" />
                                {formatTanggalShort(item.tanggalArsip)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      asChild
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <a
                                        href={item.driveWebViewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="size-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Buka di Google Drive</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteDialog(item);
                                      }}
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Hapus arsip</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2.5">
                  {data.map((item) => {
                    const config =
                      KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG.Umum;
                    const Icon = config.icon;
                    return (
                      <div
                        key={item.id}
                        className="border rounded-xl p-4 space-y-3 bg-card hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
                        onClick={() => openDetail(item)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-[11px] text-muted-foreground mb-0.5">
                              {item.nomorDokumen}
                            </p>
                            <p className="font-medium text-sm leading-snug line-clamp-2">
                              {item.namaDokumen}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 gap-1 text-[11px] ${config.bgColor} ${config.color} border ${config.borderColor}`}
                          >
                            <Icon className="size-3" />
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTanggalShort(item.tanggalArsip)}
                          </p>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                                <ExternalLink className="size-3" />
                                Buka
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="size-3" />
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
                      Halaman{" "}
                      <span className="font-semibold text-foreground">
                        {pagination.page}
                      </span>{" "}
                      dari{" "}
                      <span className="font-semibold text-foreground">
                        {pagination.totalPages}
                      </span>
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={pagination.page <= 1}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                        }
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((p) => {
                          if (p === 1 || p === pagination.totalPages) return true;
                          if (Math.abs(p - pagination.page) <= 1) return true;
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
                              variant={pagination.page === item ? "default" : "outline"}
                              size="icon"
                              className="size-8"
                              onClick={() =>
                                setPagination((prev) => ({ ...prev, page: item }))
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
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
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
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="size-3.5" />
              Sistem Pengarsipan Digital — Terintegrasi dengan Google Drive
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Arsip Digital. Dibuat dengan Next.js.
            </p>
          </div>
        </div>
      </footer>

      {/* ─── Detail Dialog ──────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5">
                  <div
                    className={`size-9 rounded-lg ${
                      (KATEGORI_CONFIG[detailItem.kategori] || KATEGORI_CONFIG.Umum)
                        .bgColor
                    } flex items-center justify-center border ${
                      (KATEGORI_CONFIG[detailItem.kategori] || KATEGORI_CONFIG.Umum)
                        .borderColor
                    }`}
                  >
                    {(() => {
                      const Icon = (
                        KATEGORI_CONFIG[detailItem.kategori] || KATEGORI_CONFIG.Umum
                      ).icon;
                      return (
                        <Icon
                          className={`size-4.5 ${
                            (
                              KATEGORI_CONFIG[detailItem.kategori] ||
                              KATEGORI_CONFIG.Umum
                            ).color
                          }`}
                        />
                      );
                    })()}
                  </div>
                  Detail Arsip
                </DialogTitle>
                <DialogDescription>
                  Informasi lengkap dokumen arsip
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Nama Dokumen
                      </p>
                      <p className="text-sm font-medium leading-snug">
                        {detailItem.namaDokumen}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground mt-0.5 shrink-0 font-mono w-4 text-center">
                      #
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Nomor Dokumen
                      </p>
                      <p className="text-sm font-mono font-medium">
                        {detailItem.nomorDokumen}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {(() => {
                      const Icon = (
                        KATEGORI_CONFIG[detailItem.kategori] || KATEGORI_CONFIG.Umum
                      ).icon;
                      return <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />;
                    })()}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Kategori
                      </p>
                      <Badge
                        variant="secondary"
                        className={`gap-1 text-xs font-medium ${
                          (
                            KATEGORI_CONFIG[detailItem.kategori] ||
                            KATEGORI_CONFIG.Umum
                          ).bgColor
                        } ${
                          (
                            KATEGORI_CONFIG[detailItem.kategori] ||
                            KATEGORI_CONFIG.Umum
                          ).color
                        } border ${
                          (
                            KATEGORI_CONFIG[detailItem.kategori] ||
                            KATEGORI_CONFIG.Umum
                          ).borderColor
                        }`}
                      >
                        {(() => {
                          const Icon = (
                            KATEGORI_CONFIG[detailItem.kategori] ||
                            KATEGORI_CONFIG.Umum
                          ).icon;
                          return <Icon className="size-3" />;
                        })()}
                        {detailItem.kategori}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Tanggal Arsip
                      </p>
                      <p className="text-sm font-medium">
                        {formatTanggal(detailItem.tanggalArsip)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        ID Record
                      </p>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {detailItem.id}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={detailItem.driveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      Buka di Drive
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setDetailOpen(false);
                      openDeleteDialog(detailItem);
                    }}
                  >
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-4 text-destructive" />
              </div>
              Hapus Arsip Dokumen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Anda akan menghapus arsip{" "}
              <span className="font-semibold text-foreground">
                &quot;{itemToDelete?.namaDokumen}&quot;
              </span>{" "}
              dengan nomor{" "}
              <span className="font-mono font-semibold text-foreground">
                {itemToDelete?.nomorDokumen}
              </span>
              . Tindakan ini akan menghapus file dari Google Drive dan database
              secara permanen. Tindakan ini{" "}
              <span className="text-destructive font-semibold">
                tidak dapat dibatalkan
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting !== null}>Batal</AlertDialogCancel>
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