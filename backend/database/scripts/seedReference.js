import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
import mongoose from "mongoose";
import connectDB from "../../config/db.js";
import Category from "../../models/Category.js";
import Field from "../../models/Field.js";
import Skill from "../../models/Skill.js";
import {
  CATEGORIES_DATA,
  FIELDS_DATA,
  SKILLS_DATA,
} from "../seeds/referenceData.js";

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function seedReference() {
  console.log("Starting reference data seed (categories, fields, skills)...");
  await connectDB();

  // 1. Seed Categories (upsert by slug)
  for (const cat of CATEGORIES_DATA) {
    await Category.updateOne(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true }
    );
  }
  const categoryCount = await Category.countDocuments();
  console.log(`Seeded Categories: ${categoryCount}`);

  // 2. Seed Fields of Study (upsert by slug)
  for (const f of FIELDS_DATA) {
    await Field.updateOne(
      { slug: f.slug },
      { $set: f },
      { upsert: true }
    );
  }
  const fieldCount = await Field.countDocuments();
  console.log(`Seeded Fields: ${fieldCount}`);

  // 3. Seed Skills (upsert by normalizedName)
  for (const s of SKILLS_DATA) {
    await Skill.updateOne(
      { normalizedName: s.normalizedName },
      { $set: s },
      { upsert: true }
    );
  }
  const skillCount = await Skill.countDocuments();
  console.log(`Seeded Skills: ${skillCount}`);

  console.log("Reference data seed completed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

seedReference().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
