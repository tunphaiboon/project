CREATE TABLE categories (
    id    SERIAL PRIMARY KEY,
    name  TEXT NOT NULL,
    slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
    id           BIGSERIAL PRIMARY KEY,
    category_id  INT NOT NULL REFERENCES categories(id),
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    price_satang INT NOT NULL CHECK (price_satang >= 0),
    image_url    TEXT,
    stock        INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    display_name   VARCHAR(50) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email ON users (lower(email));

CREATE TABLE cart_items (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty         INT NOT NULL CHECK (qty > 0),
    PRIMARY KEY (user_id, product_id)
);