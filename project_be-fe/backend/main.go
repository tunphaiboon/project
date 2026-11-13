package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB     *pgxpool.Pool
	Secret []byte
}

func main() {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร")
	}

	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatal("ต่อฐานข้อมูลไม่ได้: ", err)
	}

	app := &App{DB: pool, Secret: []byte(secret)}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/categories", app.ListCategories)
	mux.HandleFunc("GET /api/products", app.ListProducts)
	mux.HandleFunc("GET /api/products/{id}", app.GetProduct)
	mux.HandleFunc("POST /api/auth/register", app.Register)
	mux.HandleFunc("POST /api/auth/login", app.Login)

	mux.HandleFunc("GET /api/cart", app.requireAuth(app.GetCart))
	mux.HandleFunc("PUT /api/cart/{productId}", app.requireAuth(app.SetCartItem))
	mux.HandleFunc("DELETE /api/cart/{productId}", app.requireAuth(app.RemoveCartItem))
	mux.HandleFunc("POST /api/orders", app.requireAuth(app.Checkout))
	mux.HandleFunc("POST /api/payments/intent", app.requireAuth(app.CreatePaymentIntent))
	mux.HandleFunc("POST /api/orders/confirm", app.requireAuth(app.ConfirmOrder))

	mux.HandleFunc("POST /api/admin/products", app.requireAdmin(app.CreateProduct))
	mux.HandleFunc("PUT /api/admin/products/{id}", app.requireAdmin(app.UpdateProduct))
	mux.HandleFunc("DELETE /api/admin/products/{id}", app.requireAdmin(app.DeleteProduct))
	
	mux.HandleFunc("GET /api/admin/users", app.requireAdmin(app.AdminListUsers))
	mux.HandleFunc("PUT /api/admin/users/{id}/role", app.requireAdmin(app.AdminUpdateUserRole))
    

	
	mux.HandleFunc("GET /api/profile", app.requireAuth(app.GetProfile))
	mux.HandleFunc("PUT /api/profile", app.requireAuth(app.UpdateProfile))
	mux.HandleFunc("PUT /api/profile/password", app.requireAuth(app.ChangePassword))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Mercato API ฟังอยู่ที่ :" + port)
	
log.Fatal(http.ListenAndServe(":"+port, app.logger(cors(mux))))
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}