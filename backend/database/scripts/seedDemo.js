import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
import mongoose from "mongoose";
import connectDB from "../../config/db.js";
import User from "../../models/User.js";
import Category from "../../models/Category.js";
import Skill from "../../models/Skill.js";
import Field from "../../models/Field.js";
import Opportunity, { computeDerivedFields } from "../../models/Opportunity.js";

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function seedDemo() {
  console.log("Starting demo data seed...");
  await connectDB();

  // 1. Ensure or create an Admin user to attribute listings
  let admin = await User.findOne({ email: "admin@example.com" });
  if (!admin) {
    admin = await User.create({
      email: "admin@example.com",
      password: "AdminPassword123!",
      displayName: "System Admin",
      role: "ADMIN",
    });
    console.log("Created demo Admin: admin@example.com / AdminPassword123!");
  }

  // 2. Load category and skill references
  const categories = await Category.find();
  const catMap = new Map(categories.map((c) => [c.slug, c._id]));

  const skills = await Skill.find();
  const skillMap = new Map(skills.map((s) => [s.name.toLowerCase(), s._id]));

  const fields = await Field.find();
  const fieldMap = new Map(fields.map((f) => [f.name.toLowerCase(), f._id]));

  // 2b. Ensure demo student with complete profile for testing the match engine
  let student = await User.findOne({ email: "student@example.com" });
  const studentProfile = {
    educationLevel: "UNDERGRADUATE",
    major: "Computer Science",
    majorFieldId: fieldMap.get("computer science") || null,
    university: "State University of Technology",
    graduationYear: 2027,
    country: "US",
    address: "Boston, MA 02115, USA",
    location: {
      type: "Point",
      coordinates: [-71.0589, 42.3601], // Boston [lng, lat]
    },
    experienceLevel: "ENTRY",
    remotePreference: "ANY",
    skillIds: [
      skillMap.get("python"),
      skillMap.get("javascript"),
      skillMap.get("react"),
      skillMap.get("git"),
    ].filter(Boolean),
    interestFieldIds: [
      fieldMap.get("computer science"),
      fieldMap.get("artificial intelligence"),
    ].filter(Boolean),
    preferredCategoryIds: [
      catMap.get("internship"),
      catMap.get("hackathon"),
    ].filter(Boolean),
  };

  if (!student) {
    student = await User.create({
      email: "student@example.com",
      password: "StudentPassword123!",
      displayName: "Alex Johnson",
      role: "USER",
      profile: studentProfile,
    });
    console.log("Created demo Student: student@example.com / StudentPassword123!");
  } else {
    student.profile = studentProfile;
    await student.save();
    console.log("Updated demo Student profile: student@example.com");
  }

  const now = new Date();
  const inDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // 3. Define sample realistic opportunities
  const sampleData = [
    {
      title: "Google Summer of Code 2027",
      organizationName: "Google Open Source",
      categorySlug: "internship",
      description:
        "Google Summer of Code is a global program focused on bringing new contributors into open source software development. GSoC contributors work with an open source organization on a 12+ week programming project under the guidance of mentors.",
      applicationUrl: "https://summerofcode.withgoogle.com",
      sourceUrl: "https://summerofcode.withgoogle.com",
      sourceName: "Official Website",
      sourceType: "OFFICIAL_WEBSITE",
      remoteType: "REMOTE",
      deadlineStatus: "FIXED",
      deadline: inDays(14),
      educationLevels: ["UNDERGRADUATE", "RECENT_GRADUATE", "MASTERS"],
      experienceLevel: "ENTRY",
      fundingType: "PAID",
      stipendAmount: 3000,
      currency: "USD",
      skillNames: ["Python", "Git", "React", "Node.js"],
      fieldNames: ["Computer Science", "Software Engineering"],
      eligibilityText: "Open to students aged 18+ enrolled in or accepted into an accredited educational program.",
    },
    {
      title: "DAAD WISE Research Internships in Germany",
      organizationName: "German Academic Exchange Service (DAAD)",
      categorySlug: "research",
      description:
        "WISE (Working Internships in Science and Engineering) awards scholarships to international undergraduates from science and engineering disciplines to conduct research at public German higher education institutions and research institutes.",
      applicationUrl: "https://www.daad.de/wise-internship",
      sourceUrl: "https://www.daad.de",
      sourceName: "German Academic Exchange",
      sourceType: "GOVERNMENT",
      country: "DE",
      city: "Berlin",
      address: "Unter den Linden 6, 10117 Berlin, Germany",
      location: {
        type: "Point",
        coordinates: [13.4050, 52.5200], // [lng, lat]
      },
      remoteType: "ONSITE",
      deadlineStatus: "FIXED",
      deadline: inDays(45),
      educationLevels: ["UNDERGRADUATE"],
      experienceLevel: "NONE",
      fundingType: "FULLY_FUNDED",
      stipendAmount: 861,
      currency: "EUR",
      skillNames: ["Research Methods", "Laboratory Skills", "Python"],
      fieldNames: ["Mechanical Engineering", "Electrical Engineering", "Physics", "Computer Science"],
      eligibilityText: "Undergraduate students in their 5th or 6th semester with an aggregate GPA of at least 8.5/10.",
    },
    {
      title: "NASA International Space Apps Challenge",
      organizationName: "NASA",
      categorySlug: "hackathon",
      description:
        "The NASA International Space Apps Challenge is an international hackathon for scientists, designers, storytellers, makers, builders, and technologists to address real-world problems on Earth and in space using NASA free and open data.",
      applicationUrl: "https://www.spaceappschallenge.org",
      sourceUrl: "https://www.spaceappschallenge.org",
      sourceName: "NASA Space Apps Portal",
      sourceType: "GOVERNMENT",
      remoteType: "REMOTE",
      deadlineStatus: "NO_DEADLINE",
      educationLevels: ["HIGH_SCHOOL", "UNDERGRADUATE", "RECENT_GRADUATE"],
      experienceLevel: "NONE",
      fundingType: "UNPAID",
      skillNames: ["Python", "Data Visualization", "Teamwork", "Problem Solving"],
      fieldNames: ["Artificial Intelligence", "Data Science", "Physics"],
      eligibilityText: "Participants of all ages and skill levels from around the world are welcome.",
    },
    {
      title: "Rhodes Trust International Post-Graduate Scholarship",
      organizationName: "University of Oxford",
      categorySlug: "scholarship",
      description:
        "The Rhodes Scholarship is the oldest and perhaps most prestigious international scholarship programme, enabling outstanding young people from around the world to study at the University of Oxford.",
      applicationUrl: "https://www.rhodeshouse.ox.ac.uk/scholarships",
      sourceUrl: "https://www.ox.ac.uk",
      sourceName: "University of Oxford",
      sourceType: "UNIVERSITY",
      country: "GB",
      city: "Oxford",
      address: "South Parks Rd, Oxford OX1 3RG, United Kingdom",
      location: {
        type: "Point",
        coordinates: [-1.2544, 51.7589],
      },
      remoteType: "ONSITE",
      deadlineStatus: "FIXED",
      deadline: inDays(3),
      educationLevels: ["UNDERGRADUATE", "RECENT_GRADUATE"],
      experienceLevel: "INTERMEDIATE",
      fundingType: "FULLY_FUNDED",
      stipendAmount: 18000,
      currency: "GBP",
      skillNames: ["Leadership", "Academic Writing", "Critical Thinking", "Public Speaking"],
      fieldNames: ["Social Sciences", "Law & Policy", "Economics", "Arts & Humanities"],
      eligibilityText: "Completed undergraduate degree with First Class Honours or equivalent GPA; evidence of leadership and character.",
    },
    {
      title: "OpenAI Student Research Fellowship",
      organizationName: "OpenAI",
      categorySlug: "fellowship",
      description:
        "The OpenAI Fellowship is an intensive paid opportunity for students to work alongside leading researchers on frontiers of artificial intelligence, safety, and alignment.",
      applicationUrl: "https://openai.com/careers/student-fellowship",
      sourceUrl: "https://openai.com",
      sourceName: "OpenAI Careers",
      sourceType: "ORGANIZATION",
      country: "US",
      city: "San Francisco",
      address: "3180 18th St, San Francisco, CA 94110, USA",
      location: {
        type: "Point",
        coordinates: [-122.4148, 37.7628],
      },
      remoteType: "HYBRID",
      deadlineStatus: "FIXED",
      deadline: inDays(7),
      educationLevels: ["UNDERGRADUATE", "MASTERS", "PHD"],
      experienceLevel: "INTERMEDIATE",
      fundingType: "PAID",
      stipendAmount: 8500,
      currency: "USD",
      skillNames: ["Python", "Deep Learning", "Machine Learning", "Mathematics"],
      fieldNames: ["Artificial Intelligence", "Computer Science"],
      eligibilityText: "Strong mathematical background and hands-on experience implementing deep learning algorithms.",
    },
    {
      title: "CERN Summer Student Programme",
      organizationName: "European Organization for Nuclear Research (CERN)",
      categorySlug: "internship",
      description:
        "Spend 8 to 13 weeks at the forefront of science in Geneva, Switzerland. Attend specialized lectures and work with multinational scientific teams at the Large Hadron Collider.",
      applicationUrl: "https://careers.cern/summer-student-programme",
      sourceUrl: "https://home.cern",
      sourceName: "CERN Official Careers",
      sourceType: "ORGANIZATION",
      country: "CH",
      city: "Geneva",
      address: "Espl. des Particules 1, 1211 Meyrin, Switzerland",
      location: {
        type: "Point",
        coordinates: [6.0556, 46.2330],
      },
      remoteType: "ONSITE",
      deadlineStatus: "OPEN_UNTIL_FILLED",
      educationLevels: ["UNDERGRADUATE", "MASTERS"],
      experienceLevel: "ENTRY",
      fundingType: "PAID",
      stipendAmount: 3200,
      currency: "CHF",
      skillNames: ["C++", "Linux", "Data Analysis", "Python"],
      fieldNames: ["Physics", "Computer Science", "Mathematics"],
      eligibilityText: "University students having completed at least three years of full-time studies at university level.",
    },
    {
      title: "MIT Lincoln Laboratory Student Research Internship",
      organizationName: "MIT Lincoln Laboratory",
      categorySlug: "internship",
      description:
        "Join researchers at MIT Lincoln Laboratory in Cambridge/Lexington, MA. Contribute to artificial intelligence, cyber defense, and advanced sensor processing projects for students.",
      applicationUrl: "https://www.ll.mit.edu/careers/student-opportunities",
      sourceUrl: "https://www.ll.mit.edu",
      sourceName: "MIT Lincoln Lab",
      sourceType: "UNIVERSITY",
      country: "US",
      city: "Cambridge",
      address: "77 Massachusetts Ave, Cambridge, MA 02139, USA",
      location: {
        type: "Point",
        coordinates: [-71.0942, 42.3601], // ~3.5 km from Boston demo student!
      },
      remoteType: "ONSITE",
      deadlineStatus: "FIXED",
      deadline: inDays(18),
      educationLevels: ["UNDERGRADUATE", "MASTERS"],
      experienceLevel: "ENTRY",
      fundingType: "PAID",
      stipendAmount: 5000,
      currency: "USD",
      skillNames: ["Python", "C++", "React", "Machine Learning"],
      fieldNames: ["Computer Science", "Artificial Intelligence", "Electrical Engineering"],
      eligibilityText: "Enrolled undergraduate students in engineering or computing with a strong academic track record.",
    },
    {
      title: "Columbia University Data Science Summer Fellowship",
      organizationName: "Columbia University",
      categorySlug: "fellowship",
      description:
        "The Data Science Institute at Columbia University invites students for intensive summer research on high-dimensional statistics, natural language processing, and smart systems.",
      applicationUrl: "https://datascience.columbia.edu/education/programs/fellowship",
      sourceUrl: "https://datascience.columbia.edu",
      sourceName: "Columbia DSI",
      sourceType: "UNIVERSITY",
      country: "US",
      city: "New York",
      address: "550 W 120th St, New York, NY 10027, USA",
      location: {
        type: "Point",
        coordinates: [-73.9626, 40.8075], // ~300 km from Boston
      },
      remoteType: "HYBRID",
      deadlineStatus: "FIXED",
      deadline: inDays(30),
      educationLevels: ["UNDERGRADUATE", "MASTERS"],
      experienceLevel: "ENTRY",
      fundingType: "PAID",
      stipendAmount: 4500,
      currency: "USD",
      skillNames: ["Python", "Data Visualization", "Machine Learning"],
      fieldNames: ["Data Science", "Computer Science"],
      eligibilityText: "Students with solid foundation in programming and quantitative methods.",
    },
  ];

  // 4. Upsert opportunities
  for (const item of sampleData) {
    const categoryId = catMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`Category slug not found: ${item.categorySlug}`);
      continue;
    }

    const skillIds = (item.skillNames || [])
      .map((name) => skillMap.get(name.toLowerCase()))
      .filter(Boolean);

    const fieldIds = (item.fieldNames || [])
      .map((name) => fieldMap.get(name.toLowerCase()))
      .filter(Boolean);

    const derived = computeDerivedFields(
      {
        applicationUrl: item.applicationUrl,
        organizationName: item.organizationName,
        title: item.title,
        deadlineStatus: item.deadlineStatus,
        deadline: item.deadline,
        country: item.country,
        city: item.city,
      },
      {
        categoryName: item.categorySlug,
        skillNames: item.skillNames || [],
        fieldNames: item.fieldNames || [],
      }
    );

    const oppDoc = {
      ...item,
      categoryId,
      skillIds,
      fieldIds,
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      lastVerifiedAt: now,
      publishedAt: now,
      createdByUserId: admin._id,
      lastEditedByUserId: admin._id,
      isDemo: true,
      ...derived,
    };

    await Opportunity.updateOne(
      { normalizedApplicationUrl: derived.normalizedApplicationUrl },
      { $set: oppDoc },
      { upsert: true }
    );
  }

  const count = await Opportunity.countDocuments({ isDemo: true });
  console.log(`Seeded Demo Opportunities: ${count}`);

  console.log("Demo seed finished successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error("Demo seed error:", err);
  process.exit(1);
});
