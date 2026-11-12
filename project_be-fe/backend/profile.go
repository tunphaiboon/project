package main

import (
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type ProfileUpdateRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

func (app *App) GetProfile(w http.ResponseWriter, r *http.Request, userID int64) {
	var p struct {
		ID      int64  `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Phone   string `json:"phone"`
		Address string `json:"address"`
		Role    string `json:"role"`
	}

	err := app.DB.QueryRow(r.Context(), `
		SELECT id, email, COALESCE(name, ''), COALESCE(phone, ''), COALESCE(address, ''), role
		FROM users WHERE id = $1
	`, userID).Scan(&p.ID, &p.Email, &p.Name, &p.Phone, &p.Address, &p.Role)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "ไม่สามารถดึงข้อมูลโปรไฟล์ได้: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, p)
}

func (app *App) UpdateProfile(w http.ResponseWriter, r *http.Request, userID int64) {
	var req ProfileUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "อ่านข้อมูลไม่ถูกต้อง")
		return
	}

	_, err := app.DB.Exec(r.Context(), `
		UPDATE users SET name = $1, phone = $2, address = $3 WHERE id = $4
	`, req.Name, req.Phone, req.Address, userID)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "บันทึกข้อมูลไม่สำเร็จ: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "success", "message": "อัปเดตข้อมูลโปรไฟล์เรียบร้อย"})
}

func (app *App) ChangePassword(w http.ResponseWriter, r *http.Request, userID int64) {
	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "อ่านข้อมูลไม่ถูกต้อง")
		return
	}

	var currentHash string
	err := app.DB.QueryRow(r.Context(), "SELECT password FROM users WHERE id = $1", userID).Scan(&currentHash)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "DB Error: "+err.Error())
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.OldPassword)); err != nil {
		writeError(w, http.StatusUnauthorized, "รหัสผ่านเดิมไม่ถูกต้อง")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "เกิดข้อผิดพลาดในการเข้ารหัสผ่าน")
		return
	}

	_, err = app.DB.Exec(r.Context(), "UPDATE users SET password = $1 WHERE id = $2", newHash, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "เปลี่ยนรหัสผ่านไม่สำเร็จ: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "success", "message": "เปลี่ยนรหัสผ่านสำเร็จ"})
}