package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
)

type productInput struct {
	CategorySlug string `json:"categorySlug"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	PriceSatang  int    `json:"priceSatang"`
	ImageURL     string `json:"imageUrl"`
	Stock        int    `json:"stock"`
}

func validateProduct(p *productInput) string {
	p.Name = strings.TrimSpace(p.Name)
	switch {
	case p.Name == "" || len(p.Name) > 200:
		return "ชื่อสินค้าต้องไม่ว่างและไม่เกิน 200 ตัวอักษร"
	case p.PriceSatang < 0:
		return "ราคาต้องไม่ติดลบ"
	case p.Stock < 0:
		return "สต็อกต้องไม่ติดลบ"
	case p.CategorySlug == "":
		return "ต้องระบุหมวดสินค้า"
	}
	return ""
}

// CreateProduct (admin) เพิ่มสินค้าใหม่
func (a *App) CreateProduct(w http.ResponseWriter, r *http.Request, _ int64) {
	var p productInput
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeError(w, http.StatusBadRequest, "อ่านข้อมูลไม่ออก")
		return
	}
	if msg := validateProduct(&p); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	var id int64
	err := a.DB.QueryRow(r.Context(), `
		INSERT INTO products (category_id, name, description, price_satang, image_url, stock)
		VALUES ((SELECT id FROM categories WHERE slug = $1), $2, $3, $4, $5, $6)
		RETURNING id`,
		p.CategorySlug, p.Name, p.Description, p.PriceSatang, p.ImageURL, p.Stock).Scan(&id)
	if err != nil {
		a.internal(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": id})
}

// UpdateProduct (admin) แก้ไขสินค้า
func (a *App) UpdateProduct(w http.ResponseWriter, r *http.Request, _ int64) {
	id, ok := pathID(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "รหัสสินค้าไม่ถูกต้อง")
		return
	}
	var p productInput
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeError(w, http.StatusBadRequest, "อ่านข้อมูลไม่ออก")
		return
	}
	if msg := validateProduct(&p); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	tag, err := a.DB.Exec(r.Context(), `
		UPDATE products SET
		  category_id = (SELECT id FROM categories WHERE slug = $1),
		  name = $2, description = $3, price_satang = $4, image_url = $5, stock = $6
		WHERE id = $7`,
		p.CategorySlug, p.Name, p.Description, p.PriceSatang, p.ImageURL, p.Stock, id)
	if err != nil {
		a.internal(w, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "ไม่พบสินค้านี้")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DeleteProduct (admin) ลบสินค้า
func (a *App) DeleteProduct(w http.ResponseWriter, r *http.Request, _ int64) {
	id, ok := pathID(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "รหัสสินค้าไม่ถูกต้อง")
		return
	}
	// order_items อ้างอิง products จึงลบตรง ๆ ไม่ได้ถ้ามีประวัติการสั่งซื้อ
	// ให้ตอบ 409 แทนการทำให้ประวัติคำสั่งซื้อหาย
	tag, err := a.DB.Exec(r.Context(), `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		var pgErr interface{ SQLState() string }
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23503" {
			writeError(w, http.StatusConflict, "สินค้านี้มีประวัติการสั่งซื้อ ลบไม่ได้")
			return
		}
		a.internal(w, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "ไม่พบสินค้านี้")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListAdminProducts ใช้ได้ทั้ง admin และหน้าจัดการ (ดึงสต็อกและรหัสหมวด)
var _ = pgx.ErrNoRows