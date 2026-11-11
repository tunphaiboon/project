package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"os"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// รูปแบบ error ตามสัญญาในคอร์ส: {"error": "ข้อความ"}
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// internal จดรายละเอียดไว้ใน log ฝั่งเรา บอกผู้ใช้แค่ว่าระบบขัดข้อง
func (a *App) internal(w http.ResponseWriter, err error) {
	log.Printf("internal error: %v", err)
	msg := "ระบบขัดข้อง ลองใหม่อีกครั้ง"
	if os.Getenv("DEBUG") == "1" {
		msg = err.Error()
	}
	writeError(w, http.StatusInternalServerError, msg)
}
func pathID(r *http.Request, name string) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue(name), 10, 64)
	return id, err == nil && id > 0
}
func decodeJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}