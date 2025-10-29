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

-- Events table (similar to movies but for live events)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER, -- in minutes
    language VARCHAR(50),
    genre VARCHAR(100), -- Comedy, Music, Sports, Theatre, etc.
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    rating DECIMAL(2,1),
    poster_url TEXT,
    trailer_url TEXT,
    artist_name VARCHAR(255),
    event_type VARCHAR(50), -- Concert, Comedy Show, Sports, Theatre, Workshop
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event shows table (like movie shows but for events)
CREATE TABLE event_shows (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES theaters(id) ON DELETE CASCADE, -- Reusing theaters as venues
    screen_id INTEGER REFERENCES screens(id) ON DELETE CASCADE, -- Specific hall/area in venue
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- available, sold_out, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_genre ON events(genre);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_event_shows_date ON event_shows(show_date);
CREATE INDEX idx_event_shows_event ON event_shows(event_id);