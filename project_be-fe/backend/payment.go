package main

import (
	"encoding/json"
	"net/http"
	"os"
"strconv"
	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/paymentintent"
)

// CreatePaymentIntent คำนวณยอดจากตะกร้าฝั่ง server (ไม่เชื่อยอดจากหน้าเว็บ) แล้วสร้าง PaymentIntent
func (a *App) CreatePaymentIntent(w http.ResponseWriter, r *http.Request, userID int64) {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	var total int64
	err := a.DB.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(p.price_satang * ci.qty), 0)
		FROM cart_items ci JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = $1`, userID).Scan(&total)
	if err != nil {
		a.internal(w, err)
		return
	}
	if total <= 0 {
		writeError(w, http.StatusBadRequest, "ตะกร้าว่างเปล่า")
		return
	}

	pi, err := paymentintent.New(&stripe.PaymentIntentParams{
		Amount:   stripe.Int64(total),
		Currency: stripe.String("thb"),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
		Metadata: map[string]string{"user_id": itoa(userID)},
	})
	if err != nil {
		a.internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"clientSecret": pi.ClientSecret,
		"amount":       total,
	})
}

// ConfirmOrder ตรวจกับ Stripe ว่าจ่ายแล้วจริง ค่อยบันทึกคำสั่งซื้อ
func (a *App) ConfirmOrder(w http.ResponseWriter, r *http.Request, userID int64) {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	var req struct {
		PaymentIntentID string `json:"paymentIntentId"`
		Address         string `json:"address"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PaymentIntentID == "" {
		writeError(w, http.StatusBadRequest, "ข้อมูลไม่ครบ")
		return
	}

	pi, err := paymentintent.Get(req.PaymentIntentID, nil)
	if err != nil {
		a.internal(w, err)
		return
	}
	// ต้องเป็นของผู้ใช้คนนี้ และจ่ายสำเร็จจริง
	if pi.Metadata["user_id"] != itoa(userID) {
		writeError(w, http.StatusForbidden, "รายการชำระเงินนี้ไม่ใช่ของคุณ")
		return
	}
	if pi.Status != stripe.PaymentIntentStatusSucceeded {
		writeError(w, http.StatusPaymentRequired, "การชำระเงินยังไม่สำเร็จ")
		return
	}

	// บันทึกคำสั่งซื้อจากตะกร้า โดยใช้ Checkout เดิมที่ตัดสต็อกและล้างตะกร้าให้แล้ว
	orderID, total, err := a.createOrderFromCart(r.Context(), userID, req.Address, pi.ID)
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

func itoa(n int64) string {
	return strconvFormat(n)
}
func strconvFormat(n int64) string { return strconv.FormatInt(n, 10) }