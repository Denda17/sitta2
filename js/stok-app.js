new Vue({
    el: '#app',
    data: {
        upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
        kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
        stok: [
            {
                kode: "EKMA4116",
                judul: "Pengantar Manajemen",
                kategori: "MK Wajib",
                upbjj: "Jakarta",
                lokasiRak: "R1-A3",
                harga: 65000,
                qty: 28,
                safety: 20,
                catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
            },
            {
                kode: "EKMA4115",
                judul: "Pengantar Akuntansi",
                kategori: "MK Wajib",
                upbjj: "Jakarta",
                lokasiRak: "R1-A4",
                harga: 60000,
                qty: 7,
                safety: 15,
                catatanHTML: "<strong>Cover baru</strong>"
            },
            {
                kode: "BIOL4201",
                judul: "Biologi Umum (Praktikum)",
                kategori: "Praktikum",
                upbjj: "Surabaya",
                lokasiRak: "R3-B2",
                harga: 80000,
                qty: 12,
                safety: 10,
                catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
            },
            {
                kode: "FISIP4001",
                judul: "Dasar-Dasar Sosiologi",
                kategori: "MK Pilihan",
                upbjj: "Makassar",
                lokasiRak: "R2-C1",
                harga: 55000,
                qty: 2,
                safety: 8,
                catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
            },
            {
                kode: "ISIP4215",
                judul: "Pengantar Statistik Sosial",
                kategori: "MK Wajib",
                upbjj: "Padang",
                lokasiRak: "R4-A1",
                harga: 70000,
                qty: 0,
                safety: 10,
                catatanHTML: "<span style='color:red;'>Kosong total</span>"
            }
        ],
        filter: {
            upbjj: "",
            kategori: "",
            sortBy: "judul",
            warningOnly: false
        },
        showAddModal: false,
        isEditMode: false,
        formData: {
            kode: "",
            judul: "",
            kategori: "",
            upbjj: "",
            lokasiRak: "",
            harga: 0,
            qty: 0,
            safety: 0,
            catatanHTML: ""
        },
        toast: {
            show: false,
            message: "",
            type: "success"
        },
        user: null
    },
    created() {
        const userData = localStorage.getItem('sitta_user');
        if (userData) {
            this.user = JSON.parse(userData);
        }
    },
    computed: {
        filteredAndSortedStok() {
            // Filter
            let result = this.stok.filter(item => {
                let matchUpbjj = true;
                let matchKategori = true;
                let matchWarning = true;

                if (this.filter.upbjj) {
                    matchUpbjj = item.upbjj === this.filter.upbjj;
                }
                
                // Dependent option logic: only apply kategori filter if upbjj is selected
                // (though practically we can just hide the dropdown, but we also clear it in watcher)
                if (this.filter.upbjj && this.filter.kategori) {
                    matchKategori = item.kategori === this.filter.kategori;
                }

                if (this.filter.warningOnly) {
                    matchWarning = (item.qty < item.safety) || (item.qty === 0);
                }

                return matchUpbjj && matchKategori && matchWarning;
            });

            // Sort
            result = result.sort((a, b) => {
                if (this.filter.sortBy === 'judul') {
                    return a.judul.localeCompare(b.judul);
                } else if (this.filter.sortBy === 'stok') {
                    return a.qty - b.qty;
                } else if (this.filter.sortBy === 'harga') {
                    return a.harga - b.harga;
                }
                return 0;
            });

            return result;
        }
    },
    watch: {
        // Watcher 1: Mengosongkan filter kategori jika filter UT-Daerah diubah/dikosongkan
        'filter.upbjj': function(newVal) {
            if (!newVal) {
                this.filter.kategori = ""; // Reset kategori
            }
        },
        // Watcher 2: Memantau qty saat tambah/edit. Jika 0, bisa tambahkan catatan
        'formData.qty': function(newVal) {
            if (newVal === 0 && !this.formData.catatanHTML) {
                this.formData.catatanHTML = "<em>Stok habis</em>";
            }
        }
    },
    methods: {
        logout() {
            localStorage.removeItem('sitta_user');
            window.location.href = 'index.html';
        },
        deleteItem(item) {
            if (confirm(`Apakah Anda yakin ingin menghapus stok bahan ajar "${item.judul}" (${item.kode})?`)) {
                this.stok = this.stok.filter(s => s.kode !== item.kode);
                this.showToast("Stok bahan ajar berhasil dihapus!", "success");
            }
        },
        resetFilter() {
            this.filter.upbjj = "";
            this.filter.kategori = "";
            this.filter.sortBy = "judul";
            this.filter.warningOnly = false;
        },
        editItem(item) {
            this.isEditMode = true;
            this.showAddModal = true;
            // Copy data to form
            this.formData = { ...item };
        },
        closeModal() {
            this.showAddModal = false;
            this.isEditMode = false;
            this.resetForm();
        },
        resetForm() {
            this.formData = {
                kode: "",
                judul: "",
                kategori: "",
                upbjj: "",
                lokasiRak: "",
                harga: 0,
                qty: 0,
                safety: 0,
                catatanHTML: ""
            };
        },
        showToast(message, type = "success") {
            this.toast.message = message;
            this.toast.type = type;
            this.toast.show = true;
            setTimeout(() => {
                this.toast.show = false;
            }, 3500);
        },
        saveData() {
            if (this.isEditMode) {
                // Update
                const index = this.stok.findIndex(s => s.kode === this.formData.kode);
                if (index !== -1) {
                    this.$set(this.stok, index, { ...this.formData });
                    this.showToast("Data stok berhasil diperbarui!", "success");
                }
            } else {
                // Tambah validasi kode kembar
                const exists = this.stok.find(s => s.kode === this.formData.kode);
                if (exists) {
                    this.showToast("Kode Mata Kuliah sudah ada!", "error");
                    return;
                }
                // Add
                this.stok.push({ ...this.formData });
                this.showToast("Stok baru berhasil ditambahkan!", "success");
            }
            this.closeModal();
        }
    }
});
