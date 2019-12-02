module.exports = {
     stripePubKey: process.env.STRIPE_PUBLISHABLE_KEY,
     stripeSecKey: process.env.STRIPE_SECRET_KEY,
     mongodbUser: process.env.MONGODB_USER,
     mongodbPassword: process.env.MONGODB_PASSWORD,
     mongodbDefaultDB: process.env.MONGODB_DEFAULT_DB,
     sendgridApiKey: process.env.SENDGRID_API_KEY,
     sessionSecret: process.env.SESSION_SECRET
}