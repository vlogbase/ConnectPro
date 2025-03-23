import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  headline: text("headline"),
  profileImageUrl: text("profile_image_url"),
  activityPubId: text("activity_pub_id").unique(),
  actorUrl: text("actor_url"),
  inboxUrl: text("inbox_url"),
  outboxUrl: text("outbox_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workExperiences: many(workExperiences),
  educations: many(educations),
  skills: many(userSkills),
  services: many(services),
  instances: many(instances),
}));

// Work Experiences table
export const workExperiences = pgTable("work_experiences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  current: boolean("current").default(false),
  description: text("description"),
});

export const workExperiencesRelations = relations(workExperiences, ({ one }) => ({
  user: one(users, {
    fields: [workExperiences.userId],
    references: [users.id],
  }),
}));

// Educations table
export const educations = pgTable("educations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  degree: text("degree"),
  fieldOfStudy: text("field_of_study"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  description: text("description"),
});

export const educationsRelations = relations(educations, ({ one }) => ({
  user: one(users, {
    fields: [educations.userId],
    references: [users.id],
  }),
}));

// Skills table
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const skillsRelations = relations(skills, ({ many }) => ({
  userSkills: many(userSkills),
}));

// User Skills (junction table)
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  endorsements: integer("endorsements").default(0),
});

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
}));

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color"),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
}));

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: text("price"),
  location: text("location"),
  remote: boolean("remote").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const servicesRelations = relations(services, ({ one }) => ({
  user: one(users, {
    fields: [services.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
}));

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  activityId: text("activity_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  reactions: many(reactions),
}));

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Reactions table
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Like, Share, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reactionsRelations = relations(reactions, ({ one }) => ({
  post: one(posts, {
    fields: [reactions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

// Instances table
export const instances = pgTable("instances", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  adminId: integer("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").unique(),
  logo: text("logo"),
  registrationType: text("registration_type").default("open"),
  contentModeration: jsonb("content_moderation"),
  federationRules: jsonb("federation_rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true),
});

export const instancesRelations = relations(instances, ({ one, many }) => ({
  admin: one(users, {
    fields: [instances.adminId],
    references: [users.id],
  }),
  federations: many(federatedInstances),
  activities: many(activities),
}));

// Federation between instances
export const federatedInstances = pgTable("federated_instances", {
  id: serial("id").primaryKey(),
  instanceId: integer("instance_id").notNull().references(() => instances.id, { onDelete: "cascade" }),
  fedWithInstanceId: integer("fed_with_instance_id").notNull().references(() => instances.id, { onDelete: "cascade" }),
  status: text("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const federatedInstancesRelations = relations(federatedInstances, ({ one }) => ({
  instance: one(instances, {
    fields: [federatedInstances.instanceId],
    references: [instances.id],
  }),
  fedWithInstance: one(instances, {
    fields: [federatedInstances.fedWithInstanceId],
    references: [instances.id],
  }),
}));

// Activities table for federation
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  instanceId: integer("instance_id").notNull().references(() => instances.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Follow, ProfileUpdate, ServiceOffer
  actorId: integer("actor_id").references(() => users.id),
  objectId: text("object_id"),
  targetId: text("target_id"),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  instance: one(instances, {
    fields: [activities.instanceId],
    references: [instances.id],
  }),
  actor: one(users, {
    fields: [activities.actorId],
    references: [users.id],
  }),
}));

// Create insertion schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  activityPubId: true,
  actorUrl: true,
  inboxUrl: true,
  outboxUrl: true,
});

export const insertWorkExperienceSchema = createInsertSchema(workExperiences).omit({
  id: true,
});

export const insertEducationSchema = createInsertSchema(educations).omit({
  id: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
});

export const insertUserSkillSchema = createInsertSchema(userSkills).omit({
  id: true,
  endorsements: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  activityId: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export const insertInstanceSchema = createInsertSchema(instances).omit({
  id: true,
  createdAt: true,
  active: true,
});

export const insertFederatedInstanceSchema = createInsertSchema(federatedInstances).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WorkExperience = typeof workExperiences.$inferSelect;
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;

export type Education = typeof educations.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

export type Instance = typeof instances.$inferSelect;
export type InsertInstance = z.infer<typeof insertInstanceSchema>;

export type FederatedInstance = typeof federatedInstances.$inferSelect;
export type InsertFederatedInstance = z.infer<typeof insertFederatedInstanceSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
