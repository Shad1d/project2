import Category from "../models/Category.js";
import Field from "../models/Field.js";
import Skill from "../models/Skill.js";
import { CATEGORIES_DATA } from "../database/seeds/referenceData.js";

/**
 * GET /api/categories
 * Returns all available opportunity categories.
 */
export const getCategories = async (_req, res) => {
  try {
    let categories = await Category.find().sort({ sortOrder: 1 });
    if (!categories || categories.length === 0) {
      categories = CATEGORIES_DATA;
    }
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(200).json({
      success: true,
      data: CATEGORIES_DATA,
    });
  }
};

/**
 * GET /api/fields
 * Returns all academic fields of study.
 */
export const getFields = async (_req, res) => {
  try {
    const fields = await Field.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: fields,
    });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch fields." },
    });
  }
};

/**
 * GET /api/skills
 * Returns all selectable technical & soft skills.
 */
export const getSkills = async (_req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch skills." },
    });
  }
};
