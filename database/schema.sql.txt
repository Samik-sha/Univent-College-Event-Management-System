-- Create Database
CREATE DATABASE Univent;

-- =========================
-- CLUBS TABLE
-- =========================
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    members INT DEFAULT 0,
    color VARCHAR(20),
    bg VARCHAR(20),
    icon VARCHAR(10)
);

-- =========================
-- EVENTS TABLE
-- =========================
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(150),
    type VARCHAR(50),
    description TEXT,
    capacity INT DEFAULT 50
);

-- =========================
-- RSVPS TABLE
-- =========================
CREATE TABLE rsvps (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    
    -- Prevent duplicate RSVPs
    UNIQUE(user_name, event_id)
);

-- =========================
-- SAMPLE CLUB DATA
-- =========================
INSERT INTO clubs
(name, category, description, members, color, bg, icon)
VALUES
('Coding Club', 'Technology',
 'A community for programmers and tech enthusiasts.',
 120, '#1a6ef5', '#e8f0fe', '💻'),

('Music Society', 'Arts',
 'Bringing music lovers together through performances and jams.',
 80, '#db2777', '#fce7f3', '🎵'),

('Business Forum', 'Business',
 'Networking and entrepreneurship events for students.',
 60, '#16a34a', '#dcfce7', '📈');

-- =========================
-- SAMPLE EVENTS
-- =========================
INSERT INTO events
(club_id, title, date, time, location, type, description, capacity)
VALUES
(1, 'Hackathon 2025', '2025-08-10', '10:00',
 'CS Lab', 'Competition',
 '24-hour coding competition.', 100),

(2, 'Open Mic Night', '2025-08-15', '18:00',
 'Auditorium', 'Performance',
 'Live music performances by students.', 70),

(3, 'Startup Workshop', '2025-08-20', '14:00',
 'Seminar Hall', 'Workshop',
 'Learn startup fundamentals and pitching.', 50);