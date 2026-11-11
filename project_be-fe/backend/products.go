package main

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
)

type Product struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description,omitempty"`
	PriceSatang  int    `json:"priceSatang"`
	ImageURL     string `json:"imageUrl"`
	Stock        int    `json:"stock"`
	CategorySlug string `json:"categorySlug"`
	Category     string `json:"category"`
}

func (a *App) ListCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.Query(r.Context(), `SELECT slug, name FROM categories ORDER BY id`)
	if err != nil {
		a.internal(w, err)
		return
	}
	defer rows.Close()
	type cat struct {
		Slug string `json:"slug"`
		Name string `json:"name"`
	}
	items := []cat{}
	for rows.Next() {
		var c cat
		if err := rows.Scan(&c.Slug, &c.Name); err != nil {
			a.internal(w, err)
			return
		}
		items = append(items, c)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

// ListProducts รองรับ ?q= (ค้นชื่อ) และ ?category= (slug) ค่าผู้ใช้ส่งผ่าน $n เสมอ ไม่ต่อเข้า SQL
func (a *App) ListProducts(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	cat := strings.TrimSpace(r.URL.Query().Get("category"))

	args := []any{}
	where := "TRUE"
	if q != "" {
		args = append(args, "%"+q+"%")
		where += fmt.Sprintf(" AND p.name ILIKE $%d", len(args))
	}
	if cat != "" {
		args = append(args, cat)
		where += fmt.Sprintf(" AND c.slug = $%d", len(args))
	}

	rows, err := a.DB.Query(r.Context(), `
		SELECT p.id, p.name, p.price_satang, COALESCE(p.image_url, ''), p.stock, c.slug, c.name
		FROM products p JOIN categories c ON c.id = p.category_id
		WHERE `+where+` ORDER BY p.id LIMIT 60`, args...)
	if err != nil {
		a.internal(w, err)
		return
	}
	defer rows.Close()

	items := []Product{}
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.PriceSatang, &p.ImageURL, &p.Stock, &p.CategorySlug, &p.Category); err != nil {
			a.internal(w, err)
			return
		}
		items = append(items, p)
	}
	if err := rows.Err(); err != nil {
		a.internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (a *App) GetProduct(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "รหัสสินค้าไม่ถูกต้อง")
		return
	}
	var p Product
	err := a.DB.QueryRow(r.Context(), `
		SELECT p.id, p.name, p.description, p.price_satang, COALESCE(p.image_url, ''), p.stock, c.slug, c.name
		FROM products p JOIN categories c ON c.id = p.category_id
		WHERE p.id = $1`, id).
		Scan(&p.ID, &p.Name, &p.Description, &p.PriceSatang, &p.ImageURL, &p.Stock, &p.CategorySlug, &p.Category)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "ไม่พบสินค้านี้")
		return
	}
	if err != nil {
		a.internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}