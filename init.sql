-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    language VARCHAR(50),
    genre VARCHAR(100),
    release_date DATE,
    rating VARCHAR(10), -- U, UA, A, etc.
    poster_url TEXT,
    trailer_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Screens table
CREATE TABLE screens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL,
    screen_type VARCHAR(50) 
);

-- Shows/Showtimes table
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id),
    screen_id INTEGER REFERENCES screens(id),
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_seats INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seats table
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    screen_id INTEGER REFERENCES screens(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    row_name VARCHAR(5) NOT NULL,
    seat_type VARCHAR(20) DEFAULT 'Regular', 
);

-- Bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    show_id INTEGER REFERENCES shows(id),
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', 
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking seats (many-to-many)
CREATE TABLE booking_seats (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id INTEGER REFERENCES seats(id),
    show_id INTEGER REFERENCES shows(id),
    status VARCHAR(20) DEFAULT 'not_booked', -- booked, cancelled
    UNIQUE(show_id, seat_id)
);