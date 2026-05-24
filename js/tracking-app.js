new Vue({
    el: '#app',
    data: {
        pengirimanList: [
            { kode: "REG", nama: "JNE Regular (3-5 hari)" },
            { kode: "EXP", nama: "JNE Express (1-2 hari)" }
        ],
        paket: [
            { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116","EKMA4115"], harga: 120000 },
            { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201","FISIP4001"], harga: 140000 }
        ],
        tracking: {
            "DO2025-001": {
                nim: "123456789",
                nama: "Rina Wulandari",
                status: "Dalam Perjalanan",
                ekspedisi: "JNE Regular (3-5 hari)",
                tanggalKirim: "2025-08-25",
                paket: "PAKET-UT-001",
                total: 120000,
                perjalanan: [
                    { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
                    { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
                    { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" }
                ]
            }
        },
        showAddModal: false,
        showDetailModal: false,
        selectedDoNumber: "",
        selectedDo: null,
        searchQuery: "",
        hasSearched: false,
        searchResult: null,
        formData: {
            nim: "",
            nama: "",
            ekspedisi: "",
            paketKode: "",
            tanggalKirim: new Date().toISOString().split('T')[0] // auto date hari ini
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
        // Computed Property 1: Generate DO Number otomatis
        generatedDoNumber() {
            const keys = Object.keys(this.tracking);
            let yearToUse = new Date().getFullYear();
            
            // Cari sequence terbesar dari data yang ada
            let maxSeq = 0;
            keys.forEach(key => {
                const parts = key.split('-');
                if (parts.length === 2 && key.startsWith('DO')) {
                    const seq = parseInt(parts[1], 10);
                    if (seq > maxSeq) {
                        maxSeq = seq;
                        // Gunakan tahun dari data terakhir
                        yearToUse = parts[0].replace('DO', '');
                    }
                }
            });

            // Increment sequence
            const nextSeq = maxSeq + 1;
            const seqString = nextSeq.toString().padStart(3, '0');
            return `DO${yearToUse}-${seqString}`;
        },
        // Computed Property 2: Mendapatkan rincian paket yang dipilih
        selectedPaketDetail() {
            if (!this.formData.paketKode) return null;
            return this.paket.find(p => p.kode === this.formData.paketKode);
        }
    },
    watch: {
        // Watcher 1: Mensimulasikan auto-fill Nama Mahasiswa ketika NIM yang valid diinputkan
        'formData.nim': function(newNim) {
            if (newNim === "123456789") {
                this.formData.nama = "Rina Wulandari";
                this.showToast("Mahasiswa ditemukan: Rina Wulandari", "success");
            }
        },
        // Watcher 2: Memantau perubahan ekspedisi. Jika ekspedisi dipilih dan tanggal kirim kosong, otomatis diisi hari ini
        'formData.ekspedisi': function(newEks) {
            if (newEks && !this.formData.tanggalKirim) {
                this.formData.tanggalKirim = new Date().toISOString().split('T')[0];
            }
        }
    },
    methods: {
        logout() {
            localStorage.removeItem('sitta_user');
            window.location.href = 'index.html';
        },
        deleteDO(doNumber) {
            if (confirm(`Apakah Anda yakin ingin menghapus dokumen Delivery Order "${doNumber}"?`)) {
                this.$delete(this.tracking, doNumber);
                this.showToast("Delivery Order berhasil dihapus!", "success");
            }
        },
        searchDO() {
            const query = this.searchQuery.trim().toUpperCase();
            if (!query) {
                this.hasSearched = false;
                this.searchResult = null;
                return;
            }
            this.hasSearched = true;
            if (this.tracking[query]) {
                this.searchResult = this.tracking[query];
                this.showToast("Nomor DO ditemukan!", "success");
            } else {
                // Cari case-insensitive
                const foundKey = Object.keys(this.tracking).find(k => k.toUpperCase() === query);
                if (foundKey) {
                    this.searchResult = this.tracking[foundKey];
                    this.showToast("Nomor DO ditemukan!", "success");
                } else {
                    this.searchResult = null;
                    this.showToast("Nomor DO tidak ditemukan!", "error");
                }
            }
        },
        viewDetail(doNumber, doItem) {
            this.selectedDoNumber = doNumber;
            this.selectedDo = doItem;
            this.showDetailModal = true;
        },
        closeAddModal() {
            this.showAddModal = false;
            this.resetForm();
        },
        resetForm() {
            this.formData = {
                nim: "",
                nama: "",
                ekspedisi: "",
                paketKode: "",
                tanggalKirim: new Date().toISOString().split('T')[0]
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
        submitDO() {
            const newDoNumber = this.generatedDoNumber;
            const paketInfo = this.selectedPaketDetail;
            
            if (!paketInfo) {
                this.showToast("Silakan pilih paket bahan ajar!", "error");
                return;
            }

            // Menyimpan DO baru ke dalam state object tracking dengan Vue.set untuk reaktivitas
            this.$set(this.tracking, newDoNumber, {
                nim: this.formData.nim,
                nama: this.formData.nama,
                status: "Pesanan Sedang Diproses",
                ekspedisi: this.formData.ekspedisi,
                tanggalKirim: this.formData.tanggalKirim,
                paket: paketInfo.kode,
                total: paketInfo.harga,
                perjalanan: [
                    {
                        waktu: new Date().toLocaleString('id-ID'),
                        keterangan: "Pesanan DO baru berhasil dibuat dan masuk sistem."
                    }
                ]
            });

            this.closeAddModal();
            this.showToast("Berhasil membuat Delivery Order: " + newDoNumber, "success");
        }
    }
});
