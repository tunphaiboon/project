package main

import (
	"log"
	"net/http"
	"time"
)

// responseWriter ใช้สำหรับดักจับ Status Code เพื่อนำมาแสดงใน Log
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// logger เป็น Middleware สำหรับพิมพ์ Log ของทุก Request (Method, Path, Status, เวลาที่ใช้)
func (a *App) logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		log.Printf("%s %s %d %v", r.Method, r.URL.Path, rw.status, time.Since(start))
	})
}

// requireAdmin ตรวจ role จาก DB ทุกครั้ง เพื่อไม่ให้ token เก่ายังใช้สิทธิ์เดิมได้
func (a *App) requireAdmin(next func(http.ResponseWriter, *http.Request, int64)) http.HandlerFunc {
	return a.requireAuth(func(w http.ResponseWriter, r *http.Request, uid int64) {
		var role string
		if err := a.DB.QueryRow(r.Context(), "SELECT role FROM users WHERE id = $1", uid).Scan(&role); err != nil {
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