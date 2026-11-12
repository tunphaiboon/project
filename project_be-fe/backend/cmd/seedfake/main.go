package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type dummyResponse struct {
	Products []struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		Category    string  `json:"category"`
		Thumbnail   string  `json:"thumbnail"`
		Stock       int     `json:"stock"`
	} `json:"products"`
}

var categoryMap = map[string]string{
	"vehicle":             "auto",
	"motorcycle":          "auto",
	"sports-accessories":  "tools",
	"sunglasses":          "auto",
	"furniture":           "home",
	"home-decoration":     "home",
	"kitchen-accessories": "home",
	"groceries":           "health",
	"smartphones":         "electronics",
	"laptops":             "electronics",
	"tablets":             "electronics",
	"mobile-accessories":  "electronics",
	"mens-watches":        "electronics",
	"womens-watches":      "electronics",
	"beauty":              "beauty",
	"fragrances":          "beauty",
	"skin-care":           "beauty",
	"tops":                "beauty",
	"womens-dresses":      "beauty",
	"womens-shoes":        "beauty",
	"mens-shirts":         "home",
	"mens-shoes":          "home",
	"womens-bags":         "beauty",
	"womens-jewellery":    "beauty",
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Get("https://dummyjson.com/products?limit=0")
	if err != nil {
		log.Fatal("ดึง API ไม่สำเร็จ: ", err)
	}
	defer resp.Body.Close()

	var data dummyResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Fatal("อ่าน JSON ไม่สำเร็จ: ", err)
	}

	_, _ = pool.Exec(ctx, `TRUNCATE order_items, cart_items, products RESTART IDENTITY CASCADE`)

	inserted := 0
	for _, p := range data.Products {
		slug, ok := categoryMap[p.Category]
		if !ok {
			slug = "home"
		}
		priceSatang := int(p.Price * 1000)
		stock := p.Stock
		if stock <= 0 {
			stock = 15
		}

		_, err := pool.Exec(ctx, `
			INSERT INTO products (category_id, name, description, price_satang, image_url, stock)
			VALUES ((SELECT id FROM categories WHERE slug = $1), $2, $3, $4, $5, $6)`,
			slug, p.Title, p.Description, priceSatang, p.Thumbnail, stock)
		if err != nil {
			log.Printf("ข้าม %q: %v", p.Title, err)
			continue
		}
		inserted++
	}
	log.Printf("สำเร็จ! เติมสินค้าใหม่ทั้งหมด %d รายการ", inserted)
}