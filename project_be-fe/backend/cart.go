package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
)

type CartItem struct {
	ProductID   int64  `json:"productId"`
	Name        string `json:"name"`
	ImageURL    string `json:"imageUrl"`
	PriceSatang int    `json:"priceSatang"`
	Stock       int    `json:"stock"`
	Qty         int    `json:"qty"`
}

func (a *App) GetCart(w http.ResponseWriter, r *http.Request, userID int64) {
	rows, err := a.DB.Query(r.Context(), `
		SELECT p.id, p.name, COALESCE(p.image_url, ''), p.price_satang, p.stock, ci.qty
		FROM cart_items ci JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = $1 ORDER BY p.id`, userID)
	if err != nil {
		a.internal(w, err)
		return
	}
	defer rows.Close()

	items := []CartItem{}
	total := 0
	for rows.Next() {
		var c CartItem
		if err := rows.Scan(&c.ProductID, &c.Name, &c.ImageURL, &c.PriceSatang, &c.Stock, &c.Qty); err != nil {
			a.internal(w, err)
			return
		}
		total += c.PriceSatang * c.Qty
		items = append(items, c)
	}
	if err := rows.Err(); err != nil {
		a.internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "totalSatang": total})
}

// SetCartItem ตั้งจำนวนของในตะกร้า ถ้า qty = 0 คือเอาออก
func (a *App) SetCartItem(w http.ResponseWriter, r *http.Request, userID int64) {
	pid, ok := pathID(r, "productId")
	if !ok {
		writeError(w, http.StatusBadRequest, "รหัสสินค้าไม่ถูกต้อง")
		return
	}
	var req struct {
		Qty int `json:"qty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Qty < 0 || req.Qty > 99 {
		writeError(w, http.StatusBadRequest, "จำนวนต้องอยู่ระหว่าง 0 ถึง 99")
		return
	}
	if req.Qty == 0 {
		a.deleteCartItem(w, r, userID, pid)
		return
	}

	var stock int
	err := a.DB.QueryRow(r.Context(), `SELECT stock FROM products WHERE id = $1`, pid).Scan(&stock)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "ไม่พบสินค้านี้")
		return
	}
	if err != nil {
		a.internal(w, err)
		return
	}
	if req.Qty > stock {
		writeError(w, http.StatusBadRequest, "สินค้ามีไม่พอ เหลือ "+strconv.Itoa(stock)+" ชิ้น")
		return
	}

	_, err = a.DB.Exec(r.Context(), `
		INSERT INTO cart_items (user_id, product_id, qty) VALUES ($1, $2, $3)
		ON CONFLICT (user_id, product_id) DO UPDATE SET qty = EXCLUDED.qty`,
		userID, pid, req.Qty)
	if err != nil {
		a.internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"productId": pid, "qty": req.Qty})
}

func (a *App) RemoveCartItem(w http.ResponseWriter, r *http.Request, userID int64) {
	pid, ok := pathID(r, "productId")
	if !ok {
		writeError(w, http.StatusBadRequest, "รหัสสินค้าไม่ถูกต้อง")
		return
	}
	a.deleteCartItem(w, r, userID, pid)
}

func (a *App) deleteCartItem(w http.ResponseWriter, r *http.Request, userID, pid int64) {
	_, err := a.DB.Exec(r.Context(),
		`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, userID, pid)
	if err != nil {
		a.internal(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}