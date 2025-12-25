require('dotenv').config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require('./models/user');
const bookingRoutes = require("./routes/bookings");

const dbUrl = process.env.DB_URL;
console.log("✅ DB URL from .env:", dbUrl);

// Connect to MongoDB
main()
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.log("❌ MongoDB connection error:", err));

async function main() {
    await mongoose.connect(dbUrl);
}

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

// Middleware
app.use(express.json()); // ✅ Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Sessions + flash
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600,
});
store.on("error", () => console.log("❌ Mongo Store Error"));

app.use(session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true
    }
}));
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash + current user middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Routes
app.get("/", (req, res) => res.redirect("/listings"));
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/bookings", bookingRoutes);
app.use("/", userRouter);
// In app.js or bookings router
app.get("/bookings/success", (req, res) => {
    res.render("bookings/success"); // renders views/bookings/success.ejs
});


// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// Start server
app.listen(8080, () => console.log("🚀 Server running on port 8080"));
