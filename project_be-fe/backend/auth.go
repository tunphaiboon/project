package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

// dummyHash ใช้เทียบรหัสตอนไม่พบอีเมล เพื่อให้เวลาตอบใกล้เคียงกับกรณีอีเมลมีจริง
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("dummy-password"), bcrypt.DefaultCost)

type authUser struct {
	ID          int64  `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	Role        string `json:"role"`
}

func (a *App) issueToken(userID int64) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(userID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(a.Secret)
}

// requireAuth ตรวจ token แล้วส่ง userID ให้ handler
func (a *App) requireAuth(next func(http.ResponseWriter, *http.Request, int64)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || token == "" {
			writeError(w, http.StatusUnauthorized, "กรุณาเข้าสู่ระบบก่อน")
			return
		}
		var claims jwt.RegisteredClaims
		_, err := jwt.ParseWithClaims(token, &claims,
			func(t *jwt.Token) (any, error) { return a.Secret, nil },
			jwt.WithValidMethods([]string{"HS256"}),
			jwt.WithExpirationRequired(),
		)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "ตั๋วหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่")
			return
		}
		id, err := strconv.ParseInt(claims.Subject, 10, 64)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "ตั๋วหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่")
			return
		}
		next(w, r, id)
	}
}

func (a *App) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"displayName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "อ่านข้อมูลไม่ออก")
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	name := strings.TrimSpace(req.DisplayName)
	switch {
	case !strings.Contains(email, "@") || len(email) > 255:
		writeError(w, http.StatusBadRequest, "รูปแบบอีเมลไม่ถูกต้อง")
		return
	case utf8.RuneCountInString(req.Password) < 8 || len(req.Password) > 72:
		writeError(w, http.StatusBadRequest, "รหัสผ่านต้องยาว 8 ตัวอักษรขึ้นไป และไม่เกิน 72 ไบต์")
		return
	case name == "" || utf8.RuneCountInString(name) > 50:
		writeError(w, http.StatusBadRequest, "ต้องมีชื่อที่แสดง และไม่เกิน 50 ตัวอักษร")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		a.internal(w, err)
		return
	}
	var id int64
	err = a.DB.QueryRow(r.Context(),
		`INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id`,
		email, string(hash), name).Scan(&id)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		writeError(w, http.StatusConflict, "อีเมลนี้มีบัญชีอยู่แล้ว")
		return
	}
	if err != nil {
		a.internal(w, err)
		return
	}
	token, err := a.issueToken(id)
	if err != nil {
		a.internal(w, err)
		return
	}
	user := authUser{ID: id, Email: email, DisplayName: name, Role: "user"}
writeJSON(w, http.StatusCreated, map[string]any{
	"token": token,
	"user":  user,
})
}

func (a *App) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "อ่านข้อมูลไม่ออก")
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))

	var u authUser
	var hash string
	err := a.DB.QueryRow(r.Context(),
	`SELECT id, email, name, role, password_hash FROM users WHERE lower(email) = $1`, email).
	Scan(&u.ID, &u.Email, &u.DisplayName, &u.Role, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		bcrypt.CompareHashAndPassword(dummyHash, []byte(req.Password))
		writeError(w, http.StatusUnauthorized, "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
		return
	}
	if err != nil {
		a.internal(w, err)
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
		return
	}
	token, err := a.issueToken(u.ID)
	if err != nil {
		a.internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "user": u})
}