package main

import (
	"net/http"
)

// requireAdmin ตรวจ role จาก DB ทุกครั้ง เพื่อไม่ให้ token เก่ายังใช้สิทธิ์เดิมได้
func (a *App) requireAdmin(next func(http.ResponseWriter, *http.Request, int64)) http.HandlerFunc {
	return a.requireAuth(func(w http.ResponseWriter, r *http.Request, uid int64) {
		var role string
		if err := a.DB.QueryRow(r.Context(), `SELECT role FROM users WHERE id = $1`, uid).Scan(&role); err != nil {
			a.internal(w, err)
			return
		}
		if role != "admin" {
			writeError(w, http.StatusForbidden, "ไม่มีสิทธิ์เข้าถึง")
			return
		}
		next(w, r, uid)
	})
}