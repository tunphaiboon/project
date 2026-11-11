package main

import (
	"context"
	"errors"
	"net/http"
	"strings"
)

// createOrderFromCart ดึงตะกร้า ล็อกสต็อก สร้างคำสั่งซื้อ ตัดสต็อก และล้างตะกร้าในทรานแซกชันเดียว
// คืนค่า orderID และยอดรวม (สตางค์)
func (a *App) createOrderFromCart(ctx context.Context, userID int64, address, paymentRef string) (int64, int64, error) {
	address = strings.TrimSpace(address)
	if address == "" {
		return 0, 0, errors.New("กรุณากรอกที่อยู่จัดส่ง")
	}

	tx, err := a.DB.Begin(ctx)
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT p.id, p.name, p.price_satang, p.stock, ci.qty
		FROM cart_items ci JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = $1
		FOR UPDATE OF p`, userID)
	if err != nil {
		return 0, 0, err
	}
	type line struct {
		id    int64
		name  string
		price int64
		stock int64
		qty   int64
	}
	var lines []line
	for rows.Next() {
		var l line
		if err := rows.Scan(&l.id, &l.name, &l.price, &l.stock, &l.qty); err != nil {
			rows.Close()
			return 0, 0, err
		}
		lines = append(lines, l)
	}
	rows.Close()
	if len(lines) == 0 {
		return 0, 0, errors.New("ตะกร้าว่างเปล่า")
	}

	var total int64
	for _, l := range lines {
		if l.qty > l.stock {
			return 0, 0, errors.New("สินค้า \"" + l.name + "\" มีไม่พอ")
		}
		total += l.price * l.qty
	}

	var orderID int64
	if err := tx.QueryRow(ctx, `
		INSERT INTO orders (user_id, total_satang, status, address, payment_ref)
		VALUES ($1, $2, 'paid', $3, $4) RETURNING id`,
		userID, total, address, paymentRef).Scan(&orderID); err != nil {
		return 0, 0, err
	}

	for _, l := range lines {
		if _, err := tx.Exec(ctx, `
			INSERT INTO order_items (order_id, product_id, name, price_satang, qty)
			VALUES ($1, $2, $3, $4, $5)`, orderID, l.id, l.name, l.price, l.qty); err != nil {
			return 0, 0, err
		}
		if _, err := tx.Exec(ctx, `UPDATE products SET stock = stock - $1 WHERE id = $2`, l.qty, l.id); err != nil {
			return 0, 0, err
		}
	}

	if _, err := tx.Exec(ctx, `DELETE FROM cart_items WHERE user_id = $1`, userID); err != nil {
		return 0, 0, err
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, 0, err
	}
	return orderID, total, nil
}

// Checkout ใช้ระบบจำลองเดิม (ไม่ใช้ Stripe) เก็บไว้เพื่อให้ route เดิมยังทำงานได้
func (a *App) Checkout(w http.ResponseWriter, r *http.Request, userID int64) {
	var req struct {
		Address string `json:"address"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "อ่านข้อมูลไม่ออก")
		return
	}
	orderID, total, err := a.createOrderFromCart(r.Context(), userID, req.Address, "mock")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"orderId":     orderID,
		"totalSatang": total,
		"status":      "paid",
	})
}