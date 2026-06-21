// src/lib/finance-categories.ts

export const EXPENSE_CATEGORIES = {
  Needs: [
    { id: "makanan", label: "Makanan & Minuman", icon: "🍴" },
    { id: "transportasi", label: "Transportasi", icon: "🚗" },
    { id: "motor", label: "Motor & Kendaraan", icon: "🏍️" },
    { id: "listrik", label: "Tagihan Listrik", icon: "⚡" },
    { id: "air", label: "Tagihan Air", icon: "💧" },
    { id: "pendidikan", label: "Pendidikan", icon: "🎓" },
    { id: "kesehatan", label: "Kesehatan", icon: "🏥" },
    { id: "komunikasi", label: "Tagihan Internet/HP", icon: "📱" },
    { id: "sewa", label: "Sewa Tempat Tinggal", icon: "🏠" },
    { id: "tagihan", label: "Tagihan Lainnya", icon: "📝" },
  ],
  Wants: [
    { id: "hiburan", label: "Hiburan & Hobi", icon: "🎮" },
    { id: "belanja", label: "Belanja Gaya Hidup", icon: "🛍️" },
    { id: "traveling", label: "Traveling", icon: "✈️" },
    { id: "gadget", label: "Gadget & Aksesoris", icon: "💻" },
    { id: "membership", label: "Langganan Layanan", icon: "📺" },
    { id: "rokok", label: "Rokok", icon: "🚬" },
    { id: "cemilan", label: "Cemilan", icon: "🍿" },
  ],
  Business: [
    { id: "ops_kantor", label: "Operasional Kantor", icon: "🏢" },
    { id: "pemasaran", label: "Pemasaran & Iklan", icon: "📣" },
    { id: "gaji", label: "Gaji Karyawan", icon: "👥" },
    { id: "server", label: "Hosting/Server", icon: "🌐" },
  ]
};

export const INCOME_CATEGORIES = [
  { id: "gaji", label: "Gaji Utama", icon: "💰" },
  { id: "freelance", label: "Proyek Freelance", icon: "🔨" },
  { id: "bisnis", label: "Hasil Bisnis", icon: "📈" },
  { id: "investasi", label: "Hasil Investasi", icon: "🏦" },
];

export const ALLOCATION_CATEGORIES = [
  { id: "utang_baru", label: "Tambah Utang", icon: "📥" },
  { id: "darurat", label: "Dana Darurat", icon: "🛡️" },
  { id: "utang", label: "Pelunasan Utang", icon: "💳" },
  { id: "investasi", label: "Investasi", icon: "💎" },
];
