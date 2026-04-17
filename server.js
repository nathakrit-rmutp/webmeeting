const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'bookings.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function loadData() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return { bookings: [], nextId: 1 };
    }
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function overlap(aStart, aEnd, bStart, bEnd) {
    return !(aEnd <= bStart || aStart >= bEnd);
}

const store = loadData();

app.post('/api', (req, res) => {
    const body = req.body;
    const action = body.action;

    if (action === 'saveBooking') {
        const data = body.data;
        const conflict = store.bookings.some(b =>
            b.date === data.date &&
            b.room_id === data.room_id &&
            overlap(b.start_time, b.end_time, data.start_time, data.end_time) &&
            b.status !== 'rejected'
        );

        if (conflict) {
            return res.json({ ok: false, error: 'มีการจองแล้ว' });
        }

        const id = store.nextId++;
        const booking = {
            id,
            date: data.date,
            meeting_title: data.meeting_title,
            room_id: data.room_id,
            start_time: data.start_time,
            end_time: data.end_time,
            booker: data.booker,
            phone: data.phone,
            email: data.email,
            equipment: data.equipment || '',
            drinks: data.drinks || '',
            documents: data.documents || '',
            status: 'pending_lv1'
        };

        store.bookings.push(booking);
        saveData(store);
        return res.json({ ok: true, id });
    }

    if (action === 'getBookings') {
        const month = body.month;
        let filtered = store.bookings;
        if (month) {
            filtered = filtered.filter(b => b.date.startsWith(month));
        }
        return res.json({ ok: true, data: filtered });
    }

    if (action === 'approveBooking') {
        const booking = store.bookings.find(b => b.id == body.id);
        if (!booking) return res.json({ ok: false, error: 'not found' });

        if (booking.status === 'pending_lv1') {
            booking.status = 'pending_lv2';
            saveData(store);
            return res.json({ ok: true, level: 2 });
        }

        if (booking.status === 'pending_lv2') {
            booking.status = 'approved';
            saveData(store);
            return res.json({ ok: true, level: 'final' });
        }

        return res.json({ ok: false, error: 'already processed' });
    }

    if (action === 'rejectBooking') {
        const booking = store.bookings.find(b => b.id == body.id);
        if (!booking) return res.json({ ok: false, error: 'not found' });

        booking.status = 'rejected';
        saveData(store);
        return res.json({ ok: true });
    }

    return res.json({ ok: false, error: 'Unknown action' });
});

app.listen(3000, () => {
    console.log('🚀 Local backend running on http://localhost:3000');
});
