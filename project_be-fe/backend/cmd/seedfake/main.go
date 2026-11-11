package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type fakeProduct struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	Price       float64 `json:"price"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Image       string  `json:"image"`
}

// หมวดของ Fake Store ไปเป็น slug ของเรา (ต้องมีใน categories อยู่แล้ว)
var categoryMap = map[string]string{
	"men's clothing":   "home",
	"women's clothing": "beauty",
	"jewelery":         "beauty",
	"electronics":      "electronics",
}

func main() {
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	data, err := os.ReadFile("cmd/seedfake/products.json")
	if err != nil {
		log.Fatal(err)
	}

	var products []fakeProduct
	if err := json.Unmarshal(data, &products); err != nil {
		log.Fatal(err)
	}

	inserted := 0
	for _, p := range products {
		slug, ok := categoryMap[p.Category]
		if !ok {
			slug = "home"
		}
		_, err := pool.Exec(ctx, `
			INSERT INTO products (category_id, name, description, price_satang, image_url, stock)
			VALUES ((SELECT id FROM categories WHERE slug = $1), $2, $3, $4, $5, $6)`,
			slug, p.Title, p.Description, int(p.Price*100), p.Image, 20)
		if err != nil {
			log.Printf("ข้าม %q: %v", p.Title, err)
			continue
		}
		inserted++
	}
	log.Printf("เติมสินค้า %d รายการ", inserted)
}