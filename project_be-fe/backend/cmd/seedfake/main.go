package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB        *pgxpool.Pool
	JWTSecret []byte
}

func main() {
	ctx := context.Background()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL ไม่ได้ถูกกำหนด")
	}

	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("ไม่สามารถเชื่อมต่อฐานข้อมูลได้: %v", err)
	}
	defer dbPool.Close()

	jwtSecret := os.Getenv("JWT_SECRET")
	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร")
	}

	app := &App{
		DB:        dbPool,
		JWTSecret: []byte(jwtSecret),
	}

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// API Routes
	r.Route("/api", func(r chi.Router) {
		// Public Routes
		r.Post("/register", app.Register)
		r.Post("/login", app.Login)
		r.Get("/categories", app.ListCategories)
		r.Get("/products", app.ListProducts)
		r.Get("/products/{id}", app.GetProduct)

		// Protected User Routes
		r.Group(func(r chi.Router) {
			r.Use(app.requireAuth)
			r.Get("/cart", app.GetCart)
			r.Put("/cart", app.SetCartItem)
			r.Post("/orders", app.CreateOrder)
			r.Get("/orders", app.ListUserOrders)
			r.Post("/payment/qr", app.GeneratePromptPayQR)
		})

		// Admin Routes (ตรวจสอบสิทธิ์ Admin)
		r.Group(func(r chi.Router) {
			r.Use(app.requireAuth)
			r.Use(app.requireAdmin)

			// จัดการสินค้า
			r.Post("/admin/products", app.CreateProduct)
			r.Put("/admin/products/{id}", app.UpdateProduct)
			r.Delete("/admin/products/{id}", app.DeleteProduct)

			// จัดการผู้ใช้งานระบบ
			r.Get("/admin/users", app.AdminListUsers)
			r.Put("/admin/users/{id}/role", app.AdminUpdateUserRole)
		})
	})

	// เสิร์ฟไฟล์ Static ของ Frontend หากมี
	r.Handle("/*", http.FileServer(http.Dir("./dist")))

	port := ":8080"
	log.Printf("ShopMart API ฟังอยู่ที่ %s", port)
	if err := http.ListenAndServe(port, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}