"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  FileText,
  HardDrive,
  Search,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Target,
  Wallet,
  ClipboardList,
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Rows3,
  MonitorUp,
  Printer,
  SquareMinus,
  Columns3,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

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

interface StatsData {
  total: number;
  "Renstra & Renja": number;
  "Laporan Kinerja": number;
  Anggaran: number;
  "Tata Usaha": number;
  Notulensi: number;
}

interface ChartDataPoint {
  month: string;
  "Renstra & Renja": number;
  "Laporan Kinerja": number;
  Anggaran: number;
  "Tata Usaha": number;
  Notulensi: number;
}

interface ActivityLog {
  id: string;
  action: string;
  target: string;
  detail: string;
  kategori: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────
const KATEGORI_OPTIONS = ["Renstra & Renja", "Laporan Kinerja", "Anggaran", "Tata Usaha", "Notulensi"] as const;

type SortField =
  | "createdAt"
  | "tanggalArsip"
  | "nomorDokumen"
  | "namaDokumen"
  | "kategori";
type SortOrder = "asc" | "desc";

const SORTABLE_COLUMNS: {
  key: SortField;
  label: string;
  shortLabel: string;
}[] = [
  { key: "nomorDokumen", label: "Nomor Dokumen", shortLabel: "Nomor" },
  { key: "namaDokumen", label: "Nama Dokumen", shortLabel: "Nama" },
  { key: "kategori", label: "Kategori", shortLabel: "Kategori" },
  { key: "tanggalArsip", label: "Tanggal Arsip", shortLabel: "Tanggal" },
];

const COLUMN_KEYS = ["nomorDokumen", "namaDokumen", "kategori", "tanggalArsip"] as const;

const COLUMN_LABELS: Record<string, string> = {
  nomorDokumen: "Nomor Dokumen",
  namaDokumen: "Nama Dokumen",
  kategori: "Kategori",
  tanggalArsip: "Tanggal Arsip",
};

const KATEGORI_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    gradient: string;
    chartColor: string;
    borderAccent: string;
  }
> = {
  "Renstra & Renja": {
    icon: Target,
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    gradient: "from-emerald-500 to-teal-600",
    chartColor: "hsl(160, 84%, 39%)",
    borderAccent: "border-l-emerald-500",
  },
  "Laporan Kinerja": {
    icon: TrendingUp,
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-500 to-orange-600",
    chartColor: "hsl(38, 92%, 50%)",
    borderAccent: "border-l-amber-500",
  },
  Anggaran: {
    icon: Wallet,
    color: "text-sky-700 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
    gradient: "from-sky-500 to-cyan-600",
    chartColor: "hsl(199, 89%, 48%)",
    borderAccent: "border-l-sky-500",
  },
  "Tata Usaha": {
    icon: FileCheck2,
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
    gradient: "from-violet-500 to-purple-600",
    chartColor: "hsl(262, 83%, 58%)",
    borderAccent: "border-l-violet-500",
  },
  Notulensi: {
    icon: ClipboardList,
    color: "text-rose-700 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800",
    gradient: "from-rose-500 to-pink-600",
    chartColor: "hsl(347, 77%, 50%)",
    borderAccent: "border-l-rose-500",
  },
};

const chartConfig: ChartConfig = {
  "Renstra & Renja": { label: "Renstra & Renja", color: "hsl(160, 84%, 39%)" },
  "Laporan Kinerja": { label: "Laporan Kinerja", color: "hsl(38, 92%, 50%)" },
  Anggaran: { label: "Anggaran", color: "hsl(199, 89%, 48%)" },
  "Tata Usaha": { label: "Tata Usaha", color: "hsl(262, 83%, 58%)" },
  Notulensi: { label: "Notulensi", color: "hsl(347, 77%, 50%)" },
};

// ─── Helpers ─────────────────────────────────────────────────
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

const formatRelativeTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return formatTanggalShort(dateStr);
};

const formatMonthLabel = (month: string) => {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB - Vercel Hobby plan body limit is 4.5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const validateFile = (file: File): string | null => {
  // Check file extension as primary check (more reliable than MIME type across browsers)
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Tipe file ".${file.name.split(".").pop()}" tidak didukung. Gunakan PDF atau gambar (JPEG, PNG, GIF, WebP).`;
  }
  // Also check MIME type if available
  if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
    return `Tipe file "${file.type}" tidak didukung. Gunakan PDF atau gambar (JPEG, PNG, GIF, WebP).`;
  }
  // Check file size for Vercel compatibility
  if (file.size > MAX_FILE_SIZE) {
    return `Ukuran file terlalu besar (${formatFileSize(file.size)}). Maksimal ${formatFileSize(MAX_FILE_SIZE)} untuk kompatibilitas hosting.`;
  }
  if (file.size === 0) {
    return "File kosong. Silakan pilih file yang valid.";
  }
  return null;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─── HighlightText Component ─────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200/70 dark:bg-yellow-500/30 rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Animated Counter Hook ───────────────────────────────────
function useAnimatedCounter(value: number, loading?: boolean, duration = 600) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (loading) return;
    const start = prevValue.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, loading, duration]);

  return loading ? null : display;
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  loading,
  showPulse,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  loading?: boolean;
  showPulse?: boolean;
}) {
  const displayValue = useAnimatedCounter(value, loading);

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`}
      />
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              {title}
              {showPulse && (
                <span
                  className="inline-block size-2 rounded-full bg-emerald-500"
                  style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                />
              )}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums transition-transform duration-300">
                {displayValue}
              </p>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              dokumen terarsip
            </p>
          </div>
          <div className="relative">
            <div
              className={`size-10 sm:size-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
              style={{
                backgroundSize: "200% 200%",
                animation: "shimmer 3s ease-in-out infinite",
              }}
            >
              <Icon className="size-5 text-white" />
            </div>
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 2s linear infinite",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sortable Header ────────────────────────────────────────
function SortableHeader({
  column,
  sortBy,
  sortOrder,
  onSort,
  hidden,
}: {
  column: { key: SortField; label: string; shortLabel: string };
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  hidden?: boolean;
}) {
  if (hidden) return null;
  const isActive = sortBy === column.key;
  return (
    <TableHead
      className={`text-xs font-semibold uppercase tracking-wider select-none transition-colors duration-200 ${
        isActive
          ? "text-primary bg-primary/5"
          : "text-muted-foreground"
      }`}
    >
      <button
        onClick={() => onSort(column.key)}
        className="flex items-center gap-1.5 hover:text-foreground transition-colors group/head"
      >
        {column.label}
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp className="size-3 text-primary" />
          ) : (
            <ArrowDown className="size-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40 group-hover/head:opacity-70 transition-opacity" />
        )}
      </button>
    </TableHead>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function ArsipDashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Data state
  const [data, setData] = useState<ArsipDokumen[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    "Renstra & Renja": 0,
    "Laporan Kinerja": 0,
    Anggaran: 0,
    "Tata Usaha": 0,
    Notulensi: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [showShortcutHint, setShowShortcutHint] = useState(false);

  // Activity log state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showActivity, setShowActivity] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    nomorDokumen: true,
    namaDokumen: true,
    kategori: true,
    tanggalArsip: true,
  });

  // CSV Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDragOver, setImportDragOver] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // UI state
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ArsipDokumen | null>(null);
  const [detailItem, setDetailItem] = useState<ArsipDokumen | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Upload form
  const [formNomor, setFormNomor] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formTanggal, setFormTanggal] = useState(todayStr());
  const [formKategori, setFormKategori] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [autoNomor, setAutoNomor] = useState(true);
  const [generatingNomor, setGeneratingNomor] = useState(false);

  const generateNomor = useCallback(async (kategori: string) => {
    if (!kategori) return;
    setGeneratingNomor(true);
    try {
      const res = await fetch(`/api/arsip/next-number?kategori=${encodeURIComponent(kategori)}`);
      const json = await res.json();
      if (res.ok && json.nomorDokumen) {
        setFormNomor(json.nomorDokumen);
        setFormErrors((p) => {
          const n = { ...p };
          delete n.nomorDokumen;
          return n;
        });
      }
    } catch {
      /* silent fallback — user can type manually */
    } finally {
      setGeneratingNomor(false);
    }
  }, []);
  const [dragOver, setDragOver] = useState(false);

  // Scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Derived
  const hasActiveFilters =
    search ||
    (kategoriFilter && kategoriFilter !== "all") ||
    tanggalDari ||
    tanggalSampai;

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setKategoriFilter("all");
    setTanggalDari("");
    setTanggalSampai("");
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Auto-deselect on filter/search/sort/limit/page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, kategoriFilter, tanggalDari, tanggalSampai, sortBy, sortOrder]);

  // ─── Scroll progress & back-to-top ─────────────────────
  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 300);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ─── Fetch functions ────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/arsip/stats");
      const json = await res.json();
      if (!res.ok) throw new Error();
      setStats(json.stats);
    } catch {
      /* silent */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const res = await fetch("/api/arsip/chart");
      const json = await res.json();
      if (!res.ok) throw new Error();
      setChartData(json.chartData || []);
    } catch {
      /* silent */
    } finally {
      setChartLoading(false);
    }
  }, []);

  const fetchActivityLog = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetch("/api/arsip/activity-log");
      const json = await res.json();
      if (!res.ok) throw new Error();
      setActivityLogs(json.logs || []);
    } catch {
      /* silent */
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });
      if (search) params.set("search", search);
      if (kategoriFilter && kategoriFilter !== "all")
        params.set("kategori", kategoriFilter);
      if (tanggalDari) params.set("tanggalDari", tanggalDari);
      if (tanggalSampai) params.set("tanggalSampai", tanggalSampai);

      const res = await fetch(`/api/arsip?${params}`);
      const json = await res.json();
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
  }, [
    pagination.page,
    pagination.limit,
    search,
    kategoriFilter,
    tanggalDari,
    tanggalSampai,
    sortBy,
    sortOrder,
    toast,
  ]);

  useEffect(() => {
    fetchData();
    fetchStats();
    fetchChart();
    fetchActivityLog();
  }, [fetchData, fetchStats, fetchChart, fetchActivityLog]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedIds(new Set());
  }, [search, kategoriFilter, tanggalDari, tanggalSampai, sortBy, sortOrder]);

  // ─── Keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setUploadOpen(true);
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleExport();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ─── First-visit keyboard hint ────────────────────────
  useEffect(() => {
    const shown = localStorage.getItem("arsip-shortcut-hint");
    if (!shown) {
      const timer = setTimeout(() => {
        setShowShortcutHint(true);
        localStorage.setItem("arsip-shortcut-hint", "1");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // ─── Actions ───────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

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
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arsip_dokumen_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Berhasil",
        description: "Data berhasil diekspor ke CSV",
      });
    } catch {
      toast({
        title: "Gagal Ekspor",
        description: "Terjadi kesalahan saat mengekspor",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleUpload = async () => {
    const errors: Record<string, string> = {};
    if (!formNomor.trim()) errors.nomorDokumen = "Nomor dokumen wajib diisi";
    if (!formNama.trim()) errors.namaDokumen = "Nama dokumen wajib diisi";
    if (!formTanggal) errors.tanggalArsip = "Tanggal arsip wajib diisi";
    if (!formKategori) errors.kategori = "Kategori wajib dipilih";
    if (!formFile) errors.file = "File wajib diunggah";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Double-check file validity before sending (in case state was bypassed)
    const fileErr = validateFile(formFile);
    if (fileErr) {
      setFormErrors({ file: fileErr });
      return;
    }

    setFormErrors({});
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("nomorDokumen", formNomor.trim());
      formData.append("namaDokumen", formNama.trim());
      formData.append("kategori", formKategori);
      formData.append("tanggalArsip", formTanggal);
      formData.append("file", formFile!);

      const res = await fetch("/api/arsip", { method: "POST", body: formData });

      // Handle cases where the response might not be JSON (e.g., Vercel 413 HTML page)
      let json: { error?: string; message?: string; data?: unknown };
      try {
        json = await res.json();
      } catch {
        if (res.status === 413 || formFile!.size > MAX_FILE_SIZE) {
          throw new Error(`Ukuran file terlalu besar (${formatFileSize(formFile!.size)}). Maksimal ${formatFileSize(MAX_FILE_SIZE)}.`);
        }
        throw new Error(`Server error (${res.status}). Silakan coba lagi.`);
      }

      if (!res.ok) throw new Error(json.error || "Gagal mengunggah");

      toast({
        title: "Berhasil",
        description: `Dokumen "${formNama}" berhasil diarsipkan`,
      });
      setFormNomor("");
      setFormNama("");
      setFormTanggal(todayStr());
      setFormKategori("");
      setFormFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadOpen(false);
      fetchData();
      fetchStats();
      fetchChart();
      fetchActivityLog();
    } catch (err) {
      toast({
        title: "Gagal Mengunggah",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch("/api/arsip/import", { method: "POST", body: formData });
      let json: { error?: string; message?: string };
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server error (${res.status}). Silakan coba lagi.`);
      }
      if (!res.ok) throw new Error(json.error || "Gagal mengimpor");
      toast({ title: "Berhasil", description: json.message });
      setImportFile(null);
      setImportOpen(false);
      if (importFileInputRef.current) importFileInputRef.current.value = "";
      fetchData();
      fetchStats();
      fetchChart();
      fetchActivityLog();
    } catch (err) {
      toast({
        title: "Gagal Impor",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleting(itemToDelete.id);
    try {
      const res = await fetch(`/api/arsip?id=${itemToDelete.id}`, {
        method: "DELETE",
      });
      let json: { error?: string };
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server error (${res.status}). Silakan coba lagi.`);
      }
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      toast({
        title: "Berhasil Dihapus",
        description: `Dokumen "${itemToDelete.namaDokumen}" telah dihapus`,
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
      fetchStats();
      fetchChart();
      fetchActivityLog();
    } catch (err) {
      toast({
        title: "Gagal Menghapus",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  // ─── Bulk Actions ──────────────────────────────────────
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((d) => d.id)));
      if (data.length > 0) {
        toast({
          title: "Semua Dipilih",
          description: `Semua ${data.length} item di halaman ini dipilih`,
        });
      }
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/arsip/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      let json: { error?: string; deletedCount?: number };
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server error (${res.status}). Silakan coba lagi.`);
      }
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      toast({
        title: "Berhasil Dihapus",
        description: `${json.deletedCount} arsip berhasil dihapus`,
      });
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
      fetchData();
      fetchStats();
      fetchChart();
      fetchActivityLog();
    } catch (err) {
      toast({
        title: "Gagal Menghapus",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setBulkDeleting(false);
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

  // ─── Render ────────────────────────────────────────────
  const allOnPageSelected =
    data.length > 0 && selectedIds.size === data.length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted/40 via-background to-muted/20">
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted print:hidden">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 print:hidden">
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
                  Arsip Digital
                </h1>
                <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                  Bagian Perencanaan — Dinas Dukcapil Kab. Ngada
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
                <TooltipContent>
                  Refresh (<kbd className="ml-1 text-[10px] opacity-60">R</kbd>)
                </TooltipContent>
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
                <TooltipContent>
                  Ekspor CSV (<kbd className="ml-1 text-[10px] opacity-60">E</kbd>)
                </TooltipContent>
              </Tooltip>
              {/* CSV Import Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9"
                    onClick={() => setImportOpen(true)}
                  >
                    <Upload className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Impor CSV</TooltipContent>
              </Tooltip>
              <ThemeToggle />
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="shadow-sm">
                    <Upload className="size-4" />
                    <span className="hidden sm:inline">Unggah Dokumen</span>
                    <span className="sm:hidden">Unggah</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
                  style={{
                    borderImage:
                      "linear-gradient(135deg, var(--primary), var(--primary) 30%, transparent 70%) 1",
                  }}
                >
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Upload className="size-4 text-primary" />
                      </div>
                      Unggah Dokumen Baru
                    </DialogTitle>
                    <DialogDescription>
                      Unggah dokumen ke arsip digital. File akan disimpan di
                      Google Drive.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="file-upload"
                        className="text-sm font-medium"
                      >
                        File Dokumen
                      </Label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                          formErrors.file
                            ? "border-destructive bg-destructive/5"
                            : dragOver
                              ? "border-primary bg-primary/10 scale-[1.02] shadow-lg"
                              : formFile
                                ? "border-primary/40 bg-primary/5 shadow-sm"
                                : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(false);
                          const f = e.dataTransfer.files[0];
                          if (f) {
                            const err = validateFile(f);
                            if (err) {
                              setFormErrors((p) => ({ ...p, file: err }));
                              return;
                            }
                            setFormFile(f);
                            setFormErrors((p) => {
                              const n = { ...p };
                              delete n.file;
                              return n;
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
                            const f = e.target.files?.[0];
                            if (f) {
                              const err = validateFile(f);
                              if (err) {
                                setFormErrors((p) => ({ ...p, file: err }));
                                e.target.value = "";
                                return;
                              }
                              setFormFile(f);
                              setFormErrors((p) => {
                                const n = { ...p };
                                delete n.file;
                                return n;
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
                                {formFile.type || "Unknown"}
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
                              <X className="size-3" /> Hapus File
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
                                PDF, JPEG, PNG, GIF, WebP (maks. 4MB)
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="nomor-dokumen"
                          className="text-sm font-medium"
                        >
                          Nomor Dokumen
                        </Label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoNomor}
                            onChange={(e) => setAutoNomor(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="size-4 rounded border border-muted-foreground/30 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors">
                            {autoNomor && (
                              <svg className="size-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">Auto-generate</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="nomor-dokumen"
                          placeholder={autoNomor ? "Pilih kategori untuk auto-generate..." : "Contoh: 001/ARS/2024"}
                          value={formNomor}
                          disabled={autoNomor && generatingNomor}
                          onChange={(e) => {
                            setFormNomor(e.target.value);
                            // If user manually edits, keep auto on but the manual value takes priority
                            if (e.target.value.trim())
                              setFormErrors((p) => {
                                const n = { ...p };
                                delete n.nomorDokumen;
                                return n;
                              });
                          }}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={!formKategori || generatingNomor}
                          onClick={() => generateNomor(formKategori)}
                          title="Generate nomor otomatis"
                        >
                          <RefreshCw className={`size-4 ${generatingNomor ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                      {formErrors.nomorDokumen && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          {formErrors.nomorDokumen}
                        </p>
                      )}
                      {autoNomor && formKategori && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="size-3" />
                          Nomor di-generate otomatis berdasarkan kategori & tahun. Klik tombol ↻ untuk refresh.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="nama-dokumen"
                        className="text-sm font-medium"
                      >
                        Nama Dokumen
                      </Label>
                      <Input
                        id="nama-dokumen"
                        placeholder="Contoh: Surat Keterangan Domisili"
                        value={formNama}
                        onChange={(e) => {
                          setFormNama(e.target.value);
                          if (e.target.value.trim())
                            setFormErrors((p) => {
                              const n = { ...p };
                              delete n.namaDokumen;
                              return n;
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
                    <div className="space-y-2">
                      <Label
                        htmlFor="tanggal-arsip"
                        className="text-sm font-medium flex items-center gap-1.5"
                      >
                        <Calendar className="size-3.5" />
                        Tanggal Arsip
                      </Label>
                      <Input
                        id="tanggal-arsip"
                        type="date"
                        value={formTanggal}
                        onChange={(e) => {
                          setFormTanggal(e.target.value);
                          if (e.target.value)
                            setFormErrors((p) => {
                              const n = { ...p };
                              delete n.tanggalArsip;
                              return n;
                            });
                        }}
                      />
                      {formErrors.tanggalArsip && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          {formErrors.tanggalArsip}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Kategori</Label>
                      <Select
                        value={formKategori}
                        onValueChange={(val) => {
                          setFormKategori(val);
                          setFormErrors((p) => {
                            const n = { ...p };
                            delete n.kategori;
                            return n;
                          });
                          if (autoNomor) {
                            generateNomor(val);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih kategori dokumen" />
                        </SelectTrigger>
                        <SelectContent>
                          {KATEGORI_OPTIONS.map((kat) => {
                            const c = KATEGORI_CONFIG[kat];
                            const I = c.icon;
                            return (
                              <SelectItem key={kat} value={kat}>
                                <div className="flex items-center gap-2">
                                  <I className="size-4" />
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
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="shadow-sm relative overflow-hidden group/btn"
                    >
                      <span className="relative z-10 flex items-center gap-1.5">
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
                      </span>
                      <span
                        className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s linear infinite",
                        }}
                      />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        {/* Animated gradient line below header */}
        <div
          className="h-0.5 w-full print:hidden"
          style={{
            background:
              "linear-gradient(90deg, var(--primary) 0%, transparent 60%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 4s ease-in-out infinite",
          }}
        />
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Arsip"
            value={stats.total}
            icon={FolderOpen}
            gradient="from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-600"
            loading={statsLoading}
            showPulse
          />
          {KATEGORI_OPTIONS.map((kat) => {
            const c = KATEGORI_CONFIG[kat];
            return (
              <StatCard
                key={kat}
                title={kat}
                value={stats[kat] || 0}
                icon={c.icon}
                gradient={c.gradient}
                loading={statsLoading}
              />
            );
          })}
        </div>

        {/* Chart Section */}
        <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm overflow-hidden print:hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => setShowChart(!showChart)}
              >
                <div className="size-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                  <BarChart3 className="size-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    Statistik Bulanan
                    <TrendingUp className="size-3.5 text-emerald-500" />
                  </CardTitle>
                  <CardDescription>
                    Distribusi dokumen per kategori setiap bulan
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {showChart && (
                  <div className="flex items-center bg-muted rounded-md p-0.5 print:hidden transition-all duration-300">
                    <button
                      onClick={() => setChartType("bar")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors transition-all duration-300 ${chartType === "bar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <BarChart3 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setChartType("pie")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors transition-all duration-300 ${chartType === "pie" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <PieChartIcon className="size-3.5" />
                    </button>
                  </div>
                )}
                <ChevronRight
                  className={`size-4 text-muted-foreground transition-transform duration-200 ${showChart ? "rotate-90" : ""} cursor-pointer`}
                  onClick={() => setShowChart(!showChart)}
                />
              </div>
            </div>
          </CardHeader>
          {showChart && (
            <CardContent className="pt-0 bg-gradient-to-b from-muted/30 to-transparent">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada data untuk ditampilkan
                </div>
              ) : chartType === "bar" ? (
                <ChartContainer
                  config={chartConfig}
                  className="h-64 w-full"
                >
                  <BarChart
                    data={chartData}
                    barGap={2}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonthLabel}
                      className="text-xs"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                    />
                    {KATEGORI_OPTIONS.map((kat) => (
                      <Bar
                        key={kat}
                        dataKey={kat}
                        fill={KATEGORI_CONFIG[kat].chartColor}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="h-64 w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={KATEGORI_OPTIONS.map((kat) => ({
                        name: kat,
                        value: stats[kat] || 0,
                        fill: KATEGORI_CONFIG[kat].chartColor,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {KATEGORI_OPTIONS.map((kat) => (
                        <Cell
                          key={kat}
                          fill={KATEGORI_CONFIG[kat].chartColor}
                        />
                      ))}
                    </Pie>
                    <Legend
                      content={<ChartLegendContent nameKey="name" />}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          )}
        </Card>

        {/* Activity Log Panel */}
        <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm overflow-hidden print:hidden">
          <CardHeader className="pb-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowActivity(!showActivity)}
            >
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 dark:from-gray-300 dark:to-gray-500 flex items-center justify-center shadow-sm">
                  <Clock className="size-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Log Aktivitas
                  </CardTitle>
                  <CardDescription>
                    Riwayat operasi terbaru pada arsip
                  </CardDescription>
                </div>
              </div>
              <ChevronRight
                className={`size-4 text-muted-foreground transition-transform duration-200 ${showActivity ? "rotate-90" : ""}`}
              />
            </div>
          </CardHeader>
          {showActivity && (
            <CardContent className="pt-0">
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="size-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Belum ada aktivitas tercatat.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                  {activityLogs.slice(0, 5).map((log) => {
                    const actionIcon =
                      log.action === "CREATE" ? PlusCircle : Trash2;
                    const actionColor =
                      log.action === "CREATE"
                        ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                        : log.action === "IMPORT"
                          ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                          : "text-destructive bg-destructive/10";
                    const ActionIcon = actionIcon;
                    return (
                      <div key={log.id} className="relative flex items-start gap-3">
                        <div
                          className={`absolute -left-6 size-[22px] rounded-full flex items-center justify-center border border-background ${actionColor} z-10`}
                        >
                          <ActionIcon className="size-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold truncate">
                              {log.target}
                            </span>
                            {log.kategori && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {log.kategori}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {log.detail}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            {formatRelativeTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {activityLogs.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs w-full mt-2"
                      onClick={() =>
                        toast({
                          title: "Segera Hadir",
                          description: "Fitur lengkap segera hadir",
                        })
                      }
                    >
                      Lihat semua ({activityLogs.length} aktivitas)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Filters */}
        <Card
          className={`shadow-sm bg-card/50 backdrop-blur-sm transition-shadow duration-300 ${hasActiveFilters ? "ring-1 ring-primary/20" : "border-0"}`}
        >
          <CardContent className="pt-5 pb-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Cari dokumen..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-10 bg-background sm:placeholder:text-muted-foreground/50"
                  />
                  <p className="hidden sm:block text-[10px] text-muted-foreground/50 mt-1 pl-1">
                    Tekan <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[9px]">/</kbd> untuk fokus
                  </p>
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
                      const c = KATEGORI_CONFIG[kat];
                      const I = c.icon;
                      return (
                        <SelectItem key={kat} value={kat}>
                          <span className="flex items-center gap-2">
                            <I className="size-4" />
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
                  <Button
                    type="submit"
                    size="icon"
                    className="size-10 shrink-0 shadow-sm"
                  >
                    <Search className="size-4" />
                  </Button>
                </div>
              </div>

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
                      <X className="size-3" /> Reset
                    </Button>
                  )}
                </div>
              )}

              {hasActiveFilters && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Filter className="size-3" />Filter aktif:
                  </span>
                  {search && (
                    <Badge
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      &quot;{search}&quot;
                      <button
                        onClick={() => {
                          setSearchInput("");
                          setSearch("");
                        }}
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}
                  {kategoriFilter && kategoriFilter !== "all" && (
                    <Badge
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      {kategoriFilter}
                      <button onClick={() => setKategoriFilter("all")}>
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}
                  {(tanggalDari || tanggalSampai) && (
                    <Badge
                      variant="secondary"
                      className="text-xs gap-1"
                    >
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

        {/* Data Table */}
        <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm print:shadow-none print:border print:bg-transparent">
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
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground print:hidden">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">
                    /
                  </kbd>{" "}
                  cari
                  <kbd className="ml-1.5 px-1.5 py-0.5 rounded border bg-muted font-mono">
                    N
                  </kbd>{" "}
                  unggah
                  <kbd className="ml-1.5 px-1.5 py-0.5 rounded border bg-muted font-mono">
                    E
                  </kbd>{" "}
                  ekspor
                </div>
                {/* Column Visibility Toggle */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 print:hidden"
                        >
                          <Columns3 className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Toggle kolom</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">
                      Tampilkan Kolom
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {COLUMN_KEYS.map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={visibleColumns[key] ?? true}
                        onCheckedChange={(checked) =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [key]: !!checked,
                          }))
                        }
                        className="text-sm"
                      >
                        {COLUMN_LABELS[key]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 print:hidden"
                  onClick={() => window.print()}
                >
                  <Printer className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-2 py-3 border-b last:border-0"
                  >
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden">
                {/* Floating animated dots */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-primary/20"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        animation: `floatDot ${3 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="relative mb-5">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
                  <div className="relative size-20 rounded-2xl bg-muted/80 flex items-center justify-center border">
                    <FolderOpen className="size-10 text-muted-foreground/60" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1.5">
                  {hasActiveFilters
                    ? "Tidak ada hasil ditemukan"
                    : "Belum ada arsip"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
                  {hasActiveFilters
                    ? "Coba ubah kata kunci pencarian atau filter."
                    : "Mulai dengan mengunggah dokumen pertama Anda."}
                </p>
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="shadow-sm"
                  >
                    <X className="size-4" />Hapus Semua Filter
                  </Button>
                ) : (
                  <Button
                    onClick={() => setUploadOpen(true)}
                    className="shadow-sm"
                  >
                    <Sparkles className="size-4" />Unggah Dokumen Pertama
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
                        {/* Checkbox column */}
                        <TableHead className="w-10 print:hidden">
                          <Checkbox
                            checked={
                              data.length > 0 ? allOnPageSelected : false
                            }
                            onCheckedChange={toggleSelectAll}
                            aria-label="Pilih semua"
                          />
                        </TableHead>
                        {SORTABLE_COLUMNS.map((col) => (
                          <SortableHeader
                            key={col.key}
                            column={col}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            hidden={!visibleColumns[col.key]}
                          />
                        ))}
                        <TableHead className="text-right w-28 text-xs font-semibold uppercase tracking-wider">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item, index) => {
                        const cfg =
                          KATEGORI_CONFIG[item.kategori] || {
                            icon: FileText,
                            color: "text-muted-foreground",
                            bgColor: "bg-muted",
                            borderColor: "border-muted",
                            gradient: "from-gray-500 to-gray-600",
                            chartColor: "hsl(0, 0%, 50%)",
                            borderAccent: "border-l-gray-400",
                          };
                        const Icon = cfg.icon;
                        const isSelected = selectedIds.has(item.id);
                        return (
                          <TableRow
                            key={item.id}
                            className={`group cursor-pointer transition-all duration-200 border-l-2 ${cfg.borderAccent} hover:-translate-y-px hover:shadow-md group-hover:shadow-[inset_4px_0_0_var(--color-primary)] ${index % 2 === 0 ? "bg-muted/20" : ""} ${isSelected ? "bg-primary/5 border-l-primary" : ""} animate-[fadeInRow_0.3s_ease-out_forwards] opacity-0`}
                            style={{
                              animationDelay: `${index * 30}ms`,
                            }}
                            onClick={() => openDetail(item)}
                          >
                            <TableCell className="print:hidden">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectOne(item.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Pilih ${item.namaDokumen}`}
                              />
                            </TableCell>
                            <TableCell className={`font-mono text-sm text-muted-foreground ${!visibleColumns.nomorDokumen ? "hidden" : ""}`}>
                              <HighlightText text={item.nomorDokumen} query={search} />
                            </TableCell>
                            <TableCell className={`font-medium max-w-72 ${!visibleColumns.namaDokumen ? "hidden" : ""}`}>
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`size-8 rounded-lg ${cfg.bgColor} flex items-center justify-center shrink-0 border ${cfg.borderColor} transition-transform duration-200 group-hover:scale-110`}
                                >
                                  <Icon
                                    className={`size-3.5 ${cfg.color}`}
                                  />
                                </div>
                                <span className="truncate">
                                  <HighlightText text={item.namaDokumen} query={search} />
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className={`${!visibleColumns.kategori ? "hidden" : ""}`}>
                              <Badge
                                variant="secondary"
                                className={`gap-1.5 text-xs font-medium ${cfg.bgColor} ${cfg.color} border ${cfg.borderColor}`}
                              >
                                <Icon className="size-3" />
                                {item.kategori}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-muted-foreground text-sm ${!visibleColumns.tanggalArsip ? "hidden" : ""}`}>
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3 opacity-50" />
                                {formatTanggalShort(item.tanggalArsip)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
                                  <TooltipContent>
                                    Buka di Google Drive
                                  </TooltipContent>
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
                                  <TooltipContent>
                                    Hapus arsip
                                  </TooltipContent>
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
                    const cfg =
                      KATEGORI_CONFIG[item.kategori] || {
                        icon: FileText,
                        color: "text-muted-foreground",
                        bgColor: "bg-muted",
                        borderColor: "border-muted",
                        gradient: "from-gray-500 to-gray-600",
                        chartColor: "hsl(0, 0%, 50%)",
                        borderAccent: "border-l-gray-400",
                      };
                    const Icon = cfg.icon;
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`relative border rounded-xl p-4 space-y-3 bg-card hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99] overflow-hidden ${isSelected ? "ring-1 ring-primary/30 bg-primary/5" : ""}`}
                        onClick={() => openDetail(item)}
                      >
                        {/* Gradient overlay at top */}
                        <div
                          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cfg.gradient} opacity-60`}
                        />
                        {/* Checkbox on top-left */}
                        <div className="absolute top-3 left-3 print:hidden">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOne(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Pilih ${item.namaDokumen}`}
                          />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 pl-6">
                            <p className="font-mono text-[11px] text-muted-foreground mb-0.5">
                              <HighlightText text={item.nomorDokumen} query={search} />
                            </p>
                            <p className="font-medium text-sm leading-snug line-clamp-2">
                              <HighlightText text={item.namaDokumen} query={search} />
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 gap-1 text-[11px] ${cfg.bgColor} ${cfg.color} border ${cfg.borderColor}`}
                          >
                            <Icon className="size-3" />
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTanggalShort(item.tanggalArsip)}
                          </p>
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                <ExternalLink className="size-3" />Buka
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                        {/* Swipe-to-delete visual hint */}
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-destructive/10 flex items-center justify-center opacity-0 group-hover/row:opacity-100 pointer-events-none">
                          <Trash2 className="size-3.5 text-destructive/40" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {(pagination.totalPages > 1 || pagination.total > 0) && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-4 border-t gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                      {pagination.totalPages > 1 && (
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
                      )}
                      <div className="flex items-center gap-1.5">
                        <Rows3 className="size-3.5 text-muted-foreground" />
                        <Select
                          value={String(pagination.limit)}
                          onValueChange={(v) =>
                            setPagination((p) => ({
                              ...p,
                              limit: parseInt(v),
                              page: 1,
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 w-16 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 25, 50].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n} / hal
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={pagination.page <= 1}
                          onClick={() =>
                            setPagination((p) => ({
                              ...p,
                              page: p.page - 1,
                            }))
                          }
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        {Array.from(
                          { length: pagination.totalPages },
                          (_, i) => i + 1,
                        )
                          .filter(
                            (p) =>
                              p === 1 ||
                              p === pagination.totalPages ||
                              Math.abs(p - pagination.page) <= 1,
                          )
                          .reduce<(number | "ellipsis")[]>(
                            (acc, p, i, arr) => {
                              if (
                                i > 0 &&
                                p - (arr[i - 1] as number) > 1
                              )
                                acc.push("ellipsis");
                              acc.push(p);
                              return acc;
                            },
                            [],
                          )
                          .map((item, i) =>
                            item === "ellipsis" ? (
                              <span
                                key={`e-${i}`}
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
                                  setPagination((p) => ({
                                    ...p,
                                    page: item,
                                  }))
                                }
                              >
                                {item}
                              </Button>
                            ),
                          )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={
                            pagination.page >= pagination.totalPages
                          }
                          onClick={() =>
                            setPagination((p) => ({
                              ...p,
                              page: p.page + 1,
                            }))
                          }
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-20 right-6 z-30 size-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center print:hidden transition-all duration-300 hover:scale-110 active:scale-95 ${showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        aria-label="Kembali ke atas"
      >
        <ArrowUp className="size-5" />
      </button>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 print:hidden"
          style={{ animation: "slideUp 0.25s ease-out" }}
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border bg-background/80 backdrop-blur-xl shadow-2xl">
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedIds.size} dokumen dipilih
            </span>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 shadow-sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Hapus Terpilih
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkDeleting}
            >
              <SquareMinus className="size-4" />
              Batal Pilih
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Toast */}
      {showShortcutHint && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 print:hidden">
          <div className="bg-popover text-popover-foreground rounded-lg border shadow-lg px-4 py-3 text-sm">
            <p className="font-medium mb-1.5 flex items-center gap-1.5">
              <MonitorUp className="size-4 text-emerald-500" />
              Pintasan Keyboard
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                <kbd className="px-1 py-0.5 rounded border bg-muted/50 font-mono text-[10px]">
                  /
                </kbd>{" "}
                Cari
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded border bg-muted/50 font-mono text-[10px]">
                  N
                </kbd>{" "}
                Unggah
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded border bg-muted/50 font-mono text-[10px]">
                  E
                </kbd>{" "}
                Ekspor
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top section: 3-column grid */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-8 py-8">
            <div>
              <h3 className="text-sm font-semibold mb-2">Arsip Digital</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bagian Perencanaan — Dinas Kependudukan dan Pencatatan Sipil Kabupaten Ngada
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Fitur</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/50" />
                  Upload & Arsip
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/50" />
                  Pencarian Cerdas
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/50" />
                  Ekspor CSV/Impor
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/50" />
                  Statistik Visual
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Teknologi</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-500/50" />
                  Next.js 16
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-amber-500/50" />
                  Google Drive API
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-sky-500/50" />
                  Prisma ORM
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-violet-500/50" />
                  shadcn/ui
                </li>
              </ul>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="border-t py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                © {new Date().getFullYear()} Dinas Dukcapil Kab. Ngada
              </p>
              <p className="text-xs text-muted-foreground">
                Bagian Perencanaan — Dibuat dengan <span className="font-medium">Next.js</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {detailItem &&
            (() => {
              const cfg =
                KATEGORI_CONFIG[detailItem.kategori] || {
                  icon: FileText,
                  color: "text-muted-foreground",
                  bgColor: "bg-muted",
                  borderColor: "border-muted",
                  gradient: "from-gray-500 to-gray-600",
                  chartColor: "hsl(0, 0%, 50%)",
                  borderAccent: "border-l-gray-400",
                };
              const DIcon = cfg.icon;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2.5">
                      <div
                        className={`size-9 rounded-lg ${cfg.bgColor} flex items-center justify-center border ${cfg.borderColor}`}
                      >
                        <DIcon className={`size-4 ${cfg.color}`} />
                      </div>
                      Detail Arsip
                    </DialogTitle>
                    <DialogDescription>
                      Informasi lengkap dokumen arsip
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {[
                      {
                        icon: FileText,
                        label: "Nama Dokumen",
                        value: detailItem.namaDokumen,
                        mono: false,
                      },
                      {
                        icon: null,
                        label: "Nomor Dokumen",
                        value: detailItem.nomorDokumen,
                        mono: true,
                      },
                      {
                        icon: DIcon,
                        label: "Kategori",
                        value: detailItem.kategori,
                        badge: true,
                      },
                      {
                        icon: Calendar,
                        label: "Tanggal Arsip",
                        value: formatTanggal(detailItem.tanggalArsip),
                      },
                      {
                        icon: Info,
                        label: "ID Record",
                        value: detailItem.id,
                        mono: true,
                        small: true,
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        {row.icon ? (
                          <row.icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                        ) : (
                          <span className="text-xs text-muted-foreground mt-0.5 shrink-0 font-mono w-4 text-center">
                            #
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">
                            {row.label}
                          </p>
                          {row.badge ? (
                            <Badge
                              variant="secondary"
                              className={`gap-1 text-xs font-medium ${cfg.bgColor} ${cfg.color} border ${cfg.borderColor}`}
                            >
                              <DIcon className="size-3" />
                              {row.value}
                            </Badge>
                          ) : (
                            <p
                              className={`text-sm font-medium leading-snug ${row.mono ? "font-mono" : ""} ${row.small ? "text-xs !font-medium !text-muted-foreground" : ""}`}
                            >
                              {row.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  {/* Document Preview */}
                  <div className="rounded-lg overflow-hidden border bg-muted/30 print:hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Pratinjau Dokumen
                      </span>
                      <a
                          href={detailItem.driveWebViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Buka di tab baru
                          <ExternalLink className="size-3" />
                        </a>
                    </div>
                    <iframe
                        src={`https://drive.google.com/file/d/${detailItem.driveFileId}/preview`}
                        className="w-full h-64 sm:h-80 border-0"
                        title="Pratinjau dokumen"
                        loading="lazy"
                      />
                  </div>
                  <Separator />
                  <DialogFooter className="gap-2 print:hidden">
                    <Button variant="outline" className="flex-1" asChild>
                        <a
                          href={detailItem.driveWebViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />Buka di Drive
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
                      <Trash2 className="size-4" />Hapus
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation (Single) */}
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
              . Tindakan ini{" "}
              <span className="text-destructive font-semibold">
                tidak dapat dibatalkan
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
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
                  <Loader2 className="size-4 animate-spin" />Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />Hapus Permanen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-4 text-destructive" />
              </div>
              Hapus Arsip Terpilih?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Anda akan menghapus{" "}
              <span className="font-semibold text-foreground">
                {selectedIds.size}
              </span>{" "}
              arsip dokumen secara permanen. Tindakan ini{" "}
              <span className="text-destructive font-semibold">
                tidak dapat dibatalkan
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={bulkDeleting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={bulkDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Hapus {selectedIds.size} Arsip
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="size-4 text-primary" />
              </div>
              Impor Data dari CSV
            </DialogTitle>
            <DialogDescription>
              Unggah file CSV untuk menambahkan dokumen arsip secara massal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Sample CSV format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Format CSV</Label>
              <div className="rounded-lg bg-muted/50 border p-3 overflow-x-auto">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre">
{`nomorDokumen,namaDokumen,kategori,tanggalArsip,driveFileId,driveWebViewLink
001/TEST/2024,Dokumen Test,"Renstra & Renja",2024-01-15,fileId123,https://drive.google.com/...`}
                </pre>
              </div>
            </div>
            {/* CSV file upload dropzone */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">File CSV</Label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  importDragOver
                    ? "border-primary bg-primary/10 scale-[1.02] shadow-lg"
                    : importFile
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30"
                }`}
                onClick={() => importFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImportDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImportDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImportDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f && f.name.endsWith(".csv")) {
                    setImportFile(f);
                  } else {
                    toast({
                      title: "Format Tidak Didukung",
                      description: "Hanya file CSV yang diizinkan.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <input
                  ref={importFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setImportFile(f);
                    }
                  }}
                />
                {importFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {importFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(importFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImportFile(null);
                        if (importFileInputRef.current)
                          importFileInputRef.current.value = "";
                      }}
                    >
                      <X className="size-3" /> Hapus File
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Klik atau seret file CSV ke sini
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hanya file .csv yang diizinkan
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportOpen(false);
                setImportFile(null);
                if (importFileInputRef.current)
                  importFileInputRef.current.value = "";
              }}
              disabled={importing}
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || !importFile}
              className="shadow-sm"
            >
              {importing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Impor CSV
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}