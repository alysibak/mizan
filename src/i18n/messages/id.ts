import type { Messages } from "./en";

const id: Messages = {
  common: {
    nav: {
      calculator: "Kalkulator",
      method: "Metode",
      signIn: "Masuk",
      openLedger: "Buka pembukuan",
    },
    footer: {
      disclaimer:
        "Alat bantu perkiraan pribadi, bukan pengganti bimbingan ulama. Untuk keadaan Anda, tanyakan kepada orang berilmu yang berkompeten.",
      calculator: "Kalkulator zakat",
      nisab: "Nisab hari ini",
      toolsHeading: "Alat gratis",
      aboutHeading: "Tentang",
      inheritance: "Kalkulator waris",
      fitr: "Zakat fitrah",
      stocks: "Penyaring saham syariah",
      qurbani: "Patungan kurban",
      method: "Cara angka dihitung",
      trust: "Apa yang terverifikasi",
      privacy: "Privasi",
      terms: "Ketentuan",
      languages: "Bahasa",
    },
    inEnglish: " (dalam bahasa Inggris)",
  },

  landing: {
    metaTitle: "Mizan: kalkulator zakat dan pembukuan gratis",
    metaDescription:
      "Kalkulator zakat dan pembukuan yang gratis dan privat. Bandingkan harta Anda dengan nisab, pantau haul dengan kalender Hijriah, catat zakat dan sedekah, dan tutup setiap tahun dengan laporan yang jelas.",
    eyebrow: "الميزان · timbangan",
    title: "Zakat, dihitung dengan cermat.",
    lede: "Kalkulator zakat dan pembukuan yang gratis dan privat. Timbang harta Anda terhadap nisab dengan harga logam terkini, pantau haul dengan kalender Hijriah, dan tutup setiap tahun dengan angka yang bisa Anda percayai.",
    ctaCalculate: "Hitung zakat Anda",
    ctaLedger: "Buka pembukuan gratis",
    trustLine: "Gratis · Tanpa iklan · Tanpa koneksi bank · Ekspor atau hapus data Anda kapan saja",
    sample: {
      aria: "Contoh hasil zakat",
      due: "Zakat wajib",
      summary: "2,5% dari {net}, di atas nisab perak",
      cash: "Uang tunai dan bank",
      gold: "Emas, 40 g 22 karat",
      funds: "Reksa dana jangka panjang, 25% dari {amount}",
      debts: "Utang jatuh tempo",
      caption: "Angka contoh.",
    },
    featuresEyebrow: "Sepanjang tahun zakat",
    featuresTitle: "Lebih dari sekadar hitungan sekali",
    featuresLede:
      "Kebanyakan kalkulator melupakan Anda begitu tab ditutup. Mizan menyimpan tahun Anda: kapan haul dimulai, apa yang Anda miliki, apa yang sudah diberikan, dan apa yang masih terutang.",
    features: [
      {
        title: "Nisab terkini",
        body: "Harga emas dan perak hari ini dalam mata uang Anda, dengan kedua standar berdampingan. Anda yang memilih mana yang berlaku.",
      },
      {
        title: "Haul Anda, dengan kalender Hijriah",
        body: "Hitung tahun qamariah sejak hari harta Anda mencapai nisab, dengan kalender tabular atau Ummul Qura, lengkap dengan pengingat di aplikasi kalender Anda.",
      },
      {
        title: "Pembukuan yang memahami zakat",
        body: "Uang tunai, emas dan perak menurut berat dan karat, saham, kripto, barang dagangan, piutang, dan harta dalam mata uang lain.",
      },
      {
        title: "Semua pemberian di satu tempat",
        body: "Zakat, sedekah, zakat fitrah, dan pembersihan harta, dengan delapan asnaf. Lihat apa yang sudah dibayar dan yang masih terutang pada siklus ini.",
      },
      {
        title: "Tutup tahun dengan cermat",
        body: "Bekukan angka tahun ini, cetak laporan, mulai haul berikutnya, dan tinggalkan surat untuk diri Anda tahun depan.",
      },
      {
        title: "Di ponsel Anda",
        body: "Pasang dari peramban seperti aplikasi. Mode terang dan gelap, mudah dibaca semua orang, tanpa perlu toko aplikasi.",
      },
    ],
    honestEyebrow: "Jujur soal perbedaan pendapat",
    honestTitle: "Mazhab Anda, pilihan Anda",
    honestBody:
      "Di mana ulama berbeda pendapat (nisab emas atau perak, perhiasan yang dipakai, saham jangka panjang, dana pensiun, utang), Mizan menunjukkan perbedaannya dan membiarkan Anda memilih, bukan memutuskan untuk Anda. Ini alat bantu perkiraan, bukan fatwa, dan dinyatakan dengan jelas.",
    privateEyebrow: "Privat sejak rancangan",
    privateTitle: "Harta Anda tetap milik Anda",
    privateItems: [
      "Tanpa iklan, tanpa menjual data, tanpa login bank.",
      "Kalkulator berjalan di peramban Anda dan tidak menyimpan apa pun di server.",
      "Kata sandi disimpan dalam bentuk hash; satu cookie menjaga Anda tetap masuk.",
      "Unduh semuanya, atau hapus akun Anda, kapan pun Anda mau.",
    ],
    privacyLink: "Kebijakan privasi",
    questionsTitle: "Pertanyaan umum",
    moreQuestions: "Pertanyaan lainnya",
    finalTitle: "Ketahui kewajiban Anda sebelum Ramadan berakhir.",
  },

  calculatorPage: {
    metaTitle: "Kalkulator zakat — gratis, privat, tanpa daftar",
    metaDescription:
      "Hitung zakat Anda dalam hitungan menit dengan harga emas dan perak terkini. Nisab emas atau perak, perhiasan menurut mazhab, saham, kripto, dan utang. Gratis, privat, dan tidak ada yang Anda ketik disimpan di server.",
    eyebrow: "Kalkulator zakat",
    title: "Berapa zakat Anda tahun ini?",
    lede: "Masukkan apa yang Anda miliki dan utang Anda hari ini. Mizan menimbangnya terhadap nisab dengan harga logam terkini dan memberi Anda angkanya dalam hitungan menit. Gratis, tanpa akun, dan tidak ada yang Anda ketik keluar dari peramban Anda.",
    howTitle: "Cara perhitungannya",
    how: [
      {
        title: "1. Jumlahkan",
        body: "Setiap harta dihitung dengan nilai hari ini. Saham jangka panjang dan dana pensiun hanya dihitung sesuai porsi yang Anda tetapkan; perhiasan yang dipakai mengikuti mazhab pilihan Anda.",
      },
      {
        title: "2. Kurangi",
        body: "Utang yang jatuh tempo dikurangkan. Sisanya adalah harta bersih yang wajib dizakati.",
      },
      {
        title: "3. Timbang",
        body: "Jika mencapai nisab, zakatnya 2,5% untuk satu tahun qamariah. Di bawah nisab, tidak ada yang wajib.",
      },
    ],
    faqTitle: "Pertanyaan yang sering diajukan",
    faqFooter:
      "Perhitungannya terbuka: {method} dan {trust}. Untuk keadaan Anda, tanyakan kepada orang berilmu yang berkompeten.",
    appName: "Kalkulator zakat Mizan",
  },

  calc: {
    step: "Langkah {n}",
    pricesTitle: "Harga hari ini",
    pricesLede:
      "Nisab ditentukan oleh harga emas atau perak. Diisi dari sumber publik gratis bila tersedia; cocokkan dengan harga pasar setempat.",
    currency: "Mata uang",
    goldPerGram: "Emas, per gram",
    silverPerGram: "Perak, per gram",
    fetching: "Mengambil harga hari ini…",
    pricesUnavailable: "Harga terkini tidak tersedia. Masukkan harga per gram hari ini.",
    livePricesFrom: "Harga terkini dari {source}, {when}.",
    pricesFetched: "Harga diambil {when}.",
    refreshPrices: "Perbarui harga",
    fetchPrices: "Ambil harga terkini",
    nisabStandard: "Standar nisab",
    silverTitle: "Perak · 595 g",
    silverDetailWithValue: "{amount} — batas yang lebih rendah, sehingga lebih banyak orang berzakat",
    silverDetail: "Batas yang lebih rendah, sehingga lebih banyak orang berzakat",
    goldTitle: "Emas · 85 g",
    goldDetail: "Batas yang lebih tinggi",
    ownTitle: "Harta Anda",
    ownLede:
      "Nilai hari ini dari harta yang Anda miliki selama satu tahun qamariah. Kosongkan yang tidak berlaku. Rumah, kendaraan, dan barang yang Anda pakai tidak dihitung.",
    oweTitle: "Utang Anda saat ini",
    oweLede:
      "Tagihan, sewa, kartu kredit, dan cicilan pinjaman yang jatuh tempo dikurangkan. KPR jangka panjang tidak dikurangkan seluruhnya; ulama berbeda pendapat tentang selebihnya.",
    debtsDueNow: "Utang jatuh tempo",
    yearBasis: "Tahun yang Anda gunakan",
    lunarTitle: "Tahun qamariah (Hijriah) · 2,5%",
    lunarDetail: "Tahun yang menjadi dasar perhitungan zakat.",
    solarTitle: "Tahun syamsiah · 2,577%",
    solarDetail: "Jika Anda membayar pada tanggal Masehi, disesuaikan dengan tahun yang lebih panjang.",
    resultLabel: "Zakat Anda",
    needsSilverPrice: "Masukkan harga perak hari ini untuk dibandingkan dengan nisab.",
    needsGoldPrice: "Masukkan harga emas hari ini untuk dibandingkan dengan nisab.",
    enterHoldings: "Masukkan harta Anda untuk melihat zakat yang wajib.",
    dueSummarySilver: "{rate} dari {net}, yang mencapai atau melebihi nisab perak.",
    dueSummaryGold: "{rate} dari {net}, yang mencapai atau melebihi nisab emas.",
    noneDue: "Tidak ada zakat yang wajib",
    belowSummarySilver: "{net} kurang {gap} dari nisab perak sebesar {nisab}.",
    belowSummaryGold: "{net} kurang {gap} dari nisab emas sebesar {nisab}.",
    shareOf: "{share} dari {amount}",
    netWealth: "Harta bersih wajib zakat",
    nisabSilver: "Nisab (perak)",
    nisabGold: "Nisab (emas)",
    weightPriceMissing:
      "Ada harta yang dimasukkan menurut berat, tetapi harga per gramnya belum diisi.",
    hawlNote:
      "Zakat wajib atas harta yang tetap mencapai nisab selama satu tahun qamariah penuh (haul). Ini perkiraan, bukan fatwa.",
    print: "Cetak atau simpan PDF",
    clear: "Hapus",
    clearConfirm: "Hapus semua yang Anda masukkan?",
    keepTitle: "Simpan sebagai pembukuan",
    keepBody:
      "Akun gratis menghitung haul Anda dengan kalender Hijriah, memberi tahu saat zakat jatuh tempo, mencatat pemberian Anda, dan menutup setiap tahun dengan laporan. Angka-angka ini ikut bersama Anda.",
    keepNote: "Pembukuan saat ini tersedia dalam bahasa Inggris.",
    keepCta: "Buat pembukuan gratis",
    barDue: "Zakat wajib",
    barBelow: "Di bawah nisab",
    byValue: "Masukkan nilai saja",
    byWeight: "Masukkan menurut berat",
    jewelleryQuestion: "Hitung perhiasan yang dipakai?",
    jewelleryNo: "Tidak dihitung (Maliki, Syafi‘i, Hanbali)",
    jewelleryYes: "Dihitung (Hanafi)",
    grams: "{label}, gram",
    gramUnit: "g",
    purity: "{label}, kadar",
    countedShare: "Porsi yang dihitung",
    karat: "{k} karat ({fineness})",
    fineSilver: "Murni (999)",
    sterling: "Sterling (925)",
    fields: {
      cash: { label: "Uang tunai", hint: "Uang kertas dan koin di rumah atau di dompet Anda." },
      bank: {
        label: "Saldo bank",
        hint: "Rekening giro, tabungan, dan deposito. Jangan masukkan bunga yang diterima: berikan secara terpisah.",
      },
      gold: { label: "Emas simpanan", hint: "Koin, batangan, dan emas yang dibeli untuk investasi." },
      silver: {
        label: "Perak simpanan",
        hint: "Koin, batangan, dan perak yang dibeli untuk investasi.",
      },
      jewellery: {
        label: "Perhiasan emas yang dipakai",
        hint: "Dihitung atau tidak sesuai pilihan di bawah.",
      },
      trading: {
        label: "Saham dan reksa dana untuk diperdagangkan",
        hint: "Dibeli untuk dijual kembali: dihitung dengan nilai pasar hari ini.",
      },
      crypto: { label: "Mata uang kripto", hint: "Dengan nilai pasar hari ini." },
      longterm: {
        label: "Saham dan reksa dana jangka panjang",
        hint: "Untuk pertumbuhan dan dividen. Hanya sebagian nilainya yang dihitung; tetapkan porsi yang Anda ikuti.",
      },
      business: {
        label: "Barang dagangan",
        hint: "Dengan harga jualnya hari ini, bukan harga belinya.",
      },
      receivables: {
        label: "Piutang",
        hint: "Pinjaman yang Anda harapkan akan dibayar kembali. Jangan masukkan piutang yang diragukan.",
      },
      pension: {
        label: "Dana pensiun yang dapat dicairkan",
        hint: "Hukumnya sangat beragam. Tetapkan porsi yang Anda ikuti, atau abaikan jika tidak dapat Anda akses.",
      },
      other: {
        label: "Harta lain yang wajib dizakati",
        hint: "Pendapatan sewa yang ditabung, uang jaminan yang akan kembali, dan sejenisnya.",
      },
    },
  },

  nisabPage: {
    indexMetaTitle: "Nisab hari ini: nisab emas dan perak dalam mata uang Anda",
    indexMetaDescription:
      "Nisab zakat hari ini dalam enam puluh mata uang, menurut standar perak (595 g) dan standar emas (85 g), dari harga logam terkini. Diperbarui setiap jam.",
    indexTitle: "Nisab hari ini",
    indexLede:
      "Jumlah harta paling sedikit yang wajib dizakati, menurut harga emas dan perak hari ini. Diperbarui setiap jam.",
    currencyMetaTitle: "Nisab hari ini dalam {currency} ({code})",
    currencyMetaDescription:
      "Nisab zakat hari ini dalam {currency}: {silver} menurut standar perak (595 g) dan {gold} menurut standar emas (85 g). Diperbarui setiap jam.",
    currencyTitle: "Nisab hari ini dalam {currency}",
    silverLabel: "Nisab perak · 595 g",
    goldLabel: "Nisab emas · 85 g",
    asOf: "Harga dari {source}, {when}. Diperbarui setiap jam; cocokkan dengan harga pasar setempat.",
    unavailable:
      "Harga terkini sedang tidak tersedia. Coba lagi sebentar lagi, atau masukkan harga hari ini di kalkulator.",
    explainer:
      "Jika harta Anda, setelah dikurangi utang yang jatuh tempo, mencapai nisab yang Anda ikuti dan telah dimiliki selama satu tahun qamariah, zakat sebesar 2,5% wajib atas seluruhnya. Banyak ulama menganjurkan standar perak karena lebih rendah, sehingga lebih banyak orang berzakat.",
    cta: "Hitung zakat Anda dalam {code}",
    tableCurrency: "Mata uang",
    tableSilver: "Nisab perak",
    tableGold: "Nisab emas",
    allCurrencies: "Semua mata uang",
    otherCurrencies: "Nisab dalam mata uang lain",
  },

  faq: [
    {
      q: "Apa itu nisab?",
      a: "Nisab adalah jumlah harta paling sedikit yang wajib dizakati. Ukurannya berdasarkan berat logam mulia: 85 gram emas atau 595 gram perak. Nilainya dalam uang mengikuti harga logam, sehingga dihitung pada hari Anda menghitung zakat.",
    },
    {
      q: "Pakai nisab emas atau perak?",
      a: "Keduanya berasal dari sunnah, tetapi kini nilainya sangat berbeda. Banyak ulama kontemporer dan lembaga zakat menganjurkan nisab perak untuk uang dan harta campuran karena lebih rendah, sehingga lebih banyak orang berzakat dan lebih banyak yang sampai kepada yang membutuhkan. Yang lain memakai nisab emas. Mizan menampilkan keduanya dan membiarkan Anda memilih.",
    },
    {
      q: "Apa itu haul?",
      a: "Haul adalah satu tahun qamariah (Hijriah), sekitar 354 hari. Zakat wajib atas harta yang tetap mencapai nisab selama satu haul penuh. Banyak orang memilih satu hari tetap, misalnya tanggal tertentu di bulan Ramadan, dan menghitung semua harta mereka pada hari itu setiap tahun.",
    },
    {
      q: "Apa saja yang wajib dizakati?",
      a: "Uang tunai, saldo bank, emas dan perak, saham dan reksa dana, mata uang kripto, barang dagangan, dan piutang yang Anda harapkan kembali. Rumah, kendaraan, pakaian, perabot, dan barang lain untuk keperluan pribadi tidak dihitung.",
    },
    {
      q: "Apakah perhiasan wajib dizakati?",
      a: "Mazhab berbeda pendapat. Mazhab Hanafi mewajibkan zakat atas perhiasan emas dan perak, termasuk yang dipakai. Mazhab Maliki, Syafi‘i, dan Hanbali umumnya tidak mewajibkannya atas perhiasan yang dipakai untuk berhias. Perhiasan yang disimpan sebagai investasi dihitung menurut semua mazhab.",
    },
    {
      q: "Bagaimana dengan saham dan dana pensiun?",
      a: "Saham yang dibeli untuk dijual kembali dihitung dengan nilai pasar penuh. Untuk saham jangka panjang, metode modern yang umum hanya menghitung aset wajib zakat perusahaan per saham, yang sering diperkirakan sekitar seperempat harga saham. Dana pensiun tergantung pada apakah Anda dapat mencairkannya; tanyakan kepada orang yang Anda percayai.",
    },
    {
      q: "Bolehkah saya mengurangkan utang?",
      a: "Utang yang jatuh tempo, seperti tagihan, saldo kartu kredit, dan cicilan yang sudah jatuh tempo, umumnya dikurangkan. Untuk utang jangka panjang seperti KPR, banyak ulama kontemporer hanya mengurangkan bagian yang jatuh tempo dalam setahun ke depan, bukan seluruh saldonya.",
    },
    {
      q: "Mengapa tarifnya 2,577% untuk tahun syamsiah?",
      a: "Zakat adalah 2,5% untuk setiap tahun qamariah. Tahun syamsiah sekitar sebelas hari lebih panjang, sehingga jika Anda menghitung pada tanggal Masehi, tarifnya dikalikan 365,25 / 354,367, sekitar 2,577%, agar tetap adil dari waktu ke waktu.",
    },
    {
      q: "Apakah yang saya ketik disimpan atau dikirim ke mana pun?",
      a: "Kalkulator berjalan di peramban Anda. Angka Anda tersimpan di penyimpanan peramban ini agar tidak hilang saat halaman dimuat ulang, dan Anda dapat menghapusnya kapan saja. Satu-satunya yang dikirim ke Mizan adalah kode mata uang Anda, untuk mengambil harga logam hari ini.",
    },
  ],
};

export default id;
