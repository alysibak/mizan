import type { Messages } from "./en";

const ms: Messages = {
  common: {
    nav: {
      calculator: "Kalkulator",
      method: "Kaedah",
      signIn: "Log masuk",
      openLedger: "Buka lejar",
    },
    footer: {
      disclaimer:
        "Alat anggaran peribadi, bukan pengganti bimbingan ulama. Bagi keadaan anda, rujuklah orang berilmu yang bertauliah.",
      calculator: "Kalkulator zakat",
      nisab: "Nisab hari ini",
      method: "Cara angka dikira",
      trust: "Apa yang disahkan",
      privacy: "Privasi",
      terms: "Terma",
      languages: "Bahasa",
    },
    inEnglish: " (dalam bahasa Inggeris)",
  },

  landing: {
    metaTitle: "Mizan: kalkulator zakat dan lejar percuma",
    metaDescription:
      "Kalkulator zakat dan lejar yang percuma dan peribadi. Bandingkan harta anda dengan nisab, jejak haul dengan kalendar Hijrah, rekod zakat dan sedekah, dan tutup setiap tahun dengan penyata yang jelas.",
    eyebrow: "الميزان · neraca",
    title: "Zakat, dikira dengan teliti.",
    lede: "Kalkulator zakat dan lejar yang percuma dan peribadi. Timbang harta anda dengan nisab menggunakan harga logam semasa, jejak haul anda dengan kalendar Hijrah, dan tutup setiap tahun dengan angka yang boleh anda percayai.",
    ctaCalculate: "Kira zakat anda",
    ctaLedger: "Buka lejar percuma",
    trustLine:
      "Percuma · Tiada iklan · Tiada sambungan bank · Eksport atau padam data anda bila-bila masa",
    sample: {
      aria: "Contoh keputusan zakat",
      due: "Zakat wajib",
      summary: "2.5% daripada {net}, melebihi nisab perak",
      cash: "Tunai dan bank",
      gold: "Emas, 40 g 22 karat",
      funds: "Dana jangka panjang, 25% daripada {amount}",
      debts: "Hutang yang perlu dibayar sekarang",
      caption: "Angka contoh.",
    },
    featuresEyebrow: "Sepanjang tahun zakat",
    featuresTitle: "Lebih daripada kiraan sekali",
    featuresLede:
      "Kebanyakan kalkulator melupakan anda sebaik sahaja tab ditutup. Mizan menyimpan tahun anda: bila haul anda bermula, apa yang anda miliki, apa yang telah anda berikan, dan apa yang masih perlu dibayar.",
    features: [
      {
        title: "Nisab semasa",
        body: "Harga emas dan perak hari ini dalam mata wang anda, dengan kedua-dua piawaian bersebelahan. Anda pilih yang mana terpakai.",
      },
      {
        title: "Haul anda, mengikut kalendar Hijrah",
        body: "Kira tahun qamariah dari hari harta anda mencapai nisab, mengikut kalendar tabular atau Ummul Qura, dengan peringatan dalam aplikasi kalendar anda.",
      },
      {
        title: "Lejar yang memahami zakat",
        body: "Tunai, emas dan perak mengikut berat dan karat, saham, kripto, barang perniagaan, wang yang dihutang kepada anda, dan harta dalam mata wang lain.",
      },
      {
        title: "Semua pemberian di satu tempat",
        body: "Zakat, sedekah, zakat fitrah, dan penyucian harta, dengan lapan asnaf. Lihat apa yang telah dibayar dan apa yang masih perlu dibayar dalam kitaran ini.",
      },
      {
        title: "Tutup tahun dengan teliti",
        body: "Bekukan angka tahun ini, cetak penyata, mulakan haul seterusnya, dan tinggalkan surat untuk diri anda tahun depan.",
      },
      {
        title: "Di telefon anda",
        body: "Pasang dari pelayar seperti aplikasi. Mod cerah dan gelap, mudah dibaca oleh semua, dan tiada kedai aplikasi diperlukan.",
      },
    ],
    honestEyebrow: "Jujur tentang perbezaan pendapat",
    honestTitle: "Mazhab anda, pilihan anda",
    honestBody:
      "Apabila ulama berbeza pendapat (nisab emas atau perak, barang kemas yang dipakai, saham jangka panjang, dana persaraan, hutang), Mizan menunjukkan perbezaannya dan membiarkan anda memilih, bukannya membuat keputusan untuk anda. Ia alat anggaran, bukan fatwa, dan menyatakannya dengan jelas.",
    privateEyebrow: "Peribadi sejak reka bentuk",
    privateTitle: "Harta anda kekal milik anda",
    privateItems: [
      "Tiada iklan, tiada penjualan data, tiada log masuk bank.",
      "Kalkulator berjalan dalam pelayar anda dan tidak menyimpan apa-apa di pelayan.",
      "Kata laluan disimpan dalam bentuk cincangan; satu kuki mengekalkan log masuk anda.",
      "Muat turun semuanya, atau padam akaun anda, bila-bila masa.",
    ],
    privacyLink: "Dasar privasi",
    questionsTitle: "Soalan lazim",
    moreQuestions: "Lagi soalan",
    finalTitle: "Ketahui zakat anda sebelum Ramadan berakhir.",
  },

  calculatorPage: {
    metaTitle: "Kalkulator zakat — percuma, peribadi, tanpa daftar",
    metaDescription:
      "Kira zakat anda dalam beberapa minit dengan harga emas dan perak semasa. Nisab emas atau perak, barang kemas mengikut mazhab, saham, kripto, dan hutang. Percuma, peribadi, dan apa yang anda taip tidak disimpan di pelayan.",
    eyebrow: "Kalkulator zakat",
    title: "Berapakah zakat anda tahun ini?",
    lede: "Masukkan apa yang anda miliki dan hutang anda hari ini. Mizan menimbangnya dengan nisab menggunakan harga logam semasa dan memberikan angkanya dalam beberapa minit. Percuma, tanpa akaun, dan apa yang anda taip tidak meninggalkan pelayar anda.",
    howTitle: "Cara pengiraan",
    how: [
      {
        title: "1. Jumlahkan",
        body: "Setiap harta dikira pada nilai hari ini. Saham jangka panjang dan dana persaraan hanya dikira mengikut bahagian yang anda tetapkan; barang kemas yang dipakai mengikut mazhab pilihan anda.",
      },
      {
        title: "2. Tolak",
        body: "Hutang yang perlu dibayar sekarang ditolak. Bakinya ialah harta bersih yang wajib dizakatkan.",
      },
      {
        title: "3. Timbang",
        body: "Jika mencapai nisab, zakatnya 2.5% untuk setahun qamariah. Di bawah nisab, tiada yang wajib.",
      },
    ],
    faqTitle: "Soalan yang sering ditanya",
    faqFooter:
      "Pengiraannya terbuka: {method} dan {trust}. Bagi keadaan anda, rujuklah orang berilmu yang bertauliah.",
    appName: "Kalkulator zakat Mizan",
  },

  calc: {
    step: "Langkah {n}",
    pricesTitle: "Harga hari ini",
    pricesLede:
      "Nisab ditentukan oleh harga emas atau perak. Diisi daripada sumber awam percuma apabila tersedia; semak dengan harga pasaran tempatan anda.",
    currency: "Mata wang",
    goldPerGram: "Emas, segram",
    silverPerGram: "Perak, segram",
    fetching: "Mendapatkan harga hari ini…",
    pricesUnavailable: "Harga semasa tidak tersedia. Masukkan harga segram hari ini.",
    livePricesFrom: "Harga semasa daripada {source}, {when}.",
    pricesFetched: "Harga diperoleh {when}.",
    refreshPrices: "Kemas kini harga",
    fetchPrices: "Dapatkan harga semasa",
    nisabStandard: "Piawaian nisab",
    silverTitle: "Perak · 595 g",
    silverDetailWithValue: "{amount} — had yang lebih rendah, jadi lebih ramai yang berzakat",
    silverDetail: "Had yang lebih rendah, jadi lebih ramai yang berzakat",
    goldTitle: "Emas · 85 g",
    goldDetail: "Had yang lebih tinggi",
    ownTitle: "Harta anda",
    ownLede:
      "Nilai hari ini bagi harta yang anda miliki selama setahun qamariah. Biarkan kosong yang tidak berkaitan. Rumah, kenderaan, dan barang yang anda gunakan tidak dikira.",
    oweTitle: "Hutang anda sekarang",
    oweLede:
      "Bil, sewa, kad kredit, dan ansuran pinjaman yang perlu dibayar sekarang ditolak. Pinjaman perumahan jangka panjang tidak ditolak sepenuhnya; ulama berbeza pendapat tentang selebihnya.",
    debtsDueNow: "Hutang yang perlu dibayar sekarang",
    yearBasis: "Tahun yang anda gunakan",
    lunarTitle: "Tahun qamariah (Hijrah) · 2.5%",
    lunarDetail: "Tahun yang menjadi asas pengiraan zakat.",
    solarTitle: "Tahun syamsiah · 2.577%",
    solarDetail: "Jika anda membayar pada tarikh Masihi, diselaraskan dengan tahun yang lebih panjang.",
    resultLabel: "Zakat anda",
    needsSilverPrice: "Masukkan harga perak hari ini untuk dibandingkan dengan nisab.",
    needsGoldPrice: "Masukkan harga emas hari ini untuk dibandingkan dengan nisab.",
    enterHoldings: "Masukkan harta anda untuk melihat zakat yang wajib.",
    dueSummarySilver: "{rate} daripada {net}, yang mencapai atau melebihi nisab perak.",
    dueSummaryGold: "{rate} daripada {net}, yang mencapai atau melebihi nisab emas.",
    noneDue: "Tiada zakat yang wajib",
    belowSummarySilver: "{net} kurang {gap} daripada nisab perak sebanyak {nisab}.",
    belowSummaryGold: "{net} kurang {gap} daripada nisab emas sebanyak {nisab}.",
    shareOf: "{share} daripada {amount}",
    netWealth: "Harta bersih wajib zakat",
    nisabSilver: "Nisab (perak)",
    nisabGold: "Nisab (emas)",
    weightPriceMissing: "Ada harta yang dimasukkan mengikut berat, tetapi harga segramnya tiada.",
    hawlNote:
      "Zakat wajib ke atas harta yang kekal mencapai nisab selama setahun qamariah penuh (haul). Ini anggaran, bukan fatwa.",
    print: "Cetak atau simpan PDF",
    clear: "Kosongkan",
    clearConfirm: "Kosongkan semua yang telah anda masukkan?",
    keepTitle: "Simpan sebagai lejar",
    keepBody:
      "Akaun percuma mengira haul anda mengikut kalendar Hijrah, memberitahu apabila zakat wajib dibayar, merekod pemberian anda, dan menutup setiap tahun dengan penyata. Angka ini ikut bersama anda.",
    keepNote: "Lejar kini dalam bahasa Inggeris.",
    keepCta: "Cipta lejar percuma",
    barDue: "Zakat wajib",
    barBelow: "Di bawah nisab",
    byValue: "Masukkan nilai sahaja",
    byWeight: "Masukkan mengikut berat",
    jewelleryQuestion: "Kira barang kemas yang dipakai?",
    jewelleryNo: "Tidak dikira (Maliki, Syafie, Hanbali)",
    jewelleryYes: "Dikira (Hanafi)",
    grams: "{label}, gram",
    gramUnit: "g",
    purity: "{label}, ketulenan",
    countedShare: "Bahagian yang dikira",
    karat: "{k} karat ({fineness})",
    fineSilver: "Tulen (999)",
    sterling: "Sterling (925)",
    fields: {
      cash: { label: "Wang tunai", hint: "Wang kertas dan syiling di rumah atau dalam dompet anda." },
      bank: {
        label: "Baki bank",
        hint: "Akaun semasa, simpanan, dan deposit tetap. Jangan masukkan faedah yang diterima: berikannya secara berasingan.",
      },
      gold: { label: "Emas simpanan", hint: "Syiling, jongkong, dan emas yang dibeli sebagai pelaburan." },
      silver: {
        label: "Perak simpanan",
        hint: "Syiling, jongkong, dan perak yang dibeli sebagai pelaburan.",
      },
      jewellery: {
        label: "Barang kemas emas yang dipakai",
        hint: "Dikira atau tidak mengikut pilihan di bawah.",
      },
      trading: {
        label: "Saham dan dana untuk didagangkan",
        hint: "Dibeli untuk dijual semula: dikira pada nilai pasaran hari ini.",
      },
      crypto: { label: "Mata wang kripto", hint: "Pada nilai pasaran hari ini." },
      longterm: {
        label: "Saham dan dana jangka panjang",
        hint: "Dipegang untuk pertumbuhan dan dividen. Hanya sebahagian nilai yang dikira; tetapkan bahagian yang anda ikuti.",
      },
      business: {
        label: "Barang perniagaan untuk dijual",
        hint: "Pada harga jualan hari ini, bukan harga kosnya.",
      },
      receivables: {
        label: "Wang yang dihutang kepada anda",
        hint: "Pinjaman yang anda jangka akan dibayar balik. Jangan masukkan hutang yang diragui.",
      },
      pension: {
        label: "Dana persaraan yang boleh dikeluarkan",
        hint: "Hukumnya sangat berbeza. Tetapkan bahagian yang anda ikuti, atau abaikan jika anda tidak boleh mengaksesnya.",
      },
      other: {
        label: "Harta lain yang wajib dizakatkan",
        hint: "Pendapatan sewa yang disimpan, deposit yang akan dikembalikan, dan seumpamanya.",
      },
    },
  },

  nisabPage: {
    indexMetaTitle: "Nisab hari ini: nisab emas dan perak dalam mata wang anda",
    indexMetaDescription:
      "Nisab zakat hari ini dalam enam puluh mata wang, mengikut piawaian perak (595 g) dan piawaian emas (85 g), daripada harga logam semasa. Dikemas kini setiap jam.",
    indexTitle: "Nisab hari ini",
    indexLede:
      "Jumlah harta paling sedikit yang wajib dizakatkan, pada harga emas dan perak hari ini. Dikemas kini setiap jam.",
    currencyMetaTitle: "Nisab hari ini dalam {currency} ({code})",
    currencyMetaDescription:
      "Nisab zakat hari ini dalam {currency}: {silver} mengikut piawaian perak (595 g) dan {gold} mengikut piawaian emas (85 g). Dikemas kini setiap jam.",
    currencyTitle: "Nisab hari ini dalam {currency}",
    silverLabel: "Nisab perak · 595 g",
    goldLabel: "Nisab emas · 85 g",
    asOf: "Harga daripada {source}, {when}. Dikemas kini setiap jam; semak dengan harga pasaran tempatan anda.",
    unavailable:
      "Harga semasa tidak tersedia sekarang. Cuba lagi sebentar, atau masukkan harga hari ini dalam kalkulator.",
    explainer:
      "Jika harta anda, selepas ditolak hutang yang perlu dibayar sekarang, mencapai nisab yang anda ikuti dan telah dimiliki selama setahun qamariah, zakat sebanyak 2.5% wajib ke atas keseluruhannya. Ramai ulama mengesyorkan piawaian perak kerana ia lebih rendah, jadi lebih ramai yang berzakat.",
    cta: "Kira zakat anda dalam {code}",
    tableCurrency: "Mata wang",
    tableSilver: "Nisab perak",
    tableGold: "Nisab emas",
    allCurrencies: "Semua mata wang",
    otherCurrencies: "Nisab dalam mata wang lain",
  },

  faq: [
    {
      q: "Apakah nisab?",
      a: "Nisab ialah jumlah harta paling sedikit yang wajib dizakatkan. Ia ditentukan mengikut berat logam berharga: 85 gram emas atau 595 gram perak. Nilainya dalam wang berubah mengikut harga logam, jadi ia dikira pada hari anda membuat pengiraan.",
    },
    {
      q: "Patutkah saya guna nisab emas atau perak?",
      a: "Kedua-duanya daripada sunnah, tetapi hari ini nilainya sangat berbeza. Ramai ulama kontemporari dan badan zakat mengesyorkan nisab perak bagi wang dan harta bercampur kerana ia lebih rendah, jadi lebih ramai yang berzakat dan lebih banyak sampai kepada yang memerlukan. Yang lain menggunakan emas. Mizan menunjukkan kedua-duanya dan membiarkan anda memilih.",
    },
    {
      q: "Apakah haul?",
      a: "Haul ialah satu tahun qamariah (Hijrah), kira-kira 354 hari. Zakat wajib ke atas harta yang kekal mencapai nisab selama satu haul penuh. Ramai memilih satu hari tetap, seperti satu tarikh dalam Ramadan, dan mengira semua harta mereka pada hari itu setiap tahun.",
    },
    {
      q: "Apakah yang wajib dizakatkan?",
      a: "Wang tunai, baki bank, emas dan perak, saham dan dana, mata wang kripto, barang perniagaan untuk dijual, dan wang yang dihutang kepada anda yang dijangka akan dibayar. Rumah, kenderaan, pakaian, perabot, dan barang kegunaan peribadi lain tidak dikira.",
    },
    {
      q: "Adakah barang kemas wajib dizakatkan?",
      a: "Mazhab berbeza pendapat. Mazhab Hanafi mewajibkan zakat ke atas barang kemas emas dan perak, termasuk yang dipakai. Mazhab Maliki, Syafie, dan Hanbali secara umumnya mengecualikan barang kemas yang dipakai untuk perhiasan. Di Malaysia, pihak berkuasa zakat negeri juga menetapkan nilai uruf bagi barang kemas yang dipakai. Barang kemas yang disimpan sebagai pelaburan dikira oleh semua.",
    },
    {
      q: "Bagaimana dengan saham dan dana persaraan?",
      a: "Saham yang dibeli untuk dijual semula dikira pada nilai pasaran penuh. Bagi pegangan jangka panjang, kaedah moden yang lazim hanya mengira aset syarikat yang wajib dizakatkan bagi setiap saham, sering dianggarkan kira-kira suku daripada harga saham. Dana persaraan bergantung pada sama ada anda boleh mengakses wang itu; tanyalah orang yang anda percayai.",
    },
    {
      q: "Bolehkah saya menolak hutang?",
      a: "Hutang yang perlu dibayar sekarang, seperti bil, baki kad kredit, dan ansuran yang telah sampai tempoh, lazimnya ditolak. Bagi hutang jangka panjang seperti pinjaman perumahan, ramai ulama kontemporari hanya menolak bahagian yang perlu dibayar dalam tahun hadapan, bukan keseluruhan baki.",
    },
    {
      q: "Mengapa kadarnya 2.577% bagi tahun syamsiah?",
      a: "Zakat ialah 2.5% bagi setiap tahun qamariah. Tahun syamsiah kira-kira sebelas hari lebih panjang, jadi jika anda mengira pada tarikh Masihi, kadarnya didarab dengan 365.25 / 354.367, kira-kira 2.577%, supaya kekal adil dari semasa ke semasa.",
    },
    {
      q: "Adakah apa yang saya taip disimpan atau dihantar ke mana-mana?",
      a: "Kalkulator berjalan dalam pelayar anda. Angka anda kekal dalam storan pelayar ini supaya tidak hilang apabila halaman dimuat semula, dan anda boleh mengosongkannya bila-bila masa. Satu-satunya perkara yang dihantar kepada Mizan ialah kod mata wang anda, untuk mendapatkan harga logam hari ini.",
    },
  ],
};

export default ms;
