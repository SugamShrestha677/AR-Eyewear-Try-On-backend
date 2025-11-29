const express = require('express');
const config = require('./src/config/config');
const db = require('./src/config/db');
const app = express()

const userRoutes = require('./src/routes/userRoutes');
const frameRoutes = require('./src/routes/frameRoutes');
const favoriteRoutes = require('./src/routes/favoriteRoutes');
const mainCategoryRoutes = require('./src/routes/mainCategoryRoutes');
const subCategoryRoutes = require('./src/routes/subCategoryRoutes');

app.use(express.json());

app.use("/api/users",userRoutes);
app.use("/api/frames",frameRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use('/api/main-categories', mainCategoryRoutes);
app.use('/api/sub-categories', subCategoryRoutes);

app.get("/",(req,res)=>{
    res.send("This is the trial project of Netrafit.");
})

// Connect to MongoDB and start server
db.connect().then(() => {
  app.listen(config.PORT || 5000, () => {
    console.log(`Server is running on port ${config.PORT || 5000}`);
  });
});