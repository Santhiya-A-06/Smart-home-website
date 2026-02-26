// Mock Data Initializer
const MOCK_CATEGORIES = [
    { id: 1, name: "Plumbing", icon: "fas fa-faucet" },
    { id: 2, name: "Electrical", icon: "fas fa-bolt" },
    { id: 3, name: "Cleaning", icon: "fas fa-broom" },
    { id: 4, name: "Painting", icon: "fas fa-paint-roller" },
    { id: 5, name: "Mechanics", icon: "fas fa-tools" },
    { id: 6, name: "Movers", icon: "fas fa-truck-moving" }
];

const MOCK_PROVIDERS = [
    { id: 101, name: "John Doe", category_id: 1, category: "Plumbing", price: 50, location: "New York", description: "10+ years experience in fixing leaks and pipes.", rating: 4.8 },
    { id: 102, name: "Sparky Sam", category_id: 2, category: "Electrical", price: 75, location: "Brooklyn", description: "Certified electrician for home and industrial wiring.", rating: 4.9 },
    { id: 103, name: "Clean Queen", category_id: 3, category: "Cleaning", price: 40, location: "New York", description: "Professional deep cleaning for homes and offices.", rating: 4.7 },
    { id: 104, name: "Artisanal Alex", category_id: 4, category: "Painting", price: 60, location: "Queens", description: "Wall art and professional interior/exterior painting.", rating: 4.6 },
    { id: 105, name: "Turbo Tom", category_id: 5, category: "Mechanics", price: 90, location: "Jersey City", description: "On-site car maintenance and minor engine repairs.", rating: 4.5 },
    { id: 106, name: "Swift Movers", category_id: 6, category: "Movers", price: 120, location: "Manhattan", description: "Stress-free packing and moving services.", rating: 4.9 }
];

// LocalStorage Helper
const store = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    getUsers: () => store.get('hub_users'),
    setUsers: (users) => store.set('hub_users', users),
    getBookings: () => store.get('hub_bookings'),
    setBookings: (bookings) => store.set('hub_bookings', bookings),
    getComplaints: () => store.get('hub_complaints'),
    setComplaints: (complaints) => store.set('hub_complaints', complaints),
    getApplications: () => store.get('hub_applications'),
    setApplications: (apps) => store.set('hub_applications', apps),
    getCategories: () => {
        let cats = store.get('hub_categories');
        if (cats.length === 0) {
            store.set('hub_categories', MOCK_CATEGORIES);
            return MOCK_CATEGORIES;
        }
        return cats;
    },
    getProviders: () => {
        let provs = store.get('hub_providers');
        if (provs.length === 0) {
            store.set('hub_providers', MOCK_PROVIDERS);
            return MOCK_PROVIDERS;
        }
        return provs;
    }
};

const api = {
    auth: {
        login: async (credentials) => {
            const users = store.getUsers();
            // Built-in Admin for demo
            if (credentials.username === 'admin' && credentials.password === 'admin123') {
                const adminUser = { id: 0, username: 'admin', role: 'admin' };
                localStorage.setItem('hub_user', JSON.stringify(adminUser));
                return adminUser;
            }
            const user = users.find(u => u.username === credentials.username && u.password === credentials.password);
            if (!user) throw new Error("Invalid credentials");
            localStorage.setItem('hub_session', 'mock-token-' + Date.now());
            localStorage.setItem('hub_user', JSON.stringify(user));
            return user;
        },
        register: async (userData) => {
            const users = store.getUsers();
            if (users.find(u => u.username === userData.username)) throw new Error("Username taken");
            userData.id = Date.now();
            users.push(userData);
            store.setUsers(users);
            return { msg: "Success" };
        },
        logout: () => {
            localStorage.removeItem('hub_session');
            localStorage.removeItem('hub_user');
            window.location.href = 'login.html';
        }
    },

    user: {
        getServices: (category = '', location = '') => {
            let providers = store.getProviders();
            if (category) {
                providers = providers.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
            }
            if (location) {
                providers = providers.filter(p => p.location.toLowerCase().includes(location.toLowerCase()));
            }
            return providers;
        },
        bookService: async (bookingData) => {
            const bookings = store.getBookings();
            const user = JSON.parse(localStorage.getItem('hub_user'));
            const providers = store.getProviders();
            const prov = providers.find(p => p.id == bookingData.provider_id);

            const newBooking = {
                id: Date.now(),
                user_id: user.id,
                user_name: user.username,
                provider_id: bookingData.provider_id,
                provider: prov.name,
                category: prov.category,
                status: 'Confirmed',
                scheduled_date: bookingData.scheduled_date,
                location: bookingData.location,
                amount: prov.price
            };
            bookings.push(newBooking);
            store.setBookings(bookings);
            return newBooking;
        },
        getMyBookings: () => {
            const user = JSON.parse(localStorage.getItem('hub_user'));
            return store.getBookings().filter(b => b.user_id === user.id);
        },
        getComplaints: () => {
            const user = JSON.parse(localStorage.getItem('hub_user'));
            return store.getComplaints().filter(c => c.user_id === user.id);
        },
        fileComplaint: async (complaintData) => {
            const complaints = store.getComplaints();
            const user = JSON.parse(localStorage.getItem('hub_user'));
            const newComplaint = {
                id: Date.now(),
                user_id: user.id,
                ...complaintData,
                status: 'Pending',
                date: new Date().toISOString().split('T')[0]
            };
            complaints.push(newComplaint);
            store.setComplaints(complaints);
            return newComplaint;
        }
    },

    servicer: {
        getProfile: () => {
            const user = JSON.parse(localStorage.getItem('hub_user'));
            return store.getProviders().find(p => p.user_id === user.id) || { base_price: 0, description: '', availability: true };
        },
        updateProfile: (profileData) => {
            const user = JSON.parse(localStorage.getItem('hub_user'));
            let provs = store.getProviders();
            let idx = provs.findIndex(p => p.user_id === user.id);
            if (idx === -1) {
                provs.push({ ...profileData, user_id: user.id, id: Date.now(), name: user.username });
            } else {
                provs[idx] = { ...provs[idx], ...profileData };
            }
            store.set('hub_providers', provs);
            return { msg: "Updated" };
        },
        getAppointments: () => {
            const user = JSON.parse(localStorage.getItem('hub_user'));
            const prov = store.getProviders().find(p => p.user_id === user.id);
            if (!prov) return [];
            return store.getBookings().filter(b => b.provider_id === prov.id);
        },
        submitApplication: async (appData) => {
            const apps = store.getApplications();
            const newApp = {
                id: Date.now(),
                ...appData,
                status: 'Applied',
                date: new Date().toISOString().split('T')[0]
            };
            apps.push(newApp);
            store.setApplications(apps);
            return newApp;
        }
    },

    admin: {
        getStats: () => {
            const users = store.getUsers();
            const bookings = store.getBookings();
            return {
                users: users.filter(u => u.role === 'user').length,
                servicers: users.filter(u => u.role === 'servicer').length,
                bookings: bookings.length,
                categories: store.getCategories().length
            };
        },
        getAllUsers: () => store.getUsers().filter(u => u.role === 'user'),
        getAllWorkers: () => store.getUsers().filter(u => u.role === 'servicer'),
        getCategories: () => store.getCategories(),
        addCategory: (cat) => {
            const cats = store.getCategories();
            cats.push({ id: Date.now(), ...cat });
            store.set('hub_categories', cats);
            return { msg: "Added" };
        },
        getAllComplaints: () => store.getComplaints(),
        getAllApplications: () => store.getApplications()
    }
};

// Seed initial data if empty
if (store.getUsers().length === 0) {
    store.setUsers([
        { id: 1, username: 'demo_user', password: 'password', role: 'user', joined: '2026-01-15' },
        { id: 2, username: 'pro_electrician', password: 'password', role: 'servicer', category: 'Electrical', joined: '2026-02-01', rating: 4.9 },
        { id: 3, username: 'master_plumber', password: 'password', role: 'servicer', category: 'Plumbing', joined: '2026-02-10', rating: 4.7 }
    ]);
}

if (store.getBookings().length === 0) {
    store.setBookings([
        { id: 1001, user_id: 1, provider: "John Doe", category: "Plumbing", status: "Completed", scheduled_date: "2026-02-15 10:00", amount: 50 },
        { id: 1002, user_id: 1, provider: "Sparky Sam", category: "Electrical", status: "Completed", scheduled_date: "2026-02-20 14:00", amount: 75 },
        { id: 1003, user_id: 1, provider: "Clean Queen", category: "Cleaning", status: "Confirmed", scheduled_date: "2026-02-28 09:00", amount: 40 }
    ]);
}

if (store.getComplaints().length === 0) {
    store.setComplaints([
        { id: 2001, user_id: 1, subject: "Late Service", provider: "John Doe", description: "The provider arrived 30 mins late.", status: "Resolved", date: "2026-02-16" },
        { id: 2002, user_id: 1, subject: "Overcharged", provider: "Turbo Tom", description: "Base price was $90 but charged $110.", status: "Pending", date: "2026-02-24" }
    ]);
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('hub_user'));
    if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
    }
    return user;
}
