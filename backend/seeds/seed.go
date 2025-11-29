package main

import (
	"log"
	"time"

	"xinxun-news/internal/config"
	"xinxun-news/internal/database"
	"xinxun-news/internal/models"
	"xinxun-news/internal/services"

	"gorm.io/gorm"
)

func main() {
	config.LoadConfig()
	database.Connect()

	seedData()
	log.Println("Seed data created successfully")
}

func seedData() {
	// Create admin user
	hashedPassword, _ := services.HashPassword("admin123")
	admin := models.User{
		Username:     "admin",
		Email:        "admin@xinxun.us",
		PasswordHash: hashedPassword,
	}

	if err := database.DB.FirstOrCreate(&admin, models.User{Username: "admin"}).Error; err != nil {
		log.Printf("Error creating admin: %v", err)
	}

	// Create categories
	categories := []models.Category{
		{Name: "Investasi", Slug: "investasi"},
		{Name: "Teknologi", Slug: "teknologi"},
		{Name: "Ekonomi", Slug: "ekonomi"},
		{Name: "Update", Slug: "update"},
	}

	for _, cat := range categories {
		database.DB.FirstOrCreate(&cat, models.Category{Slug: cat.Slug})
	}

	// Get category IDs
	var investasiCat, techCat, ekonomiCat, updateCat models.Category
	database.DB.Where("slug = ?", "investasi").First(&investasiCat)
	database.DB.Where("slug = ?", "teknologi").First(&techCat)
	database.DB.Where("slug = ?", "ekonomi").First(&ekonomiCat)
	database.DB.Where("slug = ?", "update").First(&updateCat)

	// Create tags
	tags := []models.Tag{
		{Name: "Crypto", Slug: "crypto"},
		{Name: "Blockchain", Slug: "blockchain"},
		{Name: "Trading", Slug: "trading"},
		{Name: "Fintech", Slug: "fintech"},
	}

	for _, tag := range tags {
		database.DB.FirstOrCreate(&tag, models.Tag{Slug: tag.Slug})
	}

	// Get tag IDs
	var cryptoTag, blockchainTag models.Tag
	database.DB.Where("slug = ?", "crypto").First(&cryptoTag)
	database.DB.Where("slug = ?", "blockchain").First(&blockchainTag)

	// Create sample news
	now := time.Now()
	newsItems := []models.News{
		{
			Title:       "Xinxun Meluncurkan Platform Investasi Terbaru dengan Fitur AI",
			Slug:        "xinxun-meluncurkan-platform-investasi-terbaru-dengan-fitur-ai",
			Content:     "<p>Xinxun dengan bangga mengumumkan peluncuran platform investasi terbaru yang dilengkapi dengan teknologi Artificial Intelligence (AI) canggih. Platform ini dirancang untuk memberikan pengalaman investasi yang lebih personal dan efisien bagi para investor.</p><p>Dengan fitur AI yang terintegrasi, platform Xinxun dapat menganalisis pola pasar, memberikan rekomendasi investasi yang disesuaikan dengan profil risiko investor, dan membantu dalam pengambilan keputusan investasi yang lebih baik.</p><p>CEO Xinxun menyatakan bahwa inovasi ini merupakan langkah penting dalam transformasi digital industri investasi, dan berkomitmen untuk terus mengembangkan teknologi yang dapat memberikan nilai tambah bagi para investor.</p>",
			Excerpt:     "Platform investasi terbaru Xinxun dengan teknologi AI untuk pengalaman investasi yang lebih personal dan efisien.",
			Thumbnail:   "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
			CategoryID:  investasiCat.ID,
			AuthorID:    admin.ID,
			Status:      models.StatusPublished,
			PublishedAt: &now,
			Tags:        []models.Tag{cryptoTag, blockchainTag},
		},
		{
			Title:       "Panduan Lengkap Investasi Crypto untuk Pemula di Xinxun",
			Slug:        "panduan-lengkap-investasi-crypto-untuk-pemula-di-xinxun",
			Content:     "<p>Investasi cryptocurrency telah menjadi salah satu tren investasi yang paling populer dalam beberapa tahun terakhir. Bagi pemula yang ingin memulai perjalanan investasi crypto, Xinxun menyediakan panduan lengkap yang dapat membantu Anda memahami dasar-dasar investasi cryptocurrency.</p><p>Panduan ini mencakup penjelasan tentang apa itu cryptocurrency, bagaimana cara kerjanya, risiko yang perlu dipertimbangkan, dan strategi investasi yang dapat diterapkan. Kami juga menyediakan tips dan trik untuk membantu Anda memulai investasi crypto dengan lebih percaya diri.</p><p>Dengan platform Xinxun, Anda dapat memulai investasi crypto dengan mudah dan aman. Platform kami dilengkapi dengan fitur keamanan tingkat tinggi dan antarmuka yang user-friendly untuk memastikan pengalaman investasi yang optimal.</p>",
			Excerpt:     "Pelajari dasar-dasar investasi cryptocurrency dengan panduan lengkap dari Xinxun untuk pemula.",
			Thumbnail:   "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
			CategoryID:  investasiCat.ID,
			AuthorID:    admin.ID,
			Status:      models.StatusPublished,
			PublishedAt: &now,
			Tags:        []models.Tag{cryptoTag},
		},
		{
			Title:       "Update Terbaru: Fitur Baru di Platform Xinxun",
			Slug:        "update-terbaru-fitur-baru-di-platform-xinxun",
			Content:     "<p>Kami dengan senang hati mengumumkan update terbaru untuk platform Xinxun yang mencakup berbagai fitur baru dan peningkatan performa. Update ini dirancang untuk meningkatkan pengalaman pengguna dan memberikan lebih banyak kemudahan dalam melakukan investasi.</p><p>Fitur-fitur baru yang ditambahkan termasuk dashboard analitik yang lebih detail, notifikasi real-time untuk pergerakan pasar, dan integrasi dengan berbagai platform trading populer. Kami juga telah meningkatkan kecepatan dan stabilitas platform untuk memastikan pengalaman yang lebih lancar.</p><p>Tim pengembang Xinxun terus berkomitmen untuk memberikan inovasi terbaik dan mendengarkan feedback dari para pengguna untuk terus meningkatkan platform kami.</p>",
			Excerpt:     "Temukan fitur-fitur baru dan peningkatan performa terbaru di platform Xinxun.",
			Thumbnail:   "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
			CategoryID:  updateCat.ID,
			AuthorID:    admin.ID,
			Status:      models.StatusPublished,
			PublishedAt: &now,
			Tags:        []models.Tag{blockchainTag},
		},
		{
			Title:       "Analisis Pasar: Tren Investasi Digital di 2024",
			Slug:        "analisis-pasar-tren-investasi-digital-di-2024",
			Content:     "<p>Tahun 2024 membawa berbagai tren baru dalam dunia investasi digital. Analisis mendalam dari tim ahli Xinxun mengungkapkan beberapa tren utama yang akan mempengaruhi pasar investasi digital tahun ini.</p><p>Beberapa tren yang teridentifikasi termasuk meningkatnya adopsi teknologi blockchain, pertumbuhan investasi dalam aset digital, dan munculnya platform investasi yang lebih terdesentralisasi. Investor juga semakin tertarik pada investasi yang berkelanjutan dan ramah lingkungan.</p><p>Dengan memahami tren-tren ini, investor dapat membuat keputusan investasi yang lebih informatif dan strategis. Platform Xinxun menyediakan berbagai tools dan analisis untuk membantu investor mengikuti perkembangan pasar terkini.</p>",
			Excerpt:     "Pelajari tren investasi digital terbaru di tahun 2024 dan bagaimana hal ini mempengaruhi strategi investasi Anda.",
			Thumbnail:   "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
			CategoryID:  ekonomiCat.ID,
			AuthorID:    admin.ID,
			Status:      models.StatusPublished,
			PublishedAt: &now,
			Tags:        []models.Tag{cryptoTag, blockchainTag},
		},
		{
			Title:       "Keamanan Data: Prioritas Utama Xinxun",
			Slug:        "keamanan-data-prioritas-utama-xinxun",
			Content:     "<p>Keamanan data merupakan prioritas utama bagi Xinxun. Kami memahami betapa pentingnya melindungi informasi pribadi dan finansial para pengguna platform kami. Oleh karena itu, kami telah mengimplementasikan berbagai langkah keamanan tingkat tinggi.</p><p>Platform Xinxun menggunakan enkripsi end-to-end untuk semua data transaksi, autentikasi dua faktor (2FA) untuk akun pengguna, dan sistem monitoring keamanan 24/7. Kami juga secara rutin melakukan audit keamanan dan update sistem untuk memastikan platform tetap aman dari ancaman cyber.</p><p>Komitmen kami terhadap keamanan data tidak hanya sebatas teknologi, tetapi juga mencakup pelatihan rutin untuk tim kami dan kerja sama dengan ahli keamanan siber terkemuka untuk terus meningkatkan standar keamanan platform.</p>",
			Excerpt:     "Pelajari bagaimana Xinxun menjaga keamanan data pengguna dengan teknologi enkripsi dan sistem keamanan tingkat tinggi.",
			Thumbnail:   "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800",
			CategoryID:  techCat.ID,
			AuthorID:    admin.ID,
			Status:      models.StatusPublished,
			PublishedAt: &now,
			Tags:        []models.Tag{blockchainTag},
		},
	}

	for _, news := range newsItems {
		var existing models.News
		if err := database.DB.Where("slug = ?", news.Slug).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				database.DB.Create(&news)
			}
		}
	}
}

