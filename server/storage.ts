import { users, workExperiences, educations, skills, userSkills, categories, services, posts, comments, reactions, instances, federatedInstances, activities } from "@shared/schema";
import { db, pgClient } from "./db";
import { eq, and, desc, like, or, inArray } from "drizzle-orm";
import { type User, type InsertUser, type WorkExperience, type InsertWorkExperience, type Education, type InsertEducation, type Skill, type InsertSkill, type UserSkill, type InsertUserSkill, type Category, type InsertCategory, type Service, type InsertService, type Post, type InsertPost, type Comment, type InsertComment, type Reaction, type InsertReaction, type Instance, type InsertInstance, type FederatedInstance, type InsertFederatedInstance, type Activity, type InsertActivity } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

// Create stores for sessions
const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Work Experience operations
  createWorkExperience(workExp: InsertWorkExperience): Promise<WorkExperience>;
  getWorkExperiencesByUserId(userId: number): Promise<WorkExperience[]>;
  updateWorkExperience(id: number, workExp: Partial<InsertWorkExperience>): Promise<WorkExperience | undefined>;
  deleteWorkExperience(id: number): Promise<void>;
  
  // Education operations
  createEducation(education: InsertEducation): Promise<Education>;
  getEducationsByUserId(userId: number): Promise<Education[]>;
  updateEducation(id: number, education: Partial<InsertEducation>): Promise<Education | undefined>;
  deleteEducation(id: number): Promise<void>;
  
  // Skill operations
  createSkill(skill: InsertSkill): Promise<Skill>;
  getSkills(): Promise<Skill[]>;
  getSkillById(id: number): Promise<Skill | undefined>;
  
  // UserSkill operations
  addUserSkill(userSkill: InsertUserSkill): Promise<UserSkill>;
  getUserSkills(userId: number): Promise<(UserSkill & { skill: Skill })[]>;
  removeUserSkill(userId: number, skillId: number): Promise<void>;
  endorseSkill(userId: number, skillId: number): Promise<UserSkill | undefined>;
  
  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  
  // Service operations
  createService(service: InsertService): Promise<Service>;
  getServiceById(id: number): Promise<Service | undefined>;
  getServicesByUserId(userId: number): Promise<Service[]>;
  getServicesByCategory(categoryId: number): Promise<Service[]>;
  searchServices(query: string, categoryId?: number, location?: string): Promise<(Service & { user: User, category: Category | null })[]>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<void>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPostById(id: number): Promise<Post | undefined>;
  getFeedPosts(limit: number, offset: number): Promise<(Post & { user: User })[]>;
  getUserPosts(userId: number): Promise<Post[]>;
  deletePost(id: number): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<(Comment & { user: User })[]>;
  deleteComment(id: number): Promise<void>;
  
  // Reaction operations
  createReaction(reaction: InsertReaction): Promise<Reaction>;
  getReactionsByPostId(postId: number): Promise<Reaction[]>;
  getReactionByUserAndPost(userId: number, postId: number): Promise<Reaction | undefined>;
  deleteReaction(id: number): Promise<void>;
  
  // Instance operations
  createInstance(instance: InsertInstance): Promise<Instance>;
  getInstanceById(id: number): Promise<Instance | undefined>;
  getInstancesByAdminId(adminId: number): Promise<Instance[]>;
  updateInstance(id: number, instance: Partial<InsertInstance>): Promise<Instance | undefined>;
  deleteInstance(id: number): Promise<void>;
  
  // Federation operations
  createFederation(federation: InsertFederatedInstance): Promise<FederatedInstance>;
  getFederationsByInstanceId(instanceId: number): Promise<(FederatedInstance & { fedWithInstance: Instance })[]>;
  updateFederationStatus(id: number, status: string): Promise<FederatedInstance | undefined>;
  deleteFederation(id: number): Promise<void>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByInstanceId(instanceId: number): Promise<(Activity & { actor: User | undefined })[]>;
  getRecentActivities(limit: number): Promise<(Activity & { actor: User | undefined, instance: Instance })[]>;
  
  // Session store
  sessionStore: any; // Use any type for session store to avoid type issues
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Use any type for session store to avoid type issues
  
  constructor() {
    // Try to use PostgreSQL session store, fall back to memory store if needed
    try {
      // Create PostgreSQL session store using the client object with query method
      this.sessionStore = new PostgresSessionStore({
        pool: pgClient, // Use the pgClient object with the query method
        createTableIfMissing: true
      });
    } catch (error) {
      console.warn("Failed to create PostgreSQL session store, falling back to memory store:", error);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // Prune expired entries every 24h
      });
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Work Experience operations
  async createWorkExperience(workExp: InsertWorkExperience): Promise<WorkExperience> {
    const [newWorkExp] = await db.insert(workExperiences).values(workExp).returning();
    return newWorkExp;
  }
  
  async getWorkExperiencesByUserId(userId: number): Promise<WorkExperience[]> {
    return await db
      .select()
      .from(workExperiences)
      .where(eq(workExperiences.userId, userId))
      .orderBy(desc(workExperiences.startDate));
  }
  
  async updateWorkExperience(id: number, workExp: Partial<InsertWorkExperience>): Promise<WorkExperience | undefined> {
    const [updatedWorkExp] = await db
      .update(workExperiences)
      .set(workExp)
      .where(eq(workExperiences.id, id))
      .returning();
    return updatedWorkExp;
  }
  
  async deleteWorkExperience(id: number): Promise<void> {
    await db.delete(workExperiences).where(eq(workExperiences.id, id));
  }
  
  // Education operations
  async createEducation(education: InsertEducation): Promise<Education> {
    const [newEducation] = await db.insert(educations).values(education).returning();
    return newEducation;
  }
  
  async getEducationsByUserId(userId: number): Promise<Education[]> {
    return await db
      .select()
      .from(educations)
      .where(eq(educations.userId, userId))
      .orderBy(desc(educations.startDate));
  }
  
  async updateEducation(id: number, education: Partial<InsertEducation>): Promise<Education | undefined> {
    const [updatedEducation] = await db
      .update(educations)
      .set(education)
      .where(eq(educations.id, id))
      .returning();
    return updatedEducation;
  }
  
  async deleteEducation(id: number): Promise<void> {
    await db.delete(educations).where(eq(educations.id, id));
  }
  
  // Skill operations
  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }
  
  async getSkills(): Promise<Skill[]> {
    return await db.select().from(skills);
  }
  
  async getSkillById(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill;
  }
  
  // UserSkill operations
  async addUserSkill(userSkill: InsertUserSkill): Promise<UserSkill> {
    const [newUserSkill] = await db.insert(userSkills).values(userSkill).returning();
    return newUserSkill;
  }
  
  async getUserSkills(userId: number): Promise<(UserSkill & { skill: Skill })[]> {
    return await db
      .select({
        ...userSkills,
        skill: skills,
      })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, userId));
  }
  
  async removeUserSkill(userId: number, skillId: number): Promise<void> {
    await db
      .delete(userSkills)
      .where(
        and(
          eq(userSkills.userId, userId),
          eq(userSkills.skillId, skillId)
        )
      );
  }
  
  async endorseSkill(userId: number, skillId: number): Promise<UserSkill | undefined> {
    const [userSkill] = await db
      .select()
      .from(userSkills)
      .where(
        and(
          eq(userSkills.userId, userId),
          eq(userSkills.skillId, skillId)
        )
      );
    
    if (!userSkill) {
      return undefined;
    }
    
    const currentEndorsements = userSkill.endorsements || 0; // Handle null endorsements
    const [updatedUserSkill] = await db
      .update(userSkills)
      .set({ endorsements: currentEndorsements + 1 })
      .where(eq(userSkills.id, userSkill.id))
      .returning();
    
    return updatedUserSkill;
  }
  
  // Category operations
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  // Service operations
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  
  async getServiceById(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  
  async getServicesByUserId(userId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.userId, userId))
      .orderBy(desc(services.createdAt));
  }
  
  async getServicesByCategory(categoryId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.categoryId, categoryId))
      .orderBy(desc(services.createdAt));
  }
  
  async searchServices(query: string, categoryId?: number, location?: string): Promise<(Service & { user: User, category: Category | null })[]> {
    let dbQuery = db
      .select({
        ...services,
        user: users,
        category: categories,
      })
      .from(services)
      .innerJoin(users, eq(services.userId, users.id))
      .leftJoin(categories, eq(services.categoryId, categories.id));
    
    const conditions = [];
    
    if (query) {
      conditions.push(
        or(
          like(services.title, `%${query}%`),
          like(services.description, `%${query}%`)
        )
      );
    }
    
    if (categoryId) {
      conditions.push(eq(services.categoryId, categoryId));
    }
    
    if (location) {
      conditions.push(like(services.location, `%${location}%`));
    }
    
    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }
    
    return await dbQuery.orderBy(desc(services.createdAt));
  }
  
  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }
  
  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }
  
  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }
  
  async getFeedPosts(limit: number, offset: number): Promise<(Post & { user: User })[]> {
    return await db
      .select({
        ...posts,
        user: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }
  
  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }
  
  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }
  
  async getCommentsByPostId(postId: number): Promise<(Comment & { user: User })[]> {
    return await db
      .select({
        ...comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }
  
  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }
  
  // Reaction operations
  async createReaction(reaction: InsertReaction): Promise<Reaction> {
    const [newReaction] = await db.insert(reactions).values(reaction).returning();
    return newReaction;
  }
  
  async getReactionsByPostId(postId: number): Promise<Reaction[]> {
    return await db
      .select()
      .from(reactions)
      .where(eq(reactions.postId, postId));
  }
  
  async getReactionByUserAndPost(userId: number, postId: number): Promise<Reaction | undefined> {
    const [reaction] = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.userId, userId),
          eq(reactions.postId, postId)
        )
      );
    
    return reaction;
  }
  
  async deleteReaction(id: number): Promise<void> {
    await db.delete(reactions).where(eq(reactions.id, id));
  }
  
  // Instance operations
  async createInstance(instance: InsertInstance): Promise<Instance> {
    const [newInstance] = await db.insert(instances).values(instance).returning();
    return newInstance;
  }
  
  async getInstanceById(id: number): Promise<Instance | undefined> {
    const [instance] = await db.select().from(instances).where(eq(instances.id, id));
    return instance;
  }
  
  async getInstancesByAdminId(adminId: number): Promise<Instance[]> {
    return await db
      .select()
      .from(instances)
      .where(eq(instances.adminId, adminId))
      .orderBy(desc(instances.createdAt));
  }
  
  async updateInstance(id: number, instance: Partial<InsertInstance>): Promise<Instance | undefined> {
    const [updatedInstance] = await db
      .update(instances)
      .set(instance)
      .where(eq(instances.id, id))
      .returning();
    return updatedInstance;
  }
  
  async deleteInstance(id: number): Promise<void> {
    await db.delete(instances).where(eq(instances.id, id));
  }
  
  // Federation operations
  async createFederation(federation: InsertFederatedInstance): Promise<FederatedInstance> {
    const [newFederation] = await db.insert(federatedInstances).values(federation).returning();
    return newFederation;
  }
  
  async getFederationsByInstanceId(instanceId: number): Promise<(FederatedInstance & { fedWithInstance: Instance })[]> {
    return await db
      .select({
        ...federatedInstances,
        fedWithInstance: instances,
      })
      .from(federatedInstances)
      .innerJoin(instances, eq(federatedInstances.fedWithInstanceId, instances.id))
      .where(eq(federatedInstances.instanceId, instanceId));
  }
  
  async updateFederationStatus(id: number, status: string): Promise<FederatedInstance | undefined> {
    const [updatedFederation] = await db
      .update(federatedInstances)
      .set({ status })
      .where(eq(federatedInstances.id, id))
      .returning();
    return updatedFederation;
  }
  
  async deleteFederation(id: number): Promise<void> {
    await db.delete(federatedInstances).where(eq(federatedInstances.id, id));
  }
  
  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }
  
  async getActivitiesByInstanceId(instanceId: number): Promise<(Activity & { actor: User | undefined })[]> {
    return await db
      .select({
        ...activities,
        actor: users,
      })
      .from(activities)
      .leftJoin(users, eq(activities.actorId, users.id))
      .where(eq(activities.instanceId, instanceId))
      .orderBy(desc(activities.createdAt));
  }
  
  async getRecentActivities(limit: number): Promise<(Activity & { actor: User | undefined, instance: Instance })[]> {
    return await db
      .select({
        ...activities,
        actor: users,
        instance: instances,
      })
      .from(activities)
      .leftJoin(users, eq(activities.actorId, users.id))
      .innerJoin(instances, eq(activities.instanceId, instances.id))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
